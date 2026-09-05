# 0013 — Martin برای لایه‌های برداری

وضعیت: تصمیم معماری پذیرفته‌شده؛ مرحلهٔ ۵.

## مسئله و تصمیم

GeoJSON ملی برای شبکهٔ راه مناسب نیست. Martin از PostGIS، MVT می‌دهد؛ TiTiler برای
raster و FastAPI برای metadata/نتایج باقی می‌مانند. سرویس در شبکهٔ Compose با پورت
داخلی 3000 و مسیر proxy `/vector/*` است؛ پورت عمومی مستقل لازم نیست.

طبق [مستندات Martin](https://maplibre.org/martin/config-file/)، auto discovery باید
خاموش و فقط viewهای tiles_railways، tiles_major_roads، tiles_exposure_segments و
tiles_regions مجاز شوند. نقش DB فقط SELECT روی viewها دارد. view نتیجه به analysis
منتشرشده و source version مشخص محدود است؛ UUID انتخاب از property صریح خوانده شود.
all_tags، URI و دادهٔ خصوصی وارد tile نمی‌شوند.

## وابستگی و پذیرش

گزینه‌ها Martin یا endpoint سفارشی ST_AsMVT بودند؛ Martin طبق سند انتخاب شده و
تکرار server در FastAPI ساخته نمی‌شود. نسخه/image و maintenance upstream در مرحلهٔ
نصب بررسی و pin می‌شوند. پذیرش: MVT واقعی، بازخوانی asset ID، تست نبود draft/جدول
غیرمجاز، سقف payload و pan/zoom پایلوت؛ GeoJSON فقط برای انتخاب کوچک است.
