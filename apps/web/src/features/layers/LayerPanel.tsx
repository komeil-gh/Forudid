import { Activity, Grid2X2, Sigma, FileText, Info } from 'lucide-react'
import { useListAreas, type ProductInfo } from '../../generated/api/forudid'
import type { MapSearch } from '../../lib/search'
import { useLanguage } from '../../i18n'
import { Button } from '../../components/ui/button'
import { Status } from '../../components/Status'
import { formatDate, formatDateRange, formatDateRangesInText } from '../../lib/date'
const icons = { velocity_los: Activity, temporal_coherence: Grid2X2, velocity_uncertainty: Sigma,
  velocity_vertical: Activity, seasonal_amplitude: Activity }
export function LayerPanel({ state, product, products, update, onMetadata }:
  { state: MapSearch; product?: ProductInfo; products: ProductInfo[];
    update: (next: Partial<MapSearch>) => void; onMetadata: () => void }) {
  const { language, messages: m, layerLabels } = useLanguage()
  const en = language === 'en'
  const areas = useListAreas()
  const area = areas.data?.find(a => a.slug === state.aoi)
  const layer = product?.kind ?? state.layer
  return <div className="layer-panel">
    <div className="area-heading"><h1>{area ? (en ? area.name_en : area.name_fa) : state.aoi}</h1>
      {product && <span>{formatDateRange(product.start_date, product.end_date, language, product.time_precision)}</span>}</div>
    <label className="field-label">{en ? 'Deformation source area' : 'محدودهٔ منبع تغییرشکل'}
      <select value={state.aoi} onChange={event => {
        const selected = areas.data?.find(a => a.slug === event.target.value)
        if (selected) update({ aoi: selected.slug, product: undefined, run: undefined, layer: 'velocity_vertical',
          panel: 'none', asset: undefined, analysis: undefined, segment: undefined, pointLon: undefined, pointLat: undefined,
          lon: (selected.bbox[0] + selected.bbox[2]) / 2, lat: (selected.bbox[1] + selected.bbox[3]) / 2,
          z: Math.max(2, Math.min(11, Math.log2(360 / Math.max(selected.bbox[2] - selected.bbox[0], selected.bbox[3] - selected.bbox[1])) - 1)) })
      }}>
        {!area && <option value={state.aoi}>{state.aoi}</option>}
        {areas.data?.map(a => <option key={a.id} value={a.slug}>{en ? a.name_en : a.name_fa}</option>)}
      </select></label>
    {areas.isError && <Status error retry={() => void areas.refetch()} />}
    {product?.is_fixture && <p className="notice"><Info size={17} />{m.fixture}</p>}
    <label className="field-label">{m.product}<select value={product?.id || ''}
      onChange={e => { const chosen = products.find(p => p.id === e.target.value);
        if (chosen) update({ product: chosen.id, run: chosen.processing_run_id, layer: chosen.kind as MapSearch['layer'], orbit: chosen.orbit_direction, analysis: undefined, segment: undefined }) }}>
      {products.filter(p => p.kind === layer).map(p => <option value={p.id} key={p.id}>{formatDateRangesInText(p.product_version, language)}</option>)}
    </select></label>
    {state.mode === 'deformation' && <fieldset className="layer-options"><legend>{m.layers}</legend>
      {(Object.keys(layerLabels) as (keyof typeof layerLabels)[]).filter(kind => products.some(p => p.kind === kind)).map(kind => {
        const Icon = icons[kind]
        return <label key={kind} className={layer === kind ? 'selected' : ''}>
          <input type="radio" name="layer" value={kind} checked={layer === kind}
            onChange={() => update({ layer: kind, product: undefined, run: undefined, analysis: undefined, segment: undefined })} />
          <span>{layerLabels[kind]}</span><Icon size={18} />
        </label>
      })}
    </fieldset>}
    <label className="field-label">{en ? 'OpenStreetMap infrastructure' : 'زیرساخت OpenStreetMap'}
      <select value={state.infrastructure} onChange={e => update({ infrastructure: e.target.value as MapSearch['infrastructure'] })}>
        <option value="all">{en ? 'Roads and railways' : 'راه و راه‌آهن'}</option><option value="railway">{en ? 'Railways' : 'راه‌آهن'}</option>
        <option value="road">{en ? 'Major roads' : 'جاده‌های اصلی'}</option><option value="none">{en ? 'Hidden' : 'پنهان'}</option>
      </select>
    </label>
    <p className="scientific-note">{en ? 'The network appears from zoom level 6; OSM coverage may be incomplete.' : 'شبکه از بزرگ‌نمایی ۶ نمایش داده می‌شود؛ پوشش OSM ممکن است ناقص باشد.'}</p>
    <label className="opacity"><span>{m.opacity}<b className="technical">{Math.round(state.opacity * 100)}%</b></span>
      <input aria-label={m.opacity} type="range" min="0" max="100" step="1" value={state.opacity * 100}
        onChange={e => update({ opacity: Number(e.target.value) / 100 })} />
    </label>
    {product && <><dl className="metadata-list">
      <div><dt>{m.orbit}</dt><dd className="technical">{product.orbit_direction === 'descending' ? 'Descending' : 'Ascending'}</dd></div>
      <div><dt>{m.track}</dt><dd>{product.relative_orbit === null ? (en ? 'Multi-track mosaic' : 'موزاییک چند ترک') : String(product.relative_orbit).padStart(3, '0')}</dd></div>
      <div><dt>{m.period}</dt><dd className="dates">{formatDateRange(product.start_date, product.end_date, language, product.time_precision)}</dd></div>
      <div><dt>{en ? 'Time precision' : 'دقت زمانی'}</dt><dd>{product.time_precision === 'year' ? (en ? 'Calendar year' : 'سال تقویمی') : (en ? 'Calendar day' : 'روز تقویمی')}</dd></div>
      {Array.isArray(product.resolution_metadata?.pixel_size_degrees) && <div><dt>{en ? 'Pixel size' : 'اندازهٔ پیکسل'}</dt>
        <dd><bdi>{product.resolution_metadata.pixel_size_degrees.map(value => Number(value).toPrecision(5)).join(' × ')}</bdi> {en ? 'degrees' : 'درجه'}</dd></div>}
      <div><dt>{m.version}</dt><dd className="technical">{product.processing_version}</dd></div>
      <div><dt>{m.lastAcquisition}</dt><dd>{product.last_acquisition ? formatDate(product.last_acquisition, language) : (en ? 'Exact date not provided' : 'تاریخ دقیق ارائه نشده')}</dd></div>
    </dl><Button className="metadata-button" onClick={onMetadata}><FileText size={17} />{m.metadata}</Button>
      <p className="scientific-note">{product.measurement_method === 'descending_los_projection' ? (en ? 'Vertical estimate from descending line of sight, assuming negligible horizontal motion. These historical data do not show current ground conditions.' : 'برآورد قائم از راستای دید نزولی، با فرض ناچیزبودن حرکت افقی. این دادهٔ تاریخی وضعیت کنونی زمین را نشان نمی‌دهد.') : m.scientificNote}</p></>}
  </div>
}
