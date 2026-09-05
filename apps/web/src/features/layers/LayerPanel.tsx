import { Activity, Grid2X2, Sigma, FileText, Info } from 'lucide-react'
import type { ProductInfo } from '../../generated/api/forudid'
import type { MapSearch } from '../../lib/search'
import { layerLabels, fa } from '../../messages/fa'
import { Button } from '../../components/ui/button'
const icons = { velocity_los: Activity, temporal_coherence: Grid2X2, velocity_uncertainty: Sigma,
  velocity_vertical: Activity, seasonal_amplitude: Activity }
export function LayerPanel({ state, product, products, update, onMetadata }:
  { state: MapSearch; product?: ProductInfo; products: ProductInfo[];
    update: (next: Partial<MapSearch>) => void; onMetadata: () => void }) {
  return <div className="layer-panel">
    <div className="area-heading"><h1>{state.aoi === 'iran' ? 'ایران' : fa.varamin}</h1><span>{state.aoi === 'iran' ? 'مجموعهٔ تاریخی ۲۰۱۴ تا ۲۰۲۰' : 'Varamin'}</span></div>
    {product?.is_fixture && <p className="notice"><Info size={17} />{fa.fixture}</p>}
    <label className="field-label">{fa.product}<select value={product?.id || ''}
      onChange={e => { const chosen = products.find(p => p.id === e.target.value);
        if (chosen) update({ product: chosen.id, run: chosen.processing_run_id }) }}>
      {products.filter(p => p.kind === state.layer).map(p => <option value={p.id} key={p.id}>{p.product_version}</option>)}
    </select></label>
    <fieldset className="layer-options"><legend>{fa.layers}</legend>
      {(Object.keys(layerLabels) as (keyof typeof layerLabels)[]).filter(kind => products.some(p => p.kind === kind)).map(kind => {
        const Icon = icons[kind]
        return <label key={kind} className={state.layer === kind ? 'selected' : ''}>
          <input type="radio" name="layer" value={kind} checked={state.layer === kind}
            onChange={() => update({ layer: kind, product: undefined })} />
          <span>{layerLabels[kind]}</span><Icon size={18} />
        </label>
      })}
    </fieldset>
    <label className="opacity"><span>{fa.opacity}<b className="technical">{Math.round(state.opacity * 100)}%</b></span>
      <input aria-label={fa.opacity} type="range" min="0" max="100" step="1" value={state.opacity * 100}
        onChange={e => update({ opacity: Number(e.target.value) / 100 })} />
    </label>
    {product && <><dl className="metadata-list">
      <div><dt>{fa.orbit}</dt><dd className="technical">{product.orbit_direction === 'descending' ? 'Descending' : 'Ascending'}</dd></div>
      <div><dt>{fa.track}</dt><dd>{product.relative_orbit === null ? 'موزاییک چند ترک' : String(product.relative_orbit).padStart(3, '0')}</dd></div>
      <div><dt>{fa.period}</dt><dd className="technical dates">{product.start_date}<br />{product.end_date}</dd></div>
      <div><dt>دقت زمانی</dt><dd>{product.time_precision === 'year' ? 'سال میلادی' : 'روز میلادی'}</dd></div>
      {Array.isArray(product.resolution_metadata?.pixel_size_degrees) && <div><dt>اندازهٔ پیکسل</dt>
        <dd><bdi>{product.resolution_metadata.pixel_size_degrees.map(value => Number(value).toPrecision(5)).join(' × ')}</bdi> درجه</dd></div>}
      <div><dt>{fa.version}</dt><dd className="technical">{product.processing_version}</dd></div>
      <div><dt>{fa.lastAcquisition}</dt><dd>{product.last_acquisition ?? 'تاریخ دقیق ارائه نشده'}</dd></div>
    </dl><Button className="metadata-button" onClick={onMetadata}><FileText size={17} />{fa.metadata}</Button>
      <p className="scientific-note">{product.measurement_method === 'descending_los_projection' ? 'برآورد قائم از راستای دید نزولی، با فرض ناچیزبودن حرکت افقی. این دادهٔ تاریخی وضعیت کنونی زمین را نشان نمی‌دهد.' : fa.scientificNote}</p></>}
  </div>
}
