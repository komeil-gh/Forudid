import { useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useGetProduct, useGetPointSummary, useListAreas, useListProducts, type ProductInfo } from '../generated/api/forudid'
import { Status } from '../components/Status'
import { Button } from '../components/ui/button'
import { useLanguage } from '../i18n'
import { defaultSearch, parseMapCoordinates } from '../lib/search'
import { formatDate, formatDateRange, formatDateRangesInText } from '../lib/date'
import { format, presentation } from '../lib/units'
import './sources.css'
import './compare.css'

function Measurement({ product, lon, lat }: { product: ProductInfo; lon: number; lat: number }) {
  const { language } = useLanguage(), fa = language === 'fa'
  const query = useGetPointSummary({ product_id: product.id, lon, lat })
  const missing = fa ? 'ارائه نشده' : 'Not provided'
  const number = (value: number | null, digits = 1) => format(value, digits, fa ? 'fa-IR' : 'en-US', missing)
  if (query.isPending) return <Status />
  if (query.isError) return <Status error retry={() => void query.refetch()} />
  const point = query.data
  return <>
    <dl className="comparison-values">
      <div><dt>{fa ? 'نرخ در پیکسل بومی منبع' : 'Rate at the native source pixel'}</dt><dd data-testid="comparison-value">{point.measurement.value === null ? (fa ? 'بدون داده' : 'No data') : <bdi dir="ltr">{number(presentation(point.measurement.value, point.measurement.unit))} mm/year</bdi>}</dd></div>
      <div><dt>{fa ? 'مرکز پیکسل نمونه (طول، عرض)' : 'Sampled pixel centre (lon, lat)'}</dt><dd><bdi>{point.sampled_coordinate ? `${point.sampled_coordinate.lon.toFixed(6)}, ${point.sampled_coordinate.lat.toFixed(6)}` : (fa ? 'خارج از محدودهٔ رستر' : 'Outside raster extent')}</bdi></dd></div>
      <div><dt>{fa ? 'عدم‌قطعیت نرخ' : 'Rate uncertainty'}</dt><dd>{point.velocity_uncertainty.value === null ? missing : <bdi>±{number(presentation(point.velocity_uncertainty.value, point.velocity_uncertainty.unit))} mm/year</bdi>}</dd></div>
      <div><dt>{fa ? 'همدوسی زمانی' : 'Temporal coherence'}</dt><dd>{number(point.temporal_coherence, 2)}</dd></div>
      <div><dt>{fa ? 'تعداد مشاهدات معتبر' : 'Valid observations'}</dt><dd>{number(point.observations, 0)}</dd></div>
    </dl>
    {point.measurement.value === null && <p role="status">{fa ? 'نبود داده نشانهٔ پایداری زمین نیست.' : 'Missing data do not imply stable ground.'}</p>}
    <Link to="/map" search={{ ...defaultSearch, aoi: product.aoi_slug, product: product.id, run: product.processing_run_id, layer: product.kind as 'velocity_los' | 'velocity_vertical', orbit: product.orbit_direction, lon, lat, z: 11, panel: 'point', pointLon: lon, pointLat: lat }}>{fa ? 'نمایش روی نقشه و سری زمانی موجود' : 'Open map and available time series'}</Link>
  </>
}

