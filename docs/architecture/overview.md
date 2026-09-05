# معماری نسخهٔ محلی

React 19 / Vite 8 یک SPA ایستا می‌سازند. Router و Zod وضعیت قابل اشتراک را در URL،
Query دادهٔ remote را در cache و React وضعیت گذرای dialogها را نگه می‌دارند.
پنل راست لایه و پنل پایین نقطه روی موبایل به sheet تبدیل می‌شوند.

FastAPI قرارداد typed را صادر می‌کند و Orval 8 کلاینت و hookها را می‌سازد.
PostGIS مرجع metadata است؛ objectها در S3 خصوصی هستند. TiTiler در API mount شده و
فقط route محدود به asset منتشرشده دارد. rescale و colormap از همان registry که legend
را تولید می‌کند می‌آیند. نواحی NoData و ماسک در COG شفاف هستند.

## مرز fixture

`forudid_api.seed` تنها مولد دادهٔ ساختگی است؛ پردازشگر علمی نیست. دادهٔ زمانی این مرحله
یک cube کوچک JSON است، مطابق اجازهٔ مرحلهٔ fixture در سند. برای cube واقعی از Zarr 3
با خواندن chunk استفاده خواهد شد. آرشیو واقعی MintPy باید HDF5 خود را نگه دارد.

API وابستگی‌های سنگین MintPy، Conda و محیط HyP3 را ندارد. Rasterio وابستگی TiTiler است.
worker فعلی فقط فرمان one-shot fixture را اجرا می‌کند و workflow engine ندارد.

## قراردادهای عملکرد و خطا

- camera فقط در پایان حرکت در URL نوشته می‌شود؛ مختصات نقطه مستقل از camera هستند.
- query نقطه شامل product/run و مختصات است؛ AbortSignal از Query تا fetch عبور می‌کند.
- ECharts با moduleهای لازم و به‌شکل lazy بارگذاری می‌شود؛ MapLibre هم در route نقشه است.
- API خطای عمومی فارسی و request ID می‌دهد و stack trace یا URI امضاشده را افشا نمی‌کند.
- شکست سری زمانی، نقشه را متوقف نمی‌کند. شکست QC/summary مقدار بدون زمینهٔ کیفیت نشان نمی‌دهد.
- فهرست محصول، AOI و assetها را به‌شکل دسته‌ای می‌خواند تا N+1 ایجاد نشود.

## وابستگی‌های اضافه‌شده و دلیل

| گروه | نقش و دلیل نیاز |
| --- | --- |
| React، Vite، TypeScript، Tailwind | پشتهٔ صریح رابط ایستای سند |
| TanStack Router/Query، Zod | URL معتبر، cache و لغو درخواست؛ React به‌تنهایی این قراردادها را تأمین نمی‌کند |
| MapLibre، react-map-gl | نقشهٔ WebGL2 با tile؛ canvas ساده جای آن را نمی‌گیرد |
| ECharts | نمودار زمانی با zoom، نقاط گمشده و uncertainty band |
| Radix، shadcn button utilities | dialog دارای focus management و primitive یکدست |
| Vazirmatn، Lucide | فونت فارسی self-host و آیکون‌های معنایی |
| FastAPI/Pydantic، SQLAlchemy/Alembic، psycopg/GeoAlchemy | API و migrationهای typed و PostGIS |
| TiTiler، boto3، PySTAC با validation | COG، S3 استاندارد و اعتبارسنجی رسمی metadata |
| Orval، Vitest/RTL، Playwright، Ruff/Pyright/pytest | تولید قرارداد و آزمون‌های صریح سند |

هیچ‌یک از workflow engine، احراز هویت، Redis، deck.gl، alert یا دامنهٔ عمومی اضافه نشده است.
