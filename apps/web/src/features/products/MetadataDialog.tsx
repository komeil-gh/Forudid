import * as Dialog from 'radix-ui/dialog'
import { X } from 'lucide-react'
import { useGetMetadata, useGetProvenance, type ProductInfo } from '../../generated/api/forudid'
import { useLanguage } from '../../i18n'
import { Status } from '../../components/Status'
import { Button } from '../../components/ui/button'
export function MetadataDialog({ product, open, onOpenChange }:
  { product: ProductInfo; open: boolean; onOpenChange: (value: boolean) => void }) {
  const { language, messages: m } = useLanguage()
  const metadata = useGetMetadata(product.id, { query: { enabled: open } })
  const provenance = useGetProvenance(product.id, { query: { enabled: open } })
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="dialog-overlay" />
    <Dialog.Content className="dialog-content" dir={language === 'fa' ? 'rtl' : 'ltr'}><div className="dialog-heading"><Dialog.Title>{m.metadata}</Dialog.Title>
      <Dialog.Close asChild><Button aria-label={m.close} variant="ghost"><X size={18} /></Button></Dialog.Close></div>
      <Dialog.Description>{product.sign_convention}</Dialog.Description>
      {product.is_fixture && <p className="notice">{m.fixture}</p>}
      <h3>STAC</h3>{metadata.isPending ? <Status /> : metadata.isError ? <Status error retry={() => void metadata.refetch()} /> :
        <pre dir="ltr">{JSON.stringify(metadata.data, null, 2)}</pre>}
      <h3>{m.provenance}</h3>{provenance.isPending ? <Status /> : provenance.isError ? <Status error retry={() => void provenance.refetch()} /> :
        <pre dir="ltr">{JSON.stringify(provenance.data, null, 2)}</pre>}
    </Dialog.Content></Dialog.Portal></Dialog.Root>
}
