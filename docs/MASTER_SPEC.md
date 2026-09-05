# فرودید | FORUDID — Master Engineering Specification

## 0. مأموریت پروژه

«فرودید» یا **FORUDID** یک سامانه علمی‌ـ‌عملیاتی WebGIS برای پایش تغییرشکل سطح زمین ایران بر پایه Sentinel-1 InSAR است.

در وضعیت فعلی، پروژه فقط روی **لوکال‌هاست** اجرا می‌شود و هنوز دامنه عمومی ندارد. بنابراین هر اشاره به دامنه، لینک عمومی یا آدرس production باید فعلاً با آدرس توسعه محلی جایگزین شود؛ برای مثال:

```text
http://localhost:5173/map
```

یا هر پورت دیگری که در تنظیمات پروژه تعریف شده باشد.

نسخه اول نباید ادعا کند الگوریتم جدیدی برای InSAR ساخته است. محصول باید پردازش‌های علمی معتبر موجود را به یک زنجیره reproducible، versioned و قابل استفاده تبدیل کند.

کاربر باید بتواند:

1. یک AOI را روی نقشه ببیند.
2. نقشه سرعت تغییرشکل LOS را مشاهده کند.
3. coherence و uncertainty را ببیند.
4. روی یک نقطه کلیک کند.
5. مقدار LOS velocity و QC آن نقطه را ببیند.
6. سری زمانی displacement را مشاهده کند.
7. تاریخ، محصول، orbit و processing run را تشخیص دهد.
8. بفهمد عدد نمایش‌داده‌شده چقدر قابل اعتماد است.
9. لینک همان view را برای شخص دیگری ارسال یا در محیط محلی ذخیره کند.
10. metadata و provenance محصول را مشاهده کند.

اصل پروژه:

> اول یک دشت را درست اندازه بگیر، بعد ایران را اندازه بگیر.

MVP فقط با **ورامین** آغاز شود.

---

# 1. قواعد علمی غیرقابل مذاکره

## 1.1 LOS با فرونشست عمودی یکی نیست

در MVP هرگز عبارت‌هایی مانند:

```text
Vertical Subsidence = -72 mm/year
```

نمایش داده نشود، مگر اینکه محصول واقعاً از decomposition علمی مناسب Ascending + Descending تولید شده باشد.

در نسخه اول label اصلی باید باشد:

**نرخ تغییرشکل در راستای دید ماهواره — LOS Velocity**

یا:

**LOS Velocity (mm/year)**

این یکی از الزامات اصلی پروژه است.

## 1.2 علامت مقدار باید تعریف شود

هر محصول باید metadata مربوط به sign convention را داشته باشد.

Frontend نباید مستقل از metadata حدس بزند که مقدار منفی یا مثبت به چه معناست.

Tooltip در legend باید convention محصول را توضیح دهد.

## 1.3 displacement نسبی است

هر time series باید شامل موارد زیر باشد:

* reference date
* reference point/area
* orbit
* processing run
* unit

کاربر باید بتواند بفهمد مقدار نسبت به چه مرجعی محاسبه شده است.

## 1.4 QC بخشی از محصول است

هر عدد باید همراه حداقل این موارد قابل مشاهده باشد:

* temporal coherence
* uncertainty
* تعداد observations
* orbit direction
* relative orbit / track
* شروع دوره
* پایان دوره
* آخرین acquisition
* processing version
* reference point
* quality status

## 1.5 هیچ threshold علمی مهمی hard-code نشود

مواردی مانند:

* coherence threshold
* maximum temporal baseline
* maximum perpendicular baseline
* minimum valid observations
* uncertainty cutoff

باید داخل Processing Profile باشند.

همه باید versioned و قابل تغییر باشند.

---

# 2. تصمیم نهایی Frontend

## 2.1 Core

Frontend نهایی:

```text
React 19
TypeScript
Vite 8
pnpm
```

از Next.js استفاده نشود.

از SSR استفاده نشود.

Frontend یک SPA مستقل باشد که به FastAPI وصل می‌شود.

Build نهایی static باشد.

در محیط فعلی، frontend باید روی لوکال‌هاست اجرا شود و هیچ وابستگی به دامنه‌ای مانند `farodid.ir` یا هر دامنه عمومی دیگر نداشته باشد.

## 2.2 Routing

استفاده شود:

```text
@tanstack/react-router
```

دلیل اصلی: state قابل اشتراک نقشه باید داخل URL قرار گیرد.

مثال محلی:

```text
/map
  ?aoi=varamin
  &lon=51.6452
  &lat=35.3241
  &z=10.8
  &layer=velocity_los
  &orbit=descending
  &run=019...
  &panel=point
```

Search params با Zod validate شوند.

هر view مهم نقشه باید bookmarkable باشد و پس از reload در لوکال‌هاست قابل بازیابی باشد.

## 2.3 Server State

استفاده شود:

```text
@tanstack/react-query
```

تمام اطلاعات API مانند:

* AOI
* products
* point statistics
* time series
* acquisitions
* QC
* processing runs

با TanStack Query مدیریت شوند.

Redux نصب نشود.

Zustand هم در MVP نصب نشود.

State architecture:

```text
Shareable application state
        ↓
TanStack Router / URL

Remote/server state
        ↓
TanStack Query

Temporary UI state
        ↓
React local state
```

اگر بعداً state پیچیده شد، Zustand فقط با ADR جدا اضافه شود.

---

# 3. Map stack

استفاده شود:

```text
MapLibre GL JS 6.x
react-map-gl 8.x
```

Map component مستقیم در React نوشته شود.

برای MVP، deck.gl dependency ضروری نیست.

ولی معماری map layer registry طوری نوشته شود که بعداً بتوان اضافه کرد:

```text
deck.gl
```

کاربردهای احتمالی deck.gl:

* صدها هزار validation point
* GNSS stations
* infrastructure risk
* wells
* large scatter data
* GPU aggregation
* paths
* advanced geospatial visualization

## 3.1 Map performance rule

هیچ event پرتکراری مثل:

```text
mousemove
onHover
onViewStateChange
```

نباید در هر frame کل application state را update کند.

Camera state فقط روی:

```text
moveend
zoomend
```

یا با debounce مناسب وارد URL شود.

Hover state در local/ref نگهداری شود.

---

# 4. Visualization stack

Charts:

```text
Apache ECharts 6
```

از full bundle بدون نیاز استفاده نشود.

فقط moduleهای مورد نیاز import شوند.

Time-series chart باید شامل موارد زیر باشد:

* X = acquisition date
* Y = LOS displacement
* unit = mm برای نمایش
* reference zero
* tooltip
* uncertainty band در صورت وجود
* missing observations
* zoom
* reset zoom
* export CSV بعداً

Chart نباید با رنگ به‌تنهایی مفهوم quality را منتقل کند.

---

# 5. UI system

استفاده شود:

```text
Tailwind CSS 4
shadcn/ui
Radix UI
```

زبان اولیه:

```text
fa
```

جهت:

```html
<html lang="fa" dir="rtl">
```

RTL باید از اولین commit فعال باشد.

نه اینکه آخر پروژه اضافه شود.

برای اعداد فنی، تاریخ ISO، مختصات و identifierها wrapper با:

