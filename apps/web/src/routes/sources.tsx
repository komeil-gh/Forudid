import { useState } from 'react'
import { useListSources, useListSourceVersions } from '../generated/api/forudid'
import type { SourceInfo } from '../generated/api/forudid'
import { Status } from '../components/Status'
import { Button } from '../components/ui/button'
import './sources.css'

const number = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 })
const science: Record<string, string> = {
  published_peer_reviewed: 'پژوهش منتشرشده با داوری علمی',
  published_dataset: 'مجموعه‌دادهٔ منتشرشده',
  provider_operational: 'دادهٔ عملیاتی ارائه‌دهنده',
  experimental: 'آزمایشی', unknown: 'مشخص نشده',
}

function SourceCard({ source }: { source: SourceInfo }) {
  const [cursor, setCursor] = useState<string>()
  const versions = useListSourceVersions(source.id, { limit: 5, cursor })
  return <article className="source-card">
    <header><p>{source.provider}</p><h2>{source.name}</h2>
      <span>{science[source.scientific_status] ?? 'وضعیت علمی مشخص نشده'}</span></header>
    <dl><div><dt>مجوز</dt><dd><a href={source.license_url} target="_blank" rel="noreferrer">{source.license_name}</a></dd></div>
      <div><dt>منبع اصلی</dt><dd><a href={source.homepage} target="_blank" rel="noreferrer">صفحهٔ مجموعه‌داده</a></dd></div></dl>
    <p className="source-citation" dir="ltr">{source.citation}</p>
    <p className="source-attribution" dir="ltr">{source.attribution}</p>
    <h3>نسخه‌های ثبت‌شده</h3>
    {versions.isPending ? <Status /> : versions.isError ? <Status error retry={() => void versions.refetch()} /> :
      <>{versions.data.items.length === 0 && <p>هنوز نسخه‌ای از این منبع ثبت نشده است.</p>}
        {versions.data.items.map(version => <section className="source-version" key={version.id}>
          <h4>نسخهٔ <bdi>{version.version}</bdi></h4>
          {version.observation_years.length > 0 && <p>سال‌های مشاهده (میلادی): {version.observation_years.map(y => number.format(y)).join(' تا ')}</p>}
          {version.method === 'descending_los_projection' && <p>مؤلفهٔ قائم، حاصل تصویرکردن اندازه‌گیری راستای دید نزولی؛ با فرض ناچیزبودن تغییرشکل افقی.</p>}
          <p>دریافت: <time dateTime={version.downloaded_at}>{new Date(version.downloaded_at).toLocaleDateString('fa-IR')}</time></p>
          <p>{version.validation_status === 'checksum_verified' ? 'checksum فایل‌های اصلی بررسی شده است.' : 'وضعیت بررسی فایل: مشخص نشده'}</p>
          <details><summary>فایل‌ها و شناسهٔ یکپارچگی</summary>
            <p>SHA-256 فهرست نسخه</p><code dir="ltr">{version.checksum_sha256}</code>
            <ul>{version.files.map(file => <li key={file.role}><bdi>{file.name}</bdi>
              <span>{number.format(file.size_bytes / 1_000_000)} مگابایت</span>
              <code dir="ltr">{file.checksum_sha256}</code></li>)}</ul>
          </details>
        </section>)}
        <div className="source-pagination">{cursor && <Button onClick={() => setCursor(undefined)}>اولین نسخه‌ها</Button>}
          {versions.data.next_cursor && <Button onClick={() => setCursor(versions.data.next_cursor ?? undefined)}>نسخه‌های بعدی</Button>}</div></>}
  </article>
}

export default function SourcesPage() {
  const [cursor, setCursor] = useState<string>()
  const sources = useListSources({ limit: 10, cursor })
  return <main className="sources-page">
    <header><p>فرودید · شناسنامهٔ داده‌ها</p><h1>منابع داده</h1>
      <p>منبع، مجوز و نسخهٔ فایل‌هایی که وارد فرودید شده‌اند. ثبت منبع و بررسی checksum به‌تنهایی به معنای تأیید علمی یا انتشار محصول تحلیلی نیست.</p></header>
    {sources.isPending ? <Status /> : sources.isError ? <Status error retry={() => void sources.refetch()} /> :
      <>{sources.data.items.length === 0 ? <p role="status">هنوز منبعی ثبت نشده است.</p> : sources.data.items.map(source => <SourceCard key={source.id} source={source} />)}
        <div className="source-pagination">{cursor && <Button onClick={() => setCursor(undefined)}>اولین منابع</Button>}
          {sources.data.next_cursor && <Button onClick={() => setCursor(sources.data.next_cursor ?? undefined)}>منابع بعدی</Button>}</div></>}
  </main>
}
