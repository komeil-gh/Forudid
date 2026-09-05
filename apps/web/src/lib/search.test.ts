import { describe, expect, it } from 'vitest'
import { defaultSearch, searchSchema, assetSearchSchema, roundCoordinate } from './search'
import { presentation } from './units'
describe('shareable state and scientific units', () => {
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
  it('preserves nulls, negative LOS and zero in SI conversion', () => {
    expect(presentation(-0.0712, 'm/year')).toBeCloseTo(-71.2)
    expect(presentation(null, 'm')).toBeNull()
    expect(presentation(0, 'm/year')).toBe(0)
    expect(presentation(0.89, '1')).toBe(0.89)
    expect(presentation(37, 'cm/year')).toBe(370)
    expect(presentation(1.2, 'cm')).toBe(12)
  })
  it('rounds to finer than the fixture raster resolution', () => {
    expect(roundCoordinate(51.645219)).toBe(51.64522)
  })
})
