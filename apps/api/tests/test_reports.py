import copy
import hashlib
import os
import subprocess
from pathlib import Path
from uuid import UUID

import pytest


@pytest.mark.skipif(
    not os.environ.get("FORUDID_REPORT_TESTS"),
    reason="Requires real published analysis, S3, local Chrome and pdftotext",
)
def test_real_report_queue_failure_isolation_pdf_and_immutable_download(monkeypatch):
    from fastapi.testclient import TestClient
    from sqlalchemy.orm import Session

    from forudid_api import report_worker
    from forudid_api.db import ScreeningReport, engine, now
    from forudid_api.main import app
    from forudid_api.storage import read_json

    client = TestClient(app)
    payload = {
        "analysis_run_id": "f30d71aa-bda6-5098-b050-eed1f9657f0f",
        "asset_id": "29cbefaf-1ef9-594a-9957-68060bf45846",
        "language": "fa",
    }
    assert client.post("/api/v1/reports", json={**payload, "language": "en"}).status_code == 422
    assert (
        client.post("/api/v1/reports", json={**payload, "source_url": "file:///"}).status_code
        == 422
    )
    wrong = {**payload, "analysis_run_id": "f2eb002e-9c3e-5bab-bf4d-e93197945448"}
    assert client.post("/api/v1/reports", json=wrong).status_code == 404
    queued = client.post("/api/v1/reports", json=payload)
    assert queued.status_code == 202, queued.text
    report = queued.json()
    assert client.post("/api/v1/reports", json=payload).json()["id"] == report["id"]
    base = "/api/v1/reports/" + report["id"]
    identity = UUID(report["id"])
    if report["status"] != "completed":
        assert client.get(base + "/download").status_code == 409

        def failure(*args, **kwargs):
            raise RuntimeError("Controlled renderer failure")

        with monkeypatch.context() as patch:
            patch.setattr(report_worker, "render_pdf", failure)
            with pytest.raises(RuntimeError, match="Controlled renderer failure"):
                report_worker.run_report(identity, retry=True)
        assert client.get(base).json()["status"] == "failed"
        assert (
            client.get(
                f"/api/v1/assets/{payload['asset_id']}/exposure",
                params={"run_id": payload["analysis_run_id"]},
            ).status_code
            == 200
        )
        assert report_worker.run_report(identity, retry=True) == identity
    completed = client.get(base).json()
    assert completed["status"] == "completed" and completed["generated_at"]
    pdf = client.get(base + "/download")
    assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF-")
    assert hashlib.sha256(pdf.content).hexdigest() == completed["checksum_sha256"]
    assert pdf.headers["etag"].strip('"') == completed["checksum_sha256"]
    assert client.get(base + "/download").content == pdf.content
    assert report_worker.run_report(identity) is None
    directory = Path("/tmp/forudid-qa")
    directory.mkdir(exist_ok=True)
    target = directory / "screening-report.pdf"
    target.write_bytes(pdf.content)
    extracted = subprocess.run(
        ["pdftotext", str(target), "-"], capture_output=True, text=True, check=True
    ).stdout
    assert "FORUDID" in extracted and payload["analysis_run_id"] in extracted
    assert report["id"] in extracted and "CC BY 4.0" in extracted
    with Session(engine()) as db:
        stored = db.get(ScreeningReport, identity)
        manifest = read_json(stored.object_key.replace("report.pdf", "manifest.json"))
        assert manifest["html_sha256"] == completed["html_sha256"]
        assert manifest["inputs"]["analysis_json_sha256"]
        inputs = copy.deepcopy(stored.inputs)
    inputs["asset"]["name"] = '<script>alert("unsafe")</script>'
    from forudid_api.exposure import published_summary

    with Session(engine()) as db:
        summary, _, _ = published_summary(
            db, UUID(payload["asset_id"]), UUID(payload["analysis_run_id"])
        )
        analysis = read_json(summary.profile_key)
    markup = report_worker.build_html(identity, inputs, analysis, now())
    assert "<script>alert" not in markup and "&lt;script&gt;" in markup
    assert 'dir="rtl"' in markup and "font-src data:" in markup
