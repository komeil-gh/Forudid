# فرودید | FORUDID

WebGIS محلی برای مشاهدهٔ تغییرشکل در راستای دید ماهواره. محدودهٔ نخست، ورامین است.

## مسیر V2

[سند V2](docs/v2/MASTER_SPEC.md) مسیر توسعه را به تحلیل مواجههٔ زیرساخت و جمعیت با
تغییرشکل گسترش می‌دهد. [ممیزی V1 و ترتیب اجرا](docs/v2/audit.md) و
[تصمیم‌های معماری V2](docs/v2/adr/) مبنای این گذارند. رجیستری منبع و صفحهٔ `/sources`
با فایل‌های واقعی Haghighi–Motagh پیاده‌سازی شده است؛ [شواهد این مرحله](docs/v2/source-registry.md)
را ببینید. نقشه و تحلیل V2 هنوز پذیرفته نشده‌اند؛ V2 به تولید اختصاصی InSAR وابسته نخواهد بود و exposure را ریسک
سازه معرفی نمی‌کند. وضعیت بررسی مرحلهٔ صفر در [گزارش آزمون](docs/v2/verification.md) است.

## وضعیت نسخهٔ اجراشدنی

**نسخهٔ فعلی یک برش نرم‌افزاری با دادهٔ ساختگی است؛ نتیجهٔ علمی دربارهٔ ورامین نیست.**
نسخهٔ 0.1.0 هنوز پذیرش کامل Compose/E2E را نگرفته است؛ شواهد و مانع محیط در
[وضعیت اجرا](docs/operations/milestones.md) ثبت شده‌اند.
COG، پایگاه داده، S3 خصوصی، tile، نمونه‌برداری نقطه و نمودار واقعی‌اند؛ اعداد fixture هستند.
LOS با فرونشست عمودی یکسان نیست. قرارداد علامت و مرجع از فراداده خوانده می‌شود.

## اجرای محلی

پیش‌نیاز: Docker Desktop/Engine با Compose، Python برای ساخت تنظیمات اولیه.

```sh
python3 scripts/init_env.py
docker compose up --build
```

اسکریپت اول رمزهای تصادفی محلی می‌سازد و `.env` موجود را دست نمی‌زند. هیچ رمز یا
فایل `.env` نباید commit شود. `.env.example` فقط نام متغیرها را دارد.

یک سرویس موقت `initialize` migrationهای رو به جلو و seed تکرارپذیر fixture را اجرا می‌کند.
API هنگام startup خود migration انجام نمی‌دهد. مسیرهای محلی بعد از آماده‌شدن stack:

