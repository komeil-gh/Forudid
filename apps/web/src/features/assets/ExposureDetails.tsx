import { useEffect, useRef, useState } from 'react'
import { init, use as registerCharts } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DataZoomComponent, AriaComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useGetAssetExposure, useGetAssetProfile, useGetExposureSegments, type ProfileSample } from '../../generated/api/forudid'
import { useLanguage } from '../../i18n'
import { Status } from '../../components/Status'
import { Button } from '../../components/ui/button'
import { apiBase } from '../../lib/api'
import { formatDate, formatObservationPeriod } from '../../lib/date'
import { ReportAction } from './ReportAction'

registerCharts([LineChart, GridComponent, TooltipComponent, DataZoomComponent, AriaComponent, CanvasRenderer])

function ProfileChart({ samples, onInspect }: { samples: ProfileSample[]; onInspect: (sample?: ProfileSample) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const { language } = useLanguage(), en = language === 'en'
  const label = en ? 'Distance profile; gaps indicate missing data' : 'پروفایل فاصله؛ شکاف‌ها نشان‌دهندهٔ نبود داده‌اند'
  useEffect(() => {
    if (!ref.current) return
    const chart = init(ref.current, undefined, { renderer: 'canvas' })
    chart.setOption({ animation: false, aria: { enabled: true, label: { description: label } },
      grid: { left: 55, right: 20, top: 30, bottom: 65 },
      tooltip: { trigger: 'axis' }, xAxis: { type: 'value', name: 'km',
        min: (samples[0]?.start_chainage_m ?? 0) / 1000,
        max: (samples.at(-1)?.end_chainage_m ?? 0) / 1000,
        axisLabel: { formatter: (value: number) => value.toLocaleString(en ? 'en-US' : 'fa-IR', { maximumFractionDigits: 1 }) } },
      yAxis: { type: 'value', name: 'mm/year' },
      dataZoom: [{ type: 'inside', filterMode: 'none' }, { type: 'slider', height: 16, bottom: 8 }],
      series: [{ type: 'line', data: samples.flatMap(p => [[p.start_chainage_m / 1000, p.velocity], [p.end_chainage_m / 1000, p.velocity]]),
        connectNulls: false, showSymbol: false, lineStyle: { color: '#176e79', width: 2 } }],
    })
    chart.on('updateAxisPointer', (event: unknown) => {
      const data = event as { dataIndex?: number; axesInfo?: { value?: number }[] }
      const km = data.axesInfo?.[0]?.value
      if (typeof km === 'number' && samples.length) {
        const sample = samples.reduce((a, b) => Math.abs(a.chainage_m / 1000 - km) < Math.abs(b.chainage_m / 1000 - km) ? a : b)
        onInspect(sample)
      }
    })
    chart.getZr().on('globalout', () => onInspect())
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(ref.current)
    return () => { observer.disconnect(); chart.dispose() }
  }, [samples, label, onInspect, en])
  return <div className="chart" ref={ref} role="img" aria-label={label} dir="ltr" />
}

export function ExposureDetails({ assetId, productId, runId, onInspect, selectedSegment, onSelectSegment }: {
  assetId: string; productId: string; runId?: string; onInspect: (sample?: ProfileSample) => void;
  selectedSegment?: number; onSelectSegment: (ordinal?: number) => void;
}) {
  const { language } = useLanguage(), en = language === 'en'
  const [page, setPage] = useState(0)
  const exposure = useGetAssetExposure(assetId, { product_id: productId, run_id: runId }, { query: { retry: false } })
  const data = exposure.data
  const profile = useGetAssetProfile(data?.analysis_run_id || '', assetId, { page }, { query: { enabled: !!data } })
  const segmentOffset = Math.floor((selectedSegment ?? 0)/25)*25
  const segments = useGetExposureSegments(data?.analysis_run_id || '', assetId, { offset: segmentOffset, limit: 25 }, { query: { enabled: !!data } })
  const number = (v: unknown, digits = 1) => typeof v === 'number'
    ? v.toLocaleString(en ? 'en-US' : 'fa-IR', { maximumFractionDigits: digits }) : (en ? 'Unavailable' : 'ناموجود')
  if (exposure.isPending) return <Status />
  if (exposure.isError) return exposure.error instanceof Error && exposure.error.message === 'HTTP 404'
    ? <p>{en ? 'No published analysis is available for this segment and product.' : 'تحلیل منتشرشده‌ای برای این قطعه و محصول موجود نیست.'}</p>
    : <Status error retry={() => void exposure.refetch()} />
  if (!data) return null
  const edges = Array.isArray(data.inputs.band_edges_mm_year) && data.inputs.band_edges_mm_year.every(v => typeof v === 'number') ? data.inputs.band_edges_mm_year : []
  const bandLabel = (index: number | null) => index === null ? (en ? 'No data' : 'بدون داده') : !edges.length ? (en ? 'Unavailable' : 'ناموجود') : index === 0 ? `< ${number(edges[0])}` : index === edges.length ? `≥ ${number(edges.at(-1))}` : `${number(edges[index-1])} ≤ v < ${number(edges[index])}`
  return <section aria-label={en ? 'Descriptive exposure' : 'مواجههٔ توصیفی'}>
    <h3>{en ? 'Descriptive exposure · experimental method' : 'مواجههٔ توصیفی · روش آزمایشی'}</h3>
    <p>{en ? 'Length-weighted sampling of the selected raster; numerical bands are not hazard classes.' : 'نمونه‌برداری با وزن طول از رستر انتخاب‌شده؛ بازه‌های عددی، ردهٔ خطر نیستند.'}</p>
    {data.inputs.measurement_component === 'los' && <p data-testid="exposure-component">{en
      ? 'Satellite line of sight (LOS): positive values indicate motion towards the satellite, negative values away. These are not vertical subsidence rates.'
      : 'نرخ در راستای دید ماهواره (LOS): مقدار مثبت حرکت به سوی ماهواره و مقدار منفی دورشدن از آن است. این مقادیر نرخ فرونشست قائم نیستند.'}</p>}
    <dl className="metadata-list">
      <div><dt>{en ? 'Valid coverage' : 'پوشش معتبر'}</dt><dd data-testid="exposure-coverage">{number(data.coverage_fraction * 100)}٪</dd></div>
      <div><dt>{en ? 'Length with data' : 'طول دارای داده'}</dt><dd>{number(data.valid_length_m / 1000)} km</dd></div>
      <div><dt>{en ? 'Mean over valid length' : 'میانگین روی طول معتبر'}</dt><dd data-testid="exposure-mean">{number(data.metrics.mean_velocity)} mm/year</dd></div>
      <div><dt>{en ? 'Median over valid length' : 'میانه روی طول معتبر'}</dt><dd>{number(data.metrics.median_velocity)} mm/year</dd></div>
    </dl>
    {profile.isPending ? <Status /> : profile.isError ? <Status error retry={() => void profile.refetch()} /> : profile.data && <>
      <ProfileChart samples={profile.data.items} onInspect={onInspect} />
      <p>{en ? 'Hover over the profile or select a table row to locate a sample on the map.' : 'با حرکت روی نمودار یا انتخاب سطر جدول، محل نمونه را روی نقشه ببینید.'}</p>
      <details className="series-table"><summary>{en ? 'Sample values' : 'مقادیر نمونه‌ها'}</summary>
        <table><thead><tr><th>{en ? 'Distance (km)' : 'فاصله (کیلومتر)'}</th><th>mm/year</th></tr></thead>
          <tbody>{profile.data.items.map(p => <tr key={p.chainage_m}><td><button type="button" onClick={() => onInspect(p)}>{number(p.chainage_m / 1000, 3)}</button></td><td>{number(p.velocity)}</td></tr>)}</tbody></table>
      </details>
      {(page > 0 || profile.data.next_page !== null) && <div className="chart-heading">
        <Button disabled={page === 0} onClick={() => { setPage(page - 1); onInspect() }}>{en ? 'Previous samples' : 'نمونه‌های قبلی'}</Button>
        <span>{number(page + 1, 0)}</span>
        <Button disabled={profile.data.next_page === null} onClick={() => { setPage(page + 1); onInspect() }}>{en ? 'Next samples' : 'نمونه‌های بعدی'}</Button>
      </div>}
    </>}
    <details className="series-table segment-table"><summary>{en ? 'Exposure intervals' : 'بازه‌های مواجهه'}</summary>
      <p>{en ? 'Select a real interval to fit its geometry on the map. Bands describe rates over the selected observation period.' : 'یک بازهٔ واقعی را انتخاب کنید تا هندسهٔ آن روی نقشه نمایش داده شود. باندها نرخ در دورهٔ مشاهدهٔ انتخاب‌شده را توصیف می‌کنند.'}</p>
      {selectedSegment !== undefined && <Button onClick={() => onSelectSegment()}>{en ? 'Show the entire way' : 'نمایش کل قطعه'}</Button>}
      {segments.isPending ? <Status /> : segments.isError ? <Status error retry={() => void segments.refetch()} /> : segments.data && <>
        {selectedSegment !== undefined && !segments.data.features.some(f => f.properties.ordinal === selectedSegment) && <p role="status">{en ? 'The requested interval is unavailable.' : 'بازهٔ درخواست‌شده در دسترس نیست.'}</p>}
        <table><caption>{en ? 'Real segment boundaries and descriptive bands' : 'مرز واقعی بازه‌ها و باندهای توصیفی'}</caption>
          <thead><tr><th scope="col">{en ? 'Interval' : 'بازه'}</th><th scope="col">{en ? 'Start–end (km)' : 'ابتدا تا انتها (کیلومتر)'}</th><th scope="col">mm/year</th></tr></thead>
          <tbody>{segments.data.features.map(feature => <tr key={feature.id}><td><button type="button" aria-pressed={selectedSegment === feature.properties.ordinal} onClick={() => onSelectSegment(feature.properties.ordinal)}>{number(feature.properties.ordinal+1, 0)}</button></td>
            <td><bdi>{number(feature.properties.start_chainage_m/1000, 3)} – {number(feature.properties.end_chainage_m/1000, 3)}</bdi></td><td><bdi dir="ltr">{bandLabel(feature.properties.band_index)}</bdi></td></tr>)}</tbody>
        </table>
        {(segmentOffset > 0 || segments.data.next_offset !== null) && <div className="source-pagination"><Button disabled={segmentOffset === 0} onClick={() => onSelectSegment(Math.max(0, segmentOffset-25))}>{en ? 'Previous intervals' : 'بازه‌های قبلی'}</Button><Button disabled={segments.data.next_offset === null} onClick={() => onSelectSegment(segments.data!.next_offset!)}>{en ? 'Next intervals' : 'بازه‌های بعدی'}</Button></div>}
      </>}
    </details>
    <details><summary>{en ? 'Analysis provenance' : 'شناسنامهٔ تحلیل'}</summary>
      <p><bdi>{data.analysis_run_id}</bdi></p><p><bdi>{data.method_version}</bdi></p>
      <p>{en ? 'Infrastructure snapshot' : 'تاریخ دادهٔ زیرساخت'}: <bdi>{typeof data.inputs.infrastructure_data_date === 'string' ? formatDate(data.inputs.infrastructure_data_date, language) : '—'}</bdi></p>
      <p>{en ? 'Deformation period' : 'بازهٔ تغییرشکل'}: <bdi>{formatObservationPeriod(data.inputs.deformation_period, language)}</bdi></p>
      <p>{en ? 'Pixel uncertainty and structural validation are unavailable.' : 'عدم‌قطعیت پیکسلی و اعتبارسنجی سازه‌ای موجود نیست.'}</p>
    </details>
    <p>{data.disclaimer}</p>
    <div className="source-pagination">
      <a href={`${apiBase}/api/v1/analyses/${data.analysis_run_id}/assets/${assetId}/download`}>{en ? 'Complete analysis (JSON)' : 'دادهٔ کامل تحلیل (JSON)'}</a>
      <a href={`${apiBase}/api/v1/analyses/${data.analysis_run_id}/assets/${assetId}/profile.csv`}>{en ? 'Complete profile (CSV)' : 'پروفایل کامل (CSV)'}</a>
      <a href={`${apiBase}/api/v1/analyses/${data.analysis_run_id}/assets/${assetId}/segments.geojson`}>{en ? 'Exposure segments (GeoJSON)' : 'قطعه‌بندی مواجهه (GeoJSON)'}</a>
    </div>
    <ReportAction key={`${assetId}:${data.analysis_run_id}`} request={{ asset_id: assetId, analysis_run_id: data.analysis_run_id, language: 'fa' }} />
  </section>
}
