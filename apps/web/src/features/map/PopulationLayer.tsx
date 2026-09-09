import { X } from 'lucide-react'
import { useGetPopulationPoint, useListPopulationSources, type PopulationSource } from '../../generated/api/forudid'
import { useLanguage } from '../../i18n'
import { Status } from '../../components/Status'
import { Button } from '../../components/ui/button'
import './modes.css'

export function PopulationSelection({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  const { language } = useLanguage(), fa = language === 'fa'
  const query = useListPopulationSources()
  if (query.isPending) return <Status />
  if (query.isError) return <Status error retry={() => void query.refetch()} />
  const selected = value ? query.data.items.find(row => row.source_version_id === value) : query.data.items[0]
  return <div className="population-selection"><label className="field-label">{fa ? 'سال و نسخهٔ جمعیت' : 'Population year and version'}
    <select value={selected?.source_version_id ?? value ?? ''} onChange={event => onChange(event.target.value)}>
      {!selected && <option value={value ?? ''}>{fa ? 'نسخه در دسترس نیست' : 'Version unavailable'}</option>}
      {query.data.items.map(row => <option key={row.source_version_id} value={row.source_version_id}>
        {row.population_year} · WorldPop{row.maturity === 'alpha' ? ' · R2025A α' : ''}
      </option>)}
    </select></label>
    {selected && <p className="population-source-note">{selected.maturity === 'alpha'
      ? (fa ? 'R2025A آلفا؛ برآورد مدل برای ۲۰۲۶، تولید ۲۰۲۵. محدود به سکونتگاه‌ها و تعدیل‌شده با مجموع جمعیت سازمان ملل؛ سرشماری ۲۰۲۶ نیست.' : 'R2025A alpha: a modelled 2026 estimate produced in 2025, constrained to settlements and adjusted to UN totals; not a 2026 census.')
      : (fa ? 'برآورد تاریخی مدل جمعیت؛ این نسخه برای بازتولید تحلیل‌های قبلی حفظ شده است.' : 'Historical modelled population, retained for reproducibility.')}
      {' '}<a href={selected.source_url}>{fa ? 'منبع و روش' : 'Source and method'}</a></p>}
  </div>
}

export function PopulationLegend({ source }: { source: PopulationSource }) {
  const { language } = useLanguage(), fa = language === 'fa'
  const maximum = source.legend_ticks.at(-1)!
  const position = (value: number) => Math.log1p(value) / Math.log1p(maximum) * 100
  return <section className="legend population-legend" aria-label={fa ? 'راهنمای جمعیت' : 'Population legend'}>
    <strong>{fa ? `جمعیت برآوردی ${source.population_year} · نفر در سلول` : `Estimated population ${source.population_year} · people / cell`}</strong>
    <div className="color-scale" style={{ background: `linear-gradient(to right, ${source.legend_colors.map((color, i) => `${color} ${position(source.legend_ticks[i])}%`).join(', ')})` }} />
    <div className="legend-ticks" dir="ltr">{source.legend_ticks.filter((_, i) => i === 0 || i === 2 || i === source.legend_ticks.length - 1).map(tick => <span key={tick} style={{ left: `${position(tick)}%`, transform: tick === maximum ? 'translateX(-100%)' : tick ? 'translateX(-50%)' : undefined }}>{tick === maximum ? '30k+' : tick.toLocaleString('en-US')}</span>)}</div>
    <details><summary>{fa ? 'دقت و مقیاس نمایش' : 'Resolution and display scale'}</summary>
      <p>{fa ? 'مقیاس رنگ لگاریتمی است؛ سلول بومی حدود یک کیلومتر است. بزرگ‌نمایی جزئیات تازه ایجاد نمی‌کند. رنگ‌ها تعداد افراد را نشان می‌دهند، نه خطر یا تراکم نفر بر کیلومتر مربع.' : 'Logarithmic colour scale; native cells are approximately 1 km. Zooming adds no measurement detail. Colours show counts, not hazard or people per square kilometre.'}</p>
    </details>
  </section>
}

export function PopulationPointPanel({ source, lon, lat, close }: { source: PopulationSource; lon: number; lat: number; close: () => void }) {
  const { language } = useLanguage(), fa = language === 'fa'
  const query = useGetPopulationPoint(source.source_version_id, { lon, lat })
  return <section className="point-panel population-point" aria-label={fa ? 'سلول جمعیت انتخاب‌شده' : 'Selected population cell'}>
    <Button className="close-point" variant="ghost" aria-label={fa ? 'بستن' : 'Close'} onClick={close}><X size={18} /></Button>
    <div><h2>{fa ? 'جمعیت سلول بومی' : 'Native-cell population'} · {source.population_year}</h2>
      {query.isPending ? <Status /> : query.isError ? <Status error retry={() => void query.refetch()} /> : <>
        <p className="population-cell-value" data-testid="population-cell-count">{query.data.count === null ? (fa ? 'داده موجود نیست' : 'No data') : query.data.count.toLocaleString(fa ? 'fa-IR' : 'en-US', { maximumFractionDigits: 1 })} {query.data.count !== null && (fa ? 'نفر (برآورد)' : 'people (estimate)')}</p>
        <p><bdi dir="ltr">{lon.toFixed(5)}, {lat.toFixed(5)}</bdi> · {fa ? 'حدود یک کیلومتر؛ عددِ کل سلول، نه یک نقطه' : 'Approximately 1 km; a whole-cell count, not a point count'}</p>
        <a href={source.source_url}>WorldPop · {source.license}</a>
      </>}
    </div>
  </section>
}
