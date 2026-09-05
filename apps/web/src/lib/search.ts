import { z } from 'zod'
const number = (min: number, max: number, fallback: number) =>
  z.coerce.number().finite().min(min).max(max).catch(fallback)
const optionalCoordinate = (min: number, max: number) =>
  z.coerce.number().finite().min(min).max(max).optional().catch(undefined)
const id = z.uuid().optional().catch(undefined)
export const searchSchema = z.object({
  aoi: z.enum(['iran', 'varamin']).catch('iran'), lon: number(-180, 180, 54),
  lat: number(-85, 85, 32.5), z: number(2, 18, 4.8),
  bearing: number(-180, 180, 0), pitch: number(0, 60, 0),
  layer: z.enum(['velocity_los', 'temporal_coherence', 'velocity_uncertainty', 'velocity_vertical', 'seasonal_amplitude']).catch('velocity_vertical'),
  product: id, run: id, orbit: z.enum(['descending', 'ascending']).catch('descending'),
  opacity: number(0, 1, 0.8), panel: z.enum(['none', 'point', 'asset']).catch('none'),
  asset: id, infrastructure: z.enum(['none', 'railway', 'road', 'all']).catch('all'),
  pointLon: optionalCoordinate(-180, 180), pointLat: optionalCoordinate(-90, 90),
  from: z.iso.date().optional().catch(undefined), to: z.iso.date().optional().catch(undefined),
})
export type MapSearch = z.infer<typeof searchSchema>
export const defaultSearch = searchSchema.parse({})
export const assetSearchSchema = z.object({
  product: z.uuid().optional(), type: z.enum(['railway', 'road']).catch('railway'),
  q: z.union([z.string(), z.number().finite()]).transform(String).pipe(z.string().max(80)).optional(),
  sort: z.enum(['max_abs_velocity', 'p95_velocity', 'mean_velocity', 'valid_length_m', 'coverage_fraction']).catch('max_abs_velocity'),
  direction: z.enum(['asc', 'desc']).catch('desc'),
  coverage: z.coerce.number().min(0).max(1).catch(0),
  offset: z.coerce.number().int().min(0).max(200000).catch(0),
})
export const defaultAssetSearch = assetSearchSchema.parse({})
export const roundCoordinate = (value: number) => Math.round(value * 100000) / 100000
