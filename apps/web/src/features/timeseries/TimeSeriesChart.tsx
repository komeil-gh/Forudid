import { useEffect, useRef } from 'react'
import { init, use as registerCharts } from 'echarts/core'
import { LineChart, CustomChart } from 'echarts/charts'
import type { CustomSeriesRenderItem } from 'echarts'
import { GridComponent, TooltipComponent, DataZoomComponent, MarkLineComponent, AriaComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { TimeSeries } from '../../generated/api/forudid'
import { presentation, format } from '../../lib/units'
import { fa } from '../../messages/fa'
import { Button } from '../../components/ui/button'
registerCharts([LineChart, CustomChart, GridComponent, TooltipComponent, DataZoomComponent,
  MarkLineComponent, AriaComponent, CanvasRenderer])
const bandRenderer: CustomSeriesRenderItem = (_params, api) => {
  const points = [api.coord([api.value(0), api.value(1)]), api.coord([api.value(0), api.value(2)]),
    api.coord([api.value(3), api.value(5)]), api.coord([api.value(3), api.value(4)])]
  return { type: 'polygon', shape: { points }, style: { fill: '#176e79', opacity: 0.14 } }
}
export default function TimeSeriesChart({ data }: { data: TimeSeries }) {
  const container = useRef<HTMLDivElement>(null)
  const chart = useRef<ReturnType<typeof init> | null>(null)
  useEffect(() => {
    if (!container.current) return
    const instance = init(container.current, undefined, { renderer: 'canvas' })
    chart.current = instance
    const samples = data.series.map(epoch => ({ date: Date.parse(epoch.date),
      value: presentation(epoch.displacement, data.unit), uncertainty: presentation(epoch.uncertainty, data.unit) }))
    const bands: number[][] = []
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1], b = samples[i]
      if (a.value !== null && b.value !== null && a.uncertainty !== null && b.uncertainty !== null)
        bands.push([a.date, a.value - a.uncertainty, a.value + a.uncertainty,
          b.date, b.value - b.uncertainty, b.value + b.uncertainty])
    }
    instance.setOption({ animation: false, aria: { enabled: true, label: { description: fa.chartSummary } },
      grid: { left: 54, right: 16, top: 24, bottom: 60 },
      tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${format(value)} mm` },
      xAxis: { type: 'time', axisLabel: { hideOverlap: true, formatter: '{yyyy}-{MM}', color: '#6b7c87' },
        axisLine: { lineStyle: { color: '#c4d0d8' } } },
      yAxis: { type: 'value', name: 'mm', axisLabel: { color: '#6b7c87' },
        splitLine: { lineStyle: { color: '#e7edf0' } } },
      dataZoom: [{ type: 'inside', filterMode: 'none' }, { type: 'slider', bottom: 5, height: 16, showDetail: false }],
      series: [{ type: 'custom', renderItem: bandRenderer, data: bands, silent: true, z: 1 },
        { type: 'line', name: 'LOS displacement', data: samples.map(p => [p.date, p.value]),
          connectNulls: false, symbolSize: 5, lineStyle: { width: 2, color: '#176e79' },
          itemStyle: { color: '#176e79' }, z: 2,
          markLine: { silent: true, symbol: 'none', label: { show: false },
            lineStyle: { color: '#83939f', type: 'dashed' }, data: [{ yAxis: 0 }] } }],
    })
    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(container.current)
    return () => { observer.disconnect(); instance.dispose(); chart.current = null }
  }, [data])
  return <div className="chart-section">
    <div className="chart-heading"><h3>{fa.timeSeries}</h3><Button variant="ghost" onClick={() =>
      chart.current?.dispatchAction({ type: 'dataZoom', start: 0, end: 100 })}>{fa.resetZoom}</Button></div>
    <div className="chart" ref={container} role="img" aria-label={fa.chartSummary} dir="ltr" />
    <p className="chart-caption">{fa.chartSummary}</p>
    <details className="series-table"><summary>{fa.values}</summary><table><thead><tr>
      <th>{fa.date}</th><th>{fa.displacement}</th></tr></thead><tbody>{data.series.map(epoch =>
      <tr key={epoch.date}><td className="technical">{epoch.date}</td>
        <td className="technical">{format(presentation(epoch.displacement, data.unit))}</td></tr>)}</tbody></table></details>
  </div>
}
