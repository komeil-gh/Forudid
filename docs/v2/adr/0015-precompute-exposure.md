# 0015 — تحلیل از پیش محاسبه‌شده با run قابل بازتولید

وضعیت: تصمیم معماری پذیرفته‌شده؛ مراحل ۶ تا ۱۱.

## تصمیم

تحلیل در `packages/python/forudid_analysis` و CLI اجرا می‌شود؛ request handler کار
سنگین ملی انجام نمی‌دهد. پوشه‌ها فقط هنگام نیاز واقعی ساخته می‌شوند. FastAPI نتایج
ذخیره‌شده را با pagination می‌خواند. فعلاً workflow engine و queue جدید لازم نیست.

analysis_runs به method version، deformation product و source versionهای دقیق وصل
است. signature از serialization پایدار همین ورودی‌ها و parameters ساخته و unique
می‌شود. hash جای ذخیرهٔ خود پارامترها را نمی‌گیرد. تغییر منبع run جدید می‌خواهد.

خطوط با فاصلهٔ وابسته به grid نمونه‌برداری می‌شوند؛ chainage از CRS متری مناسب یا
geodesic است. coverage بر طول معتبر است، نه شمار نمونه‌ها. intervalهای contiguous
هندسه و chainage دارند؛ فاصلهٔ گمشده با interpolation پنهان نمی‌شود.

## پذیرش

fixture تحلیلی ده‌در‌ده کیلومتر: طول معلوم، مرز معلوم، NoData و resolution معلوم.
حد خطا از sampling/grid تعریف شود. اجرا idempotent، شکست recoverable و publication
صریح باشد. profile/summary/segment همگی یک analysis ID و provenance را نمایش دهند.
