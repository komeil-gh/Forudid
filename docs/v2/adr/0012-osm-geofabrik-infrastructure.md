# 0012 — OSM از snapshot ایران Geofabrik

وضعیت: تصمیم معماری پذیرفته‌شده؛ مرحلهٔ ۴.

## تصمیم

ورودی ملی PBF تاریخ‌دار [Geofabrik ایران](https://download.geofabrik.de/asia/iran.html)
است. Overpass مسیر bulk نیست. original، SHA-256، زمان دریافت، ابزارها، فرمان/config
و شمارش خروجی ثبت می‌شوند. انتشار جدید snapshot قدیمی را overwrite نمی‌کند.

فقط railway=rail و motorway/trunk/primary/secondary اولیه استخراج می‌شوند. OSM ID،
نام‌های اصلی، tags و data-quality نگه داشته می‌شوند. way بی‌نام نام مسیر جعلی نمی‌گیرد؛
گروه‌بندی route مستقل است و MVP می‌تواند raw feature را تحلیل کند. کلاس Python
`InfrastructureAsset` از Asset فایل محصول متمایز است.

## وابستگی و پذیرش

گزینه‌ها: osmium-tool برای filter/inspection و GDAL برای تبدیل و بارگذاری؛ parser
دستی و کتابخانهٔ موازی انتخاب نمی‌شوند. نسخه و وضعیت maintenance ابزار برگزیده در
زمان افزودن از upstream بررسی و pin می‌شود؛ اکنون dependency نصب نمی‌شود.
ODbL 1.0 و OSM Contributors در UI/report حفظ می‌شوند. پذیرش: شمارش، نمونه‌برداری
هندسه، GIST، provenance و اعلام ناتمام‌بودن احتمالی پوشش؛ OSM موجودی رسمی کامل نیست.
