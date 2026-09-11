import { useCallback, useEffect, useRef, useState } from 'react'
import Map, { Layer, Marker, NavigationControl, ScaleControl, Source, type MapRef } from 'react-map-gl/maplibre'
import * as maplibre from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { Crosshair, Scan } from 'lucide-react'
import { defaultSearch, type MapSearch } from '../../lib/search'
import type { ProductInfo, LineGeometry, RegionFeature, MultiPolygonGeometry, PopulationSource } from '../../generated/api/forudid'
import { apiBase } from '../../lib/api'
import { useLanguage } from '../../i18n'
import { Button } from '../../components/ui/button'
import { MapContext, PlaceSearch } from './MapContext'
import './modes.css'

maplibre.setWorkerUrl(workerUrl)
maplibre.setMaxParallelImageRequests(2)

const localStyle: maplibre.StyleSpecification = {
  version: 8, sources: {}, layers: [{ id: 'background', type: 'background',
    paint: { 'background-color': '#dbe9ed' } }],
}
export function MapCanvas({ state, product, population, style, update, selectPoint, selectedGeometry, profilePoint, region, eventGeometry, sampledCell, inspectEnabled = true }:
  { state: MapSearch; product?: ProductInfo; style?: string;
    population?: PopulationSource;
    selectedGeometry?: LineGeometry;
    sampledCell?: number[][];
    region?: RegionFeature;
    eventGeometry?: MultiPolygonGeometry; inspectEnabled?: boolean;
    profilePoint?: { lon: number; lat: number };
    update: (values: Partial<MapSearch>) => void; selectPoint: (lon: number, lat: number) => void }) {
  const { language, messages: m } = useLanguage()
  const ref = useRef<MapRef>(null)
  const [error, setError] = useState('')
  const [basemapFailed, setBasemapFailed] = useState(false)
  const [vectorError, setVectorError] = useState(false)
  const [tileAttempt, setTileAttempt] = useState(0)
  const [supported] = useState(() => {
    const gl = document.createElement('canvas').getContext('webgl2')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return !!gl
  })
  const sourceUrl = import.meta.env.VITE_BASEMAP_STYLE_URL
  const asset = product?.assets.find(a => a.role === 'data')
  const attribution = product?.attribution.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const infrastructureKinds = (['railway', 'road'] as const).filter(kind => state.infrastructure === 'all' || state.infrastructure === kind)
  const fitSelection = useCallback(() => {
    const coordinates = selectedGeometry?.coordinates ?? eventGeometry?.coordinates.flat(2) ?? region?.geometry.coordinates.flat(2)
    if (!ref.current || !coordinates?.length) return
    const bounds = new maplibre.LngLatBounds()
    coordinates.forEach(coordinate => bounds.extend(coordinate))
    ref.current.fitBounds(bounds, { padding: 45, maxZoom: 16, duration: 0 })
  }, [selectedGeometry, region, eventGeometry])
  useEffect(fitSelection, [fitSelection])
  useEffect(() => {
    if (profilePoint && ref.current && !ref.current.getBounds().contains([profilePoint.lon, profilePoint.lat]))
      ref.current.panTo([profilePoint.lon, profilePoint.lat], { duration: 0 })
  }, [profilePoint])
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
  const resetBounds = state.mode === 'population' ? population?.bounds : bbox
  const area = { type: 'FeatureCollection' as const, features: bbox && state.mode !== 'population' ? [{ type: 'Feature' as const,
    properties: {}, geometry: { type: 'Polygon' as const, coordinates: [[[bbox[0], bbox[1]], [bbox[2], bbox[1]],
      [bbox[2], bbox[3]], [bbox[0], bbox[3]], [bbox[0], bbox[1]]]] } }] : [] }
  return <div className="map-canvas">
    <Map ref={ref} mapLib={maplibre} initialViewState={{ longitude: state.lon, latitude: state.lat,
      zoom: state.z, bearing: state.bearing, pitch: state.pitch }}
      mapStyle={sourceUrl && !basemapFailed ? sourceUrl : localStyle}
      attributionControl={{ compact: true, customAttribution: import.meta.env.VITE_BASEMAP_ATTRIBUTION || '© OpenStreetMap contributors · ODbL' }}
      onMoveEnd={e => update({ lon: e.viewState.longitude, lat: e.viewState.latitude,
        z: e.viewState.zoom, bearing: e.viewState.bearing, pitch: e.viewState.pitch })}
      onLoad={({ target }) => {
        fitSelection()
        const attribution = target.getContainer().querySelector<HTMLDetailsElement>('.maplibregl-ctrl-attrib')
        const region = target.getContainer().closest<HTMLElement>('.map-region')
        if (attribution && region) {
          attribution.open = false
          attribution.classList.remove('maplibregl-compact-show')
          attribution.dir = 'ltr'
          const observer = new ResizeObserver(() => region.style.setProperty('--attribution-height', `${Math.min(44, attribution.getBoundingClientRect().height)}px`))
          observer.observe(attribution)
          target.once('remove', () => observer.disconnect())
        }
      }}
      interactiveLayerIds={infrastructureKinds.map(kind => `infra-${kind}`)}
      onClick={e => {
        const id = e.features?.[0]?.properties?.asset_id
        if (typeof id === 'string') update({ asset: id, analysis: undefined, segment: undefined, panel: 'asset', pointLon: undefined, pointLat: undefined })
        else if (inspectEnabled) selectPoint(e.lngLat.lng, e.lngLat.lat)
      }}
      onError={e => { if (('sourceId' in e && String(e.sourceId).startsWith('infra-')) || e.error.message.includes('/vector/')) {
        setVectorError(true); return
      }
      console.error(e.error); const rasterError = ('sourceId' in e && ['scientific-raster', 'population-raster'].includes(String(e.sourceId))) || e.error.message.includes('/tiles/')
      if (sourceUrl && !basemapFailed && !rasterError) {
        setBasemapFailed(true); setError(m.basemapError)
      } else setError(m.tileError) }}>
      <NavigationControl position="top-right" showCompass />
      <ScaleControl position="bottom-right" unit="metric" />
      <Layer id="raster-top" type="background" paint={{ 'background-opacity': 0 }} />
      {(!sourceUrl || basemapFailed) && <MapContext state={state} />}
      {infrastructureKinds.map(kind => {
        const source = kind === 'railway' ? 'railways' : 'major_roads'
        return <Source key={`${kind}-${tileAttempt}`} id={`infra-${kind}-source`} type="vector"
          url={new URL(`/vector/${source}`, window.location.origin).href}>
          <Layer id={`infra-${kind}`} type="line" source-layer={source} minzoom={6}
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
      {eventGeometry && <Source id="event-geometry" type="geojson" data={{ type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: eventGeometry.coordinates } }}>
        <Layer id="event-fill" type="fill" paint={{ 'fill-color': '#176e79', 'fill-opacity': 0.2 }} />
        <Layer id="event-outline" type="line" paint={{ 'line-color': '#176e79', 'line-width': 2 }} />
      </Source>}
      {state.mode !== 'population' && asset && bbox && style && <Source key={`${asset.id}-${tileAttempt}`} id="scientific-raster" type="raster"
        attribution={attribution}
        tiles={[`${apiBase}/tiles/${asset.id}/{z}/{x}/{y}.png?style=${style}`]}
        tileSize={256} minzoom={0} maxzoom={14} bounds={bbox as [number, number, number, number]}>
        <Layer id="scientific-layer" type="raster" beforeId="raster-top" paint={{ 'raster-opacity': state.opacity,
          'raster-resampling': 'nearest', 'raster-fade-duration': 0 }} />
      </Source>}
      {state.mode === 'population' && population && <Source key={`${population.source_version_id}-${tileAttempt}`} id="population-raster" type="raster"
        attribution={`WorldPop ${population.population_year} · CC BY 4.0`}
        tiles={[`${apiBase}${population.tile_template}`]} tileSize={256} minzoom={0} maxzoom={10}
        bounds={population.bounds as [number, number, number, number]}>
        <Layer id="population-layer" type="raster" beforeId="raster-top" paint={{ 'raster-opacity': state.opacity, 'raster-resampling': 'nearest', 'raster-fade-duration': 0 }} />
      </Source>}
      <Source id="aoi" type="geojson" data={area}><Layer id="aoi-outline" type="line"
        paint={{ 'line-color': '#176e79', 'line-width': 1.5 }} /></Source>
      {region && <Source id="historical-region" type="geojson" data={{ type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: region.geometry.coordinates } }}
        attribution={region.attribution.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}>
        <Layer id="historical-region-fill" type="fill" paint={{ 'fill-color': '#176e79', 'fill-opacity': 0.04 }} />
        <Layer id="historical-region-line" type="line" paint={{ 'line-color': '#244953', 'line-width': 2, 'line-dasharray': [3, 2] }} />
      </Source>}
      {sampledCell && <Source id="sampled-cell" type="geojson" data={{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [sampledCell] } }}>
        <Layer id="sampled-cell-fill" type="fill" paint={{ 'fill-color': '#fff', 'fill-opacity': 0.08 }} />
        <Layer id="sampled-cell-halo" type="line" paint={{ 'line-color': '#fff', 'line-width': 5 }} />
        <Layer id="sampled-cell-outline" type="line" paint={{ 'line-color': '#154c59', 'line-width': 2 }} />
      </Source>}
      {state.panel === 'point' && state.pointLon !== undefined && state.pointLat !== undefined && <Marker
        longitude={state.pointLon} latitude={state.pointLat}><span className={`point-marker ${sampledCell ? 'native-cell-marker' : ''}`}><Crosshair size={sampledCell ? 10 : 26} /></span></Marker>}
      {state.mode !== 'population' && product?.reference && <Marker longitude={product.reference.coordinate.lon} latitude={product.reference.coordinate.lat}>
        <span className="reference-marker" title={m.reference}>REF</span></Marker>}
      {profilePoint && <Marker longitude={profilePoint.lon} latitude={profilePoint.lat}>
        <span className="point-marker" data-testid="profile-map-marker"><Crosshair size={26} /></span></Marker>}
    </Map>
    <PlaceSearch update={update} />
    {(error || (vectorError && state.infrastructure !== 'none')) && <div className="map-warning" role="alert">
      {error && <p>{error}</p>}
      {vectorError && state.infrastructure !== 'none' && <p>{language === 'fa' ? 'لایهٔ زیرساخت در دسترس نیست؛ دادهٔ تغییرشکل مستقل نمایش داده می‌شود.' : 'The infrastructure layer is unavailable; deformation data remain independently visible.'}</p>}
      <Button onClick={() => { setError(''); setVectorError(false); setTileAttempt(value => value + 1) }}>{m.retry}</Button>
    </div>}
    <div className="map-tools"><Button aria-label={language === 'fa' ? 'نمای کامل منبع' : 'Fit source footprint'} onClick={() => {
      if (resetBounds && ref.current) ref.current.fitBounds(resetBounds as [number, number, number, number], { padding: 45, maxZoom: 12, duration: 0, pitch: 0, bearing: 0 })
      else update({ lon: defaultSearch.lon, lat: defaultSearch.lat, z: defaultSearch.z, pitch: 0, bearing: 0 })
    }}><Crosshair size={19} /></Button>
      {sampledCell && <Button aria-label={language === 'fa' ? 'نمای سلول بومی' : 'Fit native cell'} title={language === 'fa' ? 'نمای سلول بومی' : 'Fit native cell'} onClick={() => {
        const bounds = new maplibre.LngLatBounds()
        sampledCell.forEach(coordinate => bounds.extend(coordinate as [number, number]))
        const container = ref.current?.getContainer(), frame = container?.getBoundingClientRect()
        const search = container?.parentElement?.querySelector('.map-place-search')?.getBoundingClientRect()
        const legend = container?.closest('.map-region')?.querySelector('.map-guidance')?.getBoundingClientRect()
        const padding = frame ? { top: search ? search.bottom - frame.top + 16 : 120,
          bottom: legend ? frame.bottom - legend.top + 16 : 80, left: 70, right: 70 } : 120
        ref.current?.fitBounds(bounds, { padding, maxZoom: 18, duration: 0, pitch: 0, bearing: 0 })
      }}><Scan size={19} /></Button>}
      {inspectEnabled && <Button onClick={() => selectPoint(state.lon, state.lat)}>{m.inspectCenter}</Button>}</div>
  </div>
}