```css
direction: ltr;
unicode-bidi: isolate;
```

استفاده شود.

نام برند در رابط کاربری به شکل زیر نمایش داده شود:

```text
فرودید | FORUDID
```

---

# 6. Frontend API generation

FastAPI باید source of truth قرارداد API باشد.

Frontend typeهای API را دستی ننویسد.

Pipeline:

```text
FastAPI
   ↓
/openapi.json
   ↓
Orval
   ↓
TypeScript API Client
   ↓
TanStack Query hooks
```

استفاده شود:

```text
Orval 8
```

generated code داخل:

```text
apps/web/src/generated/api
```

باشد.

هیچ فایل generated دستی edit نشود.

CI باید بررسی کند generated client با OpenAPI sync است.

در محیط لوکال، آدرس API از طریق configuration قابل تنظیم باشد و به hostname داخلی Docker یا دامنه عمومی وابسته نباشد.

---

# 7. Frontend Testing

استفاده شود:

```text
Vitest
React Testing Library
Playwright
```

Unit test:

* utility
* parsers
* URL state
* unit conversion
* legend logic
* API adapters
* quality label logic

Component test:

* PointPanel
* LayerPanel
* Legend
* TimeSeriesChart
* ProductSelector

E2E:

* بازشدن map در لوکال‌هاست
* انتخاب AOI
* نمایش velocity
* click نقطه
* نمایش time series
* عوض‌کردن layer
* deep link
* reload کردن deep link
* mobile bottom sheet

در unit tests خود MapLibre می‌تواند mock شود.

در Playwright یک map واقعی با fixture COG اجرا شود.

---

# 8. Backend Stack

API:

```text
Python
FastAPI
Pydantic v2
SQLAlchemy 2
Alembic
psycopg 3
GeoAlchemy2
PostgreSQL
PostGIS
```

Package management API:

```text
uv
```

API environment از scientific processing environment جدا باشد.

---

# 9. جداسازی محیط API و Science

این دو environment هرگز یکی نشوند.

## API image

سبک‌تر:

```text
FastAPI
SQLAlchemy
TiTiler
Pydantic
GeoAlchemy
boto3
PySTAC
```

## Science image

با Conda/Mamba:

```text
MintPy
GDAL
Rasterio
xarray
h5py
zarr
asf_search
hyp3_sdk
PySTAC
rio-cogeo
scientific dependencies
```

دلیل:

dependencyهای MintPy/GDAL نباید deployment معمول API را شکننده کنند.

---

# 10. Raster serving

استفاده شود:

```text
TiTiler
```

اما MVP نباید TiTiler را الزاماً microservice مستقل کند.

داخل FastAPI mount شود:

```text
FastAPI
├── /api/v1/*
└── /tiles/*
      └── TiTiler routers
```

اگر tile traffic سنگین شد، بدون تغییر public API جدا شود.

در وضعیت فعلی، این مسیرها فقط از طریق لوکال‌هاست در دسترس هستند.

---

# 11. قانون امنیتی مهم TiTiler

Public API نباید چیزی شبیه این داشته باشد:

```text
/tiles?url=https://anything-user-wants.example/file.tif
```

کاربر هرگز URL arbitrary به TiTiler ندهد.

به‌جای آن:

```text
/tiles/{asset_id}/{z}/{x}/{y}.png
```

Backend:

1. `asset_id` را دریافت کند.
2. آن را در DB resolve کند.
3. بررسی کند asset published است.
4. internal S3 URI را پیدا کند.
5. همان URI trusted را به tiler بدهد.

این کار riskهای SSRF و access به objectهای غیرمجاز را کم می‌کند.

---

# 12. Storage architecture

معماری به vendor وابسته نباشد.

Interface:

```text
S3-compatible Object Storage
```

Application فقط با استاندارد S3 کار کند.

Configuration:

```text
S3_ENDPOINT
S3_REGION
S3_ACCESS_KEY
S3_SECRET_KEY
S3_BUCKET
S3_PATH_STYLE
```

Object storage private باشد.

Rasterها public bucket نشوند مگر بعداً تصمیم معماری صریح گرفته شود.

در محیط توسعه، object storage می‌تواند با سرویس محلی S3-compatible اجرا شود و هیچ دامنه عمومی برای آن لازم نیست.

---

# 13. Object naming

هیچ محصول علمی overwrite نشود.

ساختار پیشنهادی:

```text
s3://forudid/
  aoi/
    varamin/
      descending/
        track-071/
          runs/
            {run_uuid}/
              raw-hyp3/
              mintpy/
              publish/
                velocity_los.tif
                temporal_coherence.tif
                uncertainty_velocity.tif
                valid_mask.tif
                timeseries.zarr/
                stac-item.json
                qc-report.json
                provenance.json
```

نام bucket و prefix باید از configuration قابل تغییر باشد.

`latest/velocity.tif` ساخته نشود.

Latest product در DB resolve شود.

---

# 14. Scientific archive vs Web product

دو مفهوم جدا:

## Scientific archive

خروجی اصلی MintPy:

```text
HDF5
```

نگهداری شود.

## Published web products

```text
COG
Zarr v3
STAC
JSON metadata
```

یعنی:

```text
MintPy
  │
  ├── HDF5 archival output
  │
  └── publish
       ├── COG
       ├── Zarr
       ├── STAC
       ├── QC
       └── provenance
```

HDF5 صرفاً به خاطر اضافه‌شدن Zarr حذف نشود.

---

# 15. STAC

از روز اول metadata محصول با STAC تولید شود.

اما در MVP نیازی به:

```text
pgSTAC
stac-fastapi
```

نیست.

ابتدا PySTAC کافی است.

ساختار:

```text
STAC Catalog
  ↓
Collection: forudid-varamin
  ↓
Item: processing run / velocity product
```

هر STAC Item باید حداقل شامل:

* geometry
* bbox
* datetime/start_datetime/end_datetime
* orbit direction
* relative orbit
* platform
* processing version
* run ID
* CRS metadata
* unit metadata
* assets

Assets:

```text
velocity_los
temporal_coherence
uncertainty_velocity
timeseries
qc
provenance
```

---

# 16. Database

PostgreSQL + PostGIS source of truth metadata و vector data باشد.

Rasterها داخل PostgreSQL ذخیره نشوند.

## 16.1 areas_of_interest

```text
id UUID
slug TEXT UNIQUE
name_fa TEXT
name_en TEXT
geom MULTIPOLYGON 4326
bbox JSONB
active BOOLEAN
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

GIST index:

```text
geom
```

---

# 17. acquisitions

```text
id UUID
external_id TEXT UNIQUE
platform TEXT
acquisition_at TIMESTAMPTZ
relative_orbit INTEGER
orbit_direction ENUM
polarization TEXT
beam_mode TEXT
provider TEXT
geom MULTIPOLYGON
raw_metadata JSONB
created_at TIMESTAMPTZ
```

Indexes:

```text
acquisition_at
relative_orbit
orbit_direction
geom GIST
```

---

# 18. bursts

```text
id UUID
acquisition_id UUID FK
burst_id TEXT
subswath TEXT
burst_index INTEGER
geom MULTIPOLYGON
metadata JSONB
```

Unique:

```text
(acquisition_id, burst_id)
```

---

# 19. insar_pairs

```text
id UUID
aoi_id UUID
reference_acquisition_id UUID
secondary_acquisition_id UUID

