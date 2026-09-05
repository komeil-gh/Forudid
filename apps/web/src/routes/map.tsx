import { useState } from 'react'
import { Dialog } from 'radix-ui'
import { Layers, X } from 'lucide-react'
import { mapRoute } from '../app/router'
import { useListProducts, useGetLegend } from '../generated/api/forudid'
import { defaultSearch, roundCoordinate, type MapSearch } from '../lib/search'
import { MapCanvas } from '../features/map/MapCanvas'
import { LayerPanel } from '../features/layers/LayerPanel'
import { Legend } from '../features/layers/Legend'
import { PointPanel } from '../features/points/PointPanel'
import { MetadataDialog } from '../features/products/MetadataDialog'
import { fa } from '../messages/fa'
import { Status } from '../components/Status'
import { Button } from '../components/ui/button'

export default function MapPage() {
  const state = mapRoute.useSearch(), navigate = mapRoute.useNavigate()
  const [metadataOpen, setMetadataOpen] = useState(false)
  const [layersOpen, setLayersOpen] = useState(false)
  const products = useListProducts({ aoi: state.aoi, orbit: state.orbit, run: state.run })
  const choices = products.data || []
  const product = state.product ? choices.find(p => p.id === state.product && p.kind === state.layer) :
    choices.find(p => p.kind === state.layer)
  const legend = useGetLegend(product?.id || '', { query: { enabled: !!product } })
  const update = (values: Partial<MapSearch>) => {
    void navigate({ search: prev => ({ ...prev, ...values }), replace: true })
  }
  function selectPoint(lon: number, lat: number) {
    if (!product) return
    update({ pointLon: roundCoordinate(lon), pointLat: roundCoordinate(lat), panel: 'point',
      product: product.id, run: product.processing_run_id })
  }
  const panelProps = { state, product, products: choices, update, onMetadata: () => {
    setLayersOpen(false); setMetadataOpen(true)
  } }
  const showPoint = product && state.panel === 'point' && state.pointLon !== undefined && state.pointLat !== undefined
  return <main className={`workspace ${showPoint ? 'has-point' : ''}`}>
    <aside className="desktop-sidebar"><LayerPanel {...panelProps} /></aside>
    <div className="map-workspace"><div className="map-region">
      <MapCanvas state={state} product={product} style={legend.data?.style} update={update} selectPoint={selectPoint} />
      {products.isPending ? <div className="map-message"><Status /></div> : products.isError ?
        <div className="map-message"><Status error retry={() => void products.refetch()} /></div> : !product ?
        <div className="map-message"><p>{fa.empty}</p><Button onClick={() => update(defaultSearch)}>{fa.reset}</Button></div> :
        <>{legend.isError && <div className="map-message"><Status error retry={() => void legend.refetch()} /></div>}
          {legend.data && <Legend data={legend.data} />}
          {!showPoint && <p className="map-hint">{fa.selectPoint}</p>}</>}
      <Dialog.Root open={layersOpen} onOpenChange={setLayersOpen}>
        <Dialog.Trigger asChild><Button className="mobile-layer-button"><Layers size={18} />{fa.layers}</Button></Dialog.Trigger>
        <Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="mobile-layers" dir="rtl">
          <Dialog.Title className="sr-only">{fa.layers}</Dialog.Title><Dialog.Description className="sr-only">{fa.product}</Dialog.Description>
          <Dialog.Close asChild><Button className="sheet-close" aria-label={fa.close} variant="ghost"><X size={19} /></Button></Dialog.Close>
          <LayerPanel {...panelProps} /></Dialog.Content></Dialog.Portal>
      </Dialog.Root>
    </div>
      {showPoint && <PointPanel state={state} product={product} close={() => update({ panel: 'none' })} />}
    </div>{product && <MetadataDialog product={product} open={metadataOpen} onOpenChange={setMetadataOpen} />}
  </main>
}
