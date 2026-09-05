# ممیزی V1 برای FORUDID V2

تاریخ بررسی: ۲۰۲۶-۰۹-۰۵. مبنا: `c250a67` / `v0.1.0` و تغییر صفحات محتوایی در
`d0642f3` و `03e3417`. هنگام ممیزی، تغییرات مستقل دیگری در صفحات، CSS، نسخه‌ها و برند در worktree
وجود داشتند؛ جزو این ممیزی نیستند و بازنویسی نمی‌شوند.

## نتیجه

V1 یک WebGIS محلی با fixture ساختگی است، نه محصول علمی کامل ورامین. پشتهٔ آن برای V2
قابل حفظ است؛ مدل محصول و نمونه‌برداری فعلی هنوز مستقل از منبع نیستند. مرحلهٔ صفر V2
از نظر بررسی معماری و تصمیم‌ها مستند شده، اما gate کامل محیط اجرا باز است: Docker
Desktop پاسخ اتصال نمی‌دهد. ساخت کاتالوگ مرحلهٔ ۲ نباید به‌عنوان پذیرفته‌شده اعلام شود
تا migration و API روی PostGIS واقعی بررسی شوند.

سند [V2](MASTER_SPEC.md) مرجع قابلیت‌های جدید است. [سند V1](../MASTER_SPEC.md) و history
حفظ می‌شوند. الزام قبلی به LOS و تولید HyP3/MintPy برای تمام محصولات، با ADR جدید
اصلاح می‌شود؛ قواعد مرجع، عدم جعل داده، provenance و localhost باقی می‌مانند.

## معماری موجود و مرزهای قابل حفظ

| مسیر | مسئولیت فعلی | تصمیم V2 |
| --- | --- | --- |
| `apps/web/src/app/router.tsx` | SPA، shell، URL و صفحات | حفظ؛ افزودن routeها پس از API متناظر |
| `apps/web/src/routes/map.tsx` | انتخاب محصول، لایه، نقطه و dialog | حفظ؛ افزودن mode و انتخاب source تدریجی |
| `apps/web/src/features/map/MapCanvas.tsx` | MapLibre، raster و GeoJSON کوچک | حفظ؛ شبکهٔ ملی از Martin/MVT |
| `apps/web/src/generated/api/forudid.ts` | کلاینت Orval از OpenAPI | فقط بازتولید، بدون ویرایش دستی |
| `apps/api/src/forudid_api/main.py` | FastAPI خواندنی، خطا و request ID | حفظ؛ endpointهای کاتالوگ و نتایج اضافه شوند |
| `apps/api/src/forudid_api/catalog.py` | کنترل انتشار محصول و asset | حفظ کنترل انتشار؛ افزودن منشأ خارجی |
| `apps/api/src/forudid_api/tiles.py` | TiTiler محدود به asset ID | حفظ؛ برای kind/component جدید آگاهانه گسترش یابد |
| `apps/api/src/forudid_api/points.py` | نمونه‌برداری fixture و سری زمانی | تعمیم پیش از ورود منبع خارجی؛ جزئیات پایین |
| `apps/api/src/forudid_api/storage.py` | S3 خصوصی، checksum، immutable put | حفظ قرارداد؛ افزودن streaming برای فایل بزرگ |
| `apps/api/src/forudid_api/seed.py` | fixture کوچک، COG و STAC | حفظ صرفاً برای regression V1 |
| `compose.yml` و `infra/` | PostGIS، MinIO، initialize، API، web، Caddy | حفظ؛ Martin با viewهای صریح در مرحلهٔ ۵ |

React 19، Vite 8، TypeScript، TanStack، MapLibre 6، ECharts، Tailwind/Radix، FastAPI،
SQLAlchemy/Alembic، TiTiler و object storage بازنویسی نمی‌شوند. HDF5 و Zarr مسیر انتشار
آینده‌اند؛ cube فعلی JSON کوچک است. worker کنونی فقط seed است، نه موتور تحلیل علمی.

## جدول‌های V1

مرجع: `apps/api/src/forudid_api/db.py` و migration `98916efed35d_initial_catalog`.
این فهرست از کد استخراج شده؛ وضعیت اعمال migration در دیتابیس این نوبت قابل بازخوانی نبود.

