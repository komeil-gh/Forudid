import { fa } from '../messages/fa'
import { Button } from './ui/button'
export function Status({ error = false, retry }: { error?: boolean; retry?: () => void }) {
  return <div className="status" role={error ? 'alert' : 'status'}>
    <p>{error ? fa.error : fa.loading}</p>
    {error && retry && <Button onClick={retry}>{fa.retry}</Button>}
  </div>
}
