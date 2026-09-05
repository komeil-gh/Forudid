import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useListProducts, useListRegions, useGetPopulationExposure, useGetRegionalInfrastructureExposure, type PopulationSummary } from '../generated/api/forudid'
import { Status } from '../components/Status'
import { useLanguage } from '../i18n'
import { apiBase } from '../lib/api'
import './sources.css'
import './regions.css'

function PopulationResult({ result }: { result: PopulationSummary }) {
  const { language } = useLanguage(), fa = language === 'fa'
  const number = new Intl.NumberFormat(fa ? 'fa-IR' : 'en-US', { maximumFractionDigits: 0 })
  const decimal = new Intl.NumberFormat(fa ? 'fa-IR' : 'en-US', { maximumFractionDigits: 1 })
  const percent = new Intl.NumberFormat(fa ? 'fa-IR' : 'en-US', { style: 'percent', maximumFractionDigits: 1 })
  const m = result.metrics, edges = m.band_edges_mm_year
  const band = (index: number) => index === 0 ? `< ${decimal.format(edges[0])}` : index === edges.length ? `≥ ${decimal.format(edges.at(-1)!)}` : `${decimal.format(edges[index - 1])} ≤ v < ${decimal.format(edges[index])}`
  return <section aria-labelledby="population-heading" className="source-card">
    <h2 id="population-heading">{fa ? 'برآورد جمعیت در پوشش دادهٔ تغییرشکل' : 'Estimated population within deformation coverage'}</h2>
    <p>{fa ? 'سال جمعیت (میلادی):' : 'Population year:'} <bdi>{new Intl.NumberFormat(fa ? 'fa-IR' : 'en-US', { useGrouping: false }).format(result.population_year)}</bdi> · WorldPop · {fa ? 'حدود یک کیلومتر' : 'approximately 1 km'}</p>
    <p>{fa ? 'برآورد مدل جمعیت است، نه شمار سرشماری. درون هر سلول جمعیت، توزیع یکنواخت فرض شده است.' : 'A population-model estimate, not a census count. Population is assumed uniformly distributed within each native cell.'}</p>
    <dl className="region-metrics">
      <div><dt>{fa ? 'کل جمعیت برآوردی محدوده' : 'Total estimated population'}</dt><dd data-testid="population-total">{number.format(m.estimated_total)}</dd></div>
      <div><dt>{fa ? 'دارای دادهٔ تغییرشکل' : 'With deformation data'}</dt><dd data-testid="population-covered">{number.format(m.estimated_valid_coverage)}</dd></div>
      <div><dt>{fa ? 'بدون دادهٔ تغییرشکل' : 'Without deformation data'}</dt><dd>{number.format(m.estimated_without_deformation_data)}</dd></div>
      <div><dt>{fa ? 'سهم جمعیت در پوشش معتبر' : 'Population coverage'}</dt><dd>{m.coverage_fraction === null ? '—' : percent.format(m.coverage_fraction)}</dd></div>
    </dl>
    <p>{fa ? 'نبود داده به معنای پایداری زمین نیست. بازه‌ها صرفاً عددی‌اند و طبقه‌بندی خطر یا ایمنی نیستند.' : 'Missing data do not imply stable ground. These numerical bands are not hazard or safety classes.'}</p>
    <table className="region-table"><caption>{fa ? 'جمعیت برآوردی بر حسب نرخ تاریخی' : 'Estimated population by historical rate'}</caption>
      <thead><tr><th scope="col">mm/year</th><th scope="col">{fa ? 'نفر (برآورد)' : 'People (estimate)'}</th></tr></thead>
      <tbody>{m.estimated_by_numeric_band.map((count, index) => <tr key={index}><td><bdi dir="ltr">{band(index)}</bdi></td><td>{number.format(count)}</td></tr>)}</tbody>
    </table>
    {m.region && <><h3>{fa ? 'آمار مساحت‌وزن‌دار تغییرشکل' : 'Area-weighted deformation statistics'}</h3>
      <dl className="region-metrics"><div><dt>{fa ? 'مساحت محدوده (کیلومتر مربع)' : 'Region area (km²)'}</dt><dd>{decimal.format(m.region.area_m2 / 1e6)}</dd></div>
        <div><dt>{fa ? 'سهم مساحت دارای داده' : 'Area with data'}</dt><dd>{percent.format(m.region.coverage_fraction)}</dd></div>
        <div><dt>{fa ? 'میانگین' : 'Mean'} (mm/year)</dt><dd>{m.region.mean_mm_year === null ? '—' : decimal.format(m.region.mean_mm_year)}</dd></div>
        <div><dt>{fa ? 'صدک ۹۵' : '95th percentile'} (mm/year)</dt><dd>{m.region.p95_mm_year === null ? '—' : decimal.format(m.region.p95_mm_year)}</dd></div></dl></>}
    <details className="source-version"><summary>{fa ? 'روش، منابع و شناسهٔ محاسبه' : 'Method, sources and calculation identity'}</summary>
      <p>{fa ? 'روش آزمایشی؛ اعتبارسنجی علمی مستقل انجام نشده است.' : 'Experimental method; independent scientific validation has not been completed.'}</p>
      <code>{result.method_version}</code><code>{result.analysis_run_id}</code><code>{result.checksum_sha256}</code>
      <p>{fa ? 'منبع جمعیت:' : 'Population source:'} <a href="https://hub.worldpop.org/geodata/summary?id=31792">WorldPop 2020 · DOI 10.5258/SOTON/WP00670</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></p>
      <p>{fa ? 'واحد پایه نفر/سلول است. بازنمونه‌گیری درون‌یابی‌شدهٔ شمار جمعیت انجام نشده؛ سهم مساحت هم‌پوشانی ملاک تخصیص است.' : 'Native values are people per cell. Counts are allocated by overlapping area without interpolation.'}</p>
      <Link to="/sources">{fa ? 'مشاهدهٔ نسخه‌های منابع' : 'View source versions'}</Link>
    </details>
    <p className="region-disclaimer">{fa ? result.disclaimer : 'FORUDID is a spatial monitoring and screening tool. It does not replace geotechnical or structural assessment, ground surveying, or field inspection.'}</p>
  </section>
}

