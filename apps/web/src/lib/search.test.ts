import { describe, expect, it } from 'vitest'
import { defaultSearch, searchSchema, assetSearchSchema, parseMapCoordinates } from './search'
import { presentation } from './units'
describe('shareable state and scientific units', () => {
  it('accepts Persian and Arabic coordinate digits without treating malformed or polar values as a place', () => {
    expect(parseMapCoordinates('۵۱٫۴، ۳۵٫۷')).toEqual({ lon: 51.4, lat: 35.7 })
    expect(parseMapCoordinates('٥١.٤, ٣٥.٧')).toEqual({ lon: 51.4, lat: 35.7 })
    expect(parseMapCoordinates('0, 0')).toEqual({ lon: 0, lat: 0 })
    for (const value of ['181, 30', '51, 90', 'NaN, 10', ',35', '51,', 'Tehran']) expect(parseMapCoordinates(value)).toBeUndefined()
  })
  it('accepts numeric OSM queries decoded from URLs without accepting structured input', () => {
    expect(assetSearchSchema.parse({ q: 963780743 }).q).toBe('963780743')
    expect(assetSearchSchema.parse({ q: 'راه‌آهن' }).q).toBe('راه‌آهن')
    expect(assetSearchSchema.safeParse({ q: { id: 1 } }).success).toBe(false)
    expect(assetSearchSchema.safeParse({ q: 'x'.repeat(81) }).success).toBe(false)
  })
  it('falls back safely from malformed URLs', () => {
    const value = searchSchema.parse({ lat: 'NaN', z: 50, layer: 'vertical', product: 'bad', opacity: -1 })
    expect(value).toEqual(defaultSearch)
  })
  it('retains camera independently from the selected pixel', () => {
    const value = searchSchema.parse({ lon: 52, lat: 35, pointLon: 51.6452, pointLat: 35.3241, panel: 'point' })
    expect(value.lon).toBe(52)
    expect(value.pointLon).toBe(51.6452)
    expect(searchSchema.parse(JSON.parse(JSON.stringify(value)))).toEqual(value)
  })
  it('rejects empty and structured coordinates without discarding real zero', () => {
    for (const coordinate of ['', '   ', null, false, true, [], [35], {}]) {
      const value = searchSchema.parse({ lon: coordinate, lat: coordinate, pointLon: coordinate, pointLat: coordinate })
      expect(value.lon).toBe(defaultSearch.lon)
      expect(value.lat).toBe(defaultSearch.lat)
      expect(value.pointLon).toBeUndefined()
      expect(value.pointLat).toBeUndefined()
    }
    for (const coordinate of [0, '0']) {
      const value = searchSchema.parse({ lon: coordinate, lat: coordinate, pointLon: coordinate, pointLat: coordinate })
      expect([value.lon, value.lat, value.pointLon, value.pointLat]).toEqual([0, 0, 0, 0])
    }
  })
  it('restores registered source slugs without accepting paths or oversized input', () => {
    expect(searchSchema.parse({ aoi: 'varamin-comet' }).aoi).toBe('varamin-comet')
    for (const aoi of ['../secret', 'x'.repeat(65), 'Iran?run=x']) expect(searchSchema.parse({ aoi }).aoi).toBe('iran')
  })
  it('preserves nulls, negative LOS and zero in SI conversion', () => {
    expect(presentation(-0.0712, 'm/year')).toBeCloseTo(-71.2)
    expect(presentation(null, 'm')).toBeNull()
    expect(presentation(0, 'm/year')).toBe(0)
    expect(presentation(0.89, '1')).toBe(0.89)
    expect(presentation(37, 'cm/year')).toBe(370)
    expect(presentation(1.2, 'cm')).toBe(12)
  })
  it('preserves selected coordinates across URL validation near pixel edges', () => {
    expect(searchSchema.parse({ pointLon: '51.645219123', pointLat: '35.300000019' })).toMatchObject({
      pointLon: 51.645219123, pointLat: 35.300000019,
    })
  })
})
