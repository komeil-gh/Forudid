import type { Legend as LegendData } from '../../generated/api/forudid'
import { presentation, format } from '../../lib/units'
export function Legend({ data }: { data: LegendData }) {
  const min = data.ticks[0], max = data.ticks[data.ticks.length - 1]
  const stops = data.colors.map((color, i) => `${color} ${(data.ticks[i] - min) / (max - min) * 100}%`)
  return <section className="legend" aria-label="راهنمای رنگ">
    <strong className="technical">{data.label} · {data.display_unit}</strong>
    <div className="color-scale" style={{ background: `linear-gradient(to right, ${stops.join(',')})` }} />
    <div className="legend-ticks" dir="ltr">{data.ticks.map((tick, i) =>
      <span key={tick} style={{ left: `${(tick - min) / (max - min) * 100}%`,
        transform: `translateX(${i === 0 ? 0 : i === data.ticks.length - 1 ? -100 : -50}%)` }}>
        {format(presentation(tick, data.unit), data.unit === '1' ? 1 : 0)}</span>)}</div>
    <details><summary>قرارداد علامت و نبود داده</summary><p>{data.sign_convention}</p>
      <p>{data.nodata} · {data.masked}</p></details>
  </section>
}