function Source({ side }: { side: 'a' | 'b' }) {
  const { language } = useLanguage(), fa = language === 'fa'
  const search = useSearch({ from: '/compare' }), navigate = useNavigate({ from: '/compare' })
  const [offset, setOffset] = useState(0)
  const areas = useListAreas()
  const selected = useGetProduct(search[side] ?? '', { query: { enabled: Boolean(search[side]), retry: false } })
  const product = selected.data, areaKey = side === 'a' ? 'areaA' : 'areaB'
  const area = product?.aoi_slug ?? search[areaKey]
  const products = useListProducts({ aoi: area, limit: 100, offset })
  const rates = products.data?.filter(p => p.kind === 'velocity_los' || p.kind === 'velocity_vertical') ?? []
  const rate = product?.kind === 'velocity_los' || product?.kind === 'velocity_vertical'
  const title = side === 'a' ? (fa ? 'منبع اول' : 'First source') : (fa ? 'منبع دوم' : 'Second source')
  return <section className="comparison-source" aria-label={title}>
    <h2>{title}</h2>
    <label>{fa ? 'محدودهٔ منبع' : 'Source area'}<select value={area} onChange={event => {
      setOffset(0)
      void navigate({ search: { ...search, [areaKey]: event.target.value, [side]: undefined } })
    }}>
      {!areas.data?.some(item => item.slug === area) && <option value={area}>{area}</option>}
      {areas.data?.map(item => <option key={item.slug} value={item.slug}>{fa ? item.name_fa : item.name_en}</option>)}
    </select></label>
    {areas.isError && <Status error retry={() => void areas.refetch()} />}
    <label>{fa ? 'محصول نرخ تغییرشکل' : 'Deformation-rate product'}<select value={search[side] ?? ''} onChange={event => void navigate({ search: { ...search, [side]: event.target.value || undefined, [areaKey]: area } })}>
      <option value="">{fa ? 'محصول را انتخاب کنید' : 'Choose a product'}</option>
      {search[side] && !rates.some(item => item.id === search[side]) && <option value={search[side]}>{product ? formatDateRangesInText(product.product_version, language) : search[side]}</option>}
      {rates.map(item => <option key={item.id} value={item.id}>{formatDateRangesInText(item.product_version, language)}</option>)}
    </select></label>
    {products.isPending ? <Status /> : products.isError ? <Status error retry={() => void products.refetch()} /> : <div className="source-pagination">
      {offset > 0 && <Button onClick={() => setOffset(offset - 100)}>{fa ? 'محصولات قبلی' : 'Previous products'}</Button>}
      {products.data.length === 100 && <Button onClick={() => setOffset(offset + 100)}>{fa ? 'محصولات بعدی' : 'Next products'}</Button>}
    </div>}
    {search[side] && (selected.isPending ? <Status /> : selected.isError ? <Status error retry={() => void selected.refetch()} /> : product && <>
      {!rate ? <p role="alert">{fa ? 'این محصول نرخ تغییرشکل نیست؛ محصول دیگری انتخاب کنید.' : 'This product is not a deformation rate. Choose another product.'}</p> : <>
        {product.is_fixture && <p role="alert">{fa ? 'دادهٔ آزمایشی ساختگی' : 'Synthetic test data'}</p>}
        <dl className="comparison-metadata">
          <div><dt>{fa ? 'مؤلفه' : 'Component'}</dt><dd>{product.kind === 'velocity_los' ? (fa ? 'راستای دید ماهواره (LOS)' : 'Satellite line of sight (LOS)') : product.measurement_method === 'descending_los_projection' ? (fa ? 'قائمِ برآوردی از LOS نزولی، با فرض ناچیزبودن حرکت افقی' : 'Vertical projected from descending LOS, assuming negligible horizontal motion') : (fa ? 'قائم' : 'Vertical')}</dd></div>
          <div><dt>{fa ? 'دورهٔ مشاهده' : 'Observation period'}</dt><dd data-testid="comparison-period">{formatDateRange(product.start_date, product.end_date, language, product.time_precision)}</dd></div>
          <div><dt>{fa ? 'جهت مدار / ترک' : 'Orbit direction / track'}</dt><dd>{product.orbit_direction === 'ascending' ? (fa ? 'صعودی' : 'Ascending') : (fa ? 'نزولی' : 'Descending')} / {product.relative_orbit ?? (fa ? 'موزاییک چند ترک' : 'Multi-track mosaic')}</dd></div>
          <div><dt>{fa ? 'قرارداد علامت (متن منبع)' : 'Sign convention (source wording)'}</dt><dd dir="auto">{product.sign_convention}</dd></div>
          <div><dt>{fa ? 'روش اندازه‌گیری' : 'Measurement method'}</dt><dd><bdi>{product.measurement_method}</bdi></dd></div>
          {Array.isArray(product.resolution_metadata.pixel_size_degrees) && <div><dt>{fa ? 'اندازهٔ پیکسل (درجه)' : 'Pixel size (degrees)'}</dt><dd><bdi>{product.resolution_metadata.pixel_size_degrees.map(value => Number(value).toPrecision(5)).join(' × ')}</bdi></dd></div>}
          <div><dt>{fa ? 'مرجع اندازه‌گیری' : 'Measurement reference'}</dt><dd dir="auto">{product.reference ? <>{product.reference.reason}<p><bdi>{product.reference.method}</bdi></p><p><bdi dir="ltr">{product.reference.coordinate.lon.toFixed(6)}, {product.reference.coordinate.lat.toFixed(6)}</bdi> · {formatDate(product.reference.date, language)}</p></> : product.reference_description ?? (fa ? 'توضیح ارائه نشده' : 'No description provided')}</dd></div>
        </dl>
        {search.lon !== undefined && search.lat !== undefined && <Measurement product={product} lon={search.lon} lat={search.lat} />}
        <details className="source-version"><summary>{fa ? 'نسخه و شناسه‌های منبع' : 'Source version and identifiers'}</summary>
          <p dir="auto">{product.attribution}</p>
          <p>{fa ? 'محصول:' : 'Product:'}</p><code>{product.id}</code>
          <p>{fa ? 'نسخهٔ منبع:' : 'Source version:'}</p><code>{product.source_version_id ?? '—'}</code>
          <p>{fa ? 'اجرای پردازش:' : 'Processing run:'}</p><code>{product.processing_run_id}</code>
          <p><bdi>{product.processing_version}</bdi></p>
          <Link to="/sources">{fa ? 'منابع و مجوزها' : 'Sources and licences'}</Link>
        </details>
      </>}
    </>)}
  </section>
}

