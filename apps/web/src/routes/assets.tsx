import { lazy, Suspense, useCallback, useState } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useGetExposureRanking, useGetInfrastructureAsset, useGetAssetExposure, useGetExposureSegments, useGetLegend, useGetProduct, useListAreas, useListProducts, type ProductInfo, type ProfileSample, type RankedAsset } from '../generated/api/forudid'
import { Status } from '../components/Status'
import { Button } from '../components/ui/button'
import { useLanguage } from '../i18n'
import { Legend } from '../features/layers/Legend'
import { defaultSearch, defaultAssetSearch, type MapSearch } from '../lib/search'
import { apiBase } from '../lib/api'
import { csvCell } from '../lib/csv'
import { formatDate, formatDateRange } from '../lib/date'
import './sources.css'
import './regions.css'
import './assets.css'

const ExposureDetails = lazy(() => import('../features/assets/ExposureDetails').then(module => ({ default: module.ExposureDetails })))
const MapCanvas = lazy(() => import('../features/map/MapCanvas').then(module => ({ default: module.MapCanvas })))

function downloadPage(items: RankedAsset[], run: string, product: ProductInfo) {
  const header = ['asset_id', 'osm_id', 'name', 'type', 'length_m', 'valid_length_m', 'coverage_fraction', 'mean_mm_year', 'p95_mm_year', 'max_abs_mm_year', 'analysis_run_id', 'product_id', 'deformation_source_version_id', 'measurement_component', 'observation_start', 'observation_end', 'time_precision', 'sign_convention', 'interpretation']
  const rows = items.map(r => [r.asset_id, r.external_id, r.name, r.asset_type, r.total_length_m, r.valid_length_m, r.coverage_fraction, r.mean_velocity, r.p95_velocity, r.max_abs_velocity, run, product.id, product.source_version_id, product.measurement_component, product.start_date, product.end_date, product.time_precision, product.sign_convention, 'Descriptive exposure over the stated observation period; not a structural hazard or risk classification'])
  const blob = new Blob(['\ufeff', [header, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = 'forudid-assets-current-page.csv'; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function AssetsPage() {
  const { language } = useLanguage(), fa = language === 'fa'
  const search = useSearch({ from: '/assets' }), navigate = useNavigate({ from: '/assets' })
  const areas = useListAreas(), products = useListProducts({ aoi: search.aoi })
  const velocities = products.data?.filter(p => p.kind === 'velocity_vertical' || p.kind === 'velocity_los') ?? []
  const product = search.product ? velocities.find(p => p.id === search.product) : velocities[0]
  const result = useGetExposureRanking({ product_id: product?.id ?? '', asset_type: search.type, q: search.q, sort: search.sort, direction: search.direction, min_coverage: search.coverage, offset: search.offset, limit: 20 }, { query: { enabled: !!product } })
  const update = (next: Partial<typeof search>) => void navigate({ search: { ...search, offset: 0, ...next } })
  const number = (v: number | null, digits = 1) => v === null ? '—' : v.toLocaleString(fa ? 'fa-IR' : 'en-US', { maximumFractionDigits: digits })
  return <main className="sources-page assets-page"><header><h1>{fa ? 'زیرساخت و مواجههٔ تاریخی' : 'Infrastructure and historical exposure'}</h1>
    <p>{fa ? 'قطعه‌های واقعی OSM با معیارهای قابل مرتب‌سازی؛ این فهرست رتبه‌بندی خطر یا سلامت سازه نیست.' : 'Real OSM ways with transparent sortable metrics. This is not a ranking of structural hazard or safety.'}</p></header>
    <div className="region-controls asset-filters"><label>{fa ? 'نوع زیرساخت' : 'Infrastructure type'}<select value={search.type} onChange={e => update({ type: e.target.value as typeof search.type })}>
      <option value="railway">{fa ? 'راه‌آهن' : 'Railway'}</option><option value="road">{fa ? 'راه‌های اصلی' : 'Major roads'}</option></select></label>
      <label>{fa ? 'محدودهٔ منبع تغییرشکل' : 'Deformation source area'}<select value={search.aoi} onChange={e => update({ aoi: e.target.value, product: undefined })}>{areas.data?.map(area => <option key={area.slug} value={area.slug}>{fa ? area.name_fa : area.name_en}</option>)}</select></label>
      <label>{fa ? 'محصول تغییرشکل' : 'Deformation product'}<select value={product?.id ?? ''} onChange={e => update({ product: e.target.value })}>{velocities.map(p => <option key={p.id} value={p.id}>{formatDateRange(p.start_date, p.end_date, language, p.time_precision)} · {p.kind === 'velocity_vertical' ? (fa ? 'قائمِ برآوردی' : 'Projected vertical') : 'LOS'}</option>)}</select></label>
      <label>{fa ? 'مرتب‌سازی' : 'Sort by'}<select value={search.sort} onChange={e => update({ sort: e.target.value as typeof search.sort })}>
        <option value="max_abs_velocity">{fa ? 'بیشترین قدرمطلق نرخ' : 'Maximum absolute rate'}</option><option value="p95_velocity">{fa ? 'صدک ۹۵ نرخ' : '95th percentile rate'}</option><option value="mean_velocity">{fa ? 'میانگین نرخ' : 'Mean rate'}</option><option value="valid_length_m">{fa ? 'طول دارای داده' : 'Length with data'}</option><option value="coverage_fraction">{fa ? 'پوشش معتبر' : 'Valid coverage'}</option></select></label>
      <label>{fa ? 'جهت ترتیب' : 'Order'}<select value={search.direction} onChange={e => update({ direction: e.target.value as typeof search.direction })}><option value="desc">{fa ? 'بیشتر به کمتر' : 'Descending'}</option><option value="asc">{fa ? 'کمتر به بیشتر' : 'Ascending'}</option></select></label>
      <label>{fa ? 'حداقل پوشش معتبر' : 'Minimum valid coverage'}<select value={search.coverage} onChange={e => update({ coverage: Number(e.target.value) })}>
        {[0, 0.25, 0.5, 0.75, 0.9].map(v => <option key={v} value={v}>{number(v*100, 0)}٪</option>)}</select></label>
      <form key={search.q ?? ''} onSubmit={event => { event.preventDefault(); update({ q: String(new FormData(event.currentTarget).get('q') ?? '').trim() || undefined }) }}>
        <label htmlFor="asset-query">{fa ? 'نام یا شناسهٔ OSM' : 'Name or OSM identifier'}</label><div className="asset-search"><input id="asset-query" name="q" maxLength={80} defaultValue={search.q ?? ''} /><Button type="submit">{fa ? 'جست‌وجو' : 'Search'}</Button></div></form>
    </div>
    {products.isPending ? <Status /> : products.isError ? <Status error retry={() => void products.refetch()} /> : !product ? <p role="status">{fa ? 'محصول انتخاب‌شده در دسترس نیست.' : 'The selected product is unavailable.'}</p> : result.isPending ? <Status /> : result.isError ? <Status error retry={() => void result.refetch()} /> : result.data && <>
      {!result.data.analysis_run_id ? <p role="status">{fa ? 'محاسبهٔ کامل این نوع زیرساخت هنوز منتشر نشده است؛ هندسه‌ها روی نقشه قابل مشاهده‌اند.' : 'The complete analysis for this infrastructure type has not been published; geometries remain available on the map.'}</p> : <>
        <p>{number(result.data.total, 0)} {fa ? 'قطعه مطابق فیلتر؛ آمار روی کل هر قطعه است. نبود داده به معنای پایداری نیست.' : 'matching ways; metrics cover each entire way. Missing data do not imply stability.'}</p>
        <div className="asset-table-scroll" role="region" aria-label={fa ? 'جدول زیرساخت' : 'Infrastructure table'} tabIndex={0}><table className="region-table">
          <thead><tr><th scope="col">{fa ? 'قطعه' : 'Way'}</th><th scope="col">{fa ? 'پوشش' : 'Coverage'}</th><th scope="col">{fa ? 'طول دارای داده' : 'Valid length'} (km)</th><th scope="col">{fa ? 'بیشترین قدرمطلق نرخ' : 'Max absolute rate'} (mm/year)</th><th scope="col">{fa ? 'صدک ۹۵' : 'P95'} (mm/year)</th></tr></thead>
          <tbody>{result.data.items.map(r => <tr key={r.asset_id}><td><Link to="/assets/$assetId" params={{ assetId: r.asset_id }} search={{ product: product.id, analysis: result.data!.analysis_run_id! }}>{r.name || `${fa ? 'قطعهٔ OSM' : 'OSM way'} ${r.external_id}`}</Link><small><bdi>{r.external_id}</bdi></small></td><td>{number(r.coverage_fraction*100)}٪</td><td>{number(r.valid_length_m/1000)}</td><td>{number(r.max_abs_velocity)}</td><td>{number(r.p95_velocity)}</td></tr>)}</tbody>
        </table></div>
        <div className="source-pagination"><Button disabled={search.offset === 0} onClick={() => update({ offset: Math.max(0, search.offset-20) })}>{fa ? 'قبلی' : 'Previous'}</Button><Button disabled={result.data.next_offset === null} onClick={() => update({ offset: result.data!.next_offset! })}>{fa ? 'بعدی' : 'Next'}</Button>
          <Button disabled={!result.data.items.length} onClick={() => downloadPage(result.data!.items, result.data!.analysis_run_id!, product)}>{fa ? 'CSV همین صفحه' : 'Current page CSV'}</Button></div>
        <details className="source-version"><summary>{fa ? 'منشأ و روش' : 'Provenance and method'}</summary><code>{result.data.analysis_run_id}</code><code>{result.data.method_version}</code><p>{fa ? 'روش آزمایشی؛ عدم‌قطعیت پیکسلی و اعتبارسنجی سازه‌ای در دسترس نیست.' : 'Experimental method; pixel uncertainty and structural validation are unavailable.'}</p></details>
      </>}
      <Link to="/map" search={{ ...defaultSearch, aoi: product.aoi_slug, layer: product.kind as MapSearch['layer'], orbit: product.orbit_direction, product: product.id, infrastructure: search.type }}>{fa ? 'مشاهدهٔ زیرساخت روی نقشه' : 'View infrastructure on the map'}</Link>
    </>}
  </main>
}

export function AssetDetailPage() {
  const { assetId } = useParams({ from: '/assets/$assetId' }), search = useSearch({ from: '/assets/$assetId' })
  const navigate = useNavigate({ from: '/assets/$assetId' })
  const { language } = useLanguage(), fa = language === 'fa'
  const asset = useGetInfrastructureAsset(assetId), products = useListProducts({ aoi: 'iran' })
  const selected = useGetProduct(search.product ?? '', { query: { enabled: !!search.product, retry: false } })
  const product = search.product ? selected.data : products.data?.find(p => p.kind === 'velocity_vertical')
  const legend = useGetLegend(product?.id ?? '', { query: { enabled: !!product } })
  const exposure = useGetAssetExposure(assetId, { product_id: product?.id, run_id: search.analysis }, { query: { enabled: !!product, retry: false } })
  const selectedInterval = useGetExposureSegments(exposure.data?.analysis_run_id ?? '', assetId, { offset: search.segment ?? 0, limit: 1 }, { query: { enabled: !!exposure.data && search.segment !== undefined } })
  const interval = selectedInterval.data?.features.find(f => f.properties.ordinal === search.segment)
  const activeRun = search.analysis ?? exposure.data?.analysis_run_id
  const [view, setView] = useState<MapSearch>({ ...defaultSearch, asset: assetId, panel: 'asset', infrastructure: 'none' })
  const profileContext = [assetId, product?.id, activeRun].join('/')
  const [sample, setSample] = useState<{ context: string; value: ProfileSample }>()
  const inspect = useCallback((next?: ProfileSample) => setSample(next ? { context: profileContext, value: next } : undefined), [profileContext])
  return <main className="sources-page asset-detail"><header><Link to="/assets" search={{ ...defaultAssetSearch, aoi: product?.aoi_slug ?? 'iran', product: product?.id }}>{fa ? 'فهرست زیرساخت' : 'Infrastructure list'}</Link><h1>{asset.data?.properties.name || (fa ? 'جزئیات قطعهٔ زیرساخت' : 'Infrastructure way details')}</h1></header>
    {asset.isPending || (search.product ? selected.isPending : products.isPending) ? <Status /> : asset.isError || (search.product ? selected.isError : products.isError) ? <Status error retry={() => { void asset.refetch(); if (search.product) void selected.refetch(); else void products.refetch() }} /> : asset.data && <>
      <p>OSM <bdi>{asset.data.properties.external_id}</bdi> · {asset.data.properties.asset_type === 'railway' ? (fa ? 'راه‌آهن' : 'Railway') : (fa ? 'راه اصلی' : 'Major road')} · {(asset.data.properties.length_m/1000).toLocaleString(fa ? 'fa-IR' : 'en-US', { maximumFractionDigits: 2 })} km</p>
      <p>{fa ? 'این هندسه یک قطعهٔ OSM است، نه الزاماً یک مسیر کامل؛ هم‌زمانی، کامل‌بودن و دقت مکانی شبکه تأیید نشده است.' : 'This is one OSM way, not necessarily a complete route; temporal alignment, network completeness and positional accuracy are unverified.'}</p>
      <p>{fa ? 'تاریخ شبکه:' : 'Network date:'} {asset.data.data_date ? formatDate(asset.data.data_date, language) : '—'} · {fa ? 'دورهٔ تغییرشکل:' : 'Deformation period:'} {product ? formatDateRange(product.start_date, product.end_date, language, product.time_precision) : '—'}</p>
      {product && <Button asChild><Link to="/map" search={{ ...defaultSearch, aoi: product.aoi_slug, product: product.id, run: product.processing_run_id, layer: product.kind as MapSearch['layer'], orbit: product.orbit_direction, asset: assetId, analysis: activeRun, segment: search.segment, panel: 'asset', infrastructure: asset.data.properties.asset_type }}>{fa ? 'باز کردن همین بازه در نقشهٔ کامل' : 'Open this selection in the full map'}</Link></Button>}
      <div id="asset-map" className="asset-preview map-region"><Suspense fallback={<Status />}><MapCanvas state={view} product={product} style={legend.data?.style} selectedGeometry={search.segment === undefined ? asset.data.geometry : selectedInterval.isError ? undefined : interval?.geometry} profilePoint={sample?.context === profileContext ? sample.value : undefined} inspectEnabled={false} update={next => setView(prev => ({ ...prev, ...next }))} selectPoint={(lon, lat) => setView(prev => ({ ...prev, pointLon: lon, pointLat: lat }))} /></Suspense>
        {legend.data && <div className="map-guidance"><Legend data={legend.data} /></div>}
        {search.segment !== undefined && exposure.data && (selectedInterval.isPending || selectedInterval.isError || !interval) && <div className="map-message">
          <p>{fa ? 'هندسهٔ بازهٔ انتخاب‌شده هنوز روی نقشه نمایش داده نشده است.' : 'The selected interval geometry is not currently shown on the map.'}</p>
          {selectedInterval.isPending ? <Status /> : selectedInterval.isError ? <Status error retry={() => void selectedInterval.refetch()} /> : <p role="status">{fa ? 'بازهٔ درخواست‌شده وجود ندارد.' : 'The requested interval does not exist.'}</p>}
          <Button onClick={() => void navigate({ search: { ...search, segment: undefined } })}>{fa ? 'نمایش کل قطعه' : 'Show the entire way'}</Button>
        </div>}
      </div>
      {product ? <Suspense fallback={<Status />}><ExposureDetails key={`${assetId}/${product.id}/${activeRun}`} assetId={assetId} productId={product.id} runId={activeRun} onInspect={inspect} selectedSegment={search.segment} onSelectSegment={ordinal => void navigate({ search: { ...search, segment: ordinal, analysis: exposure.data?.analysis_run_id } })} /></Suspense> : <p>{fa ? 'محصول انتخاب‌شده در دسترس نیست.' : 'Selected product unavailable.'}</p>}
      <section className="source-version"><h2>{fa ? 'منابع و دریافت داده' : 'Sources and downloads'}</h2><p><a href={asset.data.license_url}>{asset.data.attribution} · ODbL 1.0</a></p><code>{asset.data.properties.source_version_id}</code>
        <p><a href={`${apiBase}/api/v1/assets/${assetId}`} download={`${assetId}.geojson`}>{fa ? 'هندسه و فرادادهٔ منبع (GeoJSON)' : 'Source geometry and metadata (GeoJSON)'}</a></p><Link to="/sources">{fa ? 'رجیستری منابع' : 'Source registry'}</Link></section>
    </>}
  </main>
}
