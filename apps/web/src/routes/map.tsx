import { useState } from 'react'
import { Dialog } from 'radix-ui'
import { Layers, X } from 'lucide-react'
import { mapRoute } from '../app/router'
import { useListProducts, useGetLegend, useGetInfrastructureAsset } from '../generated/api/forudid'
import { defaultSearch, roundCoordinate, type MapSearch } from '../lib/search'
import { MapCanvas } from '../features/map/MapCanvas'
import { LayerPanel } from '../features/layers/LayerPanel'
import { Legend } from '../features/layers/Legend'
import { PointPanel } from '../features/points/PointPanel'
import { MetadataDialog } from '../features/products/MetadataDialog'
import { useLanguage } from '../i18n'
import { Status } from '../components/Status'
import { Button } from '../components/ui/button'
import { publishedRealProducts } from '../lib/products'
import { AssetPanel } from '../features/assets/AssetPanel'

export default function MapPage() {
  const { language, messages: m } = useLanguage()
  const state = mapRoute.useSearch(), navigate = mapRoute.useNavigate()
  const [metadataOpen, setMetadataOpen] = useState(false)
  const [layersOpen, setLayersOpen] = useState(false)
  const products = useListProducts({ aoi: state.aoi, orbit: state.orbit, run: state.run })
  const choices = publishedRealProducts(products.data || [])
  const product = state.product ? choices.find(p => p.id === state.product && p.kind === state.layer) :
    choices.find(p => p.kind === state.layer)
  const legend = useGetLegend(product?.id || '', { query: { enabled: !!product } })
  const asset = useGetInfrastructureAsset(state.asset || '', { query: { enabled: state.panel === 'asset' && !!state.asset } })
  const update = (values: Partial<MapSearch>) => {
    void navigate({ search: prev => ({ ...prev, ...values }), replace: true })
  }
  function selectPoint(lon: number, lat: number) {
    if (!product) return
    update({ pointLon: roundCoordinate(lon), pointLat: roundCoordinate(lat), panel: 'point', asset: undefined,
      product: product.id, run: product.processing_run_id })
  }
  const panelProps = { state, product, products: choices, update, onMetadata: () => {
    setLayersOpen(false); setMetadataOpen(true)
  } }
  const showPoint = product && state.panel === 'point' && state.pointLon !== undefined && state.pointLat !== undefined
  const showAsset = state.panel === 'asset' && !!state.asset
  return <main className={`workspace ${showPoint || showAsset ? 'has-point' : ''}`}>
    <aside className="desktop-sidebar"><LayerPanel {...panelProps} /></aside>
    <div className="map-workspace"><div className="map-region">
      <MapCanvas state={state} product={product} style={legend.data?.style} update={update} selectPoint={selectPoint}
        selectedGeometry={showAsset ? asset.data?.geometry : undefined} />
      {products.isPending ? <div className="map-message"><Status /></div> : products.isError ?
        <div className="map-message"><Status error retry={() => void products.refetch()} /></div> : !product ?
        <div className="map-message"><p>{m.empty}</p><Button onClick={() => update(defaultSearch)}>{m.reset}</Button></div> :
        <>{legend.isError && <div className="map-message"><Status error retry={() => void legend.refetch()} /></div>}
          {legend.data && <Legend data={legend.data} />}
          {!showPoint && !showAsset && <p className="map-hint">{language === 'fa' ? 'برای جزئیات روی راه یا راه‌آهن بزنید؛ برای مقدار تغییرشکل، نقطه‌ای از نقشه را انتخاب کنید.' : 'Select a road or railway for details, or choose a map point for a deformation value.'}</p>}</>}
      <Dialog.Root open={layersOpen} onOpenChange={setLayersOpen}>
        <Dialog.Trigger asChild><Button className="mobile-layer-button"><Layers size={18} />{m.layers}</Button></Dialog.Trigger>
        <Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="mobile-layers" dir={language === 'fa' ? 'rtl' : 'ltr'}>
          <Dialog.Title className="sr-only">{m.layers}</Dialog.Title><Dialog.Description className="sr-only">{m.product}</Dialog.Description>
          <Dialog.Close asChild><Button className="sheet-close" aria-label={m.close} variant="ghost"><X size={19} /></Button></Dialog.Close>
          <LayerPanel {...panelProps} /></Dialog.Content></Dialog.Portal>
      </Dialog.Root>
    </div>
      {showPoint && <PointPanel state={state} product={product} close={() => update({ panel: 'none' })} />}
      {showAsset && <AssetPanel data={asset.data} pending={asset.isPending} error={asset.isError}
        retry={() => void asset.refetch()} close={() => update({ panel: 'none', asset: undefined })} />}
    </div>{product && <MetadataDialog product={product} open={metadataOpen} onOpenChange={setMetadataOpen} />}
  </main>
}
