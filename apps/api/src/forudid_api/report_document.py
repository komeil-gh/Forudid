"""Self-contained Persian report layout and numerical figures."""

import base64
import html
import math
from datetime import datetime
from pathlib import Path

from forudid_api.publish_historical import NOTE

FONT = Path(__file__).resolve().parents[4] / "apps/web/public/fonts/xb-zar/XB Zar.ttf"
COLORS = ("#2563eb", "#2c7080", "#bd841c", "#ce5a28", "#922c36", "#641d52")


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
    period = inputs["analysis_inputs"]["deformation_period"]
    quality_reasons = "".join(
        f"<li>{esc(reason)}</li>" for reason in inputs.get("product_quality", {}).get("reasons", [])
    )
    method_status = {
        "experimental": "آزمایشی",
        "review": "در حال بررسی",
        "validated": "اعتبارسنجی‌شده",
    }.get(inputs["method_status"], "نامشخص")
    return f"""{document_start()}<h1>گزارش غربالگری مواجهه با تغییرشکل زمین</h1>
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
{document_end(report_id, inputs)}"""


def boundary_svg(geometry):
    rings = [ring for polygon in geometry["coordinates"] for ring in polygon]
    points = [point for ring in rings for point in ring]
    west, east = min(p[0] for p in points), max(p[0] for p in points)
    south, north = min(p[1] for p in points), max(p[1] for p in points)
    dx = math.cos(math.radians((south + north) / 2))
    width, height = max((east - west) * dx, 1e-9), max(north - south, 1e-9)
    scale = min(570 / width, 220 / height)
    x0, y0 = (680 - width * scale) / 2, (265 - height * scale) / 2
    paths = []
    for polygon in geometry["coordinates"]:
        path = " ".join(
            "M"
            + " L".join(
                f"{x0 + (x - west) * dx * scale:.2f},{y0 + (north - y) * scale:.2f}"
                for x, y in ring
            )
            + " Z"
            for ring in polygon
        )
        paths.append(
            f'<path d="{path}" fill="#edf3f4" fill-rule="evenodd" '
            'stroke="#235b70" stroke-width="1"/>'
        )
    return (
        '<svg viewBox="0 0 680 290" direction="ltr" role="img" aria-label="محدودهٔ گزارش">'
        + "".join(paths)
        + '<text x="655" y="25">N ↑</text>'
        + f'<text x="10" y="280">WGS84: {west:.4f}, {south:.4f} — '
        f"{east:.4f}, {north:.4f}</text></svg>"
    )


