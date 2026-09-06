import { useQueryClient } from '@tanstack/react-query'
import { getGetScreeningReportQueryKey, useCreateScreeningReport, useGetScreeningReport } from '../../generated/api/forudid'
import { useLanguage } from '../../i18n'
import { apiBase } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Status } from '../../components/Status'

export function ReportAction({ assetId, runId }: { assetId: string; runId: string }) {
  const { language } = useLanguage(), en = language === 'en'
  const client = useQueryClient()
  const create = useCreateScreeningReport({ mutation: { onSuccess: job => client.setQueryData(getGetScreeningReportQueryKey(job.id), job) } })
  const report = useGetScreeningReport(create.data?.id ?? '', { query: {
    enabled: !!create.data?.id, retry: false,
    refetchInterval: query => ['queued', 'processing'].includes(query.state.data?.status ?? '') ? 2000 : false,
  } })
  const job = report.data ?? create.data
  const busy = create.isPending || job?.status === 'queued' || job?.status === 'processing'
  return <section aria-label={en ? 'Persian screening report' : 'گزارش غربالگری فارسی'}>
    {job?.status === 'completed' ? <p><a href={`${apiBase}/api/v1/reports/${job.id}/download`}>{en ? 'Download Persian screening PDF' : 'دانلود گزارش غربالگری فارسی (PDF)'}</a></p> : <Button
      disabled={busy} onClick={() => create.mutate({ data: { asset_id: assetId, analysis_run_id: runId, language: 'fa' } })}>
      {job?.status === 'failed' ? (en ? 'Retry report' : 'تلاش دوبارهٔ گزارش') : (en ? 'Create Persian screening PDF' : 'ساخت گزارش غربالگری فارسی')}
    </Button>}
    <p role="status" aria-live="polite">{job?.status === 'queued' ? (en ? 'Report queued.' : 'گزارش در صف ساخت است.') : job?.status === 'processing' ? (en ? 'Preparing report…' : 'گزارش در حال آماده‌سازی است…') : job?.status === 'failed' ? (en ? 'Report generation failed; the analysis remains available.' : 'ساخت گزارش ناموفق بود؛ تحلیل همچنان در دسترس است.') : ''}</p>
    {create.isError && <Status error retry={() => create.mutate({ data: { asset_id: assetId, analysis_run_id: runId, language: 'fa' } })} />}
    {report.isError && <Status error retry={() => void report.refetch()} />}
    {job?.checksum_sha256 && <details><summary>{en ? 'PDF checksum' : 'checksum فایل PDF'}</summary><p style={{ overflowWrap: 'anywhere' }}><bdi>{job.checksum_sha256}</bdi></p></details>}
  </section>
}