| جدول | مدل | ارتباط و دادهٔ اصلی |
| --- | --- | --- |
| `areas_of_interest` | AOI | slug یکتا، MultiPolygon/4326، bbox، نام‌ها، active |
| `processing_runs` | Run | AOI، config، profile، git SHA، status، parent run |
| `products` | Product | AOI و run اجباری، kind، orbit/track، دوره، واحد، stats، STAC ID |
| `product_assets` | Asset | فایل محصول، object key یکتا، checksum، اندازه، media type |
| `reference_points` | Reference | run، Point/4326، روش، دلیل، بازبین و stability metadata |
| `qc_metrics` | QCMetric | run/product، عدد یا JSON، threshold و passed |

`Asset` فعلی **فایل محصول** است؛ `assets` در V2 **زیرساخت مکانی** خواهد بود. مدل جدید
در Python باید نام متمایزی مانند `InfrastructureAsset` داشته باشد. تغییر نام یا حذف
جدول `product_assets` لازم نیست. مهاجرت‌های V2 افزایشی‌اند؛ migration اعمال‌شدهٔ V1
بازنویسی نمی‌شود. هر downgrade فقط متعلق به همان migration و آزمون دیتابیس موقت است.

## مسیرهای فعلی API

تمام مسیرهای زیر GET هستند؛ هیچ API تحلیل سنگین، import عمومی یا publish عمومی وجود ندارد.
مرجع کد: `main.py` و `tiles.py`؛ قرارداد ثبت‌شده: `docs/openapi.json`.

| مسیر | کاربرد |
| --- | --- |
| `/health/live` | زنده‌بودن برنامه |
| `/health/ready` | دسترسی PostGIS و bucket |
| `/api/v1/aois` | محدوده‌های فعال |
| `/api/v1/aois/{slug}` | جزئیات محدوده |
| `/api/v1/products` | محصولات منتشرشده با فیلتر AOI/kind/orbit/track/run |
| `/api/v1/products/{product_id}` | محصول |
| `/api/v1/products/{product_id}/legend` | رنگ و واحد از سرور |
| `/api/v1/products/{product_id}/quality` | کیفیت محصول |
| `/api/v1/products/{product_id}/metadata` | STAC |
| `/api/v1/products/{product_id}/provenance` | سابقهٔ تولید |
| `/api/v1/points/summary` | مختصات و product ID |
| `/api/v1/points/timeseries` | مختصات و run ID |
| `/api/v1/runs/{run_id}` | run منتشرشده |
| `/tiles/{asset_id}/{z}/{x}/{y}.png` | raster asset منتشرشده؛ تنها query مجاز style |

FastAPI مسیرهای استاندارد `/docs`، `/redoc` و `/openapi.json` را نیز ارائه می‌کند.
مسیرهای V2 منابع، assets، regions، reports و vector هنوز وجود ندارند.

## مسیرهای frontend

| مسیر | مسئولیت |
| --- | --- |
| `/` | معرفی کوتاه و ورود به fixture |
| `/map` | نقشه و نقطهٔ LOS |
| `/methodology` | صفحهٔ روش‌شناسی؛ اکنون فایل مستقل `routes/methodology.tsx` |
| `/about` | صفحهٔ مستقل `routes/about.tsx` با متن نویسنده |

متن اختصاصی صفحهٔ درباره جزو تغییر معماری V2 نیست. نام فارسی/لاتین از قبل صحیح است؛
rename repository یا تغییر تاریخچه لازم نیست. فایل‌های طراحی برندِ خارج از commit مبنا
در مرحلهٔ برند بر اساس سند منتخب همان کار بررسی شوند، نه از روی حدس یا مسیرهای ردشده.

## بدهی‌های اولویت‌دار و محل رفع