relative_orbit INTEGER

temporal_baseline_days INTEGER
perpendicular_baseline_m FLOAT NULL

pair_signature TEXT UNIQUE

status ENUM

created_at
```

`pair_signature` برای idempotency استفاده شود.

---

# 20. processing_runs

مهم‌ترین table عملیاتی:

```text
id UUID
aoi_id UUID

pipeline_version TEXT
git_sha TEXT
processing_profile TEXT
config JSONB

status ENUM:
  created
  discovering
  submitting
  processing
  downloading
  mintpy
  qc
  validation_required
  publishing
  published
  failed
  cancelled

started_at TIMESTAMPTZ
finished_at TIMESTAMPTZ

parent_run_id UUID NULL

log_uri TEXT
error JSONB
created_at
```

هر بار تغییر config علمی باید run جدید بسازد.

---

# 21. processing_jobs

```text
id UUID
processing_run_id UUID
provider TEXT
job_type TEXT

external_job_id TEXT UNIQUE

status TEXT

submitted_at
completed_at
expires_at

request JSONB
response JSONB
```

HyP3 job metadata کامل نگهداری شود.

---

# 22. products

```text
id UUID
processing_run_id UUID
aoi_id UUID

kind ENUM:
  velocity_los
  temporal_coherence
  velocity_uncertainty
  valid_mask
  timeseries

orbit_direction
relative_orbit

start_date
end_date

unit
crs
resolution_metadata JSONB

status ENUM:
  draft
  validated
  published
  superseded

processing_version

stats JSONB
stac_item_id TEXT

created_at
published_at
```

---

# 23. product_assets

```text
id UUID
product_id UUID

role TEXT
object_key TEXT
media_type TEXT

size_bytes BIGINT
checksum_sha256 TEXT
etag TEXT

created_at
```

object key ذخیره شود، نه presigned URL.

---

# 24. reference_points

```text
id UUID
processing_run_id UUID

geom POINT
method TEXT
reason TEXT

selected_by TEXT

stability_metrics JSONB
created_at
```

Frontend باید بتواند reference point مرتبط را نشان دهد.

---

# 25. qc_metrics

```text
id UUID
processing_run_id UUID
product_id UUID NULL

metric_name TEXT

value_number DOUBLE PRECISION NULL
value_json JSONB NULL

threshold JSONB NULL
passed BOOLEAN NULL

created_at
```

Thresholdها با run ذخیره شوند.

---

# 26. validation_observations

برای آینده:

```text
id
source_type:
  GNSS
  leveling
  literature
  field

geom
observed_at

values JSONB
source_reference TEXT
metadata JSONB
```

---

# 27. API structure

Base path:

```text
/api/v1
```

در محیط فعلی، API از طریق آدرس محلی پروژه در دسترس است؛ برای مثال:

```text
http://localhost:8000/api/v1
```

پورت باید از configuration خوانده شود و در مستندات پروژه به‌صورت ثابت فرض نشود.

Health:

```text
GET /health/live
GET /health/ready
```

AOI:

```text
GET /api/v1/aois
GET /api/v1/aois/{slug}
```

Products:

```text
GET /api/v1/products
GET /api/v1/products/{id}
GET /api/v1/products/{id}/metadata
GET /api/v1/products/{id}/legend
GET /api/v1/products/{id}/quality
```

Filtering:

```text
?aoi=varamin
&kind=velocity_los
&orbit=descending
&relative_orbit=71
&status=published
```

---

# 28. Point API

```text
GET /api/v1/points/summary
```

Parameters:

```text
lon
lat
product_id
```

Response:

```json
{
  "coordinate": {
    "lon": 51.6452,
    "lat": 35.3241
  },
  "product_id": "uuid",
  "velocity_los": {
    "value": -0.0712,
    "unit": "m/year"
  },
  "velocity_uncertainty": {
    "value": 0.006,
    "unit": "m/year"
  },
  "temporal_coherence": 0.89,
  "observations": 68,
  "orbit_direction": "descending",
  "relative_orbit": 71,
  "reference_id": "uuid",
  "start_date": "2025-01-01",
  "end_date": "2026-08-29",
  "quality": "valid"
}
```

Internal unit SI نگه داشته شود.

Frontend:

```text
m/year → mm/year
```

تبدیل کند یا API presentation value جدا بدهد.

Canonical value در response از بین نرود.

---

# 29. Time Series API

```text
GET /api/v1/points/timeseries
```

Parameters:

```text
lon
lat
run_id
```

Response:

```json
{
  "coordinate": {
    "lon": 51.6452,
    "lat": 35.3241
  },
  "unit": "m",
  "reference_date": "2025-01-01",
  "reference_point_id": "uuid",
  "series": [
    {
      "date": "2025-01-01",
      "displacement": 0.0,
      "uncertainty": null
    }
  ]
}
```

برای MVP extraction می‌تواند server-side از HDF5/Zarr انجام شود.

Caching برای point requests بعداً اضافه شود.

---

# 30. Region statistics API

بعد از point API:

```text
POST /api/v1/regions/statistics
```

Body:

```json
{
  "product_id": "uuid",
  "geometry": {
    "type": "Polygon",
    "coordinates": []
  }
}
```

Response:

```text
mean
median
min
max
std
valid_pixel_count
coverage_fraction
area_above_threshold
```

در MVP threshold arbitrary از client قبول نشود مگر محدود و validated باشد.

Polygon محدودیت داشته باشد:

* maximum vertices
* maximum geographic area
* timeout
* request size

---

# 31. Tile API

Public در محیط محلی:

```text
GET /tiles/{asset_id}/{z}/{x}/{y}.png
```

Query parameters فقط whitelist:

```text
style
```

مثال:

```text
?style=velocity-default
```

به client اجازه نده:

* arbitrary file path
* arbitrary S3 URL
* arbitrary remote URL
* arbitrary Python expression

Style definitions server-side باشند.

---

# 32. Product styles

Registry:

```text
velocity-default
velocity-high-contrast
coherence-default
uncertainty-default
```

هر style شامل:

```text
rescale
colormap
nodata behavior
mask behavior
legend ticks
unit
```

باشد.

Frontend legend همان style metadata را از API بگیرد.

Color scale و tile rendering نباید مستقل از هم تعریف شوند.

---

# 33. Frontend routes

```text
/
/map
/areas/$aoiSlug
/products/$productId
/methodology
/about
```

صفحه اصلی می‌تواند ساده باشد.

هسته محصول `/map` است.

در محیط فعلی، مسیرهای بالا باید با آدرس لوکال frontend قابل دسترسی باشند؛ برای مثال:

```text
http://localhost:5173/map
```

---

# 34. Map URL state

Schema تقریبی:

```text
aoi
lon
lat
z
bearing
pitch
layer
product
run
orbit
from
to
opacity
panel
```

همه search params validate شوند.

Invalid URL نباید app را crash کند.

Fallback:

```text
default Iran extent
```

یا AOI default ورامین در MVP.

---

# 35. Desktop layout

پیشنهاد:

```text
┌──────────────────────────────────────────────────────────┐
│ فرودید | FORUDID       Search             Product / About│
├───────────────┬──────────────────────────────────────────┤
│               │                                          │
│ Layer panel   │                                          │
│ سمت راست      │                  MAP                     │
│               │                                          │
│               │                                          │
│               │                                          │
├───────────────┴──────────────────────────────────────────┤
│ Selected Point / Time Series                    ▲        │
└──────────────────────────────────────────────────────────┘
```

RTL:

Layer panel سمت راست.

Bottom panel برای time series.

Map بیشترین فضای ممکن را بگیرد.

---

# 36. Mobile layout

روی موبایل:

* map تمام صفحه
* top search compact
* floating layer button
* selected point به شکل bottom sheet
* time-series داخل bottom sheet
* هیچ sidebar دائمی وجود نداشته باشد

Touch targets حداقل اندازه مناسب داشته باشند.

---

# 37. Layer panel

MVP فقط:

```text
● LOS Velocity
○ Temporal Coherence
○ Velocity Uncertainty
```

Opacity:

```text
0–100%
```

Metadata:

```text
Orbit
Track
Start
End
Processing version
```

لایه‌های آبخوان، جاده، راه‌آهن و غیره تا MVP scientific درست نشده اضافه نشوند.

---

# 38. Legend

Velocity legend:

```text
LOS Velocity
mm/year
```

نباید فقط:

```text
Subsidence
```

نوشته شود.

Legend باید:

* unit
* min/max
* ticks
* nodata
* masked pixels
* sign convention tooltip

را داشته باشد.

---

# 39. Point interaction

Click map:

```text
Map Click
    ↓