def build_region_html(report_id, inputs, documents, generated_at):
    population = documents["analysis"]
    regional = bool(inputs.get("region_id"))
    edges = population["band_edges_mm_year"]
    title = "گزارش غربالگری مواجههٔ منطقه با تغییرشکل زمین"
    rows = [
        ("جمعیت کل برآوردی", population["estimated_total"]),
        ("جمعیت در پوشش دادهٔ تغییرشکل", population["estimated_valid_coverage"]),
        ("جمعیت بدون دادهٔ تغییرشکل", population["estimated_without_deformation_data"]),
    ]
    totals = "".join(
        f"<tr><th>{label}</th><td>{number(value, 0)}</td></tr>" for label, value in rows
    )
    bands = "".join(
        f"<tr><td>{band_label(i, edges)}</td><td>{number(value, 0)}</td></tr>"
        for i, value in enumerate(population["estimated_by_numeric_band"])
    )
    infrastructure = []
    for snapshot in inputs["infrastructure"]:
        kind = snapshot["asset_type"]
        metrics = documents[kind]["metrics"]
        name = "راه‌آهن" if kind == "railway" else "راه‌های اصلی"
        table = "".join(
            f"<tr><td>{band_label(i, metrics['band_edges_mm_year'])}</td>"
            f"<td>{number(length / 1000)}</td></tr>"
            for i, length in enumerate(metrics["length_by_numeric_band_m"])
        )
        infrastructure.append(f"""<section class="infrastructure"><h3>{name}</h3>
<p>تعداد قطعات دارای طول در محدوده: {number(metrics["way_count"], 0)}.
طول کل: {number(metrics["total_length_m"] / 1000)} کیلومتر؛
دارای داده: {number(metrics["valid_length_m"] / 1000)} کیلومتر؛
فاقد داده: {number(metrics["nodata_length_m"] / 1000)} کیلومتر.</p>
<table><thead><tr><th>بازهٔ نرخ (میلی‌متر/سال)</th><th>طول (کیلومتر)</th></tr></thead>
<tbody>{table}</tbody></table><p>روش: <bdi>{esc(snapshot["method_version"])}</bdi>؛
وضعیت: <bdi>{esc(snapshot["method_status"])}</bdi>.</p>
<p>تحلیل منطقه: <bdi>{esc(snapshot["analysis_run_id"])}</bdi></p>
<p>تحلیل خطی پایه: <bdi>{esc(snapshot["upstream_run_id"])}</bdi></p>
<p class="hash">JSON SHA-256: {esc(snapshot["checksum_sha256"])}</p></section>""")
    area = population.get("region")
    area_html = ""
    if area:
        area_html = f"""<h3>تغییرشکل در محدودهٔ مرز</h3>
<p>مساحت: {number(area["area_m2"] / 1e6)} کیلومتر مربع؛
سهم مساحت دارای داده: {number(area["coverage_fraction"] * 100)} درصد.
میانگین مساحت‌وزن‌دار: {number(area["mean_mm_year"])} و صدک ۹۵:
{number(area["p95_mm_year"])} میلی‌متر/سال.</p>"""
    period = inputs["analysis_inputs"]["deformation_period"]
    caption = (
        f"مرز تاریخی {esc(inputs.get('boundary_year'))}؛ مرجع رسمی کنونی یا نقشهٔ تراکم جمعیت نیست."
        if regional
        else "کادر گسترهٔ رستر جمعیت؛ مرز کشور یا پوشش پیکسل‌های معتبر نیست."
    )
    scope_note = (
        "طول زیرساخت‌ها به مرز همین منطقه بریده شده است؛ قسمت خارج مرز شمرده نمی‌شود."
        if regional
        else "جمعیت مربوط به پوشش منبع WorldPop است؛ طول زیرساخت مربوط به کل "
        "snapshot واردشدهٔ OSM است. این دو گستره را یکسان فرض نکنید."
    )
    quality_reasons = "".join(
        f"<li>{esc(reason)}</li>" for reason in inputs.get("product_quality", {}).get("reasons", [])
    )
    return f"""{document_start()}<h1>{title}</h1><h2>{esc(inputs["name"])}</h2>
<p>زمان تولید (UTC): <bdi>{esc(generated_at.isoformat())}</bdi></p>
{boundary_svg(inputs["geometry"])}<p class="small">{caption}</p>
<h2>جمعیت و پوشش داده</h2><table>{totals}</table>
<p>برآورد مدل WorldPop برای سال
{number(inputs["analysis_inputs"]["population_year"], 0).replace("٬", "")}؛
شمار سرشماری یا جمعیت امروز نیست. مقدارها برای نمایش گرد شده‌اند.</p>
<p>دورهٔ تغییرشکل: <bdi>{esc(period[0])} — {esc(period[1])}</bdi>.
نبود داده به معنای پایداری زمین نیست.</p><p class="note">{NOTE}</p>
<section class="page"><h2>جمعیت در بازه‌های نرخ تاریخی</h2>
<table><thead><tr><th>بازهٔ نرخ (میلی‌متر/سال)</th><th>نفر (برآورد)</th></tr></thead>
<tbody>{bands}</tbody></table>{area_html}
<h3>روش و محدودیت‌ها</h3><p>توزیع جمعیت درون هر سلول تقریباً یک‌کیلومتری یکنواخت فرض شده
و شمار افراد بر اساس مساحت هم‌پوشانی تخصیص یافته است؛ شمار جمعیت درون‌یابی نشده است.</p>
<p>روش: <bdi>{esc(inputs["method_version"])}</bdi>؛ وضعیت:
<bdi>{esc(inputs["method_status"])}</bdi>. کیفیت مرز، جمعیت و رستر، دقت نتیجه را محدود می‌کند.</p>
<p>{esc(inputs["analysis_inputs"].get("sign_convention"))}</p>
<ul>{quality_reasons}</ul>
<p>اعوجاج زاویه‌ای، طبقهٔ خطر و احتمال خرابی در این گزارش محاسبه نشده‌اند.</p></section>
<section class="page"><h2>مواجههٔ راه و راه‌آهن</h2><p>{scope_note}</p>
<p>مجموع طول قطعات OSM است؛ مسیرهای موازی و هم‌پوشان یکتاسازی نشده‌اند.
تاریخ OSM زمان ساخت زیرساخت نیست و انطباق زمانی آن با دورهٔ ماهواره تأیید نشده است.</p>
{"".join(infrastructure)}</section>{document_end(report_id, inputs)}"""


def document_start():
    font = base64.b64encode(FONT.read_bytes()).decode("ascii")
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
.infrastructure + .infrastructure{{break-before:page}}
.note{{border-right:3px solid #c58b38;padding:3mm;background:#faf6ee}}
.ltr,.hash{{direction:ltr;text-align:left;unicode-bidi:isolate;overflow-wrap:anywhere}}
.hash{{font:8pt/1.6 monospace}}bdi{{direction:ltr;unicode-bidi:isolate;font-size:10pt}}
svg{{width:100%;height:auto;display:block;break-inside:avoid}}
svg text{{font-family:Report,serif;font-size:13px}}
.small{{font-size:10pt;color:#505b60}}.brand{{font-size:15pt;letter-spacing:1px}}
</style></head><body>
<div class="brand">FORUDID | فرودید</div>"""


def document_end(report_id, inputs):
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
    subject_label = "شناسهٔ محدوده" if inputs.get("scope") == "region" else "شناسهٔ زیرساخت"
    subject_id = inputs.get("asset_id") or inputs.get("region_id") or "country/population-footprint"
    return f"""<section class="page"><h2>منابع، مجوزها و شناسه‌های پردازش</h2>{sources}
<p>شناسهٔ گزارش: <bdi>{esc(report_id)}</bdi></p>
<p>شناسهٔ تحلیل: <bdi>{esc(inputs["analysis_run_id"])}</bdi></p>
<p>{subject_label}: <bdi>{esc(subject_id)}</bdi></p>
<p>نسخهٔ برنامه: <bdi>{esc(inputs["application_version"])}</bdi>؛ قالب:
<bdi>{esc(inputs["renderer"]["version"])}</bdi></p>
<p class="hash">Analysis JSON SHA-256: {esc(inputs["analysis_json_sha256"])}</p>
<p class="hash">Template SHA-256: {esc(inputs["renderer"]["template_sha256"])}</p>
<p class="small">فایل PDF و HTML اصلی به‌صورت تغییرناپذیر همراه checksum مستقل آرشیو می‌شوند.
checksum بالا متعلق به JSON تحلیل است؛ checksum PDF در پاسخ دانلود گزارش ارائه می‌شود.</p>
</section></body></html>"""