| اولویت | شاهد در کد | اثر و مرحلهٔ رفع |
| --- | --- | --- |
| P1 | `Product.processing_run_id` اجباری؛ join با Run در catalog/main | محصول خارجی بدون run داخلی قابل عرضه نیست؛ مرحلهٔ ۳، FK منبع و منشأ صریح، حفظ readerهای V1 |
| P1 | Kind فقط velocity_los/coherence/uncertainty/mask/timeseries | قائم و seasonal amplitude مدل ندارند؛ مرحلهٔ ۳، metric/component/method مستقل |
| P1 | `points.summary` به cube JSON و هر سه raster وابسته است | نبود uncertainty یا timeseries نباید نقطه را از کار بیندازد؛ مرحلهٔ ۳، sampling native-grid مستقل و null صریح |
| P1 | `points.timeseries` همیشه velocity_los و run می‌خواهد | برای dataset ایستا سری زمانی ساختگی ساخته نشود؛ capability availability صریح |
| P1 | `put_immutable` ورودی bytes و readback کامل دارد | برای PBF و raster بزرگ مصرف RAM خطی با اندازهٔ فایل؛ پیش از ingestion، streaming checksum/upload و حفظ عدم overwrite |
| P1 | کنترل tile بر role/kind/published متکی است | ورود asset خارجی نیازمند validation raster پیش از published؛ URL دلخواه همچنان ممنوع |
| P2 | `Asset.size_bytes` Integer و تاریخ‌های Product رشته‌اند | پیش از داده‌های بزرگ BIGINT؛ Date و اعتبارسنجی بازه با migration افزایشی |
| P2 | فهرست products بدون pagination | کاتالوگ ملی به pagination و index مناسب نیاز دارد؛ مرحلهٔ ۲ برای endpointهای جدید، سپس V1 |
| P2 | AOI ثابت varamin در Zod و select بدون تغییر | source switcher و search داخلی واقعی در مراحل ۳ و ۸ |
| P2 | `from/to` در URL پذیرفته می‌شوند ولی مصرف نمی‌شوند | UI نباید فیلتر اعمال‌نشده را معتبر جلوه دهد؛ قرارداد دوره در مرحلهٔ ۳ |
| P2 | labelهای LOS و آرایهٔ ثابت لایه‌ها | frontend از metadata مؤلفه/واحد/capability بخواند؛ تغییر صرف label کافی نیست |
| P2 | baseline build هشدار chunk بزرگ دارد | map/chart از قبل lazy هستند؛ پس از UI واقعی profile اندازه‌گیری شود، library موازی افزوده نشود |
| P2 | API خطای sanitized دارد ولی cause در log محدود است | timeout پایگاه و ثبت نوع خطا بدون credential؛ پیش از gate محیط مرحلهٔ ۲ |

## تحقیق اولیهٔ منابع

