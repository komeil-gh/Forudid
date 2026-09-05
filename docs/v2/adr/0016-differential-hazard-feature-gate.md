# 0016 — دروازهٔ اعتبار علمی روش differential

وضعیت: تصمیم پذیرفته‌شده؛ روش علمی هنوز experimental و پیاده‌سازی‌نشده است.

## تصمیم

velocity exposure توصیفی مستقل از gradient proxy و angular distortion است. proxy
فقط روی مؤلفهٔ قائم مناسب و با نام Experimental Deformation Gradient Proxy عرضه
می‌شود. Payne-style method تا استخراج دقیق مقاله/ضمائم و validation پشت flag خاموش
می‌ماند. حضور β = Δd/l به‌تنهایی specification کامل الگوریتم نیست.

analysis_methods نسخه، parameters، reference و status را نگه می‌دارد. thresholdها
فقط در profile سمت سرورند. زمان، واحد، pixel size، window، valid-pixel rule، gradient
و classification باید معلوم باشند؛ فرض باز مقدار null دارد و جلوی publication را می‌گیرد.

## پذیرش

flat plane، linear plane، NoData window، تغییر CRS/resolution و literature golden
با tolerance پذیرفته‌شده بررسی شوند. سپس experimental → review → validated با
بازبین، زمان و شواهد ثبت شود. backend انتشار ترکیب نامعتبر method/product را رد
می‌کند، حتی اگر flag رابط تغییر کند. dataset مرورشده به‌تنهایی روش مشتق را validated نمی‌کند.
