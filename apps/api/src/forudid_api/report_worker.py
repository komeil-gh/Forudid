"""Render independent Persian screening reports with an isolated local browser."""

import argparse
import base64
import hashlib
import html
import json
import math
import os
import shutil
import signal
import subprocess
import tempfile
import time
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from uuid import UUID, uuid4

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from forudid_api import catalog
from forudid_api.config import settings
from forudid_api.db import ScreeningReport, engine, now
from forudid_api.exposure import published_summary
from forudid_api.ingest import digest
from forudid_api.publish_historical import NOTE, json_bytes
from forudid_api.storage import put_file, put_immutable, s3

FONT = Path(__file__).resolve().parents[4] / "apps/web/public/fonts/xb-zar/XB Zar.ttf"
RENDERER = Path(__file__).resolve().parents[4] / "scripts/render_report.mjs"
COLORS = ("#2563eb", "#2c7080", "#bd841c", "#ce5a28", "#922c36", "#641d52")


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
        "renderer_sha256": digest(RENDERER),
    }


def esc(value):
    return html.escape(str(value if value is not None else "در دسترس نیست"), quote=True)


def number(value, digits=2):
    if value is None:
        return "در دسترس نیست"
    return f"{value:,.{digits}f}".translate(str.maketrans("0123456789,.", "۰۱۲۳۴۵۶۷۸۹٬٫"))


def band_label(index, edges):
    if index is None:
        return "فاقد داده"
    if index == 0:
        return f"کمتر از {number(edges[0], 0)}"
    if index == len(edges):
        return f"{number(edges[-1], 0)} و بیشتر"
    return f"{number(edges[index - 1], 0)} تا کمتر از {number(edges[index], 0)}"


def map_svg(geometry, segments):
    coordinates = geometry["coordinates"]
    west = min(p[0] for p in coordinates)
    east = max(p[0] for p in coordinates)
    south = min(p[1] for p in coordinates)
    north = max(p[1] for p in coordinates)
    scale_x = math.cos(math.radians((south + north) / 2))
    width, height = max((east - west) * scale_x, 1e-9), max(north - south, 1e-9)
    scale = min(580 / width, 225 / height)
    x0, y0 = (680 - width * scale) / 2, (275 - height * scale) / 2

    def point(p):
        return f"{x0 + (p[0] - west) * scale_x * scale:.2f},{y0 + (north - p[1]) * scale:.2f}"

    lines = []
    for segment in segments:
        band = segment["band_index"]
        color = COLORS[min(band, len(COLORS) - 1)] if band is not None else "#777"
        dash = 'stroke-dasharray="5 4"' if band is None else ""
        points = " ".join(point(p) for p in segment["geometry"]["coordinates"])
        lines.append(
            f'<polyline points="{points}" fill="none" stroke="{color}" stroke-width="3" {dash}/>'
        )
    return (
        '<svg viewBox="0 0 680 300" role="img" aria-label="هندسهٔ واقعی قطعه و بازه‌های نرخ">'
        '<rect x="1" y="1" width="678" height="298" fill="#fafafa" stroke="#ddd"/>'
        + "".join(lines)
        + '<text x="655" y="30" direction="ltr">N ↑</text>'
        + f'<text x="15" y="290" direction="ltr" font-size="12">'
        f"WGS84: {west:.4f}, {south:.4f} — {east:.4f}, {north:.4f}</text></svg>"
    )


