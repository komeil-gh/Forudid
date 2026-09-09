"""Render independent Persian screening reports with an isolated local browser."""

import argparse
import hashlib
import json
import os
import shutil
import signal
import subprocess
import tempfile
import time
from functools import lru_cache
from pathlib import Path
from uuid import UUID, uuid4

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from forudid_api import catalog, report_document
from forudid_api.config import settings
from forudid_api.db import (
    AnalysisRun,
    PopulationExposureResult,
    RegionalInfrastructureResult,
    ScreeningReport,
    engine,
    now,
)
from forudid_api.exposure import population_summary, published_summary, regional_infrastructure
from forudid_api.ingest import digest
from forudid_api.publish_historical import json_bytes
from forudid_api.report_document import FONT, build_html, build_region_html
from forudid_api.storage import put_file, put_immutable, s3

RENDERER = Path(__file__).resolve().parents[4] / "scripts/render_report.mjs"


def chrome_binary():
    candidates = [
        settings().report_chrome_binary,
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        shutil.which("chromium"),
        shutil.which("chromium-browser"),
    ]
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return str(candidate)
    raise RuntimeError("A local Chrome/Chromium executable is required for PDF rendering")


@lru_cache(maxsize=1)
def renderer_identity():
    return {
        "version": "screening-pdf-1",
        "worker_sha256": digest(Path(__file__)),
        "font_sha256": digest(FONT),
        "template_sha256": digest(Path(report_document.__file__)),
        "renderer_sha256": digest(RENDERER),
    }


