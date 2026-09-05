# مرز انتشار علمی

دادهٔ فعلی کاملاً ساختگی است. مقدار `quality=caution` از backend می‌آید و وضعیت fixture
جایگزین کنترل کیفیت علمی نیست. هیچ threshold علمی در frontend تعریف نشده است.

پروفایل `pipeline/profiles/varamin-desc-20x4-v1.json` عمداً مقادیر تأییدنشده را `null` نگه
می‌دارد: ترک واقعی، baselineهای زمانی و عمودی، حداقل درجهٔ شبکه، coherence، تعداد
مشاهدات و cutoff عدم قطعیت. ترک 071 در نمونه صرفاً fixture است.

پیش از پردازش واقعی لازم است:

1. geometry تقریباً ۵۰×۵۰ کیلومتر ورامین و پوشش burstها بررسی و تأیید شود.
2. acquisitionهای واقعی با مسیر Descending، polarization و ترک سازگار کشف شوند.
3. بازهٔ زمانی و thresholdهای profile با شواهد علمی تعیین شوند.
4. دسترسی Earthdata/HyP3 در محیط محلی امن تنظیم شود؛ credential در مخزن قرار نگیرد.
5. محیط Conda/Mamba علمی مستقل، نسخه‌ها و digest کانتینر ثبت شوند.
6. QC ماشین‌خوان و خواندنی تولید و run در `validation_required` متوقف شود.
7. تأیید دستی علمی همراه نام بازبین، زمان و شواهد ثبت شود؛ سپس publish مجاز است.

فرمان seed به run علمی دست نمی‌زند و endpoint پردازش یا publish عمومی وجود ندارد.
هیچ vertical product یا decomposition در این نسخه تولید نمی‌شود.

Provenance fixture صریحاً `scientifically_validated=false` و container digest ناموجود را
`null` ثبت می‌کند. این وضعیت برای محصول علمی قابل قبول نیست. مولد fixture با checksum
در مسیر immutable همان run آرشیو می‌شود.