در [رکورد نسخه‌دار Zenodo](https://zenodo.org/records/10815578)، نسخهٔ `1.0.0` شامل rate،
seasonal amplitude و mask است؛ دورهٔ مشاهده ۲۰۱۴–۲۰۲۰ و مجوز اعلام‌شده CC BY 4.0 است.
rate و amplitude از LOS نزولی به قائم تصویر شده‌اند؛ این decomposition صعودی/نزولی
نیست. DOI نسخه `10.5281/zenodo.10815578` است. واحد واقعی باند، scale/offset، NoData،
CRS، resolution، sign و reference باید از فایل و مقاله استخراج شوند؛ این ممیزی آن‌ها
را حدس نمی‌زند. داده هنوز دانلود یا ingest نشده است. Attribution نویسندگان و Copernicus
و metadata اصلی همراه source version نگه داشته شوند.

[Geofabrik ایران](https://download.geofabrik.de/asia/iran.html) PBF و snapshotهای تاریخ‌دار
دارد و ODbL 1.0/OSM Contributors را ذکر می‌کند. snapshot دقیق و SHA-256 داخلی لازم است؛
latest شناسهٔ نسخه نیست. هیچ شمارش feature یا پوشش واقعی کریدور هنوز تأیید نشده است.

[WorldPop API](https://www.worldpop.org/sdi/introapi/) امکان کشف dataset و metadata را
مستند می‌کند. انتخاب محصول ایران، سال، روش، count/density، citation و مجوز همان محصول
هنوز باز است؛ مجوز یک محصول به همهٔ خانواده‌ها تعمیم داده نمی‌شود.

مرجع احتمالی Payne مشخص شد: [DOI 10.1029/2024JB030367](https://doi.org/10.1029/2024JB030367).
این صرفاً شناسایی مقاله است؛ استخراج روش و ضمائم، بازتولید مثال و scientific review
انجام نشده‌اند. هیچ threshold یا beta از این شناسایی وارد محصول نمی‌شود.

## تصمیم‌ها و ترتیب اجرا

۹ ADR در [adr](adr/) با نام‌های درخواستی V2 قرار دارند. پوشهٔ مستقل V2 تعارض شمارهٔ
`0010` با ADR توسعهٔ محلی V1 را حل می‌کند و فایل تاریخی را تغییر نمی‌دهد.

| مرحله | برش قابل پذیرش | gate اصلی |
| --- | --- | --- |
| 0 | این audit، نقشهٔ کد، بدهی‌ها و ADRها | شواهد کد و baseline؛ Compose فعلاً مسدود |
| 1 | نام درست در shell/title/docs و معرفی pivot | حفظ متن نویسنده، RTL و مسیرهای V1 |
| 2 | ثبت منبع از CLI → source version → API → `/sources` | citation/license/version/checksum، idempotency، pagination، migration واقعی |
| 3 | یک نسخهٔ واقعی Haghighi–Motagh | immutable original، COG/STAC، مؤلفه/روش/دوره و attribution صحیح |
| 4 | snapshot OSM → rail/major roads | tags اصلی، شمارش و بازرسی هندسه، provenance |
| 5 | Martin → MVT → نقشه | فقط view مجاز، بدون GeoJSON ملی، تست عدم انتشار دادهٔ draft |
| 6 | fixture ده‌در‌ده کیلومتر و دو خط | طول/chainage/NoData/coverage/segment و tolerance معلوم |
| 7–9 | یک کریدور واقعی → profile/summary/segments → UI | تحلیل توصیفی، deep link، کلیک متقابل نقشه/جدول و source provenance |
| 10–11 | یک population dataset → یک region | mass conservation، grid/NoData، برآورد جمعیت و سال صریح |
| 12–15 | proxy تجربی سپس پژوهش differential | flag خاموش؛ validated فقط پس از بازتولید و بازبینی علمی |
| 16–17 | گزارش فارسی و CSV/GeoJSON | روش/source IDs/دوره/محدودیت‌ها، PDF مستقل از React، خروجی قابل ردیابی |
| 18 | ساختمان | اختیاری V2.1؛ مانع MVP نیست |

## معیار پذیرش مرحلهٔ بعد

به‌عنوان تحلیل‌گر، می‌توانم منشأ و نسخهٔ دقیق داده را ببینم تا نتیجه را به ورودی مشخص
ارجاع دهم. ثبت metadata به‌تنهایی به معنی ingest یا اعتبار علمی محصول نیست.

- ثبت CLI با citation، license، provider و version معتبر پذیرفته شود؛ SHA-256 از فایل واقعی محاسبه شود.
- تکرار ورودی یکسان رکورد تکراری نسازد؛ تعارض checksum در همان شناسه خطا دهد.
- source_versions immutable باشند؛ تغییر ورودی نسخهٔ جدید بسازد.
- سه GET منابع مطابق بند ۷۵ و UI `/sources` با حالت loading/error/empty کار کنند.
- URI خصوصی و credential به مرورگر نرسند؛ endpoint عمومی arbitrary import ساخته نشود.
- migration افزایشی، roundtrip روی DB موقت، API integration، Orval sync و RTL مرورگر موفق باشند.

این مرحله dependency علمی جدید نمی‌خواهد: argparse/pathlib/hashlib، Pydantic، SQLAlchemy
و اجزای UI موجود کافی‌اند. adapterهای بعدی فقط هنگام اجرای مرحلهٔ مربوط ساخته می‌شوند.

## فرض‌های علمی باز

واحد/sign/reference و grid فایل واقعی؛ روش و بازهٔ زمانی دقیق ورودی؛ کف کیفیت داده؛
قانون bandهای توصیفی؛ spacing وابسته به resolution؛ semantics جمعیت و روش حفظ جرم؛
coverage کریدور واقعی؛ completeness دارایی‌های OSM؛ روش/threshold/window معتبر Payne.
هیچ‌کدام با مقدار ساختگی جایگزین نمی‌شوند. عدم قطعیت ناموجود null است. صفر با NoData
یکی نیست و نبود تغییرشکل کشف‌شده به معنی ایمنی سازه نیست.

## تغییر و مهاجرت این تحویل

فقط مستندات مرحلهٔ صفر V2؛ هیچ migration، dependency یا endpoint جدید ایجاد نشده است.
گزارش بررسی‌های همین نوبت در `verification.md` قرار می‌گیرد. نتایج قبلی V1 در
[وضعیت V1](../operations/milestones.md) سابقه‌اند، نه اثبات سلامت فعلی کل stack.
