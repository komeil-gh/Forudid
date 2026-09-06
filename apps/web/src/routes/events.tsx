import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { z } from 'zod'
import { useLanguage } from '../i18n'
import { Status } from '../components/Status'
import { Button } from '../components/ui/button'
import { MapCanvas } from '../features/map/MapCanvas'
import { defaultSearch, type MapSearch } from '../lib/search'
import { useGetEvent, useGetEventEvidence, useGetEventObservations, useGetEventTimeline, useListEvents } from '../generated/api/forudid'
import type { EventInfo, MultiPolygonGeometry } from '../generated/api/forudid'
import './events.css'

const labels: Record<string, [string, string]> = {
  candidate: ['نامزد بررسی', 'Candidate'], under_review: ['در حال بررسی', 'Under review'],
  corroborated: ['دارای شواهد پشتیبان', 'Corroborated'], monitoring: ['در حال پایش', 'Monitoring'],
  escalated: ['ارجاع‌شده', 'Escalated'], stable: ['پایدار', 'Stable'], resolved: ['مختومه', 'Resolved'],
  seasonal: ['فصلی', 'Seasonal'], artifact: ['اثر پردازش یا اندازه‌گیری', 'Artifact'], rejected: ['ردشده', 'Rejected'],
  los: ['راستای دید', 'Line of sight'], vertical: ['قائم', 'Vertical'], east_west: ['شرقی–غربی', 'East–west'],
  north_south: ['شمالی–جنوبی', 'North–south'], three_dimensional: ['سه‌بعدی', 'Three-dimensional'],
  U: ['شواهد ناکافی', 'Insufficient evidence'], D: ['نامطمئن', 'Uncertain'],
  C: ['تک‌منبع معتبر', 'Single-source credible'], B: ['تأیید متقابل', 'Corroborated'], A: ['تأیید متقابل قوی', 'Strongly corroborated'],
  beta: ['بتا', 'Beta'], provisional: ['موقت', 'Provisional'], validated: ['تأییدشده نزد ارائه‌دهنده', 'Provider validated'],
  unknown: ['مشخص نشده', 'Unknown'], experimental: ['آزمایشی', 'Experimental'],
  slope_change: ['تغییر روند', 'Trend change'], nisar: ['نیسار', 'NISAR'], sentinel1: ['سنتینل ۱', 'Sentinel-1'],
}

function useText() {
  const { language } = useLanguage()
  const fa = language === 'fa'
  const t = (persian: string, english: string) => fa ? persian : english
  const label = (value: string) => labels[value]?.[fa ? 0 : 1] ?? value
  const number = (value: number | null, digits = 1) => value === null ? t('در دسترس نیست', 'Unavailable')
    : new Intl.NumberFormat(fa ? 'fa-IR' : 'en-GB', { maximumFractionDigits: digits }).format(value)
  const date = (value: string | null) => value === null ? t('مشخص نشده', 'Not specified')
    : new Date(value).toLocaleDateString(fa ? 'fa-IR' : 'en-GB')
  return { t, label, number, date }
}

function EventMetrics({ event }: { event: EventInfo }) {
  const { t, label, number, date } = useText()
  return <dl className="event-metrics">
    <div><dt>{t('وضعیت رخداد', 'Event status')}</dt><dd>{label(event.status)}</dd></div>
    <div><dt>{t('درجهٔ شواهد', 'Evidence grade')}</dt><dd><bdi>{event.confidence_grade}</bdi> · <span>{label(event.confidence_grade)}</span></dd></div>
    <div><dt>{t('آخرین مشاهده', 'Last observation')}</dt><dd><time dateTime={event.last_observed_at}>{date(event.last_observed_at)}</time></dd></div>
    <div><dt>{t('مؤلفهٔ اندازه‌گیری', 'Measurement component')}</dt><dd>{label(event.dominant_component)}</dd></div>
    <div><dt>{t('نرخ کنونی · میلی‌متر در سال', 'Current rate · mm/year')}</dt><dd>{number(event.current_velocity)}</dd></div>
    <div><dt>{t('مساحت کنونی · کیلومتر مربع', 'Current area · km²')}</dt><dd>{number(event.area_current / 1_000_000, 3)}</dd></div>
  </dl>
}

