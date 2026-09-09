import type { Legend as LegendData } from '../../generated/api/forudid'
import { presentation, format } from '../../lib/units'
import { useLanguage } from '../../i18n'
export function Legend({ data }: { data: LegendData }) {
  const { language, layerLabels } = useLanguage(), en = language === 'en'
  const translated = (value: string) => value === 'LOS Velocity' ? layerLabels.velocity_los : en ? ({
    'نرخ فرونشست قائم برآوردشده': 'Estimated vertical subsidence rate',
    'دامنهٔ قله‌تا‌قلهٔ فصلی': 'Peak-to-peak seasonal amplitude',
    'بدون داده: شفاف': 'No data: transparent',
    'پیکسل‌های ماسک‌شده: شفاف': 'Masked pixels: transparent',
  }[value] ?? value) : value
  const min = data.ticks[0], max = data.ticks[data.ticks.length - 1]
  const stops = data.colors.map((color, i) => `${color} ${(data.ticks[i] - min) / (max - min) * 100}%`)
  return <section className="legend" aria-label={en ? 'Colour legend' : 'راهنمای رنگ'}>
    <strong className="technical">{translated(data.label)} · {data.display_unit}</strong>
    <div className="color-scale" style={{ background: `linear-gradient(to right, ${stops.join(',')})` }} />
    <div className="legend-ticks" dir="ltr">{data.ticks.map((tick, i) =>
      <span key={tick} style={{ left: `${(tick - min) / (max - min) * 100}%`,
        transform: `translateX(${i === 0 ? 0 : i === data.ticks.length - 1 ? -100 : -50}%)` }}>
        {format(presentation(tick, data.unit), data.unit === '1' ? 1 : 0)}</span>)}</div>
    <details><summary>{en ? 'Sign convention and missing data' : 'قرارداد علامت و نبود داده'}</summary><p>{data.sign_convention}</p>
      <p>{translated(data.nodata)} · {translated(data.masked)}</p></details>
  </section>
}