def profile_svg(profile, length):
    # ponytail: 600 display bins preserve extrema; full samples remain in the archived CSV.
    lows, highs, gaps = [math.inf] * 600, [-math.inf] * 600, [False] * 600
    for sample in profile:
        first = min(599, max(0, math.floor(sample["start_chainage_m"] / length * 600)))
        last = min(599, max(first, math.ceil(sample["end_chainage_m"] / length * 600) - 1))
        value = sample["velocity"]
        for index in range(first, last + 1):
            if value is None:
                gaps[index] = True
            else:
                lows[index] = min(lows[index], value)
                highs[index] = max(highs[index], value)
    finite = [v for v in lows if math.isfinite(v)] + [v for v in highs if math.isfinite(v)]
    low, high = (min(0, min(finite)), max(0, max(finite))) if finite else (0, 1)
    span = max(high - low, 1)
    lines = []
    for i in range(600):
        if math.isfinite(lows[i]):
            y1, y2 = 180 - (highs[i] - low) / span * 145, 180 - (lows[i] - low) / span * 145
            lines.append(
                f'<line x1="{50 + i}" x2="{50 + i}" y1="{y1:.2f}" '
                f'y2="{max(y2, y1 + 0.8):.2f}" stroke="#235b70"/>'
            )
        if gaps[i]:
            lines.append(f'<path d="M{50 + i} 190v5" stroke="#777"/>')
    return (
        '<svg viewBox="0 0 680 225" direction="ltr" role="img" '
        'aria-label="پروفایل نرخ برحسب فاصله">'
        '<path d="M50 20v160h600" fill="none" stroke="#aaa"/>'
        + "".join(lines)
        + f'<text x="42" y="38" text-anchor="end">{number(high, 0)}</text>'
        + f'<text x="42" y="178" text-anchor="end">{number(low, 0)}</text>'
        + '<text x="50" y="217">۰</text>'
        + f'<text x="570" y="217">{number(length / 1000)} km</text>'
        + '<text x="70" y="18" direction="ltr">mm/year</text></svg>'
    )


