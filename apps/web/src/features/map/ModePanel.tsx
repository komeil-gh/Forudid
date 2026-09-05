import { Link } from '@tanstack/react-router'
import { useGetExposureRanking, useListRegions, type ProductInfo } from '../../generated/api/forudid'
import { type MapSearch, defaultAssetSearch } from '../../lib/search'
import { PopulationExposure } from '../../routes/regions'
import { useLanguage } from '../../i18n'
import { Status } from '../../components/Status'
import { Button } from '../../components/ui/button'

export function ModePanel({ state, product, update, selectAsset }: {
  state: MapSearch; product?: ProductInfo; update: (next: Partial<MapSearch>) => void;
  selectAsset: (id: string, runId: string) => void;
}) {
  const { language } = useLanguage(), fa = language === 'fa'
  const regions = useListRegions()
  const type = state.infrastructure === 'road' ? 'road' : 'railway'
  const ranking = useGetExposureRanking({ product_id: product?.id ?? '', asset_type: type,
    region_id: state.region, sort: state.rankSort, min_coverage: state.minCoverage,
    q: state.rankQuery, offset: state.rankOffset, limit: 10,
  }, { query: { enabled: state.mode === 'infrastructure' && !!product } })
  const filter = (next: Partial<MapSearch>) => update({ rankOffset: 0, ...next })
  const number = (v: number | null) => v === null ? '—' : v.toLocaleString(fa ? 'fa-IR' : 'en-US', { maximumFractionDigits: 1 })
  return <div className="mode-panel">
    <label className="field-label">{fa ? 'محدودهٔ تاریخی' : 'Historical region'}<select value={state.region ?? ''} onChange={e => filter({ region: e.target.value || undefined })}>
      <option value="">{fa ? 'کل دامنهٔ منبع' : 'Entire source footprint'}</option>
      {regions.data?.items.map(r => <option key={r.id} value={r.id}>{fa ? r.name_fa : r.name_en}</option>)}
    </select></label>
    {regions.isError && <Status error retry={() => void regions.refetch()} />}
    {state.region && <p>{fa ? 'مرز تاریخی ۲۰۱۷؛ geoBoundaries / OpenStreetMap، با مجوز ODbL. مرجع رسمی کنونی نیست.' : 'Historical 2017 boundary; geoBoundaries / OpenStreetMap, ODbL. Not a current official boundary.'}</p>}
    {state.mode === 'population' ? product && <><PopulationExposure product={product.id} region={state.region} />
      <Link to="/regions" search={{ region: state.region, product: product.id }}>{fa ? 'داشبورد کامل محدوده و زیرساخت' : 'Full region and infrastructure dashboard'}</Link></> : <>
      <h2>{fa ? 'فهرست زیرساخت' : 'Infrastructure list'}</h2>
      <label className="field-label">{fa ? 'نوع زیرساخت' : 'Infrastructure type'}<select value={type} onChange={e => filter({ infrastructure: e.target.value as 'road' | 'railway' })}>
        <option value="railway">{fa ? 'راه‌آهن' : 'Railway'}</option><option value="road">{fa ? 'راه‌های اصلی' : 'Major roads'}</option>
      </select></label>
      <form onSubmit={e => { e.preventDefault(); filter({ rankQuery: String(new FormData(e.currentTarget).get('q') ?? '').trim() || undefined }) }} key={state.rankQuery ?? ''}>
        <label className="field-label">{fa ? 'نام یا شناسهٔ OSM' : 'Name or OSM identifier'}<input name="q" maxLength={80} defaultValue={state.rankQuery ?? ''} /></label>
        <Button type="submit">{fa ? 'جست‌وجو' : 'Search'}</Button>
      </form>
      <label className="field-label">{fa ? 'مرتب‌سازی نزولی' : 'Descending order'}<select value={state.rankSort} onChange={e => filter({ rankSort: e.target.value as MapSearch['rankSort'] })}>
        <option value="max_abs_velocity">{fa ? 'بیشترین قدرمطلق نرخ' : 'Maximum absolute rate'}</option><option value="p95_velocity">{fa ? 'صدک ۹۵ نرخ' : '95th percentile rate'}</option><option value="coverage_fraction">{fa ? 'پوشش معتبر' : 'Valid coverage'}</option>
      </select></label>
      <label className="field-label">{fa ? 'حداقل پوشش' : 'Minimum coverage'}<select value={state.minCoverage} onChange={e => filter({ minCoverage: Number(e.target.value) })}>
        {[0, .25, .5, .75, .9].map(v => <option key={v} value={v}>{number(v*100)}٪</option>)}
      </select></label>
      <p>{fa ? 'ترتیب بر اساس معیار انتخابی است، نه خطر سازه. آمار مربوط به کل هر قطعه است، حتی هنگام فیلتر محدوده.' : 'Ordered by the selected metric, not structural hazard. Metrics cover whole ways, including when a region filter is active.'}</p>
      {!product ? <p>{fa ? 'محصول نرخ در دسترس نیست.' : 'Rate product unavailable.'}</p> : ranking.isPending ? <Status /> : ranking.isError ? <Status error retry={() => void ranking.refetch()} /> : ranking.data && <>
        {!ranking.data.analysis_run_id ? <p>{fa ? 'تحلیل کامل منتشر نشده است.' : 'A complete analysis has not been published.'}</p> : <>
          <p>{number(ranking.data.total)} {fa ? 'قطعه' : 'ways'}</p>
          <table className="region-table"><caption>{fa ? 'انتخاب قطعه روی نقشه' : 'Select a way on the map'}</caption><thead><tr>
            <th scope="col">{fa ? 'قطعه' : 'Way'}</th><th scope="col">{fa ? 'پوشش' : 'Coverage'}</th><th scope="col">{fa ? 'بیشینه' : 'Maximum'} (mm/year)</th></tr></thead>
            <tbody>{ranking.data.items.map(row => <tr key={row.asset_id}><td><button className="rank-asset" onClick={() => selectAsset(row.asset_id, ranking.data!.analysis_run_id!)}>{row.name || row.external_id}</button></td><td>{number(row.coverage_fraction*100)}٪</td><td>{number(row.max_abs_velocity)}</td></tr>)}</tbody></table>
          <div className="source-pagination"><Button disabled={state.rankOffset === 0} onClick={() => update({ rankOffset: Math.max(0, state.rankOffset-10) })}>{fa ? 'قبلی' : 'Previous'}</Button>
            <Button disabled={ranking.data.next_offset === null} onClick={() => update({ rankOffset: ranking.data!.next_offset! })}>{fa ? 'بعدی' : 'Next'}</Button></div>
        </>}
        <Link to="/assets" search={{ ...defaultAssetSearch, product: product.id, type }}>{fa ? 'فهرست کامل و دریافت داده' : 'Full list and downloads'}</Link>
      </>}
    </>}
  </div>
}