coordinate
    ↓
GET point summary
    ↓
show point marker
    ↓
GET time series
    ↓
open bottom panel
```

Request قبلی در click جدید cancel شود.

TanStack Query query key شامل:

```text
productId
rounded lon
rounded lat
```

باشد.

دقت rounding باید با raster resolution سازگار باشد.

---

# 40. Point detail UI

نمایش:

```text
مختصات
51.6452, 35.3241

LOS Velocity
-71.2 mm/year

Uncertainty
±6.0 mm/year

Temporal coherence
0.89

Observations
68

Orbit
Descending

Relative orbit
71

Period
2025-01-01 → 2026-08-29

Reference
REF-...

Processing
v...
```

اگر quality بد است، مقدار حذف نشود؛ با status واضح نشان داده شود.

مثلاً:

```text
کیفیت پایین — برای استناد مناسب نیست
```

---

# 41. Quality model در UI

مثلاً:

```text
valid
caution
invalid
nodata
```

اما این status از backend/QC بیاید.

Frontend خودش science threshold اختراع نکند.

رنگ تنها indicator نباشد.

هم icon و هم text باشد.

---

# 42. Accessibility

تمام داده‌ای که فقط روی canvas/WebGL دیده می‌شود، برای selected point در DOM قابل خواندن باشد.

الزامات:

* keyboard navigation
* visible focus
* semantic buttons
* ARIA labels
* chart textual summary
* contrast مناسب
* color-independent status
* reduced-motion support

---

# 43. Basemap

هیچ demo tile provider عمومی بدون مجوز به‌عنوان production basemap استفاده نشود.

در وضعیت فعلی، basemap فقط برای محیط توسعه لوکال پیکربندی می‌شود و نباید فرض شود که دامنه عمومی یا سرویس production در دسترس است.

Basemap configuration:

```text
VITE_BASEMAP_STYLE_URL
VITE_BASEMAP_ATTRIBUTION
```

باشد.

Provider قابل تعویض باشد.

Attribution هیچ‌وقت مخفی نشود.

---

# 44. Repository structure

Monorepo:

```text
forudid/
│
├── apps/
│   ├── web/
│   │   ├── src/
│   │   ├── public/
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── api/
│       ├── src/forudid_api/
│       ├── tests/
│       └── pyproject.toml
│
├── packages/
│   └── python/
│       └── forudid_core/
│           ├── domain/
│           ├── db/
│           ├── storage/
│           └── stac/
│
├── pipeline/
│   ├── discovery/
│   ├── pairing/
│   ├── hyp3/
│   ├── mintpy/
│   ├── qc/
│   ├── publish/
│   ├── profiles/
│   └── tests/
│
├── infra/
│   ├── compose/
│   ├── caddy/
│   └── docker/
│
├── fixtures/
│   ├── sample-cog/
│   ├── sample-timeseries/
│   └── sample-stac/
│
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── science/
│   └── operations/
│
├── scripts/
│
├── compose.yml
├── Makefile
├── .env.example
└── README.md
```

نام repository و packageها باید با برند فعلی پروژه، یعنی `forudid`، هماهنگ باشند.

---

# 45. Frontend folder structure

```text
apps/web/src/

app/
  router.tsx
  providers.tsx

routes/
  index.tsx
  map.tsx
  areas.$aoiSlug.tsx
  products.$productId.tsx
  methodology.tsx
  about.tsx

features/
  map/
  layers/
  products/
  points/
  timeseries/
  quality/
  aoi/

components/
  ui/
  layout/

generated/
  api/

lib/
  api/
  units/
  geo/
  format/
  config/

styles/

test/
```

Feature-first architecture.

Component dump بزرگی در:

```text
components/
```

ساخته نشود.

---

# 46. Backend folder structure

```text
apps/api/src/forudid_api/

main.py

api/
  v1/
    aois.py
    products.py
    points.py
    regions.py
    acquisitions.py
    runs.py

db/
  models/
  repositories/
  session.py

schemas/

services/
  products/
  points/
  statistics/
  tiles/

tiler/

core/
  config.py
  logging.py
  errors.py
  security.py
```

API handler مستقیم SQL پیچیده اجرا نکند.

Repository/service separation ساده و معقول باشد.

Overengineering نشود.

---

# 47. Scientific pipeline commands

Pipeline یک CLI داشته باشد.

مثلاً:

```text
forudid discover
forudid pair
forudid submit-hyp3
forudid fetch-hyp3
forudid run-mintpy
forudid qc
forudid publish
```

و:

```text
forudid run \
  --aoi varamin \
  --profile varamin-desc-20x4-v1
```

هر step idempotent باشد.

Run شکست‌خورده از صفر شروع نشود.

---

# 48. Processing Profile

نمونه:

```yaml
name: varamin-desc-20x4-v1

aoi: varamin

platform:
  - SENTINEL-1

orbit_direction: DESCENDING

polarization: VV

period:
  years: 2

hyp3:
  looks: 20x4

pairing:
  strategy: sbas
  max_temporal_baseline_days: null
  max_perpendicular_baseline_m: null
  minimum_network_degree: null

quality:
  temporal_coherence_threshold: null
  minimum_observations: null

publish:
  velocity: true
  coherence: true
  uncertainty: true
  timeseries: true
