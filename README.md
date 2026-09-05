# فرودید | FORUDID

WebGIS محلی برای مشاهدهٔ دادهٔ تاریخی تغییرشکل زمین ایران، با منبع و نسخهٔ قابل ردیابی.

## مسیر V2

[سند V2](docs/v2/MASTER_SPEC.md) مسیر توسعه را به تحلیل مواجههٔ زیرساخت و جمعیت با
تغییرشکل گسترش می‌دهد. [ممیزی V1 و ترتیب اجرا](docs/v2/audit.md) و
[تصمیم‌های معماری V2](docs/v2/adr/) مبنای این گذارند. رجیستری منبع و صفحهٔ `/sources`
با فایل‌های واقعی Haghighi–Motagh پیاده‌سازی شده است؛ [شواهد این مرحله](docs/v2/source-registry.md)
را ببینید. دو لایهٔ تاریخی واقعی روی نقشه منتشر شده‌اند؛ تحلیل مواجههٔ V2 هنوز کامل نیست.
V2 به تولید اختصاصی InSAR وابسته نخواهد بود و exposure را ریسک
سازه معرفی نمی‌کند. وضعیت بررسی مرحلهٔ صفر در [گزارش آزمون](docs/v2/verification.md) است.

## وضعیت نسخهٔ اجراشدنی

نسخهٔ `0.2.0-alpha.8` دادهٔ واقعی Haghighi–Motagh (۲۰۱۴–۲۰۲۰) را نمایش می‌دهد:
نرخ فرونشست قائم برآوردشده و دامنهٔ قله‌تا‌قلهٔ فصلی. این‌ها تصویرکردن راستای دید نزولی
با فرض ناچیزبودن حرکت افقی‌اند و وضعیت کنونی زمین را نشان نمی‌دهند.
سری زمانی و عدم‌قطعیت پیکسلی در این منبع ارائه نشده‌اند؛ رابط هم آن‌ها را تولید نمی‌کند.
هر سه COG با تمام پیکسل‌های فایل اصلی تطبیق داده شده‌اند؛ [شواهد](docs/v2/raster-normalization.md).
دادهٔ ساختگی V1 فقط برای آزمون باقی مانده و در تنظیم پیش‌فرض API قابل مشاهده نیست.
۱۳۳٬۱۱۵ قطعهٔ واقعی راه و راه‌آهن OSM وارد شده‌اند و با Martin روی نقشه قابل انتخاب‌اند؛
[شواهد ورود زیرساخت](docs/v2/osm-infrastructure.md) و [نمایش برداری](docs/v2/vector-tiles.md).
موتور مواجههٔ خطی و پروفایل متصل به نقشه آزموده شده‌اند و تحلیل هر ۱۲٬۷۲۲ قطعهٔ
راه‌آهن و هر ۱۲۰٬۳۹۳ قطعهٔ راه اصلی با دادهٔ واقعی منتشر شده است؛ [روش و شواهد](docs/v2/line-exposure.md).
فهرست `/assets` مرتب‌سازی، جست‌وجو، جزئیات قابل اشتراک و خروجی JSON/CSV/GeoJSON دارد؛
[دامنه و شواهد خروجی‌ها](docs/v2/asset-exploration.md).
جمعیت WorldPop سال ۲۰۲۰ در شبکهٔ حدود یک کیلومتر با حفظ شمار افراد وارد شده و
برآورد کل ایران و مناطق تاریخی در صفحهٔ `/regions` قابل مشاهده است؛
[روش، محدودیت‌ها و شواهد جمعیت](docs/v2/population-exposure.md) و
[مرزهای تاریخی و مواجههٔ زیرساخت داخل آن‌ها](docs/v2/regions.md) را ببینید.
نقشه سه حالت تغییرشکل، زیرساخت و جمعیت دارد؛ انتخاب محدوده و تحلیل با URL حفظ می‌شود.
جدول قطعه‌بندی به هندسهٔ واقعی نقشه و نشانی قابل بازیابی متصل است؛
گزارش PDF و روش‌های تفاضلی V2 باقی است.

## اجرای محلی

پیش‌نیاز: Docker Desktop/Engine با Compose، Python برای ساخت تنظیمات اولیه.

```sh
python3 scripts/init_env.py
docker compose up --build
```

اسکریپت اول رمزهای تصادفی محلی می‌سازد و `.env` موجود را دست نمی‌زند. هیچ رمز یا
فایل `.env` نباید commit شود. `.env.example` فقط نام متغیرها را دارد.