function InfrastructureResult({ product, region, type }: { product: string, region?: string, type: 'railway' | 'road' }) {
  const { language } = useLanguage(), fa = language === 'fa'
  const query = useGetRegionalInfrastructureExposure(product, { region_id: region, asset_type: type }, { query: { retry: false } })
  const title = type === 'railway' ? (fa ? 'مواجههٔ راه‌آهن' : 'Railway exposure') : (fa ? 'مواجههٔ راه‌های اصلی' : 'Major-road exposure')
  if (query.isPending) return <section className="source-card" aria-label={title}><h2>{title}</h2><Status /></section>
  if (query.isError) return <section className="source-card" aria-label={title}><h2>{title}</h2>{query.error instanceof Error && query.error.message === 'HTTP 404'
    ? <p role="status">{fa ? 'هنوز نتیجهٔ کامل این محدوده و محصول منتشر نشده است.' : 'A complete result has not yet been published for this scope and product.'}</p>
    : <Status error retry={() => void query.refetch()} />}</section>
  const result = query.data, m = result.metrics
  const number = (v: number, digits = 1) => v.toLocaleString(fa ? 'fa-IR' : 'en-US', { maximumFractionDigits: digits })
  const band = (i: number) => i === 0 ? `< ${number(m.band_edges_mm_year[0])}` : i === m.band_edges_mm_year.length ? `≥ ${number(m.band_edges_mm_year.at(-1)!)}` : `${number(m.band_edges_mm_year[i-1])} ≤ v < ${number(m.band_edges_mm_year[i])}`
  return <section className="source-card" aria-label={title}>
    <h2>{title}</h2><p>{region
      ? (fa ? 'طول بخش‌های واقعاً داخل مرز تاریخی محدوده؛ بخش بیرون مرز در این اعداد محاسبه نشده است.' : 'Lengths of portions inside the historical boundary; outside portions are excluded.')
      : (fa ? 'کل شبکهٔ واردشدهٔ OSM؛ دامنهٔ آن مستقل از محدودهٔ رستر جمعیت است.' : 'The entire imported OSM snapshot; its footprint is independent of the population raster.')}</p>
    <dl className="region-metrics">
      <div><dt>{fa ? 'تعداد قطعه‌های دارای طول در محدوده' : 'Ways with length in scope'}</dt><dd>{number(m.way_count, 0)}</dd></div>
      <div><dt>{fa ? 'طول کل (کیلومتر)' : 'Total length (km)'}</dt><dd data-testid={`regional-${type}-total`}>{number(m.total_length_m/1000)}</dd></div>
      <div><dt>{fa ? 'طول دارای داده (کیلومتر)' : 'Length with data (km)'}</dt><dd data-testid={`regional-${type}-valid`}>{number(m.valid_length_m/1000)}</dd></div>
      <div><dt>{fa ? 'طول بدون داده (کیلومتر)' : 'Length without data (km)'}</dt><dd>{number(m.nodata_length_m/1000)}</dd></div>
      <div><dt>{fa ? 'پوشش معتبر طولی' : 'Valid length coverage'}</dt><dd>{m.coverage_fraction === null ? '—' : new Intl.NumberFormat(fa ? 'fa-IR' : 'en-US', { style: 'percent', maximumFractionDigits: 1 }).format(m.coverage_fraction)}</dd></div>
    </dl>
    <p>{fa ? 'مجموع قطعه‌های OSM است؛ مسیرهای موازی و هم‌پوشان یکتاسازی نشده‌اند. نبود داده نشانهٔ پایداری نیست و باندها طبقه‌بندی خطر نیستند.' : 'Summed OSM ways; parallel and overlapping ways are not deduplicated. Missing data do not imply stability, and bands are not hazard classes.'}</p>
    <table className="region-table"><caption>{fa ? 'طول در باندهای عددی نرخ تاریخی' : 'Length in numerical historical-rate bands'}</caption>
      <thead><tr><th scope="col">mm/year</th><th scope="col">{fa ? 'کیلومتر' : 'Kilometres'}</th></tr></thead>
      <tbody>{m.length_by_numeric_band_m.map((value, index) => <tr key={index}><td><bdi dir="ltr">{band(index)}</bdi></td><td>{number(value/1000)}</td></tr>)}</tbody>
    </table>
    <details className="source-version"><summary>{fa ? 'روش و شناسه‌های محاسبه' : 'Method and calculation identities'}</summary>
      <p>{fa ? 'روش آزمایشی؛ برش دوبعدی مرز و اندازه‌گیری ژئودزیک روی WGS84. دقت مستقل مرز و زیرساخت تأیید نشده است.' : 'Experimental method: planar boundary intersection followed by WGS84 geodesic length. Independent boundary and infrastructure accuracy are unverified.'}</p>
      <code>{result.method_version}</code><code>{result.analysis_run_id}</code><code>{result.upstream_run_id}</code><code>{result.checksum_sha256}</code>
      <Link to="/sources">{fa ? 'نسخه‌ها و مجوز منابع' : 'Source versions and licenses'}</Link>
    </details>
  </section>
}