```

`null` یعنی threshold علمی هنوز باید از validation/profile تعیین شود.

Codex نباید خودش عدد علمی اختراع کند.

---

# 49. Sentinel discovery

استفاده:

```text
asf_search
```

برای هر AOI:

1. geometry query
2. Sentinel-1 relevant acquisitions
3. orbit filtering
4. relative orbit consistency
5. polarization consistency
6. burst coverage
7. persistence در DB

Raw provider metadata هم ذخیره شود.

Discovery باید repeatable باشد.

---

# 50. Pair network

اول SBAS network ساخته شود.

Network باید graph در نظر گرفته شود.

قبل از submit:

```text
is graph connected?
```

بررسی شود.

اگر disconnected:

run متوقف شود و QC error بدهد.

Pair generation output versioned باشد.

برای هر pair:

```text
reference
secondary
temporal baseline
perpendicular baseline when available
burst set
signature
```

ذخیره شود.

---

# 51. HyP3 integration

استفاده:

```text
hyp3_sdk
```

Job submission idempotent باشد.

قبل از submit:

```text
pair_signature
+
processing options
+
burst ids
```

hash شوند.

اگر job قبلی موجود است، duplicate submit نشود.

HyP3 Multi-Burst برای Sentinel-1 مسیر MVP باقی بماند.

پس از کامل‌شدن job، output سریع به object storage خود پروژه منتقل شود.

Provider storage هیچ‌وقت archive دائمی پروژه فرض نشود.

---

# 52. HyP3 job lifecycle

```text
created
  ↓
submitted
  ↓
running
  ↓
succeeded
  ↓
downloading
  ↓
archived
```

Failure:

```text
failed
```

با:

```text
provider message
retry count
last attempt
```

ذخیره شود.

---

# 53. Integrity

بعد از download:

```text
SHA-256
size
file list
```

ثبت شود.

Upload به S3 انجام شود.

سپس integrity دوباره بررسی شود.

فقط بعد:

```text
archived = true
```

شود.

---

# 54. MintPy

از workflow استاندارد MintPy استفاده شود.

Config MintPy برای هر processing run ذخیره شود.

Run command، dependency versions و config همگی در provenance قرار گیرند.

خروجی‌هایی مانند:

```text
timeseries.h5
velocity.h5
temporalCoherence.h5
geometry*.h5
```

به‌عنوان scientific artifact نگهداری شوند.

---

# 55. Reproducibility

هر processing run باید بتواند بگوید:

```text
git_sha
pipeline_version
container_digest
MintPy version
GDAL version
HyP3 processing type
processing profile
input acquisitions
input pairs
reference point
```

بدون این metadata محصول publish نشود.

---

# 56. QC Pipeline

QC یک step مستقل باشد.

حداقل checks:

### Network QC

```text
connected network
number of acquisitions
number of pairs
date coverage
```

### Raster QC

```text
dimensions
CRS
transform
nodata
finite coverage
range sanity
```

### Time-series QC

```text
number of observations
missing epochs
temporal coherence
residual metrics where available
```

### Unwrapping QC

هر metric قابل استخراج از workflow انتخاب‌شده ذخیره شود.

### Reference QC

```text
reference point exists
reference point metadata exists
reference area is valid
```

### Product QC

```text
COG valid
STAC valid
checksums available
all required assets exist
```

---

# 57. Publication Gate

MVP publication باید manual scientific approval داشته باشد.

Flow:

```text
processing complete
      ↓
QC computed
      ↓
validation_required
      ↓
manual scientific review
      ↓
validated
      ↓
publish
```

هیچ run صرفاً چون process exit code = 0 بوده public نشود.

---

# 58. COG publication

برای هر raster web محصول COG ساخته شود.

حداقل:

```text
velocity_los.tif
temporal_coherence.tif
velocity_uncertainty.tif
valid_mask.tif
```

COG validation در CI/publish pipeline انجام شود.

Overviews ساخته شوند.

NoData صریح باشد.

CRS و transform حفظ شوند.

---

# 59. Zarr

Published time cube:

```text
timeseries.zarr
```

ساختار مفهومی:

```text
time
y
x

displacement[time,y,x]
```

Coordinate arrays و attributes:

```text
unit
crs
reference
processing_run_id
```

داشته باشند.

Zarr برای web/cloud analysis است.

HDF5 archive همچنان حفظ شود.

---

# 60. Unit policy

Canonical:

```text
displacement = meter
velocity = meter/year
uncertainty_velocity = meter/year
coherence = dimensionless 0..1
```

Display:

```text
mm
mm/year
```

تمام conversionها در utility واحد نوشته شوند.

هیچ component به‌صورت دستی:

```text
value * 1000
```

تکرار نکند.

---

# 61. Time policy

همه timestampهای operational:

```text
UTC
TIMESTAMPTZ
ISO 8601
```

Acquisition date از provider preserve شود.

Frontend localization فارسی فقط presentation باشد.

---

# 62. Coordinate policy

PostGIS vectors:

```text
EPSG:4326
```

باشد.

Scientific raster CRS بدون دلیل فقط برای frontend تغییر داده نشود.

TiTiler مسئول tile reprojection به WebMercator باشد.

CRS هر product در metadata ذخیره شود.

---

# 63. Observability

از روز اول structured logging.

هر log مرتبط باید در صورت امکان داشته باشد:

```text
request_id
run_id
job_id
aoi_id
product_id
```

JSON logs در production.

در محیط لوکال نیز logها باید برای debugging خوانا و قابل فیلتر باشند.

Frontend error boundary داشته باشد.

API exceptionها error code استاندارد بدهند.

مثال:

```json
{
  "error": {
    "code": "PRODUCT_NOT_PUBLISHED",
    "message": "..."
  }
}
```

Stack trace به user فرستاده نشود.

---

# 64. Security

## Public

در MVP فقط read APIs public باشند.

در وضعیت فعلی، منظور از public فقط قابل دسترسی بودن در محیط توسعه محلی است؛ هیچ endpointی هنوز روی اینترنت عمومی منتشر نشده است.

Processing API public نباشد.

## Secrets

هیچ‌کدام commit نشوند:

```text
Earthdata credentials
HyP3 credentials/tokens
S3 secrets
DB password
```

`.env.example` فقط نام متغیرها را داشته باشد.

## CORS

فقط originهای مشخص.

در محیط لوکال، originهای توسعه مانند `http://localhost:5173` باید صریحاً در configuration تعریف شوند.

`*` در production ممنوع.

## S3

bucket private.

API/worker credentials least privilege.

## Statistics endpoint

محدودیت:

* polygon size
* geometry complexity
* timeout
* request size
* rate

## TiTiler

arbitrary URL ممنوع.

---

# 65. Caching

MVP:

Browser cache برای immutable tile assets.

Product assets immutable هستند، بنابراین:

```text
Cache-Control: public, max-age=..., immutable
```

در صورت مناسب‌بودن deployment.

Metadata APIs cache کوتاه‌تر.

`latest` endpoint در صورت وجود cache کوتاه.

بعداً CDN برای tileها.

Redis در MVP برای cache اضافه نشود مگر evidence واقعی لازم بودن وجود داشته باشد.

در وضعیت فعلی، caching باید با نیازهای لوکال‌هاست و fixtureها سازگار باشد و باعث stale شدن داده‌های توسعه نشود.

---

# 66. Docker Compose MVP

Services:

```text
postgres
object-storage
api
worker
web
reverse-proxy
```

نه:

```text
Kubernetes
Kafka
Celery
RabbitMQ
Elasticsearch
GraphQL
service mesh
```

