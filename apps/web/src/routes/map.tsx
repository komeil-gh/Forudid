import { useCallback, useState } from 'react'
import { Dialog } from 'radix-ui'
import { Layers, X } from 'lucide-react'
import { mapRoute } from '../app/router'
import { useListProducts, useGetLegend, useGetInfrastructureAsset, useGetAssetExposure, useGetExposureSegments, useGetRegion, type ProfileSample } from '../generated/api/forudid'
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
import { ModePanel } from '../features/map/ModePanel'
import '../features/map/modes.css'

export default function MapPage() {
  const { language, messages: m } = useLanguage()
  const state = mapRoute.useSearch(), navigate = mapRoute.useNavigate()
  const [metadataOpen, setMetadataOpen] = useState(false)
  const [layersOpen, setLayersOpen] = useState(false)
  const [profilePoint, setProfilePoint] = useState<{ asset: string; sample: ProfileSample }>()
  const inspectProfile = useCallback((sample?: ProfileSample) => setProfilePoint(
    sample && state.asset ? { asset: state.asset, sample } : undefined), [state.asset])
  const products = useListProducts({ aoi: state.aoi, orbit: state.orbit, run: state.run })
  const choices = publishedRealProducts(products.data || [])
  const product = state.product ? choices.find(p => p.id === state.product && p.kind === state.layer) :
    choices.find(p => p.kind === state.layer)
  const legend = useGetLegend(product?.id || '', { query: { enabled: !!product } })
  const asset = useGetInfrastructureAsset(state.asset || '', { query: { enabled: state.panel === 'asset' && !!state.asset } })
  const region = useGetRegion(state.region || '', { query: { enabled: state.mode !== 'deformation' && !!state.region } })
  const exposure = useGetAssetExposure(state.asset || '', { product_id: product?.id, run_id: state.analysis }, { query: { enabled: state.panel === 'asset' && !!state.asset && !!product, retry: false } })
  const selectedInterval = useGetExposureSegments(exposure.data?.analysis_run_id || '', state.asset || '', { offset: state.segment ?? 0, limit: 1 }, { query: { enabled: state.panel === 'asset' && !!exposure.data && state.segment !== undefined } })
  const interval = selectedInterval.data?.features.find(f => f.properties.ordinal === state.segment)
  const update = (values: Partial<MapSearch>) => {
    void navigate({ search: prev => ({ ...prev, ...values }), replace: true })
  }
  function selectPoint(lon: number, lat: number) {
    if (!product) return
    update({ pointLon: roundCoordinate(lon), pointLat: roundCoordinate(lat), panel: 'point', asset: undefined, analysis: undefined, segment: undefined,
      product: product.id, run: product.processing_run_id })
  }
  const panelProps = { state, product, products: choices, update, onMetadata: () => {
    setLayersOpen(false); setMetadataOpen(true)
  } }
  const showPoint = product && state.panel === 'point' && state.pointLon !== undefined && state.pointLat !== undefined
  const showAsset = state.panel === 'asset' && !!state.asset
  const controls = state.mode === 'deformation' ? <LayerPanel {...panelProps} /> : <>
    <ModePanel state={state} product={product} update={update} selectAsset={(id, runId) => {
      update({ asset: id, analysis: runId, segment: undefined, panel: 'asset', pointLon: undefined, pointLat: undefined }); setLayersOpen(false)
    }} />
    <details className="mode-display"><summary>{language === 'fa' ? 'داده و تنظیمات نمایش' : 'Data and display settings'}</summary><LayerPanel {...panelProps} /></details>
  </>
  return <main className="map-page"><div className="map-modes" role="group" aria-label={language === 'fa' ? 'حالت نقشه' : 'Map mode'}>
    {(['deformation', 'infrastructure', 'population'] as const).map(mode => <button key={mode} aria-pressed={state.mode === mode} onClick={() => {
      const velocity = product && ['velocity_los', 'velocity_vertical'].includes(product.kind) ? product : choices.find(p => p.kind === 'velocity_vertical' || p.kind === 'velocity_los')
      update({ mode, panel: 'none', asset: undefined, analysis: undefined, segment: undefined, pointLon: undefined, pointLat: undefined,
        ...(mode === 'deformation' ? {} : { infrastructure: mode === 'infrastructure' ? 'railway' : 'none',
          ...(velocity ? { product: velocity.id, layer: velocity.kind as MapSearch['layer'], run: velocity.processing_run_id } : {}) }) })
    }}>{mode === 'deformation' ? (language === 'fa' ? 'تغییرشکل زمین' : 'Deformation') : mode === 'infrastructure' ? (language === 'fa' ? 'زیرساخت' : 'Infrastructure') : (language === 'fa' ? 'جمعیت و مناطق' : 'Population & regions')}</button>)}
  </div><div className={`workspace ${showPoint || showAsset ? 'has-point' : ''}`}>
    <aside className="desktop-sidebar">{controls}</aside>
    <div className="map-workspace"><div className="map-region">
      <MapCanvas state={state} product={product} style={legend.data?.style} update={update} selectPoint={selectPoint}
        region={state.mode !== 'deformation' && state.region ? region.data : undefined}
        profilePoint={profilePoint && profilePoint.asset === state.asset && showAsset ? profilePoint.sample : undefined}
        selectedGeometry={showAsset ? interval?.geometry ?? asset.data?.geometry : undefined} />
      {products.isPending ? <div className="map-message"><Status /></div> : products.isError ?
        <div className="map-message"><Status error retry={() => void products.refetch()} /></div> : !product ?
        <div className="map-message"><p>{m.empty}</p><Button onClick={() => update(defaultSearch)}>{m.reset}</Button></div> :
        <>{legend.isError && <div className="map-message"><Status error retry={() => void legend.refetch()} /></div>}
          <div className="map-guidance">
            {legend.data && <Legend data={legend.data} />}
            {!showPoint && !showAsset && <p className="map-hint">{state.mode === 'population' ? (language === 'fa' ? 'محدوده را از پنل انتخاب کنید؛ مرز تاریخی روی نقشه و آمار جمعیت در پنل نمایش داده می‌شود.' : 'Choose a region in the panel to display its historical boundary and population statistics.') : (language === 'fa' ? 'برای جزئیات روی راه یا راه‌آهن بزنید؛ برای مقدار تغییرشکل، نقطه‌ای از نقشه را انتخاب کنید.' : 'Select a road or railway for details, or choose a map point for a deformation value.')}</p>}
          </div></>}
      {state.mode !== 'deformation' && state.region && region.isError && <div className="map-message"><Status error retry={() => void region.refetch()} /></div>}
      <Dialog.Root open={layersOpen} onOpenChange={setLayersOpen}>
        <Dialog.Trigger asChild><Button className="mobile-layer-button"><Layers size={18} />{m.layers}</Button></Dialog.Trigger>
        <Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="mobile-layers" dir={language === 'fa' ? 'rtl' : 'ltr'}>
          <Dialog.Title className="sr-only">{m.layers}</Dialog.Title><Dialog.Description className="sr-only">{m.product}</Dialog.Description>
          <Dialog.Close asChild><Button className="sheet-close" aria-label={m.close} variant="ghost"><X size={19} /></Button></Dialog.Close>
          {controls}</Dialog.Content></Dialog.Portal>
      </Dialog.Root>
    </div>
      {showPoint && <PointPanel state={state} product={product} close={() => update({ panel: 'none' })} />}
      {showAsset && <AssetPanel data={asset.data} pending={asset.isPending} error={asset.isError}
        productId={product?.id} runId={state.analysis ?? exposure.data?.analysis_run_id} onInspect={inspectProfile}
        selectedSegment={state.segment} onSelectSegment={ordinal => update({ segment: ordinal, analysis: exposure.data?.analysis_run_id })}
        retry={() => void asset.refetch()} close={() => update({ panel: 'none', asset: undefined, analysis: undefined, segment: undefined })} />}
    </div>{product && <MetadataDialog product={product} open={metadataOpen} onOpenChange={setMetadataOpen} />}</div>
  </main>
}
