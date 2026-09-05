import { useEffect, useRef, useState } from 'react'
import Map, { Layer, Marker, NavigationControl, Source, type MapRef } from 'react-map-gl/maplibre'
import * as maplibre from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { Crosshair } from 'lucide-react'
import { defaultSearch, type MapSearch } from '../../lib/search'
import type { ProductInfo, LineGeometry } from '../../generated/api/forudid'
import { apiBase } from '../../lib/api'
import { useLanguage } from '../../i18n'
import { Button } from '../../components/ui/button'

maplibre.setWorkerUrl(workerUrl)

const grid = { type: 'FeatureCollection' as const, features: [
  ...Array.from({ length: 21 }, (_, i) => ({ type: 'Feature' as const, properties: {}, geometry: {
    type: 'LineString' as const, coordinates: [[43 + i, 24], [43 + i, 40]],
  } })), ...Array.from({ length: 17 }, (_, i) => ({ type: 'Feature' as const, properties: {}, geometry: {
    type: 'LineString' as const, coordinates: [[43, 24 + i], [63, 24 + i]],
  } })),
] }
const localStyle: maplibre.StyleSpecification = {
  version: 8, sources: {}, layers: [{ id: 'background', type: 'background',
    paint: { 'background-color': '#eaf0f3' } }],
}
export function MapCanvas({ state, product, style, update, selectPoint, selectedGeometry, profilePoint }:
  { state: MapSearch; product?: ProductInfo; style?: string;
    selectedGeometry?: LineGeometry;
    profilePoint?: { lon: number; lat: number };
    update: (values: Partial<MapSearch>) => void; selectPoint: (lon: number, lat: number) => void }) {
  const { language, messages: m } = useLanguage()
  const ref = useRef<MapRef>(null)
  const [error, setError] = useState('')
  const [basemapFailed, setBasemapFailed] = useState(false)
  const [vectorError, setVectorError] = useState(false)
  const [supported] = useState(() => {
    const gl = document.createElement('canvas').getContext('webgl2')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return !!gl
  })
  const sourceUrl = import.meta.env.VITE_BASEMAP_STYLE_URL
  const asset = product?.assets.find(a => a.role === 'data')
  const attribution = product?.attribution.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const infrastructureKinds = (['railway', 'road'] as const).filter(kind => state.infrastructure === 'all' || state.infrastructure === kind)
  useEffect(() => {
    const map = ref.current
    if (!map) return
    const center = map.getCenter()
    if (Math.abs(center.lng - state.lon) > 0.000001 || Math.abs(center.lat - state.lat) > 0.000001
      || Math.abs(map.getZoom() - state.z) > 0.001 || map.getBearing() !== state.bearing || map.getPitch() !== state.pitch)
      map.jumpTo({ center: [state.lon, state.lat], zoom: state.z, bearing: state.bearing, pitch: state.pitch })
  }, [state.lon, state.lat, state.z, state.bearing, state.pitch])
  if (!supported) return <div role="alert" className="status">{m.webgl}</div>
  const bbox = product?.bbox
  const area = { type: 'FeatureCollection' as const, features: bbox ? [{ type: 'Feature' as const,
    properties: {}, geometry: { type: 'Polygon' as const, coordinates: [[[bbox[0], bbox[1]], [bbox[2], bbox[1]],
      [bbox[2], bbox[3]], [bbox[0], bbox[3]], [bbox[0], bbox[1]]]] } }] : [] }
  return <div className="map-canvas">
    <Map ref={ref} mapLib={maplibre} initialViewState={{ longitude: state.lon, latitude: state.lat,
      zoom: state.z, bearing: state.bearing, pitch: state.pitch }}
      mapStyle={sourceUrl && !basemapFailed ? sourceUrl : localStyle}
      attributionControl={{ compact: true, customAttribution: import.meta.env.VITE_BASEMAP_ATTRIBUTION || m.noBasemap }}
      onMoveEnd={e => update({ lon: e.viewState.longitude, lat: e.viewState.latitude,
        z: e.viewState.zoom, bearing: e.viewState.bearing, pitch: e.viewState.pitch })}
      onLoad={({ target }) => {
        const attribution = target.getContainer().querySelector('.maplibregl-ctrl-attrib')
        const region = target.getContainer().closest<HTMLElement>('.map-region')
        if (attribution && region) {
          const observer = new ResizeObserver(() => region.style.setProperty('--attribution-height', `${attribution.getBoundingClientRect().height}px`))
          observer.observe(attribution)
          target.once('remove', () => observer.disconnect())
        }
      }}
      interactiveLayerIds={infrastructureKinds.map(kind => `infra-${kind}`)}
      onClick={e => {
        const id = e.features?.[0]?.properties?.asset_id
        if (typeof id === 'string') update({ asset: id, panel: 'asset', pointLon: undefined, pointLat: undefined })
        else selectPoint(e.lngLat.lng, e.lngLat.lat)
      }}
      onError={e => { if (('sourceId' in e && String(e.sourceId).startsWith('infra-')) || e.error.message.includes('/vector/')) {
        setVectorError(true); return
      }
      console.error(e.error); if (sourceUrl && !basemapFailed) {
        setBasemapFailed(true); setError(m.basemapError)
      } else setError(m.tileError) }}>
      <NavigationControl position="top-left" showCompass />
      <Layer id="raster-top" type="background" paint={{ 'background-opacity': 0 }} />
      {!sourceUrl && <Source id="coordinate-grid" type="geojson" data={grid}>
        <Layer id="grid-lines" type="line" paint={{ 'line-color': '#b8cbd5', 'line-width': 1,
          'line-dasharray': [3, 4], 'line-opacity': 0.6 }} />
      </Source>}
      {infrastructureKinds.map(kind => {
        const source = kind === 'railway' ? 'railways' : 'major_roads'
        return <Source key={kind} id={`infra-${kind}-source`} type="vector"
          url={new URL(`/vector/${source}`, window.location.origin).href}>
          <Layer id={`infra-${kind}`} type="line" source-layer={source}
            paint={{ 'line-color': kind === 'railway' ? '#244953' : '#75694e',
              'line-width': ['interpolate', ['linear'], ['zoom'], 6, 1, 13, 3],
              'line-opacity': 0.7 }} />
        </Source>
      })}
      {selectedGeometry && <Source id="selected-infrastructure" type="geojson"
        data={{ type: 'Feature', properties: {}, geometry: selectedGeometry }}>
        <Layer id="selected-infrastructure-line" type="line" paint={{ 'line-color': '#087f8c',
          'line-width': 5, 'line-opacity': 0.95 }} />
      </Source>}
      {asset && bbox && style && <Source key={asset.id} id="scientific-raster" type="raster"
        attribution={attribution}
        tiles={[`${apiBase}/tiles/${asset.id}/{z}/{x}/{y}.png?style=${style}`]}
        tileSize={256} minzoom={0} maxzoom={18} bounds={bbox as [number, number, number, number]}>
        <Layer id="scientific-layer" type="raster" beforeId="raster-top" paint={{ 'raster-opacity': state.opacity,
          'raster-resampling': 'nearest', 'raster-fade-duration': 0 }} />
      </Source>}
      <Source id="aoi" type="geojson" data={area}><Layer id="aoi-outline" type="line"
        paint={{ 'line-color': '#176e79', 'line-width': 1.5 }} /></Source>
      {state.pointLon !== undefined && state.pointLat !== undefined && <Marker
        longitude={state.pointLon} latitude={state.pointLat}><span className="point-marker"><Crosshair size={26} /></span></Marker>}
      {product?.reference && <Marker longitude={product.reference.coordinate.lon} latitude={product.reference.coordinate.lat}>
        <span className="reference-marker" title={m.reference}>REF</span></Marker>}
      {profilePoint && <Marker longitude={profilePoint.lon} latitude={profilePoint.lat}>
        <span className="point-marker" data-testid="profile-map-marker"><Crosshair size={26} /></span></Marker>}
    </Map>
    {error && <p className="map-warning" role="alert">{error}</p>}
    {vectorError && state.infrastructure !== 'none' && <p className="map-warning" role="alert">{language === 'fa' ? 'لایهٔ زیرساخت در دسترس نیست؛ دادهٔ تغییرشکل مستقل نمایش داده می‌شود.' : 'The infrastructure layer is unavailable; deformation data remain independently visible.'}</p>}
    <div className="map-tools"><Button aria-label={m.reset} onClick={() => update({ lon: defaultSearch.lon, lat: defaultSearch.lat, z: defaultSearch.z, pitch: 0, bearing: 0 })}><Crosshair size={19} /></Button>
      <Button onClick={() => selectPoint(state.lon, state.lat)}>{m.inspectCenter}</Button></div>
  </div>
}
