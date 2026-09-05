import { lazy, Suspense } from 'react'
import { X, MapPin } from 'lucide-react'
import { useGetPointSummary, useGetTimeSeries, type ProductInfo } from '../../generated/api/forudid'
import type { MapSearch } from '../../lib/search'
import { presentation, format } from '../../lib/units'
import { useLanguage } from '../../i18n'
import { Status } from '../../components/Status'
import { Boundary } from '../../components/Boundary'
import { Button } from '../../components/ui/button'
const Chart = lazy(() => import('../timeseries/TimeSeriesChart'))
export function PointPanel({ state, product, close }: { state: MapSearch; product: ProductInfo; close: () => void }) {
  const { language, messages: m, layerLabels } = useLanguage(), en = language === 'en'
  const localized = (value: number | null | undefined, digits = 1) => format(value, digits, en ? 'en-US' : 'fa-IR', en ? 'Unavailable' : 'ناموجود')
  const lon = state.pointLon!, lat = state.pointLat!
  const summary = useGetPointSummary({ lon, lat, product_id: product.id })
  const series = useGetTimeSeries({ lon, lat, run_id: product.processing_run_id }, { query: { enabled: product.timeseries_available } })
  const point = summary.data
  return <section className="point-panel" aria-label={m.point}>
    <Button variant="ghost" className="close-point" aria-label={m.close} onClick={close}><X size={18} /></Button>
    <div className="point-details"><h2><MapPin size={17} />{m.point}</h2>
      <p className="coordinate technical">{lon.toFixed(5)}, {lat.toFixed(5)}</p>
      {summary.isPending ? <Status /> : summary.isError ? <Status error retry={() => void summary.refetch()} /> : point && <>
        <p className={`quality quality-${point.quality}`}>{m.quality[point.quality]}</p>
        <p className="quality-reason">{point.quality_reasons.join(' ')}</p>
        <dl className="point-values">
          <div><dt>{layerLabels[point.measurement_kind as keyof typeof layerLabels] ?? m.velocity}</dt><dd className="technical"><strong>{localized(presentation(point.measurement.value, point.measurement.unit))}</strong><small> {point.measurement.unit.endsWith('/year') ? 'mm/year' : 'mm'}</small></dd></div>
          <div><dt>{m.uncertainty}</dt><dd>{point.velocity_uncertainty.value === null ? (en ? 'Not provided' : 'ارائه نشده') : <>±{localized(presentation(point.velocity_uncertainty.value, point.velocity_uncertainty.unit))}<small> mm/year</small></>}</dd></div>
          <div><dt>{m.coherence}</dt><dd className={point.temporal_coherence === null ? undefined : 'technical'}>{point.temporal_coherence === null ? (en ? 'Not provided' : 'ارائه نشده') : localized(point.temporal_coherence, 2)}</dd></div>
          <div><dt>{m.observations}</dt><dd>{point.observations ?? (en ? 'Not provided' : 'ارائه نشده')}</dd></div>
        </dl>{point.reference ? <p className="reference-info">{m.referenceDate}: <bdi>{point.reference.date}</bdi><br />
          {m.reference}: <bdi>{point.reference.coordinate.lon.toFixed(5)}, {point.reference.coordinate.lat.toFixed(5)}</bdi></p> : <p className="reference-info">{point.reference_description}</p>}
      </>}
    </div>
    <Boundary fallback={m.unexpected}><div className="point-chart">
      {!product.timeseries_available ? <p>{en ? 'This historical collection does not provide pixel-level time series.' : 'سری زمانی پیکسلی در این مجموعهٔ تاریخی ارائه نشده است.'}</p> : series.isPending ? <Status /> : series.isError ? <Status error retry={() => void series.refetch()} /> : series.data &&
        <Suspense fallback={<Status />}><Chart data={series.data} /></Suspense>}
    </div></Boundary>
  </section>
}
