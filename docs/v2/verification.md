# شواهد مرحلهٔ صفر V2

تاریخ: ۲۰۲۶-۰۹-۰۵. این تغییر مستندات است و runtime یا migration جدید ندارد.
worktree حین ممیزی تغییرات مستقل frontend داشت؛ نتایج زیر دربارهٔ زمان اجرای هر فرمان
هستند و جای پذیرش commit نهایی آن تغییرات را نمی‌گیرند.

| بررسی | نتیجهٔ این نوبت |
| --- | --- |
| `pnpm lint` | موفق |
| `pnpm typecheck` | موفق |
| `pnpm test` | ۸ آزمون در ۴ فایل موفق |
| Ruff | موفق |
| Pyright | بدون خطا و هشدار |
| pytest انتخابی | ۱۰ موفق، ۱ ناموفق، ۹ انتخاب‌نشده |
| build | ناموفق؛ TS2307 برای module صفحهٔ methodology در worktree هم‌زمان |
| Compose smoke | مسدود؛ Docker Desktop daemon در دسترس نیست |
| مجموعهٔ کامل API/E2E | به‌دلیل نبود PostGIS/S3 اجرا نشده |

## تفسیر pytest

انتخاب با عبارت `golden_cog or openapi or coordinate_validation or rejects_untrusted_options`
انجام شد. مورد `test_tile_rejects_untrusted_options[style=coherence-default]` برخلاف
queryهای ممنوع URL/path به محصول واقعی در PostGIS نیاز دارد. نبود اتصال باعث 503 به‌جای
422 شد؛ این آزمون موفق اعلام نمی‌شود و با mock جایگزین نشده است. تطبیق OpenAPI، COG
ساختگی و بررسی‌های مستقل ورودی در همین انتخاب موفق بودند.

## محیط و دامنه

بررسی خواندنی `docker --context desktop-linux compose ps` با نبود اتصال daemon برگشت.
restart مشترک از نوبت قبل مجوز نگرفته بود و در این ممیزی تکرار نشد. context فعال کاربر
تغییر نکرد. هیچ dev server یا کانتینر در این مرحله راه‌اندازی نشده است.

هنگام build، pnpm به‌علت تغییر هم‌زمان dependencyهای frontend وارد install شد و به
محدودیت DNS سندباکس رسید. فرایند retry متوقف و dependencyهای lockfile با
`pnpm install --frozen-lockfile` بازیابی شدند؛ package جدیدی برای V2 انتخاب نشد.

پس از بازیابی dependency، build در `src/app/router.tsx` و `src/routes/content.test.tsx`
با TS2307 متوقف شد: module `routes/methodology` هنگام آن اجرا پیدا نشد. نتیجهٔ موفق
typecheck ابتدای ممیزی به معنی سلامت این وضعیت تازه نیست. فایل‌های محتوایی متعلق به
ویرایش هم‌زمان‌اند و برای عبور مصنوعی از gate با نسخهٔ قدیمی جایگزین نشده‌اند.

## پذیرش و ادامه

audit، ۹ ADR، سند اصلی V2 و اتصال README تحویل مستندات این مرحله‌اند. تمام migrationها
و قابلیت‌های اجرایی V2 هنوز پیاده‌سازی‌نشده‌اند. gate کامل مرحلهٔ صفر باز است؛ پس از
دسترسی به PostGIS/S3، ابتدا baseline V1 و Compose/E2E بررسی شوند و سپس مرحلهٔ ۱ و
برش registry مرحلهٔ ۲ مطابق audit اجرا شوند. این وضعیت نه پذیرش V2 MVP است، نه
اعتبارسنجی علمی dataset یا روش differential.
