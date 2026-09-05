import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useGetExposureRanking, useGetInfrastructureAsset, useGetLegend, useListProducts, type ProfileSample, type RankedAsset } from '../generated/api/forudid'
import { Status } from '../components/Status'
import { Button } from '../components/ui/button'
import { useLanguage } from '../i18n'
import { ExposureDetails } from '../features/assets/ExposureDetails'
import { MapCanvas } from '../features/map/MapCanvas'
import { defaultSearch, defaultAssetSearch, type MapSearch } from '../lib/search'
import { apiBase } from '../lib/api'
import { csvCell } from '../lib/csv'
import './sources.css'
import './regions.css'
import './assets.css'

function downloadPage(items: RankedAsset[], run: string, product: string) {
  const header = ['asset_id', 'osm_id', 'name', 'type', 'length_m', 'valid_length_m', 'coverage_fraction', 'mean_mm_year', 'p95_mm_year', 'max_abs_mm_year', 'analysis_run_id', 'product_id', 'interpretation']
  const rows = items.map(r => [r.asset_id, r.external_id, r.name, r.asset_type, r.total_length_m, r.valid_length_m, r.coverage_fraction, r.mean_velocity, r.p95_velocity, r.max_abs_velocity, run, product, 'Historical descriptive exposure; not a structural hazard or risk classification'])
  const blob = new Blob(['\ufeff', [header, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = 'forudid-assets-current-page.csv'; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function AssetsPage() {
  const { language } = useLanguage(), fa = language === 'fa'
  const search = useSearch({ from: '/assets' }), navigate = useNavigate({ from: '/assets' })
  const products = useListProducts({ aoi: 'iran' })
  const velocities = products.data?.filter(p => p.kind === 'velocity_vertical' || p.kind === 'velocity_los') ?? []
  const product = search.product ? velocities.find(p => p.id === search.product) : velocities[0]
  const result = useGetExposureRanking({ product_id: product?.id ?? '', asset_type: search.type, q: search.q, sort: search.sort, direction: search.direction, min_coverage: search.coverage, offset: search.offset, limit: 20 }, { query: { enabled: !!product } })
  const update = (next: Partial<typeof search>) => void navigate({ search: { ...search, offset: 0, ...next } })
  const number = (v: number | null, digits = 1) => v === null ? '—' : v.toLocaleString(fa ? 'fa-IR' : 'en-US', { maximumFractionDigits: digits })
  return <main className="sources-page assets-page"><header><h1>{fa ? 'زیرساخت و مواجههٔ تاریخی' : 'Infrastructure and historical exposure'}</h1>
    <p>{fa ? 'قطعه‌های واقعی OSM با معیارهای قابل مرتب‌سازی؛ این فهرست رتبه‌بندی خطر یا سلامت سازه نیست.' : 'Real OSM ways with transparent sortable metrics. This is not a ranking of structural hazard or safety.'}</p></header>
    <div className="region-controls asset-filters"><label>{fa ? 'نوع زیرساخت' : 'Infrastructure type'}<select value={search.type} onChange={e => update({ type: e.target.value as typeof search.type })}>
      <option value="railway">{fa ? 'راه‌آهن' : 'Railway'}</option><option value="road">{fa ? 'راه‌های اصلی' : 'Major roads'}</option></select></label>
      <label>{fa ? 'محصول تغییرشکل' : 'Deformation product'}<select value={product?.id ?? ''} onChange={e => update({ product: e.target.value })}>{velocities.map(p => <option key={p.id} value={p.id}>{p.start_date}–{p.end_date} · {p.kind === 'velocity_vertical' ? (fa ? 'قائمِ برآوردی' : 'Projected vertical') : 'LOS'}</option>)}</select></label>
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
          <Button disabled={!result.data.items.length} onClick={() => downloadPage(result.data!.items, result.data!.analysis_run_id!, product.id)}>{fa ? 'CSV همین صفحه' : 'Current page CSV'}</Button></div>
        <details className="source-version"><summary>{fa ? 'منشأ و روش' : 'Provenance and method'}</summary><code>{result.data.analysis_run_id}</code><code>{result.data.method_version}</code><p>{fa ? 'روش آزمایشی؛ عدم‌قطعیت پیکسلی و اعتبارسنجی سازه‌ای در دسترس نیست.' : 'Experimental method; pixel uncertainty and structural validation are unavailable.'}</p></details>
      </>}
      <Link to="/map" search={{ ...defaultSearch, product: product.id, infrastructure: search.type }}>{fa ? 'مشاهدهٔ زیرساخت روی نقشه' : 'View infrastructure on the map'}</Link>
    </>}
  </main>
}

export function AssetDetailPage() {
  const { assetId } = useParams({ from: '/assets/$assetId' }), search = useSearch({ from: '/assets/$assetId' })
  const { language } = useLanguage(), fa = language === 'fa'
  const asset = useGetInfrastructureAsset(assetId), products = useListProducts({ aoi: 'iran' })
  const product = products.data?.find(p => search.product ? p.id === search.product : p.kind === 'velocity_vertical')
  const legend = useGetLegend(product?.id ?? '', { query: { enabled: !!product } })
  const [view, setView] = useState<MapSearch>({ ...defaultSearch, asset: assetId, panel: 'asset', infrastructure: 'none' })
  const [sample, setSample] = useState<{ assetId: string; value: ProfileSample }>()
  const inspect = useCallback((next?: ProfileSample) => setSample(next ? { assetId, value: next } : undefined), [assetId])
  return <main className="sources-page asset-detail"><header><Link to="/assets" search={defaultAssetSearch}>{fa ? 'فهرست زیرساخت' : 'Infrastructure list'}</Link><h1>{asset.data?.properties.name || (fa ? 'جزئیات قطعهٔ زیرساخت' : 'Infrastructure way details')}</h1></header>
    {asset.isPending || products.isPending ? <Status /> : asset.isError || products.isError ? <Status error retry={() => { void asset.refetch(); void products.refetch() }} /> : asset.data && <>
      <p>OSM <bdi>{asset.data.properties.external_id}</bdi> · {asset.data.properties.asset_type === 'railway' ? (fa ? 'راه‌آهن' : 'Railway') : (fa ? 'راه اصلی' : 'Major road')} · {(asset.data.properties.length_m/1000).toLocaleString(fa ? 'fa-IR' : 'en-US', { maximumFractionDigits: 2 })} km</p>
      <p>{fa ? 'این هندسه یک قطعهٔ OSM است، نه الزاماً یک مسیر کامل. شبکهٔ ۲۰۲۶ با دادهٔ تغییرشکل ۲۰۱۴–۲۰۲۰ مقایسه می‌شود؛ هم‌زمانی، کامل‌بودن و دقت مکانی شبکه تأیید نشده است.' : 'This is one OSM way, not necessarily a complete route. The 2026 network is compared with 2014–2020 deformation; temporal alignment, network completeness and positional accuracy are unverified.'}</p>
      <div className="asset-preview map-region"><MapCanvas state={view} product={product} style={legend.data?.style} selectedGeometry={asset.data.geometry} profilePoint={sample?.assetId === assetId ? sample.value : undefined} update={next => setView(prev => ({ ...prev, ...next }))} selectPoint={(lon, lat) => setView(prev => ({ ...prev, pointLon: lon, pointLat: lat }))} /></div>
      {product ? <ExposureDetails key={`${assetId}/${product.id}/${search.analysis}`} assetId={assetId} productId={product.id} runId={search.analysis} onInspect={inspect} /> : <p>{fa ? 'محصول انتخاب‌شده در دسترس نیست.' : 'Selected product unavailable.'}</p>}
      <section className="source-version"><h2>{fa ? 'منابع و دریافت داده' : 'Sources and downloads'}</h2><p><a href={asset.data.license_url}>{asset.data.attribution} · ODbL 1.0</a></p><code>{asset.data.properties.source_version_id}</code>
        <p><a href={`${apiBase}/api/v1/assets/${assetId}`} download={`${assetId}.geojson`}>{fa ? 'هندسه و فرادادهٔ منبع (GeoJSON)' : 'Source geometry and metadata (GeoJSON)'}</a></p><Link to="/sources">{fa ? 'رجیستری منابع' : 'Source registry'}</Link></section>
    </>}
  </main>
}
