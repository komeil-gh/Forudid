import { useLanguage } from '../i18n'
import { Button } from './ui/button'
export function Status({ error = false, retry }: { error?: boolean; retry?: () => void }) {
  const { messages: m } = useLanguage()
  return <div className="status" role={error ? 'alert' : 'status'}>
    <p>{error ? m.error : m.loading}</p>
    {error && retry && <Button onClick={retry}>{m.retry}</Button>}
  </div>
}