Reverse proxy در محیط لوکال باید routeهای داخلی را بدون نیاز به دامنه عمومی فراهم کند.

---

# 67. Workflow engine

در MVP:

```text
Python CLI + persisted processing state
```

کافی است.

Prefect فقط وقتی اضافه شود که:

* acquisition جدید خودکار ingest شود
* schedule لازم شود
* retries مرکزی لازم شود
* چند worker داشته باشیم
* monitoring workflow لازم شود

آن موقع:

```text
Prefect 3
```

اضافه شود.

نه قبل از آن.

---

# 68. Reverse proxy

یک reverse proxy ساده استفاده شود.

Routeها:

```text
/          → web
/api/*     → FastAPI
/tiles/*   → FastAPI/TiTiler
```

در محیط فعلی، این routeها باید از طریق لوکال‌هاست قابل دسترسی باشند.

TLS فقط در زمان استقرار روی محیط عمومی یا production اضافه شود.

Frontend هیچ hostname داخلی container را نشناسد.

---

# 69. MVP Development Strategy

مستقیماً از Sentinel شروع نشود.

اول یک vertical slice با fixture ساخته شود.

## Stage A — Fake science, real software

استفاده از:

```text
sample velocity COG
sample coherence COG
sample timeseries JSON/Zarr
```

هدف:

```text
DB
→ API
→ Tile
→ Map
→ Click
→ Point API
→ Chart
```

کاملاً کار کند.

این stage mock architecture نیست؛ data fixture است.

---

# 70. Milestone 0 — Repository Foundation

Codex باید:

1. monorepo بسازد.
2. README بنویسد.
3. `.editorconfig` اضافه کند.
4. `.env.example` بسازد.
5. Docker Compose base بسازد.
6. CI base بسازد.
7. ADR structure بسازد.
8. frontend scaffold کند.
9. FastAPI scaffold کند.
10. PostGIS migration اولیه بسازد.

Acceptance:

```text
docker compose up
```

کل dev stack را بالا بیاورد.

Frontend health OK.

API health OK.

DB health OK.

هیچ دامنه‌ای برای موفقیت این milestone لازم نیست؛ تمام سرویس‌ها باید با آدرس‌های محلی و configuration مستندشده در دسترس باشند.

---

# 71. Milestone 1 — Frontend Shell

بسازد:

```text
React
Vite
TanStack Router
TanStack Query
Tailwind
shadcn
RTL
MapLibre
```

Routes:

```text
/
/map
/methodology
/about
```

Map empty shell.

Acceptance:

* Persian RTL
* responsive
* no console errors
* route reload works
* URL state works
* اجرا روی لوکال‌هاست بدون وابستگی به دامنه عمومی

---

# 72. Milestone 2 — Data Model

Alembic migration برای:

```text
areas_of_interest
products
product_assets
processing_runs
reference_points
qc_metrics
```

ورامین seed شود.

Acceptance:

```text
alembic upgrade head
alembic downgrade -1
alembic upgrade head
```

همه موفق.

---

# 73. Milestone 3 — Sample Product

یک COG کوچک fixture وارد object storage شود.

DB product ایجاد شود.

API:

```text
GET /products
GET /products/{id}
```

بسازد.

Tile endpoint با asset ID کار کند.

Acceptance:

COG روی MapLibre در محیط لوکال دیده شود.

---

# 74. Milestone 4 — Real WebGIS MVP UI

بسازد:

* LayerPanel
* Legend
* ProductSelector
* Opacity control
* metadata dialog
* loading states
* error states
* empty states

Acceptance:

Velocity/Coherence/Uncertainty fixture قابل تعویض.

---

# 75. Milestone 5 — Point Query

API point sampling.

Click map.

Point panel.

Acceptance:

کلیک روی coordinate معلوم مقدار fixture مورد انتظار برگرداند.

E2E test داشته باشد.

---

# 76. Milestone 6 — Time Series

Timeseries fixture.

API endpoint.

ECharts panel.

Acceptance:

click point → chart.

URL refresh → selected context حفظ شود.

---

# 77. Milestone 7 — QC UI

Backend QC schema.

Frontend:

```text
uncertainty
coherence
observations
reference
processing version
quality
```

نمایش دهد.

Acceptance:

هیچ velocity بدون quality context در detail panel نمایش داده نشود.

---

# 78. Milestone 8 — STAC Publisher

PySTAC اضافه شود.

Sample product STAC Item تولید شود.

STAC validate شود.

Acceptance:

هر published product STAC metadata معتبر داشته باشد.

---

# 79. Milestone 9 — Sentinel Discovery

حالا وارد science واقعی شو.

`asf_search` integration.

برای Varamin:

```text
Sentinel-1
Descending
target track
target burst coverage
1–2 years
```

metadata در DB.

Acceptance:

query تکراری duplicate ایجاد نکند.

---

# 80. Milestone 10 — SBAS Pair Builder

Acquisitions → graph.

Connectivity validation.

Persist pairs.

Acceptance:

* deterministic output
* duplicate pair ندارد
* disconnected network detect می‌شود

---

# 81. Milestone 11 — HyP3 Integration

Job submission.

Job polling.

Download.

Archive.

Checksum.

Acceptance:

حداقل یک pair واقعی کامل end-to-end archive شود.

---

# 82. Milestone 12 — Full Varamin HyP3 Stack

تمام pairهای profile تأییدشده پردازش شوند.

Failure recovery.

Acceptance:

همه interferogramهای مورد نیاز archive شده باشند.

---

# 83. Milestone 13 — MintPy Runner

Science container.

MintPy config.

Run tracking.

Output archive.

Acceptance:

برای Varamin خروجی واقعی:

```text
timeseries
velocity
coherence
geometry
```

تولید شود.

---

# 84. Milestone 14 — Scientific QC

QC report تولید شود.

run تا زمان manual approval:

```text
validation_required
```

بماند.

Acceptance:

QC report machine-readable و human-readable داشته باشد.

---

# 85. Milestone 15 — Production Publisher

MintPy output:

```text
HDF5
 ↓
publish
 ├ COG velocity
 ├ COG coherence
 ├ COG uncertainty
 ├ Zarr timeseries
 ├ STAC
 ├ QC JSON
 └ provenance JSON
```

Acceptance:

تمام checksumها ثبت.

COG validates.

STAC validates.

Frontend product واقعی را در محیط لوکال نمایش دهد.

---

# 86. Milestone 16 — First Scientific Release

ورامین.

فقط:

```text
Descending
LOS
```

Frontend هیچ vertical product نشان ندهد.

یک نسخه release:

```text
Varamin LOS v1
```

با processing version ثابت.

این لحظه MVP واقعی پروژه است.

هرگونه اشاره به release در این مرحله باید به نسخه محلی یا build مشخص پروژه اشاره کند، نه یک دامنه عمومی.

---

# 87. Phase 2 — Automation

بعد از موفقیت Varamin:

new acquisition detection.

Flow:

```text
discover
  ↓
diff with DB
  ↓
new acquisition
  ↓
pair
  ↓
HyP3
  ↓
archive
  ↓
MintPy update/reprocess
  ↓
QC
  ↓
manual approval
  ↓
publish
```

در این مرحله Prefect قابل اضافه‌شدن است.