export function PopulationExposure({ product, region }: { product: string, region?: string }) {
  const query = useGetPopulationExposure(product, { region_id: region }, { query: { retry: false } })
  const { language } = useLanguage()
  if (query.isPending) return <Status />
  if (query.isError) return query.error instanceof Error && query.error.message === 'HTTP 404'
    ? <p role="status">{language === 'fa' ? 'هنوز نتیجهٔ محاسبه‌شده‌ای برای این محدوده و محصول منتشر نشده است.' : 'No precomputed result has been published for this region and product.'}</p>
    : <Status error retry={() => void query.refetch()} />
  return <PopulationResult result={query.data} />
}

export default function RegionsPage() {
  const { language } = useLanguage(), fa = language === 'fa'
  const regions = useListRegions(), products = useListProducts({ aoi: 'iran' })
  const search = useSearch({ from: '/regions' }), navigate = useNavigate({ from: '/regions' })
  const selected = search.region ?? '', selectedProduct = search.product ?? ''
  const velocities = products.data?.filter(p => p.kind === 'velocity_vertical' || p.kind === 'velocity_los') ?? []
  const product = velocities.find(p => p.id === selectedProduct) ?? velocities[0]
  const region = regions.data?.items.find(r => r.id === selected)
  const invalidSelection = Boolean(selected && !region) || Boolean(selectedProduct && !velocities.some(p => p.id === selectedProduct))
  const date = (value: string) => fa ? value.replace(/[0-9]/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]) : value
  return <main className="sources-page regions-page"><header><h1>{fa ? 'جمعیت و مناطق' : 'Population and regions'}</h1>
    <p>{fa ? 'مواجههٔ توصیفی با دادهٔ تاریخی تغییرشکل زمین؛ همراه با سال جمعیت، منبع مرز و محدودیت پوشش.' : 'Descriptive exposure to historical ground deformation, with population year, boundary source, and coverage limitations.'}</p></header>
    {regions.isPending || products.isPending ? <Status /> : regions.isError || products.isError ? <Status error retry={() => { void regions.refetch(); void products.refetch() }} /> : invalidSelection ? <p role="status">{fa ? 'محدوده یا محصول انتخاب‌شده در دسترس نیست.' : 'The selected region or product is unavailable.'} <Link to="/regions">{fa ? 'بازگشت به انتخاب محدوده' : 'Choose a region'}</Link></p> : <>
      <div className="region-controls"><label>{fa ? 'محدوده' : 'Region'}<select value={selected} onChange={e => void navigate({ search: { ...search, region: e.target.value || undefined } })}>
        <option value="">{fa ? 'کل محدودهٔ دادهٔ جمعیت ایران' : 'Entire Iran population dataset footprint'}</option>
        {regions.data.items.map(r => <option key={r.id} value={r.id}>{fa ? r.name_fa : r.name_en}</option>)}</select></label>
        <label>{fa ? 'محصول تغییرشکل' : 'Deformation product'}<select value={product?.id ?? ''} onChange={e => void navigate({ search: { ...search, product: e.target.value || undefined } })}>
          {velocities.map(p => <option key={p.id} value={p.id}>{date(p.start_date)} — {date(p.end_date)} · {p.kind === 'velocity_vertical' ? (fa ? 'قائمِ برآوردی' : 'Projected vertical') : 'LOS'}</option>)}</select></label></div>
      {region && <section className="source-version"><h2>{fa ? region.name_fa : region.name_en}</h2>
        <p>{fa ? 'مرز تاریخی ۲۰۱۷ از geoBoundaries / OpenStreetMap؛ این مرز مرجع رسمیِ وضعیت کنونی نیست.' : 'Historical 2017 boundary from geoBoundaries / OpenStreetMap; not an official current administrative boundary.'}</p>
        <p>{fa ? 'فرادادهٔ منبع ۳۳ واحد اعلام کرده، اما فایل ۳۲ هندسه و ۳۱ نام یکتا دارد. دو بخش مازندران با حفظ شناسه‌های اصلی یکپارچه شده‌اند.' : 'Provider metadata reports 33 units; the file contains 32 geometries and 31 unique names. The two Mazandaran parts were merged with original identifiers preserved.'}</p>
        <a href={`${apiBase}/api/v1/regions/${region.id}`} download={`${region.name_en}.geojson`}>{fa ? 'دریافت مرز و فراداده (GeoJSON)' : 'Download boundary and metadata (GeoJSON)'}</a> · <a href="https://www.openstreetmap.org/copyright">ODbL 1.0</a></section>}
      {product ? <div key={`${product.id}/${selected}`}><PopulationExposure product={product.id} region={region?.id} />
        <InfrastructureResult product={product.id} region={region?.id} type="railway" />
        <InfrastructureResult product={product.id} region={region?.id} type="road" />
      </div> : <p role="status">{fa ? 'محصول نرخ تغییرشکل منتشرشده در دسترس نیست.' : 'No published deformation-rate product is available.'}</p>}
    </>}
  </main>
}
