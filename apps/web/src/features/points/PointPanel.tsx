import { lazy, Suspense } from 'react'
import { X, MapPin } from 'lucide-react'
import { useGetPointSummary, useGetTimeSeries, type ProductInfo } from '../../generated/api/forudid'
import type { MapSearch } from '../../lib/search'
import { presentation, format } from '../../lib/units'
import { fa } from '../../messages/fa'
import { Status } from '../../components/Status'
import { Boundary } from '../../components/Boundary'
import { Button } from '../../components/ui/button'
const Chart = lazy(() => import('../timeseries/TimeSeriesChart'))
export function PointPanel({ state, product, close }: { state: MapSearch; product: ProductInfo; close: () => void }) {
  const lon = state.pointLon!, lat = state.pointLat!
  const summary = useGetPointSummary({ lon, lat, product_id: product.id })
  const series = useGetTimeSeries({ lon, lat, run_id: product.processing_run_id })
  const point = summary.data
  return <section className="point-panel" aria-label={fa.point}>
    <Button variant="ghost" className="close-point" aria-label={fa.close} onClick={close}><X size={18} /></Button>
    <div className="point-details"><h2><MapPin size={17} />{fa.point}</h2>
      <p className="coordinate technical">{lon.toFixed(5)}, {lat.toFixed(5)}</p>
      {summary.isPending ? <Status /> : summary.isError ? <Status error retry={() => void summary.refetch()} /> : point && <>
        <p className={`quality quality-${point.quality}`}>{fa.quality[point.quality]}</p>
        <p className="quality-reason">{point.quality_reasons.join(' ')}</p>
        <dl className="point-values">
          <div><dt>{fa.velocity}</dt><dd className="technical"><strong>{format(presentation(point.velocity_los.value, point.velocity_los.unit))}</strong><small> mm/year</small></dd></div>
          <div><dt>{fa.uncertainty}</dt><dd className="technical">±{format(presentation(point.velocity_uncertainty.value, point.velocity_uncertainty.unit))}<small> mm/year</small></dd></div>
          <div><dt>{fa.coherence}</dt><dd className="technical">{format(point.temporal_coherence, 2)}</dd></div>
          <div><dt>{fa.observations}</dt><dd className="technical">{point.observations}</dd></div>
        </dl><p className="reference-info">{fa.referenceDate}: <bdi>{point.reference.date}</bdi><br />
          {fa.reference}: <bdi>{point.reference.coordinate.lon.toFixed(5)}, {point.reference.coordinate.lat.toFixed(5)}</bdi></p>
      </>}
    </div>
    <Boundary><div className="point-chart">
      {series.isPending ? <Status /> : series.isError ? <Status error retry={() => void series.refetch()} /> : series.data &&
        <Suspense fallback={<Status />}><Chart data={series.data} /></Suspense>}
    </div></Boundary>
  </section>
}