export default function ComparePage() {
  const { language } = useLanguage(), fa = language === 'fa'
  const search = useSearch({ from: '/compare' }), navigate = useNavigate({ from: '/compare' })
  const [invalid, setInvalid] = useState(false)
  const coordinate = search.lon !== undefined && search.lat !== undefined ? `${search.lon}, ${search.lat}` : ''
  return <main className="sources-page comparison-page">
    <h1>{fa ? 'مقایسهٔ منابع' : 'Source comparison'}</h1>
    <p>{fa ? 'دو اندازه‌گیری در یک مختصات جغرافیایی، با حفظ پیکسل بومی، دوره و مرجع هر منبع. این نمایش، ادغام یا اعتبارسنجی منابع نیست.' : 'Two measurements at one geographic coordinate, preserving each source’s native pixel, period and reference. This display does not merge or validate sources.'}</p>
    <p className="comparison-notice">{fa ? 'نرخ قائم و LOS، دوره‌های متفاوت و مراجع متفاوت مستقیماً قابل تفریق نیستند. اختلاف ظاهری را تغییر زمانی یا تأیید مستقل تلقی نکنید؛ برای مقایسهٔ کمی، همسان‌سازی و اعتبارسنجی لازم است.' : 'Vertical and LOS rates, different periods and different references cannot be directly subtracted. An apparent difference is not temporal change or independent confirmation; quantitative comparison requires harmonisation and validation.'}</p>
    <p>{fa ? 'دو منبع می‌توانند از مشاهدات ماهواره‌ای مشترک استفاده کنند؛ جدا بودن نام منابع، استقلال خطاهای آن‌ها را اثبات نمی‌کند.' : 'Two sources may share satellite observations; separate source names do not establish independent errors.'}</p>
    <p>{fa ? 'مقادیر فقط برای نمایش به میلی‌متر در سال تبدیل می‌شوند؛ شبکه‌ها بازنمونه‌گیری نشده‌اند و یک مختصات می‌تواند به پیکسل‌هایی با مرکز و اندازهٔ متفاوت برسد.' : 'Values are converted to millimetres per year for display only. Grids are not resampled; one coordinate can select pixels with different centres and sizes.'} <Link to="/methodology">{fa ? 'روش‌شناسی و حدود تفسیر' : 'Methodology and interpretation limits'}</Link></p>
    <form className="comparison-coordinate" onSubmit={event => {
      event.preventDefault()
      const point = parseMapCoordinates(String(new FormData(event.currentTarget).get('coordinate') ?? ''))
      setInvalid(!point)
      if (point) void navigate({ search: { ...search, ...point } })
    }}>
      <label>{fa ? 'طول، عرض جغرافیایی' : 'Longitude, latitude'}<input key={coordinate} name="coordinate" defaultValue={coordinate} placeholder="51.70, 35.30" dir="ltr" required aria-invalid={invalid} aria-describedby={invalid ? 'coordinate-error' : undefined} /></label>
      <Button type="submit">{fa ? 'بررسی نقطه' : 'Inspect point'}</Button>
      {invalid && <p id="coordinate-error" role="alert">{fa ? 'دو عدد معتبر با ویرگول وارد کنید؛ طول بین ۱۸۰− و ۱۸۰ و عرض بین ۸۵− و ۸۵.' : 'Enter two comma-separated numbers: longitude −180 to 180, latitude −85 to 85.'}</p>}
    </form>
    {!coordinate && <p role="status">{fa ? 'برای دریافت اندازه‌گیری، مختصات معتبر وارد کنید.' : 'Enter valid coordinates to retrieve measurements.'}</p>}
    {search.a && search.a === search.b && <p role="status">{fa ? 'هر دو انتخاب یک محصول‌اند؛ منبع مستقلی انتخاب نشده است.' : 'Both selections are the same product; no independent source is selected.'}</p>}
    <div className="comparison-grid"><Source key={`a/${search.areaA}`} side="a" /><Source key={`b/${search.areaB}`} side="b" /></div>
  </main>
}
