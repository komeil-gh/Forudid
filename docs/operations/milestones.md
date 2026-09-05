# وضعیت اجرا

## وضعیت جاری V2

ثبت منبع واقعی، نرمال‌سازی بدون تغییر پیکسل و انتشار مجموعهٔ تاریخی ۲۰۱۴–۲۰۲۰ انجام شده است.
شواهد و محدودیت‌ها در [پذیرش محصول تاریخی](../v2/historical-products.md) ثبت شده‌اند.
ورود ۱۳۳٬۱۱۵ قطعهٔ واقعی زیرساخت OSM، نمایش MVT با Martin و انتخاب شناسنامهٔ هر قطعه
نیز در محیط محلی بررسی شده‌اند؛ [زیرساخت](../v2/osm-infrastructure.md)، [لایهٔ برداری](../v2/vector-tiles.md).
تحلیل مواجههٔ زیرساخت، جمعیت، گزارش و خروجی‌های V2 هنوز کامل نیستند؛ V3 پس از آن آغاز می‌شود.
جدول و موانع زیر سابقهٔ پذیرش V1 هستند و وضعیت جاری دادهٔ عمومی را توصیف نمی‌کنند.

این جدول وضعیت نرم‌افزار را از تأیید علمی جدا می‌کند. تست ناموفق به معنی milestone تمام‌شده نیست.

| مرحله | پیاده‌سازی | شواهد پذیرش |
| --- | --- | --- |
| 0 — Repository | monorepo، Compose، Dockerfile، قرارداد API و CI | ساخت دو image موفق؛ پذیرش کامل Compose هنوز تأیید نشده |
| 1 — Shell | فارسی/RTL، React/Vite، URL، routing، حالت خطا | build/typecheck موفق؛ حالت قطع API روی build در دسکتاپ و موبایل موفق |
| 2 — Model | شش جدول PostGIS و seed ورامین | upgrade → downgrade → upgrade موفق |
| 3 — Fixture | COG خصوصی و tile با asset ID | COG validation و PNG و golden pixel موفق |
| 4 — UI | سه لایه، opacity، legend، metadata | ۶ آزمون frontend موفق؛ پذیرش کامل E2E باقی است |
| 5 — Point | نمونه‌برداری COG و NoData | مقدار golden و مرزهای مختصات موفق |
| 6 — Time series | cube JSON fixture، نمودار، missing epoch و uncertainty band | آزمون داده موفق؛ پذیرش نهایی reload نیازمند اجرای مجدد stack |
| 7 — QC UI | caution صریح، coherence، uncertainty، reference، counts | پوشش failure isolation نوشته شده؛ مجموعهٔ کامل هنوز سبز نیست |
| 8 — STAC | Catalog/Collection/Item، metadata و provenance | validator رسمی STAC موفق |
| 9 تا 16 | هنوز اجرا نشده | discovery واقعی، profile، HyP3، MintPy و تأیید علمی لازم است |

## شواهد نسخهٔ 0.1.0 — ۲۰۲۶-۰۹-۰۵

- ۲۰ آزمون API/raster/STAC با PostGIS و S3 محلی موفق شدند.
- پس از اصلاح قرارداد خطای 422، دو آزمون مستقل COG و همگامی OpenAPI دوباره موفق شدند.
- شش آزمون frontend، lint، TypeScript، Ruff، Pyright و build موفق شدند.
- migration با upgrade → downgrade → upgrade روی پایگاه اولیه بررسی شد.
- ساخت imageهای API و frontend موفق شد؛ آخرین اصلاح worker پس از آن بوده و image نهایی باید دوباره ساخته شود.
- آزمون Playwright روی build نهایی، worker نقشه، خطای قطع API، نبود overflow و دسترسی کپی URL را در دسکتاپ و موبایل تأیید کرد: ۲ آزمون موفق.
- مجموعهٔ کامل E2E سبز نشده است. در اجرای قبلی ۸ مورد از ۱۲ مورد موفق شدند؛ اجرای مجدد با قطع اتصال داده متوقف شد. این نتیجه پذیرش milestoneهای 0–8 نیست.

STAC پس از پیداشدن لینک Collection مفقود در run جدید اصلاح شد. نسخهٔ قبلی برای حفظ
provenance نگه داشته و superseded شده است. مشکل آدرس worker در MapLibre 6 نیز مطابق
[راهنمای رسمی نصب](https://maplibre.org/maplibre-gl-js/docs/) با worker مستقل Vite اصلاح شد.

## مانع محیط محلی و ادامهٔ پذیرش

Docker Desktop حین بررسی به وضعیت `stopping` رفت و API آن 500 داد. context فعال نیز به
`colima-cankav-builder` تغییر کرده بود؛ برای جلوگیری از تداخل، context کاربر تغییر داده نشد.
راه‌اندازی مجدد کل engine انجام نشد. پذیرش کامل Compose و ۱۴ آزمون مرورگر باید پس از
بازیابی Docker اجرا شود. CI نوشته شده ولی روی سرویس CI اجرا نشده است.

API و Vite موقت پس از بررسی بسته می‌شوند. volumeهای داده حذف نمی‌شوند.

Chromium موردنیاز Playwright از CDN با 403 منطقه‌ای دانلود نشد؛ آزمون جایگزین از Chrome
نصب‌شده و پروفایل موقت استفاده می‌کند. این جایگزین به معنی تأیید همهٔ مرورگرهای هدف نیست.
