# 0011 — منبع و نسخهٔ داده

وضعیت: تصمیم معماری پذیرفته‌شده؛ مرحلهٔ پیاده‌سازی ۲.

## تصمیم

`data_sources` هویت provider، نوع، citation، license، attribution و scientific status
را نگه می‌دارد. `source_versions` snapshot تغییرناپذیر و دارای تاریخ، URI، SHA-256،
اندازهٔ BIGINT و metadata است. اعتبار provider، validation فایل و publication محصول
سه وضعیت جدا هستند. درج منبع به معنی انتشار محصول نیست.

یک dataset چندفایلی از manifest تغییرناپذیر استفاده می‌کند: checksum نسخه مربوط به
manifest آرشیوشده است و URI، اندازه و checksum تک‌تک فایل‌ها در همان manifest ثبت
می‌شوند. تاریخ دسترسی جای دورهٔ مشاهده نیست. کلید `(source_id, version)` یکتا است؛
تکرار با checksum یکسان idempotent و تعارض checksum خطاست.

## اجرا و پذیرش

ثبت در ابتدا CLI است؛ API عمومی فقط GET و paginated. URI خصوصی/credential در API
عمومی پنهان می‌ماند. OpenAPI منبع Orval و `/sources` نمایش‌دهندهٔ دادهٔ واقعی registry
است. ابزارهای stdlib و dependencyهای موجود کافی‌اند. migration به شش جدول V1 دست
نمی‌زند. پذیرش: ثبت، بازخوانی، خطای تعارض، persistence و RTL با PostGIS واقعی.
