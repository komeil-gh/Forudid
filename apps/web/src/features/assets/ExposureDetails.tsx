import { useEffect, useRef, useState } from 'react'
import { init, use as registerCharts } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DataZoomComponent, AriaComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useGetAssetExposure, useGetAssetProfile, type ProfileSample } from '../../generated/api/forudid'
import { useLanguage } from '../../i18n'
import { Status } from '../../components/Status'
import { Button } from '../../components/ui/button'

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

export function ExposureDetails({ assetId, productId, onInspect }: {
  assetId: string; productId: string; onInspect: (sample?: ProfileSample) => void;
}) {
  const { language } = useLanguage(), en = language === 'en'
  const [page, setPage] = useState(0)
  const exposure = useGetAssetExposure(assetId, { product_id: productId }, { query: { retry: false } })
  const data = exposure.data
  const profile = useGetAssetProfile(data?.analysis_run_id || '', assetId, { page }, { query: { enabled: !!data } })
  const number = (v: unknown, digits = 1) => typeof v === 'number'
    ? v.toLocaleString(en ? 'en-US' : 'fa-IR', { maximumFractionDigits: digits }) : (en ? 'Unavailable' : 'ناموجود')
  if (exposure.isPending) return <Status />
  if (exposure.isError) return exposure.error instanceof Error && exposure.error.message === 'HTTP 404'
    ? <p>{en ? 'No published analysis is available for this segment and product.' : 'تحلیل منتشرشده‌ای برای این قطعه و محصول موجود نیست.'}</p>
    : <Status error retry={() => void exposure.refetch()} />
  if (!data) return null
  return <section aria-label={en ? 'Descriptive exposure' : 'مواجههٔ توصیفی'}>
    <h3>{en ? 'Descriptive exposure · experimental method' : 'مواجههٔ توصیفی · روش آزمایشی'}</h3>
    <p>{en ? 'Length-weighted sampling of the historical raster; numerical bands are not hazard classes.' : 'نمونه‌برداری با وزن طول از رستر تاریخی؛ بازه‌های عددی، ردهٔ خطر نیستند.'}</p>
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
    <details><summary>{en ? 'Analysis provenance' : 'شناسنامهٔ تحلیل'}</summary>
      <p><bdi>{data.analysis_run_id}</bdi></p><p><bdi>{data.method_version}</bdi></p>
      <p>{en ? 'Infrastructure snapshot' : 'تاریخ snapshot زیرساخت'}: <bdi>{String(data.inputs.infrastructure_data_date)}</bdi></p>
      <p>{en ? 'Deformation period' : 'بازهٔ تغییرشکل'}: <bdi>{Array.isArray(data.inputs.deformation_period) ? data.inputs.deformation_period.join('–') : '—'}</bdi></p>
      <p>{en ? 'Pixel uncertainty and structural validation are unavailable.' : 'عدم‌قطعیت پیکسلی و اعتبارسنجی سازه‌ای موجود نیست.'}</p>
    </details>
    <p>{data.disclaimer}</p>
  </section>
}
