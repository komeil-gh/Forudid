import { X, Route } from 'lucide-react'
import type { InfrastructureFeature, ProfileSample } from '../../generated/api/forudid'
import { Button } from '../../components/ui/button'
import { Status } from '../../components/Status'
import { useLanguage } from '../../i18n'
import { ExposureDetails } from './ExposureDetails'

export function AssetPanel({ data, pending, error, retry, close, productId, runId, onInspect }: {
  data?: InfrastructureFeature; pending: boolean; error: boolean;
  retry: () => void; close: () => void;
  productId?: string; runId?: string; onInspect: (sample?: ProfileSample) => void;
}) {
  const { language, messages: m } = useLanguage(), en = language === 'en'
  const item = data?.properties
  return <section className="point-panel" aria-label={en ? 'Selected infrastructure' : 'زیرساخت انتخاب‌شده'}>
    <Button variant="ghost" className="close-point" aria-label={m.close} onClick={close}><X size={18} /></Button>
    <div className="point-details"><h2><Route size={17} />{en ? 'Selected infrastructure' : 'زیرساخت انتخاب‌شده'}</h2>
      {pending ? <Status /> : error ? <Status error retry={retry} /> : item && <>
        <h3>{item.name || (en ? 'No name recorded in the source' : 'نام در منبع ثبت نشده')}</h3>
        <dl className="metadata-list">
          <div><dt>{en ? 'Type' : 'نوع'}</dt><dd>{item.asset_type === 'railway' ? (en ? 'Railway' : 'راه‌آهن') : (en ? 'Road' : 'جاده')}</dd></div>
          <div><dt>{en ? 'Source ID' : 'شناسهٔ منبع'}</dt><dd><bdi>{item.external_id}</bdi></dd></div>
          <div><dt>{en ? 'Source class' : 'ردهٔ منبع'}</dt><dd><bdi>{item.asset_class}</bdi></dd></div>
          <div><dt>{en ? 'Segment length' : 'طول قطعه'}</dt><dd>{item.length_m.toLocaleString(en ? 'en-US' : 'fa-IR', { maximumFractionDigits: 1 })} {en ? 'm' : 'متر'}</dd></div>
          <div><dt>{en ? 'Snapshot date' : 'تاریخ snapshot، میلادی'}</dt><dd><bdi>{data?.data_date ?? (en ? 'Not provided' : 'ارائه نشده')}</bdi></dd></div>
        </dl>
      </>}
    </div>
    {data && <div className="point-chart">
      {productId && <ExposureDetails key={`${data.id}/${productId}/${runId}`} assetId={data.id} productId={productId} runId={runId} onInspect={onInspect} />}
      <p>{en ? 'This geometry is one OSM segment and does not necessarily represent a complete route. Network completeness and positional accuracy have not been verified.' : 'این هندسه یک قطعهٔ ثبت‌شده در OSM است و لزوماً یک مسیر کامل نیست. کامل‌بودن شبکه و دقت مکانی آن تأیید نشده است.'}</p>
      <p>{en ? 'The infrastructure snapshot is from 2026, while the deformation data cover 2014 to 2020; their temporal alignment has not been established.' : 'snapshot زیرساخت مربوط به ۲۰۲۶ و دادهٔ تغییرشکل مربوط به ۲۰۱۴–۲۰۲۰ است؛ هم‌زمانی آن‌ها تأیید نشده است.'}</p>
      <p><a href={data.license_url} target="_blank" rel="noreferrer">{data.attribution} · ODbL 1.0</a></p>
    </div>}
  </section>
}
