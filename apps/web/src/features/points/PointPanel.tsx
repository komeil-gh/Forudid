import { lazy, Suspense } from 'react'
import { Link } from '@tanstack/react-router'
import { X, MapPin } from 'lucide-react'
import { useGetPointSummary, useGetTimeSeries, type ProductInfo } from '../../generated/api/forudid'
import type { MapSearch } from '../../lib/search'
import { presentation, format, displayUnit } from '../../lib/units'
import { useLanguage } from '../../i18n'
import { Status } from '../../components/Status'
import { Boundary } from '../../components/Boundary'
import { Button } from '../../components/ui/button'
import { formatDate, formatDateRange } from '../../lib/date'
const Chart = lazy(() => import('../timeseries/TimeSeriesChart'))
export function PointPanel({ state, product, close }: { state: MapSearch; product: ProductInfo; close: () => void }) {
  const { language, messages: m, layerLabels } = useLanguage(), en = language === 'en'
  const localized = (value: number | null | undefined, digits = 1) => format(value, digits, en ? 'en-US' : 'fa-IR', en ? 'Unavailable' : 'ناموجود')
  const lon = state.pointLon!, lat = state.pointLat!
  const summary = useGetPointSummary({ lon, lat, product_id: product.id })
  const series = useGetTimeSeries({ lon, lat, run_id: product.processing_run_id }, { query: { enabled: product.timeseries_available } })
  const point = summary.data
  return <section className={`point-panel ${product.timeseries_available ? '' : 'point-summary-only'}`} aria-label={m.point}>
    <Button variant="ghost" className="close-point" aria-label={m.close} onClick={close}><X size={18} /></Button>
    <div className="point-details"><h2><MapPin size={17} />{m.point}</h2>
      <p className="coordinate"><span>{en ? 'Selected location (lon, lat)' : 'مختصات انتخاب (طول، عرض)'}</span> <bdi dir="ltr">{lon.toFixed(6)}, {lat.toFixed(6)}</bdi></p>
      {(product.kind === 'velocity_los' || product.kind === 'velocity_vertical') && <Link className="point-comparison-link" to="/compare" search={{ lon, lat, a: product.id, areaA: product.aoi_slug, areaB: 'iran' }}>{en ? 'Compare sources at this point' : 'مقایسهٔ منابع در این نقطه'}</Link>}
      {summary.isPending ? <Status /> : summary.isError ? <Status error retry={() => void summary.refetch()} /> : point && <>
        <p className={`quality quality-${point.quality}`}>{m.quality[point.quality]}</p>
        <p className="quality-reason">{point.quality_reasons.join(' ')}</p>
        <dl className="point-values">
          <div><dt>{layerLabels[point.measurement_kind as keyof typeof layerLabels] ?? m.velocity}</dt><dd><bdi dir="ltr"><strong>{localized(presentation(point.measurement.value, point.measurement.unit), point.measurement.unit === '1' ? 2 : 1)}</strong><small> {point.measurement.unit === '1' ? (en ? 'unitless' : 'بی‌بُعد') : displayUnit(point.measurement.unit)}</small></bdi></dd></div>
          <div><dt>{m.uncertainty}</dt><dd>{point.velocity_uncertainty.value === null ? (en ? 'Not provided' : 'ارائه نشده') : <bdi dir="ltr">±{localized(presentation(point.velocity_uncertainty.value, point.velocity_uncertainty.unit))}<small> {displayUnit(point.velocity_uncertainty.unit)}</small></bdi>}</dd></div>
          <div><dt>{m.coherence}</dt><dd className={point.temporal_coherence === null ? undefined : 'technical'}>{point.temporal_coherence === null ? (en ? 'Not provided' : 'ارائه نشده') : localized(point.temporal_coherence, 2)}</dd></div>
          <div><dt>{m.observations}</dt><dd>{point.observations === null ? (en ? 'Not provided' : 'ارائه نشده') : localized(point.observations, 0)}</dd></div>
        </dl>
        <details className="native-cell-details">
          <summary>{en ? 'Native pixel, observation period and reference' : 'پیکسل بومی، دورهٔ مشاهده و مرجع'}</summary>
          <p>{en ? 'Observation period' : 'دورهٔ مشاهده'}: {formatDateRange(product.start_date, product.end_date, language, product.time_precision)}</p>
          {point.sampled_coordinate ? <p>{en ? 'Native pixel centre (lon, lat)' : 'مرکز پیکسل بومی (طول، عرض)'}: <bdi dir="ltr">{point.sampled_coordinate.lon.toFixed(6)}, {point.sampled_coordinate.lat.toFixed(6)}</bdi></p> : <p role="status">{en ? 'Outside the raster extent.' : 'خارج از محدودهٔ رستر منبع.'}</p>}
          {point.sampled_cell && <p>{en ? 'The outlined cell is the sampled source pixel. Zooming does not add measurement precision.' : 'سلول دورخط‌دار، پیکسل نمونه‌برداری‌شدهٔ منبع است. بزرگ‌نمایی دقت اندازه‌گیری را افزایش نمی‌دهد.'}</p>}
          {point.measurement.value === null && point.sampled_coordinate && <p role="status">{en ? 'This cell is inside the raster but has no measurement; missing data do not imply stable ground.' : 'این سلول داخل محدودهٔ رستر است، اما اندازه‌گیری ندارد؛ نبود داده به معنای پایداری زمین نیست.'}</p>}
        {point.reference ? <p className="reference-info">{m.referenceDate}: <time dateTime={point.reference.date}>{formatDate(point.reference.date, language)}</time><br />
          {m.reference}: <bdi>{point.reference.coordinate.lon.toFixed(5)}, {point.reference.coordinate.lat.toFixed(5)}</bdi></p> : <p className="reference-info">{point.reference_description}</p>}
        </details>
      </>}
    </div>
    <Boundary fallback={m.unexpected}><div className="point-chart">
      {!product.timeseries_available ? <p>{en ? 'This historical collection does not provide pixel-level time series.' : 'سری زمانی پیکسلی در این مجموعهٔ تاریخی ارائه نشده است.'}</p> : series.isPending ? <Status /> : series.isError ? <Status error retry={() => void series.refetch()} /> : series.data &&
        <Suspense fallback={<Status />}><Chart data={series.data} /></Suspense>}
    </div></Boundary>
  </section>
}