---

# 88. Phase 3 — Multiple Basins

ترتیب پیشنهادی:

```text
Varamin
↓
Tehran / Karaj
↓
Isfahan
↓
Rafsanjan
↓
Mashhad
↓
major subsidence basins
```

هر AOI profile مستقل داشته باشد.

---

# 89. Phase 4 — Context layers

بعد از معتبرشدن science:

```text
aquifers
groundwater wells
railway
roads
cities
agriculture
land use
faults
GNSS
```

برای vectorهای کوچک:

```text
GeoJSON API
```

برای national-scale dynamic vector:

```text
MVT
```

بعداً یک vector tile server مانند Martin قابل اضافه است.

نه در MVP.

---

# 90. Phase 5 — Ascending + Descending

وقتی هر دو track معتبر داریم:

```text
Ascending LOS
+
Descending LOS
↓
decomposition
```

محصول احتمالی:

```text
Vertical
East-West
```

فقط با فرض‌ها و uncertainty مشخص.

اگر فرض negligible north-south استفاده می‌شود، در metadata و UI صریحاً ذکر شود.

---

# 91. Phase 6 — Infrastructure Risk

مثلاً:

```text
Railway geometry
       +
validated deformation product
       ↓
intersection / zonal statistics
       ↓
risk context
```

UI بتواند بگوید:

```text
18.3 km of railway
intersects high-deformation zone
```

اما «خطر» علمی/مهندسی نباید صرفاً با threshold raster تعریف شود.

---

# 92. Phase 7 — Alerts

Alert قبل از baseline معتبر ساخته نشود.

نه:

```text
if velocity < -50:
  ALERT
```

بلکه بعدها:

```text
current trend
+
historical baseline
+
uncertainty
+
quality
+
persistence
+
spatial consistency
↓
candidate alert
↓
validation
```

اول alert داخلی برای analyst.

Public alert بعد از اعتبارسنجی.

---

# 93. Performance budgets

Frontend:

* map first interaction باید سریع باشد
* route-level code splitting
* ECharts lazy load
* deck.gl فقط اگر استفاده شد lazy load
* پنل‌های غیرضروری lazy
* تصاویر بزرگ bundle نشوند

Map:

* tile source
* نه download کامل raster
* GeoJSON بسیار بزرگ مستقیماً browser داده نشود

API:

* point request سریع
* DB indexes
* tile caching
* N+1 query ممنوع

---

# 94. Browser support

Target:

* current Chrome
* current Firefox
* current Edge
* current Safari
* modern Android/iOS browsers

WebGL2 requirement در documentation ذکر شود.

اگر browser WebGL2 ندارد:

یک error page قابل فهم نمایش داده شود.

---

# 95. Coding rules TypeScript

```text
strict = true
```

ممنوع:

```text
any
```

مگر با comment توجیهی.

استفاده شود:

* discriminated unions
* Zod at runtime boundaries
* generated API types
* exhaustive switch

Componentهای بزرگ شکسته شوند.

Business logic داخل JSX انباشته نشود.

---

# 96. Coding rules Python

* type hints
* Ruff
* Pyright
* pytest
* Pydantic boundaries
* SQLAlchemy models از API مستقیم return نشوند
* DB transactions explicit
* timezone-aware datetime
* Decimal فقط جایی که واقعاً لازم است

---

# 97. Scientific tests

یک golden fixture کوچک داشته باش.

مثلاً چند pixel و epoch مشخص.

Regression test بررسی کند:

* dimensions
* date count
* velocity sample
* coherence sample
* spatial extent
* nodata
* unit

در tolerance علمی مشخص.

Science regression test با refactor software نباید بی‌دلیل عوض شود.

---

# 98. API contract tests

OpenAPI snapshot.

Generated TypeScript client.

CI:

اگر OpenAPI تغییر کرد ولی generated client commit نشده:

FAIL.

---

# 99. Docker image policy

هر production build با tag متغیر `latest` deploy نشود.

بعد از تثبیت:

* exact version
* lock files
* image digest

ثبت شوند.

Scientific run باید container digest داشته باشد.

---

# 100. Database migration policy

Migrationهای منتشرشده rewrite نشوند.

هر schema change:

migration جدید.

Production startup خودش migration destructive اجرا نکند مگر deployment step صریح.

---

# 101. Product versioning

سه نوع version جدا:

```text
application_version
pipeline_version
product_version
```

مثال:

```text
app: 0.4.0
pipeline: insar-v2.1.0
product: varamin-desc-071-2026q3-v1
```

این‌ها با هم اشتباه نشوند.

---

# 102. Provenance JSON

نمونه مفهومی:

```json
{
  "run_id": "...",
  "pipeline_version": "...",
  "git_sha": "...",
  "container_digest": "...",
  "provider": "ASF HyP3",
  "processor": "MintPy",
  "orbit_direction": "descending",
  "relative_orbit": 71,
  "inputs": [],
  "pair_network": [],
  "processing_profile": "...",
  "reference": {},
  "outputs": [],
  "created_at": "..."
}
```

---

# 103. Error handling UI

چهار state عمومی:

```text
loading
error
empty
success
```

هیچ spinner بی‌پایان.

Error message:

* فارسی
* قابل فهم
* دارای retry در صورت منطقی بودن

Technical error در dev console.

---

# 104. Offline/degraded behavior

اگر basemap fail شد ولی scientific overlay/API سالم بود، app کامل crash نکند.

اگر time series fail شد، map همچنان کار کند.

اگر QC fail شد، velocity value بدون warning نشان داده نشود.

Featureها fault-isolated باشند.

در محیط لوکال، خطاهای مربوط به نبودن دامنه یا سرویس خارجی نباید باعث crash کل برنامه شوند؛ وضعیت degraded باید به‌صورت قابل فهم نمایش داده شود.

---

# 105. Search

MVP فقط AOIهای داخلی را search کند:

```text
ورامین
```

External geocoder تا زمانی که provider/licensing مشخص نشده اضافه نشود.

بعداً geocoding abstraction ساخته شود.

---

# 106. Localization

تمام UI strings در component hard-code پراکنده نشوند.

حتی اگر فقط فارسی داریم:

```text
messages/fa.ts
```

یا i18n structure ساده ساخته شود.

English later قابل اضافه باشد.

Scientific identifiers ترجمه نشوند:

```text
LOS
Ascending
Descending
Temporal Coherence
```

می‌توانند همراه توضیح فارسی نمایش داده شوند.

---

# 107. ADRs

از ابتدا این ADRها ایجاد شوند:

```text
0001-react-vite-over-next-svelte.md
0002-fastapi-separate-backend.md
0003-maplibre-react-map-gl.md
0004-titiler-mounted-in-api.md
0005-s3-compatible-storage.md
0006-stac-product-catalog.md
0007-hdf5-archive-zarr-publish.md
0008-los-not-vertical.md
0009-no-workflow-engine-in-mvp.md
0010-localhost-first-development.md
```

هر تغییر مهم بعدی ADR بخواهد.

---

# 108. Things Codex must NOT add

بدون درخواست صریح اضافه نشوند:

```text
Next.js
Redux
Zustand
GraphQL
Apollo
Kubernetes
Kafka
RabbitMQ
Celery
Elasticsearch
microservices
service mesh
AI/LLM
authentication system
alert system
real-time websocket
Redis
pgSTAC
deck.gl
public domain configuration
```

برخی بعدها ممکن است مفید شوند، ولی نه پیش‌فرض.

---

# 109. Definition of Done برای هر Milestone

Milestone فقط وقتی تمام است که:

1. implementation کامل باشد.
2. tests pass باشند.
3. lint pass باشد.
4. typecheck pass باشد.
5. docs update شده باشد.
6. Compose هنوز بالا بیاید.
7. migrationها سالم باشند.
8. هیچ secret commit نشده باشد.
9. acceptance criteria milestone pass باشد.
10. هیچ TODO بحرانی پنهان نمانده باشد.
11. قابلیت در محیط لوکال پروژه قابل اجرا و بررسی باشد.
12. هیچ وابستگی به دامنه‌ای که هنوز وجود ندارد اضافه نشده باشد.

---

# 110. دستور کاری برای Codex

Codex باید این پروژه را milestone-by-milestone بسازد.

در ابتدای هر milestone:

1. فایل‌های مرتبط موجود را بخواند.
2. acceptance criteria را استخراج کند.
3. کوچک‌ترین implementation کامل را طراحی کند.
4. سپس code بزند.

در پایان:

```text
lint
typecheck
unit tests
integration tests relevant to milestone
build
```

را اجرا کند.

اگر test fail شد، milestone تمام‌شده تلقی نشود.

هر بار dependency جدید اضافه می‌شود توضیح داده شود:

```text
why it is needed
why existing dependencies cannot do it
```

Codex نباید فرض کند پروژه روی دامنه عمومی deploy شده است. تمام تست‌ها، لینک‌ها و acceptance criteria فعلی باید با محیط لوکال و نام برند **فرودید | FORUDID** سازگار باشند.

---

# 111. ترتیب واقعی کار

Codex نباید اول HyP3 را پیاده کند.

ترتیب صحیح:

```text
Repository
 ↓
Frontend shell
 ↓
DB
 ↓
Fixture COG
 ↓
TiTiler
 ↓
Map
 ↓
Point API
 ↓
Time series
 ↓
QC UI
 ↓
STAC
 ↓
Sentinel discovery
 ↓
Pair network
 ↓
HyP3
 ↓
MintPy
 ↓
QC science
 ↓
Publish
 ↓
Varamin v1
```

هدف این است که failureهای WebGIS و science با هم مخلوط نشوند.

---

# 112. معماری نهایی MVP

```text
                        Sentinel-1
                            │
                            ▼
                        asf_search
                            │
                            ▼
                      Acquisition DB
                            │
                            ▼
                     SBAS Pair Builder
                            │
                            ▼
                    HyP3 Multi-Burst
                            │
                            ▼
                    Internal S3 Archive
                            │
                            ▼
                          MintPy
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
       HDF5 Scientific               Publish Worker
           Archive                         │
                               ┌───────────┼───────────┐
                               ▼           ▼           ▼
                              COG        Zarr 3       STAC
                               │           │           │
                               └───────────┴───────────┘
                                           │
                                  S3-compatible storage
                                           │
                         ┌─────────────────┴──────────────┐
                         │                                │
                         ▼                                ▼
                PostgreSQL/PostGIS                  FastAPI
                                                         │
                                            ┌────────────┴─────────────┐
                                            │                          │
                                            ▼                          ▼
                                      Business REST              TiTiler Router
                                            │                          │
                                            └────────────┬─────────────┘
                                                         │
                                                       OpenAPI
                                                         │
                                                       Orval
                                                         │
                                                         ▼
                                                  React + Vite
                                                         │
                       ┌─────────────────────────────────┼──────────────────────┐
                       ▼                                 ▼                      ▼
                TanStack Router                    TanStack Query          MapLibre
                                                                                │
                                                                           react-map-gl
                                                                                │
                                                               deck.gl only when needed
                                                         │
                                                       ECharts
```

تمام اجزای این معماری در مرحله فعلی باید ابتدا روی لوکال‌هاست اجرا و اعتبارسنجی شوند. دامنه عمومی، TLS عمومی، CDN و deployment اینترنتی جزو MVP فعلی نیستند.

---

# 113. استک نهایی

## Frontend

```text
React 19
TypeScript
Vite 8
pnpm

TanStack Router
TanStack Query
Zod

MapLibre GL JS 6
react-map-gl 8

ECharts 6

Tailwind CSS 4
shadcn/ui
Radix UI

Orval

Vitest
React Testing Library
Playwright
```

## Backend

```text
Python
FastAPI
Pydantic 2
SQLAlchemy 2
Alembic
psycopg 3
GeoAlchemy2

PostgreSQL
PostGIS

TiTiler

PySTAC
boto3
```

## Scientific processing

```text
Python scientific environment
Conda/Mamba

asf_search
hyp3_sdk
HyP3 Multi-Burst

MintPy

GDAL
Rasterio
rio-cogeo
xarray
h5py
Zarr 3
PySTAC
```

## Storage

```text
S3-compatible Object Storage
COG
HDF5
Zarr 3
STAC JSON
```

## Workflow

```text
MVP:
Python CLI / worker

Later:
Prefect 3
```

## Deployment

```text
Docker
Docker Compose
reverse proxy
static frontend

Current:
localhost-first development

No public domain initially
No Kubernetes initially
```

---

# 114. اولین Processing Target

تنها target علمی اولیه:

```text
AOI:
Varamin

Size:
approximately 50 × 50 km

Orbit:
Descending

HyP3 profile:
20x4

Temporal coverage:
1–2 years

Outputs:
LOS velocity
temporal coherence
velocity uncertainty
LOS time series
QC
metadata
```

اگر این زنجیره معتبر نشد، هیچ AOI دوم اضافه نشود.

---

# 115. MVP Final Acceptance Test

نسخه MVP فقط وقتی موفق است که یک کاربر بتواند:

1. آدرس محلی نقشه، مانند `http://localhost:5173/map`، را باز کند.
2. برند **فرودید | FORUDID** را ببیند.
3. ورامین را ببیند.
4. `LOS Velocity` واقعی را مشاهده کند.
5. legend با `mm/year` ببیند.
6. coherence را انتخاب کند.
7. uncertainty را انتخاب کند.
8. روی نقطه کلیک کند.
9. LOS velocity را ببیند.
10. uncertainty را ببیند.
11. temporal coherence را ببیند.
12. تعداد observations را ببیند.
13. time series واقعی را ببیند.
14. orbit و track را ببیند.
15. processing version را ببیند.
16. reference را ببیند.
17. URL همان view را copy و reload کند.
18. metadata/STAC محصول را ببیند.
19. سیستم هیچ‌جا LOS را به‌اشتباه vertical subsidence معرفی نکند.
20. محصول دارای QC و provenance باشد.
21. همان processing run قابل بازتولید و audit باشد.
22. تمام قابلیت‌های اصلی بدون نیاز به دامنه عمومی در محیط لوکال اجرا شوند.

این نقطه، «فرودید نسخه ۱» است.

هر چیزی فراتر از آن — کل ایران، alert، decomposition، infrastructure risk و automation — مرحله بعدی است.
