import { useState } from 'react'
import { useListSources, useListSourceVersions } from '../generated/api/forudid'
import type { SourceInfo } from '../generated/api/forudid'
import { Status } from '../components/Status'
import { Button } from '../components/ui/button'
import './sources.css'
import { useLanguage, type Language } from '../i18n'

const copy = {
  fa: { unknown: 'وضعیت علمی مشخص نشده', license: 'مجوز', origin: 'منبع اصلی', dataset: 'صفحهٔ مجموعه‌داده', versions: 'نسخه‌های ثبت‌شده', noVersions: 'هنوز نسخه‌ای از این منبع ثبت نشده است.', version: 'نسخهٔ', years: 'سال‌های مشاهده (میلادی):', to: ' تا ', projection: 'مؤلفهٔ قائم، حاصل تصویرکردن اندازه‌گیری راستای دید نزولی؛ با فرض ناچیزبودن تغییرشکل افقی.', downloaded: 'دریافت:', verified: 'checksum فایل‌های اصلی بررسی شده است.', unchecked: 'وضعیت بررسی فایل: مشخص نشده', files: 'فایل‌ها و شناسهٔ یکپارچگی', manifest: 'SHA-256 فهرست نسخه', mb: 'مگابایت', firstVersions: 'اولین نسخه‌ها', nextVersions: 'نسخه‌های بعدی', title: 'منابع داده', intro: 'منبع، مجوز و نسخهٔ فایل‌هایی که وارد فرودید شده‌اند. ثبت منبع و بررسی checksum به‌تنهایی به معنای تأیید علمی یا انتشار محصول تحلیلی نیست.', noSources: 'هنوز منبعی ثبت نشده است.', firstSources: 'اولین منابع', nextSources: 'منابع بعدی' },
  en: { unknown: 'Scientific status not specified', license: 'Licence', origin: 'Original source', dataset: 'Dataset page', versions: 'Registered versions', noVersions: 'No version of this source has been registered.', version: 'Version', years: 'Observation years:', to: ' to ', projection: 'Vertical component projected from descending line-of-sight measurements, assuming negligible horizontal deformation.', downloaded: 'Downloaded:', verified: 'Checksums of the original files have been verified.', unchecked: 'File verification status is not specified.', files: 'Files and integrity identifiers', manifest: 'Version-manifest SHA-256', mb: 'MB', firstVersions: 'First versions', nextVersions: 'Next versions', title: 'Data sources', intro: 'Sources, licences, and file versions ingested into Forudid. Registering a source and verifying its checksum do not by themselves constitute scientific validation or publication of an analytical product.', noSources: 'No source has been registered.', firstSources: 'First sources', nextSources: 'Next sources' },
} as const
const science = {
  fa: { published_peer_reviewed: 'پژوهش منتشرشده با داوری علمی', published_dataset: 'مجموعه‌دادهٔ منتشرشده', provider_operational: 'دادهٔ عملیاتی ارائه‌دهنده', experimental: 'آزمایشی', unknown: 'مشخص نشده' },
  en: { published_peer_reviewed: 'Published peer-reviewed research', published_dataset: 'Published dataset', provider_operational: 'Operational provider data', experimental: 'Experimental', unknown: 'Not specified' },
}

function SourceCard({ source, language }: { source: SourceInfo, language: Language }) {
  const [cursor, setCursor] = useState<string>()
  const versions = useListSourceVersions(source.id, { limit: 5, cursor })
  const text = copy[language], locale = language === 'fa' ? 'fa-IR' : 'en-US'
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const year = new Intl.NumberFormat(locale, { useGrouping: false })
  const name = language === 'en' ? ({
    'فرونشست ایران، مشاهدات سنتینل ۱ در بازهٔ ۲۰۱۴ تا ۲۰۲۰': 'Land subsidence in Iran, Sentinel-1 observations from 2014 to 2020',
    'راه و راه‌آهن ایران در OpenStreetMap': 'Roads and railways in Iran from OpenStreetMap',
  }[source.name] ?? source.name) : source.name
  return <article className="source-card">
    <header><p>{source.provider}</p><h2>{name}</h2>
      <span>{science[language][source.scientific_status as keyof typeof science.fa] ?? text.unknown}</span></header>
    <dl><div><dt>{text.license}</dt><dd><a href={source.license_url} target="_blank" rel="noreferrer">{source.license_name}</a></dd></div>
      <div><dt>{text.origin}</dt><dd><a href={source.homepage} target="_blank" rel="noreferrer">{text.dataset}</a></dd></div></dl>
    <p className="source-citation" dir="ltr">{source.citation}</p>
    <p className="source-attribution" dir="ltr">{source.attribution}</p>
    <h3>{text.versions}</h3>
    {versions.isPending ? <Status /> : versions.isError ? <Status error retry={() => void versions.refetch()} /> :
      <>{versions.data.items.length === 0 && <p>{text.noVersions}</p>}
        {versions.data.items.map(version => <section className="source-version" key={version.id}>
          <h4>{text.version} <bdi>{version.version}</bdi></h4>
          {version.observation_years.length > 0 && <p>{text.years} {version.observation_years.map(y => year.format(y)).join(text.to)}</p>}
          {version.method === 'descending_los_projection' && <p>{text.projection}</p>}
          <p>{text.downloaded} <time dateTime={version.downloaded_at}>{new Date(version.downloaded_at).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-GB')}</time></p>
          <p>{version.validation_status === 'checksum_verified' ? text.verified : version.validation_status === 'local_sha256_and_pixels_verified' ? (language === 'fa' ? 'SHA-256 محلی ثبت شده و تمام پیکسل‌های COG با اصل فایل برابرند؛ checksum رمزنگاری‌شده‌ای از ارائه‌دهنده موجود نیست.' : 'Local SHA-256 recorded and every COG base pixel matches the original; no provider cryptographic checksum is available.') : text.unchecked}</p>
          <details><summary>{text.files}</summary>
            <p>{text.manifest}</p><code dir="ltr">{version.checksum_sha256}</code>
            <ul>{version.files.map(file => <li key={file.role}><bdi>{file.name}</bdi>
              <span>{number.format(file.size_bytes / 1_000_000)} {text.mb}</span>
              <code dir="ltr">{file.checksum_sha256}</code></li>)}</ul>
          </details>
        </section>)}
        <div className="source-pagination">{cursor && <Button onClick={() => setCursor(undefined)}>{text.firstVersions}</Button>}
          {versions.data.next_cursor && <Button onClick={() => setCursor(versions.data.next_cursor ?? undefined)}>{text.nextVersions}</Button>}</div></>}
  </article>
}

export default function SourcesPage() {
  const [cursor, setCursor] = useState<string>()
  const sources = useListSources({ limit: 10, cursor })
  const { language } = useLanguage(), text = copy[language]
  return <main className="sources-page">
    <header><h1>{text.title}</h1><p>{text.intro}</p></header>
    {sources.isPending ? <Status /> : sources.isError ? <Status error retry={() => void sources.refetch()} /> :
      <>{sources.data.items.length === 0 ? <p role="status">{text.noSources}</p> : sources.data.items.map(source => <SourceCard key={source.id} source={source} language={language} />)}
        <div className="source-pagination">{cursor && <Button onClick={() => setCursor(undefined)}>{text.firstSources}</Button>}
          {sources.data.next_cursor && <Button onClick={() => setCursor(sources.data.next_cursor ?? undefined)}>{text.nextSources}</Button>}</div></>}
  </main>
}