export default function EventsPage() {
  const [cursor, setCursor] = useState<string>()
  const query = useListEvents({ cursor, limit: 20 })
  const { t, label } = useText()
  return <main className="events-page article">
    <header><h1>{t('رخدادهای تغییرشکل', 'Deformation events')}</h1>
      <p>{t('رخدادهای منتشرشده، همراه با تاریخچه و شواهد اندازه‌گیری. درجهٔ شواهد از شدت تغییرشکل و ارزیابی مهندسی مستقل است.', 'Published events with their history and measurement evidence. Evidence grade is separate from deformation severity and engineering assessment.')}</p></header>
    {query.isPending ? <Status /> : query.isError ? <Status error retry={() => void query.refetch()} /> : <>
      {!query.data.items.length && <section className="event-empty" role="status">
        <h2>{t('هنوز رخداد واقعی منتشرشده‌ای وجود ندارد.', 'No real event has been published yet.')}</h2>
        <p>{t('دادهٔ تاریخی ۲۰۱۴ تا ۲۰۲۰، مشاهدهٔ تازه یا نشانهٔ تغییر روند امروز نیست. رخدادها پس از ورود مشاهدات زمانی و بررسی شواهد در این صفحه ظاهر می‌شوند.', 'The 2014–2020 historical data are not a new observation or evidence of a present-day trend change. Events appear here after temporal observations are ingested and their evidence is reviewed.')}</p>
        <Link to="/sources">{t('دیدن منابع موجود', 'View available sources')}</Link>
      </section>}
      {query.data.items.map(event => <article className="event-card" key={event.id}>
        <p>{label(event.event_type)}</p><h2><Link to="/events/$eventId" params={{ eventId: event.id }}>{event.event_key}</Link></h2>
        <EventMetrics event={event} />
      </article>)}
      <div className="event-pagination">{cursor && <Button onClick={() => setCursor(undefined)}>{t('اولین رخدادها', 'First events')}</Button>}
        {query.data.next_cursor && <Button onClick={() => setCursor(query.data.next_cursor ?? undefined)}>{t('رخدادهای بعدی', 'Next events')}</Button>}</div>
    </>}
  </main>
}

function EventMap({ geometry }: { geometry: MultiPolygonGeometry }) {
  const [state, setState] = useState<MapSearch>({ ...defaultSearch, infrastructure: 'none' })
  const { t } = useText()
  return <section className="event-map" aria-label={t('نقشهٔ رخداد', 'Event map')}>
    <MapCanvas state={state} eventGeometry={geometry} inspectEnabled={false}
      update={values => setState(current => ({ ...current, ...values }))} selectPoint={() => undefined} />
  </section>
}

function Timeline({ id }: { id: string }) {
  const [after, setAfter] = useState(0)
  const query = useGetEventTimeline(id, { after, limit: 10 })
  const { t, number, date, label } = useText()
  return <section aria-label={t('تاریخچه', 'Timeline')} className="event-card">
    <h2>{t('تاریخچهٔ رخداد', 'Event history')}</h2>
    {query.isPending ? <Status /> : query.isError ? <Status error retry={() => void query.refetch()} /> : <>
      {!query.data.items.length && <p>{t('تاریخچه‌ای ثبت نشده است.', 'No history has been recorded.')}</p>}
      <ol className="event-timeline">{query.data.items.map(revision => <li key={revision.id}>
        <h3>{t('نسخهٔ ', 'Revision ')}{number(revision.revision_number, 0)}</h3>
        <p>{revision.reason}</p><p>{t('ثبت در سامانه: ', 'Recorded in system: ')}<time dateTime={revision.created_at}>{date(revision.created_at)}</time></p>
        {typeof revision.metrics.status === 'string' && <p>{label(revision.metrics.status)}</p>}
        <details><summary>{t('منشأ این تغییر', 'Revision provenance')}</summary>
          <p>{t('شناسهٔ اجرای پردازش', 'Processing run ID')}</p><code dir="ltr">{revision.source_processing_run_id}</code>
          <p>SHA-256</p><code dir="ltr">{revision.input_sha256}</code>
          {typeof revision.provenance.detector_version === 'string' && <p><bdi>{revision.provenance.detector_version}</bdi></p>}
        </details>
      </li>)}</ol>
      <div className="event-pagination">{after > 0 && <Button onClick={() => setAfter(0)}>{t('اولین نسخه‌ها', 'First revisions')}</Button>}
        {query.data.next_revision !== null && <Button onClick={() => setAfter(query.data.next_revision ?? 0)}>{t('نسخه‌های بعدی', 'Next revisions')}</Button>}</div>
    </>}
  </section>
}