- [نقشهٔ محلی](http://localhost:58080/map)
- [سلامت API](http://localhost:58080/health/ready)

`LOCAL_PORT` پورت ورودی، `API_PORT` پورت API، `DB_PORT` پورت PostGIS و `S3_PORT`
پورت S3 هستند؛ مقادیر لینک‌های بالا پیش‌فرض اسکریپت‌اند و قابل تغییرند.
همهٔ پورت‌ها به `127.0.0.1` محدودند. frontend فقط مسیرهای همان origin را مصرف می‌کند.

```sh
docker compose down
```

این دستور سرویس‌های همین پروژه را متوقف می‌کند و volumeهای داده را نگه می‌دارد.
اگر هم‌زمان پروژهٔ دیگری context را تغییر می‌دهد، context مربوط به این stack را در هر
دستور صریح بنویسید؛ مثلاً `docker --context desktop-linux compose up --build`.
برای پاک‌کردن volumeها از `-v` استفاده نکنید مگر واقعاً قصد حذف داده را داشته باشید.

## توسعه خارج از کانتینر

Node 22.12+، pnpm 11.24.0، uv و Python 3.13 لازم‌اند.

```sh
pnpm install --frozen-lockfile
uv sync --project apps/api --frozen
docker compose up -d postgres object-storage
uv run --project apps/api alembic -c apps/api/alembic.ini upgrade head
uv run --project apps/api python -m forudid_api.seed
```

در دو ترمینال، از ریشهٔ مخزن اجرا کنید:

```sh
uv run --project apps/api uvicorn forudid_api.main:app --host 127.0.0.1 --port 58000
pnpm dev
```

پورت CLI مربوط به uvicorn را با `API_PORT` و `VITE_API_PROXY_TARGET` هماهنگ کنید.
Vite، `WEB_PORT` و proxy target را از `.env` ریشه می‌خواند.
پیش‌فرض frontend توسعه [نقشه](http://localhost:5173/map) است.
هر دو سرور با Ctrl+C بسته می‌شوند.

## بررسی‌ها

```sh
uv run --project apps/api ruff check apps/api/src apps/api/tests
uv run --project apps/api pyright --project apps/api
uv run --project apps/api pytest apps/api/tests -q
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @forudid/web exec playwright install chromium
pnpm test:e2e
```

آزمون API به PostGIS و S3 همین پروژه و seed نیاز دارد. آزمون مرورگر به دو سرور توسعهٔ بالا
نیاز دارد. برای آزمون build Compose از `WEB_BASE_URL=http://localhost:58080` استفاده کنید.
در صورت نبود Chromium تست و وجود Chrome نصب‌شده، `PLAYWRIGHT_CHANNEL=chrome` را تنظیم کنید؛
Playwright از پروفایل موقت استفاده می‌کند. اسکرین‌شات‌ها در `/tmp/forudid-qa` قرار می‌گیرند.

## ورود منبع واقعی V2

پس از migration، از ریشهٔ مخزن اجرا کنید:

```sh
uv run --project apps/api python -m forudid_api.ingest data/sources/haghighi-motagh-2024/1.0.0
uv run --project apps/api python -m forudid_api.register_source data/sources/haghighi-motagh-2024/1.0.0
```

فرمان اول سه رستر نسخهٔ ثابت Zenodo را دریافت و با MD5 منتشرشده تطبیق می‌دهد.
فرمان دوم SHA-256 را دوباره بررسی، فایل‌ها را به‌صورت streaming در S3 خصوصی آرشیو
و منبع و نسخه را اتمیک ثبت می‌کند. تکرار با محتوای یکسان همان شناسه را برمی‌گرداند؛
تعارض checksum خطاست. این فرمان‌ها هنوز محصول نقشه یا نتیجهٔ exposure منتشر نمی‌کنند.
فایل‌های حجیم در `data/` و S3 می‌مانند و وارد Git نمی‌شوند.
صفحهٔ `/sources` فقط اطلاعات عمومی منبع و نسخه را نشان می‌دهد.

## قرارداد API

```sh
uv run --project apps/api python scripts/export_openapi.py
pnpm generate:api
git diff --exit-code -- docs/openapi.json apps/web/src/generated/api
```

منبع حقیقت FastAPI است. فایل generated را دستی تغییر ندهید. CI همین همگامی را بررسی می‌کند.

## نقشه و داده

به‌صورت پیش‌فرض نقشهٔ پایهٔ خارجی وجود ندارد؛ شبکهٔ مختصاتی محلی و COG نمایش داده می‌شوند.
`VITE_BASEMAP_STYLE_URL` و `VITE_BASEMAP_ATTRIBUTION` فقط پس از انتخاب provider دارای مجوز
تنظیم شوند. Attribution پنهان نمی‌شود. WebGL2 لازم است.

دادهٔ fixture شامل ۶۴×۶۴ پیکسل، ۲۶ تاریخ و یک تاریخ گمشده است. نقطهٔ
`51.6452, 35.3241` باید `-71.2 mm/year`، عدم قطعیت `6.0 mm/year` و coherence برابر `0.89`
داشته باشد. تعداد مشاهدات معتبر ۲۵ است. کیفیت آن همیشه «نیازمند احتیاط» و ساختگی است.

objectها با run ID ذخیره و پس از upload با SHA-256 بررسی می‌شوند. نوشتن با `If-None-Match`
انجام می‌شود؛ خروجی موجود overwrite نمی‌شود. fixture اصلاح‌شده run جدید می‌سازد و محصول
قبلی به `superseded` می‌رود. bucket خصوصی است. فقط asset منتشرشده از مسیر
`/tiles/{asset_id}/{z}/{x}/{y}.png` قابل خواندن است؛ query تنها `style` را می‌پذیرد.

## دامنه و ادامهٔ کار

[سند اصلی](docs/MASTER_SPEC.md)، [معماری](docs/architecture/overview.md)،
[وضعیت milestoneها](docs/operations/milestones.md)، [الزامات علمی](docs/science/validation.md)
و [تصمیم‌ها](docs/adr) مسیر ادامه را مشخص می‌کنند.

پردازش واقعی HyP3/MintPy، محیط علمی Conda، آرشیو HDF5، انتشار Zarr و محصول واقعی Varamin LOS v1
هنوز ارائه نشده‌اند. ترک 071 و اعداد fixture هیچ تأییدی برای انتخاب ترک واقعی نیستند.
محصول علمی فقط پس از profile تکمیل‌شده، QC و تأیید دستی منتشر خواهد شد.
