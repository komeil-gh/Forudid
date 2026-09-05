# 0017 — برآورد مواجههٔ جمعیت از منبع نسخه‌دار

وضعیت: تصمیم انتخاب خانوادهٔ منبع؛ محصول/سال/روش دقیق هنوز انتخاب نشده است.

## تصمیم

اولویت WorldPop است؛ GHSL فقط با دلیل و metadata همان محصول جایگزین می‌شود.
[API رسمی WorldPop](https://www.worldpop.org/sdi/introapi/) برای کشف metadata است؛
dataset، سال، resolution، method، license و citation دقیق قبل از ingest ثبت می‌شوند.
خروجی «برآورد جمعیت در معرض» است و سرشماری رسمی نامیده نمی‌شود.

count، density و نرخ، semantics متفاوت دارند. دو grid نامنطبق مستقیم ضرب نمی‌شوند.
alignment شامل CRS، overlap، NoData و روش حفظ جرم است. تغییر سال run جدید می‌سازد؛
سال جمعیت و دورهٔ تاریخی deformation هر دو در UI/report آشکارند.

## پذیرش و وابستگی

NumPy/Rasterio/PyProj موجود در پشته بررسی و فقط dependency مستقیم مصرف‌شده در
package تحلیل اعلام شود. کتابخانهٔ تحلیل population موازی پیشاپیش اضافه نمی‌شود.
آزمون جرم قبل/بعد از alignment، clipping جزئی، NoData و count/density اجباری است.
تا روش hazard معتبر نیست، جمعیت به تفکیک band توصیفی گزارش می‌شود؛ ستون hazard
ناموجود null است و نام low/high علمی نمی‌گیرد.