function Observations({ id }: { id: string }) {
  const [cursor, setCursor] = useState<string>()
  const query = useGetEventObservations(id, { cursor, limit: 10 })
  const { t, label, number, date } = useText()
  return <section aria-label={t('مشاهدات', 'Observations')} className="event-card">
    <h2>{t('مشاهدات اندازه‌گیری', 'Measurement observations')}</h2>
    {query.isPending ? <Status /> : query.isError ? <Status error retry={() => void query.refetch()} /> : <>
      {!query.data.items.length && <p>{t('مشاهده‌ای ثبت نشده است.', 'No observation has been recorded.')}</p>}
      {query.data.items.map(observation => <article className="event-observation" key={observation.id}>
        <h3>{label(observation.sensor_family)} · {label(observation.component)}</h3>
        <p>{t('بلوغ محصول ارائه‌دهنده: ', 'Provider product maturity: ')}<strong>{label(observation.maturity)}</strong></p>
        <dl><div><dt>{t('بازهٔ مشاهده', 'Observation interval')}</dt><dd>{date(observation.interval_start)} — {date(observation.interval_end)}</dd></div>
          <div><dt>{t('زمان دسترس‌پذیری', 'Available at')}</dt><dd>{date(observation.available_at)}</dd></div>
          <div><dt>{t('نرخ · میلی‌متر در سال', 'Rate · mm/year')}</dt><dd>{number(observation.velocity)}</dd></div>
          <div><dt>{t('پوشش معتبر', 'Valid coverage')}</dt><dd>{observation.coverage === null ? number(null) : `${number(observation.coverage * 100)}%`}</dd></div></dl>
        <details open><summary>{t('برداشت‌های خام', 'Raw acquisitions')}</summary>
          <ul>{observation.raw_acquisition_ids.map(raw => <li key={raw}><bdi>{raw}</bdi></li>)}</ul></details>
        <details><summary>{t('شناسه‌های منبع و محصول', 'Source and product identities')}</summary>
          <p>{t('نسخهٔ منبع', 'Source version')}</p><code dir="ltr">{observation.source_version_id}</code>
          <p>{t('محصول', 'Product')}</p><code dir="ltr">{observation.product_id}</code>
          <p>{t('روش اندازه‌گیری', 'Measurement method')}</p><bdi>{observation.measurement_method}</bdi>
        </details>
      </article>)}
      <div className="event-pagination">{cursor && <Button onClick={() => setCursor(undefined)}>{t('اولین مشاهدات', 'First observations')}</Button>}
        {query.data.next_cursor && <Button onClick={() => setCursor(query.data.next_cursor ?? undefined)}>{t('مشاهدات بعدی', 'Next observations')}</Button>}</div>
    </>}
  </section>
}

function Evidence({ id }: { id: string }) {
  const [cursor, setCursor] = useState<string>()
  const query = useGetEventEvidence(id, { cursor, limit: 10 })
  const { t, label, date } = useText()
  return <section aria-label={t('شواهد', 'Evidence')} className="event-card">
    <h2>{t('شواهد', 'Evidence')}</h2><p>{t('چند محصول از یک برداشت خام، تأیید مستقل محسوب نمی‌شوند.', 'Multiple products from one raw acquisition are not independent confirmations.')}</p>
    {query.isPending ? <Status /> : query.isError ? <Status error retry={() => void query.refetch()} /> : <>
      {!query.data.items.length && <p>{t('شاهدی ثبت نشده است.', 'No evidence has been recorded.')}</p>}
      {query.data.items.map(evidence => <article className="event-observation" key={evidence.id}>
        <h3>{label(evidence.evidence_type)}</h3>
        <strong>{evidence.contradicts_event ? t('متناقض', 'Contradicting') : evidence.supports_event ? t('پشتیبان', 'Supporting') : t('بدون جهت‌گیری', 'Neutral')}</strong>
        <p>{evidence.summary}</p><time dateTime={evidence.created_at}>{date(evidence.created_at)}</time>
        <p>{t('گروه استقلال شواهد: ', 'Evidence independence group: ')}<bdi>{evidence.independence_group}</bdi></p>
        {evidence.supersedes_id && <p>{t('جایگزین شاهد: ', 'Supersedes evidence: ')}<code dir="ltr">{evidence.supersedes_id}</code></p>}
      </article>)}
      <div className="event-pagination">{cursor && <Button onClick={() => setCursor(undefined)}>{t('اولین شواهد', 'First evidence')}</Button>}
        {query.data.next_cursor && <Button onClick={() => setCursor(query.data.next_cursor ?? undefined)}>{t('شواهد بعدی', 'Next evidence')}</Button>}</div>
    </>}
  </section>
}

function EventDossier({ id }: { id: string }) {
  const query = useGetEvent(id)
  const { t, label, date, number } = useText()
  if (query.isPending) return <Status />
  if (query.isError) return <Status error retry={() => void query.refetch()} />
  const { event, geometry, disclaimer } = query.data
  return <main className="events-page article">
    <Link to="/events">{t('همهٔ رخدادها', 'All events')}</Link>
    <header><p>{label(event.event_type)} · {label(event.scientific_status)}</p><h1>{event.event_key}</h1></header>
    <EventMetrics event={event} />
    <p>{t('نخستین تشخیص سامانه: ', 'First system detection: ')}{date(event.first_detected_at)} · {t('آغاز برآوردشده: ', 'Estimated onset: ')}{date(event.estimated_onset_at)}</p>
    <p>{t('نسخهٔ جاری: ', 'Current revision: ')}{number(event.revision_number, 0)} · {t('طبقه‌بندی غربالگری: ', 'Screening class: ')}{event.severity_screening_class ?? t('ارزیابی نشده', 'Not assessed')}</p>
    <EventMap geometry={geometry} />
    <p className="event-disclaimer">{disclaimer}</p>
    <div className="event-columns"><div><Observations id={id} /><Evidence id={id} /></div><Timeline id={id} /></div>
  </main>
}

export function EventDetailPage() {
  const { eventId } = useParams({ strict: false })
  if (!z.uuid().safeParse(eventId).success) return <Status error />
  return <EventDossier key={eventId} id={eventId!} />
}