def build_html(report_id, inputs, analysis, generated_at: datetime):
    summary, asset, edges = analysis["summary"], inputs["asset"], analysis["band_edges_mm_year"]
    segments = analysis["segments"]
    font = base64.b64encode(FONT.read_bytes()).decode("ascii")
    metrics = [
        ("طول قطعه (کیلومتر)", summary["total_length_m"] / 1000),
        ("طول دارای داده (کیلومتر)", summary["valid_length_m"] / 1000),
        ("طول فاقد داده (کیلومتر)", summary["nodata_length_m"] / 1000),
        ("پوشش داده (درصد)", summary["coverage_fraction"] * 100),
        ("میانگین طول‌وزن نرخ (میلی‌متر/سال)", summary["mean_velocity"]),
        ("صدک ۹۵ نرخ (میلی‌متر/سال)", summary["p95_velocity"]),
        ("بیشینهٔ قدرمطلق نرخ (میلی‌متر/سال)", summary["max_abs_velocity"]),
    ]
    metric_rows = "".join(
        f"<tr><th>{name}</th><td>{number(value)}</td></tr>" for name, value in metrics
    )
    segment_rows = "".join(
        f"<tr><td>{number(i + 1, 0)}</td><td>{number(s['start_chainage_m'] / 1000, 3)}</td>"
        f"<td>{number(s['end_chainage_m'] / 1000, 3)}</td>"
        f"<td>{number(s['length_m'] / 1000, 3)}</td>"
        f"<td>{band_label(s['band_index'], edges)}</td></tr>"
        for i, s in enumerate(segments)
    )
    sources = "".join(
        f'<section class="source"><h3>{esc(source["name"])}</h3>'
        f"<p class='ltr'>{esc(source['attribution'])} · {esc(source['license'])}</p>"
        f'<p class="ltr">{esc(source["citation"])}</p>'
        f"<p>نسخه: <bdi>{esc(source['version'])}</bdi> · تاریخ داده: "
        f"<bdi>{esc(source['data_date'])}</bdi></p>"
        f'<p class="ltr">{esc(source["homepage"])}<br>{esc(source["license_url"])}</p>'
        f"<p>شناسهٔ نسخه: <bdi>{esc(source['version_id'])}</bdi></p>"
        f'<p class="hash">SHA-256: {esc(source["sha256"])}</p></section>'
        for source in inputs["sources"]
    )
    period = inputs["analysis_inputs"]["deformation_period"]
    quality_reasons = "".join(
        f"<li>{esc(reason)}</li>" for reason in inputs.get("product_quality", {}).get("reasons", [])
    )
    method_status = {
        "experimental": "آزمایشی",
        "review": "در حال بررسی",
        "validated": "اعتبارسنجی‌شده",
    }.get(inputs["method_status"], "نامشخص")
    return f"""<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy"
content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:">
<title>فرودید — گزارش غربالگری مواجهه با تغییرشکل زمین</title>
<style>@font-face{{font-family:Report;src:url(data:font/ttf;base64,{font})}}
@page{{size:A4;margin:16mm}}*{{box-sizing:border-box}}
body{{font:13pt/1.55 Report,serif;color:#20282b;margin:0}}
h1{{font-size:22pt;line-height:1.5;margin:5mm 0 3mm}}h2{{font-size:17pt;margin:4mm 0 2mm}}
h3{{font-size:14pt}}p{{margin:2.5mm 0}}table{{width:100%;border-collapse:collapse;font-size:11pt}}
th,td{{padding:1.5mm;border-bottom:1px solid #ddd;text-align:right}}
thead{{display:table-header-group}}tr,.source{{break-inside:avoid}}.page{{break-before:page}}
.note{{border-right:3px solid #c58b38;padding:3mm;background:#faf6ee}}
.ltr,.hash{{direction:ltr;text-align:left;unicode-bidi:isolate;overflow-wrap:anywhere}}
.hash{{font:8pt/1.6 monospace}}bdi{{direction:ltr;unicode-bidi:isolate;font-size:10pt}}
svg{{width:100%;height:auto;display:block;break-inside:avoid}}
svg text{{font-family:Report,serif;font-size:13px}}
.small{{font-size:10pt;color:#505b60}}.brand{{font-size:15pt;letter-spacing:1px}}
</style></head><body>
<div class="brand">FORUDID | فرودید</div><h1>گزارش غربالگری مواجهه با تغییرشکل زمین</h1>
<h2>{esc(asset["name"] or asset["external_id"])}</h2>
<p>{"راه‌آهن" if asset["type"] == "railway" else "راه اصلی"} · <bdi>{esc(asset["external_id"])}</bdi>
· کلاس منبع: <bdi>{esc(asset["class"])}</bdi></p>
<p>زمان تولید (UTC): <bdi>{esc(generated_at.isoformat())}</bdi></p>
<p>این قطعه در {number(summary["coverage_fraction"] * 100)} درصد از طول خود دادهٔ معتبر نرخ دارد.
باقی طول فاقد داده است و پایداری زمین را اثبات نمی‌کند.
مقادیر زیر مواجههٔ مکانی با دادهٔ تاریخی را توصیف می‌کنند.</p>
<table>{metric_rows}</table><h2>موقعیت و بازه‌های نرخ</h2>
{map_svg(asset["geometry"], segments)}
<p class="small">هندسهٔ واقعی OSM؛ نمایش موقعیت بدون نقشهٔ پایه و مقیاس مهندسی.
خط خاکستریِ بریده فاقد داده است. رنگ‌ها بازه‌های عددی جدول قطعات‌اند و طبقهٔ خطر نیستند.</p>
<p class="small ltr">{esc(inputs["sources"][0]["attribution"])} ·
{esc(inputs["sources"][0]["license"])}</p>
<section class="page"><h2>پروفایل طولی و کیفیت داده</h2>
{profile_svg(analysis["profile"], summary["total_length_m"])}
<p class="small">پوش کمینه و بیشینهٔ نرخ در ۶۰۰ بازهٔ نمایشی؛ اتصال یا درون‌یابی شکاف‌ها انجام نشده است.
نوار خاکستری وجود دادهٔ گمشده در آن بازه را نشان می‌دهد.
پروفایل کامل در دانلود CSV تحلیل موجود است.</p>
<p>دورهٔ دادهٔ تغییرشکل: <bdi>{esc(period[0])} — {esc(period[1])}</bdi>.
تاریخ OSM تاریخ ثبت منبع است و تاریخ ساخت زیرساخت نیست؛
هم‌زمانی هندسه با دورهٔ ماهواره تأیید نشده است.</p>
<p>فاصلهٔ نمونه‌برداری: {number(analysis["sample_spacing_m"])} متر؛ کمترین عرض پیکسل بررسی‌شده:
{number(analysis["minimum_checked_pixel_width_m"])} متر.
دقت مرزهای قطعه‌بندی محدود به شبکهٔ رستر است.</p>
<p>روش: <bdi>{esc(inputs["method_version"])}</bdi>؛ وضعیت علمی: {method_status}
(<bdi>{esc(inputs["method_status"])}</bdi>). آمار با طول معتبر وزن‌دهی می‌شوند؛
صفر معتبر با NoData متفاوت است.</p>
<p>{esc(inputs["analysis_inputs"].get("sign_convention"))}</p>
<h3>محدودیت‌های ثبت‌شدهٔ منبع</h3><ul>{quality_reasons}</ul>
<p>عدم‌قطعیت پیکسلی، اعوجاج زاویه‌ای و طبقهٔ خطر این تحلیل در دسترس نیستند.
گرادیان پژوهشیِ جداگانه، مجوز انتساب خطر به این زیرساخت نیست.</p>
<p class="note">{NOTE}</p>
<p>نتایج از سنجش‌ازدور و دادهٔ مکانی مشتق شده‌اند؛ برای غربالگری‌اند و بازدید سازه‌ای،
گواهی مهندسی یا احتمال خرابی محسوب نمی‌شوند.
کیفیت و تفکیک مکانی داده نتیجه را محدود می‌کند.</p></section>
<section class="page"><h2>همهٔ قطعات مواجهه</h2>
<p>تعداد: {number(len(segments), 0)}؛ حدود نرخ برحسب میلی‌متر/سال و طول‌ها برحسب کیلومتر.
دقت نمایشی طول، دقت مکانی مرز را تضمین نمی‌کند.</p>
<table><thead><tr><th>ردیف</th><th>آغاز</th><th>پایان</th><th>طول</th>
<th>بازهٔ عددی نرخ</th></tr></thead>
<tbody>{segment_rows}</tbody></table></section>
<section class="page"><h2>منابع، مجوزها و شناسه‌های پردازش</h2>{sources}
<p>شناسهٔ گزارش: <bdi>{esc(report_id)}</bdi></p>
<p>شناسهٔ تحلیل: <bdi>{esc(inputs["analysis_run_id"])}</bdi></p>
<p>شناسهٔ زیرساخت: <bdi>{esc(inputs["asset_id"])}</bdi></p>
<p>نسخهٔ برنامه: <bdi>{esc(inputs["application_version"])}</bdi>؛ قالب:
<bdi>{esc(inputs["renderer"]["version"])}</bdi></p>
<p class="hash">Analysis JSON SHA-256: {esc(inputs["analysis_json_sha256"])}</p>
<p class="hash">Template SHA-256: {esc(inputs["renderer"]["worker_sha256"])}</p>
<p class="small">فایل PDF و HTML اصلی به‌صورت تغییرناپذیر همراه checksum مستقل آرشیو می‌شوند.
checksum بالا متعلق به JSON تحلیل است؛ checksum PDF در پاسخ دانلود گزارش ارائه می‌شود.</p>
</section></body></html>"""


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
                    query = query.where(ScreeningReport.status == "queued")
                report = db.scalar(query.limit(1).with_for_update())
                if report is None or report.status == "completed":
                    return None
                if report.status != "queued" and not retry:
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
                    summary, run, _ = published_summary(db, report.asset_id, report.analysis_run_id)
                    catalog.product(db, run.product_id)
                    response = s3().get_object(Bucket=settings().s3_bucket, Key=summary.profile_key)
                    with response["Body"] as body:
                        if response["ContentLength"] > 100 * 1024 * 1024:
                            raise ValueError("Report analysis exceeds the 100 MiB input limit")
                        raw = body.read()
                    if hashlib.sha256(raw).hexdigest() != inputs["analysis_json_sha256"]:
                        raise ValueError("Archived analysis checksum mismatch")
                generated_at = now()
                markup = build_html(identity, inputs, json.loads(raw), generated_at)
                prefix = f"reports/{identity}/{uuid4()}"
                with tempfile.TemporaryDirectory(prefix="forudid-report-") as temp:
                    work = Path(temp).resolve()
                    pdf = work / "report.pdf"
                    runtime = render_pdf(markup, pdf, work)
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