def render_pdf(markup, output: Path, work: Path):
    source = work / "report.html"
    source.write_text(markup, encoding="utf-8")
    process = subprocess.Popen(
        [
            shutil.which("node") or "node",
            str(RENDERER),
            str(source),
            str(output),
            chrome_binary(),
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        start_new_session=True,
    )
    try:
        stdout, _ = process.communicate(timeout=120)
        if process.returncode or not output.exists() or output.read_bytes()[:5] != b"%PDF-":
            raise RuntimeError("PDF renderer did not produce a valid document")
        return json.loads(stdout)
    finally:
        try:
            os.killpg(process.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)
            process.wait()


def report_artifacts(db, report):
    """Resolve only the pinned published dependencies; no browser or object reads."""
    if report.scope == "asset":
        summary, run, _ = published_summary(db, report.asset_id, report.analysis_run_id)
        catalog.product(db, run.product_id)
        return {"analysis": (summary.profile_key, summary.checksum_sha256)}
    run = db.get(AnalysisRun, report.analysis_run_id)
    if run is None:
        raise catalog.missing("ANALYSIS_NOT_FOUND")
    population = population_summary(run.product_id, db, run_id=run.id, region_id=report.region_id)
    result = db.scalar(
        select(PopulationExposureResult).where(
            PopulationExposureResult.analysis_run_id == population.analysis_run_id
        )
    )
    artifacts = {"analysis": (result.object_key, result.checksum_sha256)}
    for snapshot in report.inputs["infrastructure"]:
        current = regional_infrastructure(
            run.product_id,
            snapshot["asset_type"],
            db,
            region_id=report.region_id,
            run_id=UUID(snapshot["analysis_run_id"]),
        )
        result = db.scalar(
            select(RegionalInfrastructureResult).where(
                RegionalInfrastructureResult.analysis_run_id == current.analysis_run_id
            )
        )
        if current.checksum_sha256 != snapshot["checksum_sha256"]:
            raise ValueError("Pinned infrastructure result changed")
        artifacts[current.asset_type] = (result.object_key, result.checksum_sha256)
    return artifacts


def run_report(report_id: UUID | None = None, *, retry=False):
    with engine().connect() as lock:
        if not lock.scalar(text("SELECT pg_try_advisory_lock(702318)")):
            return None
        lock.commit()
        try:
            with Session(engine()) as db, db.begin():
                query = select(ScreeningReport).order_by(ScreeningReport.created_at)
                if report_id:
                    query = query.where(ScreeningReport.id == report_id)
                else:
                    # Holding the session lock proves no other compliant worker is active.
                    # A processing row left after a crash can safely start a new attempt.
                    query = query.where(ScreeningReport.status.in_(("queued", "processing")))
                report = db.scalar(query.limit(1).with_for_update())
                if report is None or report.status == "completed":
                    return None
                if report_id and report.status != "queued" and not retry:
                    return None
                identity, inputs = report.id, report.inputs
                report.status, report.error_code = "processing", None
            try:
                if inputs["renderer"] != renderer_identity():
                    raise ValueError("Queued renderer version changed; request a new report")
                with Session(engine()) as db:
                    report = db.get(ScreeningReport, identity)
                    if report is None:
                        raise ValueError("Report job disappeared")
                    artifacts = report_artifacts(db, report)
                documents = {}
                for role, (key, expected) in artifacts.items():
                    response = s3().get_object(Bucket=settings().s3_bucket, Key=key)
                    with response["Body"] as body:
                        if response["ContentLength"] > 100 * 1024 * 1024:
                            raise ValueError("Report analysis exceeds the 100 MiB input limit")
                        raw = body.read()
                    if hashlib.sha256(raw).hexdigest() != expected or (
                        role == "analysis" and expected != inputs["analysis_json_sha256"]
                    ):
                        raise ValueError("Archived analysis checksum mismatch")
                    documents[role] = json.loads(raw)
                generated_at = now()
                markup = (
                    build_region_html(identity, inputs, documents, generated_at)
                    if inputs.get("scope") == "region"
                    else build_html(identity, inputs, documents["analysis"], generated_at)
                )
                prefix = f"reports/{identity}/{uuid4()}"
                with tempfile.TemporaryDirectory(prefix="forudid-report-") as temp:
                    work = Path(temp).resolve()
                    pdf = work / "report.pdf"
                    runtime = render_pdf(markup, pdf, work)
                    markup = (work / "report.html").read_text(encoding="utf-8")
                    checksum, _ = put_file(f"{prefix}/report.pdf", pdf, "application/pdf")
                    html_sha, _ = put_immutable(
                        f"{prefix}/report.html", markup.encode(), "text/html"
                    )
                    put_immutable(
                        f"{prefix}/manifest.json",
                        json_bytes(
                            {
                                "report_id": str(identity),
                                "generated_at": generated_at.isoformat(),
                                "inputs": inputs,
                                "pdf_sha256": checksum,
                                "html_sha256": html_sha,
                                "renderer_runtime": runtime,
                            }
                        ),
                        "application/json",
                    )
                with Session(engine()) as db, db.begin():
                    report = db.get(ScreeningReport, identity)
                    if report is None:
                        raise ValueError("Report job disappeared")
                    report.status, report.generated_at = "completed", generated_at
                    report.object_key, report.checksum_sha256 = f"{prefix}/report.pdf", checksum
                    report.html_sha256 = html_sha
                return identity
            except Exception:
                with Session(engine()) as db, db.begin():
                    report = db.get(ScreeningReport, identity)
                    if report is not None:
                        report.status, report.error_code = "failed", "REPORT_GENERATION_FAILED"
                raise
        finally:
            lock.execute(text("SELECT pg_advisory_unlock(702318)"))
            lock.commit()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", type=UUID)
    parser.add_argument("--retry", action="store_true")
    parser.add_argument("--watch", action="store_true")
    args = parser.parse_args()
    if args.retry and args.report is None:
        parser.error("--retry requires an explicit --report")
    if args.watch and args.report:
        parser.error("--watch processes the queue; omit --report")
    while True:
        try:
            result = run_report(args.report, retry=args.retry)
            if result:
                print(result, flush=True)
        except Exception:
            if not args.watch:
                raise
            print("Report failed; failure state retained for explicit retry", flush=True)
        if not args.watch:
            break
        time.sleep(2)


if __name__ == "__main__":
    main()
