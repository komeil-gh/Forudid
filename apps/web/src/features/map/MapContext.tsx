import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layer, Marker, Source, useMap } from 'react-map-gl/maplibre'
import { Search } from 'lucide-react'
import { useLanguage } from '../../i18n'
import { parseMapCoordinates, type MapSearch } from '../../lib/search'

interface Place { id: number; name: string; name_fa: string; name_en: string; lon: number; lat: number; kind: string; capital: boolean }
interface Country { code: string; name_fa: string; name_en: string; lon: number; lat: number }
interface PlaceIndex { places: Place[]; countries: Country[] }

function usePlaces() {
  return useQuery({ queryKey: ['map-places-260904'], staleTime: Infinity, queryFn: async ({ signal }): Promise<PlaceIndex> => {
    const response = await fetch('/map/places.json', { signal })
    if (!response.ok) throw new Error('Place index unavailable')
    return response.json()
  } })
}

export function MapContext({ state }: { state: MapSearch }) {
  const { language } = useLanguage(), fa = language === 'fa'
  const query = usePlaces(), map = useMap().current
  const labels: Place[] = [], occupied: { x: number; y: number }[] = []
  const bounds = map?.getBounds()
  if (bounds && map && query.data) {
    const candidates = query.data.places.filter(p => bounds.contains([p.lon, p.lat]) && (state.z >= 8 || p.kind === 'city'))
      .sort((a, b) => Number(b.capital) - Number(a.capital) || Number(b.kind === 'city') - Number(a.kind === 'city') || a.id - b.id)
    for (const place of candidates) {
      const pixel = map.project([place.lon, place.lat])
      if (occupied.some(p => Math.abs(p.x - pixel.x) < 105 && Math.abs(p.y - pixel.y) < 34)) continue
      occupied.push(pixel); labels.push(place)
      if (labels.length >= 48) break
    }
  }
  return <>
    <Source id="context-countries" type="geojson" data="/map/countries.geojson" attribution="Natural Earth · generalized cartographic context">
      <Layer id="context-land" type="fill" beforeId="raster-top" paint={{ 'fill-color': ['case', ['==', ['get', 'code'], 'IRN'], '#f6f3e9', '#ebeae4'] }} />
      <Layer id="context-borders" type="line" paint={{ 'line-color': '#8b979a', 'line-width': 1, 'line-opacity': 0.75 }} />
    </Source>
    {state.z < 6 && query.data?.countries.filter(p => bounds?.contains([p.lon, p.lat])).map(country => <Marker key={country.code} longitude={country.lon} latitude={country.lat}>
      <span className="map-country-label" dir={fa ? 'rtl' : 'ltr'}>{fa ? country.name_fa : country.name_en}</span>
    </Marker>)}
    {labels.map(place => <Marker key={place.id} longitude={place.lon} latitude={place.lat} anchor="left">
      <span className={`map-place-label ${place.capital ? 'capital' : ''}`} dir={fa ? 'rtl' : 'ltr'}><span aria-hidden="true">{place.capital ? '◉' : '•'}</span> {fa ? place.name_fa : place.name_en}</span>
    </Marker>)}
  </>
}

const normalized = (value: string) => value.normalize('NFKC').replaceAll('ي', 'ی').replaceAll('ك', 'ک').replace(/[\u200c\u200f]|[\u064b-\u065f]/gu, '').toLocaleLowerCase().trim()

export function PlaceSearch({ update }: { update: (values: Partial<MapSearch>) => void }) {
  const { language } = useLanguage(), fa = language === 'fa'
  const query = usePlaces(), [term, setTerm] = useState(''), [open, setOpen] = useState(false)
  const needle = normalized(term)
  const coordinate = parseMapCoordinates(term)
  const matches = needle.length >= 2 ? query.data?.places.filter(place => [place.name, place.name_fa, place.name_en].some(name => normalized(name).includes(needle))).slice(0, 12) ?? [] : []
  const choose = (place: Place) => { update({ lon: place.lon, lat: place.lat, z: 10, pitch: 0, bearing: 0 }); setTerm(fa ? place.name_fa : place.name_en); setOpen(false) }
  const chooseCoordinate = () => { if (coordinate) { update({ ...coordinate, z: 11, pitch: 0, bearing: 0 }); setOpen(false) } }
  return <form className="map-place-search" role="search" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }} onSubmit={event => { event.preventDefault(); if (coordinate) chooseCoordinate(); else if (matches[0]) choose(matches[0]) }}>
    <label><Search size={17} aria-hidden="true" /><input maxLength={80} aria-label={fa ? 'جست‌وجوی شهر یا مختصات' : 'Find a city or coordinates'} placeholder={fa ? 'نام شهر یا 51.4, 35.7' : 'City or 51.4, 35.7'} value={term}
      onFocus={() => setOpen(true)} onKeyDown={event => { if (event.key === 'Escape') setOpen(false) }} onChange={event => { setTerm(event.target.value); setOpen(true) }} /></label>
    {open && needle.length >= 2 && <div className="place-results">
      {coordinate ? <button type="button" onClick={chooseCoordinate}>{fa ? 'رفتن به طول و عرض جغرافیایی' : 'Go to longitude, latitude'} <bdi>{coordinate.lon}, {coordinate.lat}</bdi></button> : query.isError ? <button type="button" onClick={() => void query.refetch()}>{fa ? 'بارگذاری نام‌ها ناموفق بود؛ تلاش دوباره' : 'Could not load places; retry'}</button> : query.isPending ? <p role="status">{fa ? 'در حال بارگذاری…' : 'Loading…'}</p> : matches.length ? matches.map(place => <button type="button" key={place.id} onClick={() => choose(place)}>
        <strong>{fa ? place.name_fa : place.name_en}</strong><small><bdi>{place.lon.toFixed(3)}, {place.lat.toFixed(3)}</bdi> · OSM</small>
      </button>) : <p role="status">{fa ? 'نامی در نمایهٔ محلی OSM پیدا نشد.' : 'No match in the local OSM index.'}</p>}
    </div>}
  </form>
}