یک سرویس موقت `initialize` migrationهای رو به جلو و ساخت bucket خصوصی را اجرا می‌کند؛
دادهٔ ساختگی به‌صورت خودکار تولید نمی‌شود. برای دادهٔ واقعی، مراحل ورود منبع پایین را اجرا کنید.
API هنگام startup خود migration انجام نمی‌دهد. مسیرهای محلی بعد از آماده‌شدن stack:

- [نقشهٔ محلی](http://localhost:58080/map)
- [منابع داده](http://localhost:58080/sources)
- [جمعیت و مناطق](http://localhost:58080/regions)
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
uv run --project apps/api python -m forudid_api.initialize
```

در دو ترمینال، از ریشهٔ مخزن اجرا کنید:

```sh
uv run --project apps/api uvicorn forudid_api.main:app --host 127.0.0.1 --port 58000
pnpm dev
```

پورت CLI مربوط به uvicorn را با `API_PORT` و `VITE_API_PROXY_TARGET` هماهنگ کنید.
Vite، `WEB_PORT` و proxy target را از `.env` ریشه می‌خواند.
پیش‌فرض frontend توسعه [نقشه](http://localhost:5173/map) است.
هر دو سرور با Ctrl+C بسته می‌شوند. برای شبکهٔ زیرساخت، Martin 1.15.0 را طبق
[راهنمای برداری](docs/v2/vector-tiles.md) در ترمینال سوم اجرا و در پایان با Ctrl+C متوقف کنید.

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

آزمون‌های قدیمی API به PostGIS و S3 همین پروژه و اجرای صریح `python -m forudid_api.seed`
نیاز دارند؛ مجوز دیدن fixture فقط داخل همان آزمون‌ها فعال می‌شود. آزمون مرورگر به دو سرور توسعهٔ بالا
نیاز دارد. برای آزمون build Compose از `WEB_BASE_URL=http://localhost:58080` استفاده کنید.
در صورت نبود Chromium تست و وجود Chrome نصب‌شده، `PLAYWRIGHT_CHANNEL=chrome` را تنظیم کنید؛
Playwright از پروفایل موقت استفاده می‌کند. اسکرین‌شات‌ها در `/tmp/forudid-qa` قرار می‌گیرند.

## ورود منبع واقعی V2

پس از migration، از ریشهٔ مخزن اجرا کنید:

```sh
uv run --project apps/api python -m forudid_api.ingest data/sources/haghighi-motagh-2024/1.0.0
uv run --project apps/api python -m forudid_api.register_source data/sources/haghighi-motagh-2024/1.0.0
uv run --project apps/api python -m forudid_api.normalize data/sources/haghighi-motagh-2024/1.0.0 data/normalized/haghighi-motagh-cog-1
uv run --project apps/api python -m forudid_api.publish_historical data/sources/haghighi-motagh-2024/1.0.0 data/normalized/haghighi-motagh-cog-1
```

فرمان اول سه رستر نسخهٔ ثابت Zenodo را دریافت و با MD5 منتشرشده تطبیق می‌دهد.
فرمان دوم SHA-256 را دوباره بررسی، فایل‌ها را به‌صورت streaming در S3 خصوصی آرشیو
و منبع و نسخه را اتمیک ثبت می‌کند. تکرار با محتوای یکسان همان شناسه را برمی‌گرداند؛
تعارض checksum خطاست. فرمان سوم COGهای هم‌شبکه با اصل داده می‌سازد؛ فرمان چهارم
پس از تطبیق پیکسل‌ها، دو لایهٔ واقعی را همراه STAC، کیفیت و provenance محلی منتشر می‌کند.
برای آزمون‌های واقعی API و مرورگر، `FORUDID_REAL_SOURCE_TESTS=1` را تنظیم کنید.
تنظیم `ALLOW_FIXTURE_PRODUCTS` در حالت عادی false است و نباید برای نمایش محصول فعال شود.
فایل‌های حجیم در `data/` و S3 می‌مانند و وارد Git نمی‌شوند.
صفحهٔ `/sources` فقط اطلاعات عمومی منبع و نسخه را نشان می‌دهد.

## قرارداد API

ورود زیرساخت واقعی پس از migration:

```sh
uv run --project apps/api python -m forudid_api.ingest_osm data/sources/geofabrik-iran/260904
```

آزمون‌های زیرساخت با `FORUDID_OSM_TESTS=1` و آزمون‌های سرویس برداری با
`FORUDID_MARTIN_TESTS=1` فعال می‌شوند. دادهٔ OSM مربوط به ۲۰۲۶ است؛ هم‌زمانی آن با
دادهٔ تغییرشکل تاریخی تأیید نشده و کامل‌بودن شبکه نیز تضمین نمی‌شود.

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

دادهٔ fixture آزمون شامل ۶۴×۶۴ پیکسل، ۲۶ تاریخ و یک تاریخ گمشده است. نقطهٔ
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
