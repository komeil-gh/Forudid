import { z } from 'zod'
const number = (min: number, max: number, fallback: number) =>
  z.coerce.number().finite().min(min).max(max).catch(fallback)
const optionalCoordinate = (min: number, max: number) =>
  z.coerce.number().finite().min(min).max(max).optional().catch(undefined)
const id = z.uuid().optional().catch(undefined)
export const searchSchema = z.object({
  aoi: z.literal('varamin').catch('varamin'), lon: number(-180, 180, 51.65),
  lat: number(-85, 85, 35.325), z: number(2, 18, 9.2),
  bearing: number(-180, 180, 0), pitch: number(0, 60, 0),
  layer: z.enum(['velocity_los', 'temporal_coherence', 'velocity_uncertainty']).catch('velocity_los'),
  product: id, run: id, orbit: z.enum(['descending', 'ascending']).catch('descending'),
  opacity: number(0, 1, 0.8), panel: z.enum(['none', 'point']).catch('none'),
  pointLon: optionalCoordinate(-180, 180), pointLat: optionalCoordinate(-90, 90),
  from: z.iso.date().optional().catch(undefined), to: z.iso.date().optional().catch(undefined),
})
export type MapSearch = z.infer<typeof searchSchema>
export const defaultSearch = searchSchema.parse({})
export const roundCoordinate = (value: number) => Math.round(value * 100000) / 100000
