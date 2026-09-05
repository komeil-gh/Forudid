import {
  useQuery
} from '@tanstack/react-query';
import type {
  DataTag,
  DefinedInitialDataOptions,
  DefinedUseQueryResult,
  QueryClient,
  QueryFunction,
  QueryKey,
  UndefinedInitialDataOptions,
  UseQueryOptions,
  UseQueryResult
} from '@tanstack/react-query';

import { apiFetch } from '../../lib/api.ts';
export interface Area {
  active: boolean;
  bbox: number[];
  id: string;
  name_en: string;
  name_fa: string;
  slug: string;
}

export interface AssetInfo {
  checksum_sha256: string;
  id: string;
  media_type: string;
  role: string;
  size_bytes: number;
}

export interface Coordinate {
  /**
     * @minimum -90
     * @maximum 90
     */
  lat: number;
  /**
     * @minimum -180
     * @maximum 180
     */
  lon: number;
}

export interface Epoch {
  date: string;
  displacement: number | null;
  uncertainty: number | null;
}

export interface ErrorDetail {
  code: string;
  message: string;
}

export interface ErrorResponse {
  error: ErrorDetail;
}

export type ExposureSummaryInputs = { [key: string]: unknown };

export type ExposureSummaryMetrics = { [key: string]: unknown };

export interface ExposureSummary {
  analysis_run_id: string;
  asset_id: string;
  checksum_sha256: string;
  coverage_fraction: number;
  disclaimer?: string;
  inputs: ExposureSummaryInputs;
  method_status: string;
  method_version: string;
  metrics: ExposureSummaryMetrics;
  segment_count: number;
  total_length_m: number;
  unit?: 'mm/year';
  valid_length_m: number;
}

export interface LineGeometry {
  /**
     * @items.minItems 2
     * @items.maxItems 2
     */
  coordinates: [number, number][];
  type?: 'LineString';
}

export type InfrastructureInfoAssetType = typeof InfrastructureInfoAssetType[keyof typeof InfrastructureInfoAssetType];


export const InfrastructureInfoAssetType = {
  road: 'road',
  railway: 'railway',
} as const;

export type InfrastructureInfoDataQuality = { [key: string]: unknown };

export type InfrastructureInfoProperties = { [key: string]: unknown };

export interface InfrastructureInfo {
  asset_class: string;
  asset_type: InfrastructureInfoAssetType;
  data_quality: InfrastructureInfoDataQuality;
  external_id: string;
  id: string;
  length_m: number;
  name: string | null;
  properties: InfrastructureInfoProperties;
  source_version_id: string;
}

export interface InfrastructureFeature {
  attribution: string;
  data_date: string | null;
  geometry: LineGeometry;
  id: string;
  license_url: string;
  properties: InfrastructureInfo;
  type?: 'Feature';
}

export interface InfrastructurePage {
  items: InfrastructureInfo[];
  next_cursor: string | null;
  source_version_id: string | null;
}

export type Kind = typeof Kind[keyof typeof Kind];


export const Kind = {
  velocity_los: 'velocity_los',
  temporal_coherence: 'temporal_coherence',
  velocity_uncertainty: 'velocity_uncertainty',
  valid_mask: 'valid_mask',
  timeseries: 'timeseries',
  velocity_vertical: 'velocity_vertical',
  seasonal_amplitude: 'seasonal_amplitude',
} as const;

export interface Legend {
  colors: string[];
  display_unit: string;
  label: string;
  masked: string;
  nodata: string;
  sign_convention: string;
  style: string;
  ticks: number[];
  unit: string;
}

export interface MultiPolygonGeometry {
  /**
     * @items.items.items.minItems 2
     * @items.items.items.maxItems 2
     */
  coordinates: [number, number][][][];
  type?: 'MultiPolygon';
}

export type PointSummaryQuality = typeof PointSummaryQuality[keyof typeof PointSummaryQuality];


export const PointSummaryQuality = {
  valid: 'valid',
  caution: 'caution',
  invalid: 'invalid',
  nodata: 'nodata',
} as const;

export interface Quantity {
  unit: string;
  value: number | null;
}

export interface ReferenceInfo {
  coordinate: Coordinate;
  date: string;
  id: string;
  method: string;
  reason: string;
}

export interface PointSummary {
  coordinate: Coordinate;
  end_date: string;
  is_fixture: boolean;
  last_acquisition: string | null;
  measurement: Quantity;
  measurement_kind: Kind;
  observations: number | null;
  orbit_direction: string;
  processing_version: string;
  product_id: string;
  quality: PointSummaryQuality;
  quality_reasons: string[];
  reference: ReferenceInfo | null;
  reference_description: string | null;
  relative_orbit: number | null;
  run_id: string;
  sampled_coordinate: Coordinate | null;
  start_date: string;
  temporal_coherence: number | null;
  velocity_los: Quantity;
  velocity_uncertainty: Quantity;
}

export interface RegionMetrics {
  area_m2: number;
  area_weighted: boolean;
  boundary_max_segment_degrees: number;
  boundary_projection: string;
  coverage_fraction: number;
  maximum_mm_year: number | null;
  mean_mm_year: number | null;
  median_mm_year: number | null;
  p95_mm_year: number | null;
  valid_deformation_area_m2: number;
}

export interface PopulationMetrics {
  alignment_method: string;
  allocation_assumption: string;
  band_edges_mm_year: number[];
  coverage_fraction: number | null;
  estimated_by_numeric_band: number[];
  estimated_outside_deformation_extent: number;
  estimated_total: number;
  estimated_valid_coverage: number;
  estimated_without_deformation_data: number;
  /** @nullable */
  hazard_population?: null;
  region?: RegionMetrics | null;
}

export type PopulationSummaryInputs = { [key: string]: unknown };

export interface PopulationSummary {
  analysis_run_id: string;
  checksum_sha256: string;
  disclaimer?: string;
  inputs: PopulationSummaryInputs;
  method_status: string;
  method_version: string;
  metrics: PopulationMetrics;
  population_source_version_id: string;
  population_year: number;
  product_id: string;
  region_id: string | null;
}

export type ProductInfoOrbitDirection = typeof ProductInfoOrbitDirection[keyof typeof ProductInfoOrbitDirection];


export const ProductInfoOrbitDirection = {
  ascending: 'ascending',
  descending: 'descending',
} as const;

export type ProductInfoResolutionMetadata = { [key: string]: unknown };

export type ProductInfoTimePrecision = typeof ProductInfoTimePrecision[keyof typeof ProductInfoTimePrecision];


export const ProductInfoTimePrecision = {
  day: 'day',
  year: 'year',
} as const;

export interface ProductInfo {
  aoi_id: string;
  aoi_slug: string;
  assets: AssetInfo[];
  attribution: string;
  bbox: number[];
  crs: string;
  end_date: string;
  id: string;
  is_fixture: boolean;
  kind: Kind;
  last_acquisition: string | null;
  measurement_component: string;
  measurement_method: string;
  orbit_direction: ProductInfoOrbitDirection;
  processing_run_id: string;
  processing_version: string;
  product_version: string;
  reference: ReferenceInfo | null;
  reference_description: string | null;
  relative_orbit: number | null;
  resolution_metadata: ProductInfoResolutionMetadata;
  sign_convention: string;
  source_version_id: string | null;
  start_date: string;
  status: 'published';
  time_precision: ProductInfoTimePrecision;
  timeseries_available: boolean;
  unit: string;
}

export type ProfileSampleQuality = typeof ProfileSampleQuality[keyof typeof ProfileSampleQuality];


export const ProfileSampleQuality = {
  source_value: 'source_value',
  nodata: 'nodata',
} as const;

export interface ProfileSample {
  angular_distortion: number | null;
  band_index: number | null;
  chainage_m: number;
  end_chainage_m: number;
  gradient_proxy: number | null;
  hazard_class: string | null;
  lat: number;
  lon: number;
  quality: ProfileSampleQuality;
  start_chainage_m: number;
  uncertainty: number | null;
  velocity: number | null;
}

export interface ProfilePage {
  analysis_run_id: string;
  asset_id: string;
  items: ProfileSample[];
  next_page: number | null;
  total: number;
}

export type QualityMetrics = { [key: string]: unknown };

export type QualityQuality = typeof QualityQuality[keyof typeof QualityQuality];


export const QualityQuality = {
  valid: 'valid',
  caution: 'caution',
  invalid: 'invalid',
  nodata: 'nodata',
} as const;

export type QualityThresholds = {[key: string]: number | null};

export interface Quality {
  is_fixture: boolean;
  metrics: QualityMetrics;
  quality: QualityQuality;
  reasons: string[];
  thresholds: QualityThresholds;
}

export type RegionInfoProperties = { [key: string]: unknown };

export interface RegionInfo {
  area_m2: number;
  bbox: number[];
  id: string;
  name_en: string;
  name_fa: string;
  properties: RegionInfoProperties;
  source_code: string | null;
  source_version_id: string;
}

export interface RegionFeature {
  attribution: string;
  geometry: MultiPolygonGeometry;
  id: string;
  license_url: string;
  properties: RegionInfo;
  source_year: string;
  type?: 'Feature';
}

export interface RegionPage {
  items: RegionInfo[];
  next_offset: number | null;
  source_version_id: string | null;
}

export type RunInfoConfig = { [key: string]: unknown };

export interface RunInfo {
  aoi_id: string;
  config: RunInfoConfig;
  finished_at: string | null;
  git_sha: string;
  id: string;
  pipeline_version: string;
  processing_profile: string;
  started_at: string | null;
  status: string;
}

export type SegmentPageFeaturesItem = { [key: string]: unknown };

export interface SegmentPage {
  analysis_run_id: string;
  asset_id: string;
  features: SegmentPageFeaturesItem[];
  next_offset: number | null;
  type?: 'FeatureCollection';
}

export interface SourceFileInfo {
  checksum_sha256: string;
  name: string;
  role: string;
  size_bytes: number;
}

export interface SourceInfo {
  access_method: string;
  attribution: string;
  citation: string;
  homepage: string;
  id: string;
  license_name: string;
  license_url: string;
  name: string;
  provider: string;
  scientific_status: string;
  slug: string;
  source_type: string;
}

export interface SourcePage {
  items: SourceInfo[];
  next_cursor: string | null;
}

export interface TimeSeries {
  coordinate: Coordinate;
  is_fixture: boolean;
  orbit_direction: string;
  reference_date: string;
  reference_point_id: string;
  relative_orbit: number;
  run_id: string;
  series: Epoch[];
  unit: 'm';
}

export interface VersionInfo {
  checksum_sha256: string;
  component: string | null;
  data_date: string | null;
  downloaded_at: string;
  files: SourceFileInfo[];
  id: string;
  method: string | null;
  observation_years: number[];
  size_bytes: number;
  source_id: string;
  valid_from: string | null;
  valid_to: string | null;
  validation_status: string;
  version: string;
}

export interface VersionPage {
  items: VersionInfo[];
  next_cursor: string | null;
}

export type GetAssetProfileParams = {
/**
 * @minimum 0
 * @maximum 199
 */
page?: number;
};

export type GetExposureSegmentsParams = {
/**
 * @minimum 0
 * @maximum 200000
 */
offset?: number;
/**
 * @minimum 1
 * @maximum 100
 */
limit?: number;
};

export type ListInfrastructureAssetsParams = {
source_version_id?: string | null;
asset_type?: ListInfrastructureAssetsAssetType;
asset_class?: string | null;
bbox?: string | null;
/**
 * @minimum 1
 * @maximum 100
 */
limit?: number;
cursor?: string | null;
};

export type ListInfrastructureAssetsAssetType = typeof ListInfrastructureAssetsAssetType[keyof typeof ListInfrastructureAssetsAssetType] | null;


export const ListInfrastructureAssetsAssetType = {
  road: 'road',
  railway: 'railway',
} as const;

export type GetAssetExposureParams = {
run_id?: string | null;
product_id?: string | null;
};

export type GetPointSummaryParams = {
/**
 * @minimum -180
 * @maximum 180
 */
lon: number;
/**
 * @minimum -90
 * @maximum 90
 */
lat: number;
product_id: string;
};

export type GetTimeSeriesParams = {
/**
 * @minimum -180
 * @maximum 180
 */
lon: number;
/**
 * @minimum -90
 * @maximum 90
 */
lat: number;
run_id: string;
};

export type ListProductsParams = {
aoi?: string;
kind?: Kind | null;
orbit?: ListProductsOrbit;
relative_orbit?: number | null;
status?: 'published';
run?: string | null;
/**
 * @minimum 1
 * @maximum 100
 */
limit?: number;
/**
 * @minimum 0
 * @maximum 100000
 */
offset?: number;
};

export type ListProductsOrbit = typeof ListProductsOrbit[keyof typeof ListProductsOrbit] | null;


export const ListProductsOrbit = {
  ascending: 'ascending',
  descending: 'descending',
} as const;

export type GetMetadata200 = { [key: string]: unknown };

export type GetPopulationExposureParams = {
run_id?: string | null;
region_id?: string | null;
};

export type GetProvenance200 = { [key: string]: unknown };

export type ListRegionsParams = {
source_version_id?: string | null;
/**
 * @minimum 1
 * @maximum 100
 */
limit?: number;
/**
 * @minimum 0
 * @maximum 100000
 */
offset?: number;
};

export type ListSourcesParams = {
/**
 * @minimum 1
 * @maximum 100
 */
limit?: number;
cursor?: string | null;
};

export type ListSourceVersionsParams = {
/**
 * @minimum 1
 * @maximum 100
 */
limit?: number;
cursor?: string | null;
};

export type GetLiveness200 = {[key: string]: string};

export type GetReadiness200 = {[key: string]: string};

export type GetTileParams = {
style?: string | null;
};

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];



const withQueryKey = <T extends object, K>(query: T, queryKey: K): T & { queryKey: K } => {
  const result = { queryKey } as T & { queryKey: K };
  for (const key of Object.keys(query)) {
    // The explicit queryKey always wins, matching the previous
    // `{ ...query, queryKey }` spread where it was set last.
    if (key === 'queryKey') continue;
    Object.defineProperty(result, key, {
      enumerable: true,
      configurable: true,
      get: () => (query as Record<string, unknown>)[key],
    });
  }
  return result;
};

export const getGetAssetProfileUrl = (runId: string,
    assetId: string,
    params?: GetAssetProfileParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/api/v1/analyses/${runId}/assets/${assetId}/profile?${stringifiedParams}` : `/api/v1/analyses/${runId}/assets/${assetId}/profile`
}

/**
 * @summary Profile
 */
export const getAssetProfile = async (runId: string,
    assetId: string,
    params?: GetAssetProfileParams, options?: Parameters<typeof apiFetch>[1]): Promise<ProfilePage> => {

  return apiFetch<ProfilePage>(getGetAssetProfileUrl(runId,assetId,params),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetAssetProfileQueryKey = (runId: string,
    assetId: string,
    params?: GetAssetProfileParams,) => {
    return [
    `/api/v1/analyses/${runId}/assets/${assetId}/profile`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetAssetProfileQueryOptions = <TData = Awaited<ReturnType<typeof getAssetProfile>>, TError = ErrorResponse>(runId: string,
    assetId: string,
    params?: GetAssetProfileParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getAssetProfile>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetAssetProfileQueryKey(runId,assetId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getAssetProfile>>> = ({ signal }) => getAssetProfile(runId,assetId,params, { signal, ...requestOptions });





   return  { queryKey, queryFn, enabled: runId !== null && runId !== undefined && assetId !== null && assetId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getAssetProfile>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetAssetProfileQueryResult = NonNullable<Awaited<ReturnType<typeof getAssetProfile>>>
export type GetAssetProfileQueryError = ErrorResponse


export function useGetAssetProfile<TData = Awaited<ReturnType<typeof getAssetProfile>>, TError = ErrorResponse>(
 runId: string,
    assetId: string,
    params: undefined |  GetAssetProfileParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getAssetProfile>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getAssetProfile>>,
          TError,
          Awaited<ReturnType<typeof getAssetProfile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetAssetProfile<TData = Awaited<ReturnType<typeof getAssetProfile>>, TError = ErrorResponse>(
 runId: string,
    assetId: string,
    params?: GetAssetProfileParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getAssetProfile>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getAssetProfile>>,
          TError,
          Awaited<ReturnType<typeof getAssetProfile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetAssetProfile<TData = Awaited<ReturnType<typeof getAssetProfile>>, TError = ErrorResponse>(
 runId: string,
    assetId: string,
    params?: GetAssetProfileParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getAssetProfile>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Profile
 */

export function useGetAssetProfile<TData = Awaited<ReturnType<typeof getAssetProfile>>, TError = ErrorResponse>(
 runId: string,
    assetId: string,
    params?: GetAssetProfileParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getAssetProfile>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetAssetProfileQueryOptions(runId,assetId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getGetExposureSegmentsUrl = (runId: string,
    assetId: string,
    params?: GetExposureSegmentsParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/api/v1/analyses/${runId}/assets/${assetId}/segments?${stringifiedParams}` : `/api/v1/analyses/${runId}/assets/${assetId}/segments`
}

/**
 * @summary Segments
 */
export const getExposureSegments = async (runId: string,
    assetId: string,
    params?: GetExposureSegmentsParams, options?: Parameters<typeof apiFetch>[1]): Promise<SegmentPage> => {

  return apiFetch<SegmentPage>(getGetExposureSegmentsUrl(runId,assetId,params),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetExposureSegmentsQueryKey = (runId: string,
    assetId: string,
    params?: GetExposureSegmentsParams,) => {
    return [
    `/api/v1/analyses/${runId}/assets/${assetId}/segments`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetExposureSegmentsQueryOptions = <TData = Awaited<ReturnType<typeof getExposureSegments>>, TError = ErrorResponse>(runId: string,
    assetId: string,
    params?: GetExposureSegmentsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getExposureSegments>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetExposureSegmentsQueryKey(runId,assetId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getExposureSegments>>> = ({ signal }) => getExposureSegments(runId,assetId,params, { signal, ...requestOptions });





   return  { queryKey, queryFn, enabled: runId !== null && runId !== undefined && assetId !== null && assetId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getExposureSegments>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetExposureSegmentsQueryResult = NonNullable<Awaited<ReturnType<typeof getExposureSegments>>>
export type GetExposureSegmentsQueryError = ErrorResponse


export function useGetExposureSegments<TData = Awaited<ReturnType<typeof getExposureSegments>>, TError = ErrorResponse>(
 runId: string,
    assetId: string,
    params: undefined |  GetExposureSegmentsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getExposureSegments>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getExposureSegments>>,
          TError,
          Awaited<ReturnType<typeof getExposureSegments>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetExposureSegments<TData = Awaited<ReturnType<typeof getExposureSegments>>, TError = ErrorResponse>(
 runId: string,
    assetId: string,
    params?: GetExposureSegmentsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getExposureSegments>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getExposureSegments>>,
          TError,
          Awaited<ReturnType<typeof getExposureSegments>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetExposureSegments<TData = Awaited<ReturnType<typeof getExposureSegments>>, TError = ErrorResponse>(
 runId: string,
    assetId: string,
    params?: GetExposureSegmentsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getExposureSegments>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Segments
 */

export function useGetExposureSegments<TData = Awaited<ReturnType<typeof getExposureSegments>>, TError = ErrorResponse>(
 runId: string,
    assetId: string,
    params?: GetExposureSegmentsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getExposureSegments>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetExposureSegmentsQueryOptions(runId,assetId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getListAreasUrl = () => {




  return `/api/v1/aois`
}

/**
 * @summary Areas
 */
export const listAreas = async ( options?: Parameters<typeof apiFetch>[1]): Promise<Area[]> => {

  return apiFetch<Area[]>(getListAreasUrl(),
  {
    ...options,
    method: 'GET'


  }
);}





export const getListAreasQueryKey = () => {
    return [
    `/api/v1/aois`
    ] as const;
    }


export const getListAreasQueryOptions = <TData = Awaited<ReturnType<typeof listAreas>>, TError = ErrorResponse>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAreas>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListAreasQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listAreas>>> = ({ signal }) => listAreas({ signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listAreas>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListAreasQueryResult = NonNullable<Awaited<ReturnType<typeof listAreas>>>
export type ListAreasQueryError = ErrorResponse


export function useListAreas<TData = Awaited<ReturnType<typeof listAreas>>, TError = ErrorResponse>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAreas>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listAreas>>,
          TError,
          Awaited<ReturnType<typeof listAreas>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListAreas<TData = Awaited<ReturnType<typeof listAreas>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAreas>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listAreas>>,
          TError,
          Awaited<ReturnType<typeof listAreas>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListAreas<TData = Awaited<ReturnType<typeof listAreas>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAreas>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Areas
 */

export function useListAreas<TData = Awaited<ReturnType<typeof listAreas>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listAreas>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListAreasQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getGetAreaUrl = (slug: string,) => {




  return `/api/v1/aois/${slug}`
}

/**
 * @summary Area
 */
export const getArea = async (slug: string, options?: Parameters<typeof apiFetch>[1]): Promise<Area> => {

  return apiFetch<Area>(getGetAreaUrl(slug),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetAreaQueryKey = (slug: string,) => {
    return [
    `/api/v1/aois/${slug}`
    ] as const;
    }


export const getGetAreaQueryOptions = <TData = Awaited<ReturnType<typeof getArea>>, TError = ErrorResponse>(slug: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getArea>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetAreaQueryKey(slug);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getArea>>> = ({ signal }) => getArea(slug, { signal, ...requestOptions });





   return  { queryKey, queryFn, enabled: slug !== null && slug !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getArea>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetAreaQueryResult = NonNullable<Awaited<ReturnType<typeof getArea>>>
export type GetAreaQueryError = ErrorResponse


export function useGetArea<TData = Awaited<ReturnType<typeof getArea>>, TError = ErrorResponse>(
 slug: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getArea>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getArea>>,
          TError,
          Awaited<ReturnType<typeof getArea>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetArea<TData = Awaited<ReturnType<typeof getArea>>, TError = ErrorResponse>(
 slug: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getArea>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getArea>>,
          TError,
          Awaited<ReturnType<typeof getArea>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetArea<TData = Awaited<ReturnType<typeof getArea>>, TError = ErrorResponse>(
 slug: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getArea>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Area
 */

export function useGetArea<TData = Awaited<ReturnType<typeof getArea>>, TError = ErrorResponse>(
 slug: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getArea>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetAreaQueryOptions(slug,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getListInfrastructureAssetsUrl = (params?: ListInfrastructureAssetsParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/api/v1/assets?${stringifiedParams}` : `/api/v1/assets`
}

/**
 * @summary Assets
 */
export const listInfrastructureAssets = async (params?: ListInfrastructureAssetsParams, options?: Parameters<typeof apiFetch>[1]): Promise<InfrastructurePage> => {

  return apiFetch<InfrastructurePage>(getListInfrastructureAssetsUrl(params),
  {
    ...options,
    method: 'GET'


  }
);}





export const getListInfrastructureAssetsQueryKey = (params?: ListInfrastructureAssetsParams,) => {
    return [
    `/api/v1/assets`, ...(params ? [params] : [])
    ] as const;
    }


export const getListInfrastructureAssetsQueryOptions = <TData = Awaited<ReturnType<typeof listInfrastructureAssets>>, TError = ErrorResponse>(params?: ListInfrastructureAssetsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listInfrastructureAssets>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListInfrastructureAssetsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listInfrastructureAssets>>> = ({ signal }) => listInfrastructureAssets(params, { signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listInfrastructureAssets>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListInfrastructureAssetsQueryResult = NonNullable<Awaited<ReturnType<typeof listInfrastructureAssets>>>
export type ListInfrastructureAssetsQueryError = ErrorResponse


export function useListInfrastructureAssets<TData = Awaited<ReturnType<typeof listInfrastructureAssets>>, TError = ErrorResponse>(
 params: undefined |  ListInfrastructureAssetsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listInfrastructureAssets>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listInfrastructureAssets>>,
          TError,
          Awaited<ReturnType<typeof listInfrastructureAssets>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListInfrastructureAssets<TData = Awaited<ReturnType<typeof listInfrastructureAssets>>, TError = ErrorResponse>(
 params?: ListInfrastructureAssetsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listInfrastructureAssets>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listInfrastructureAssets>>,
          TError,
          Awaited<ReturnType<typeof listInfrastructureAssets>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListInfrastructureAssets<TData = Awaited<ReturnType<typeof listInfrastructureAssets>>, TError = ErrorResponse>(
 params?: ListInfrastructureAssetsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listInfrastructureAssets>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Assets
 */

export function useListInfrastructureAssets<TData = Awaited<ReturnType<typeof listInfrastructureAssets>>, TError = ErrorResponse>(
 params?: ListInfrastructureAssetsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listInfrastructureAssets>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListInfrastructureAssetsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getGetInfrastructureAssetUrl = (assetId: string,) => {




  return `/api/v1/assets/${assetId}`
}

/**
 * @summary Asset
 */
export const getInfrastructureAsset = async (assetId: string, options?: Parameters<typeof apiFetch>[1]): Promise<InfrastructureFeature> => {

  return apiFetch<InfrastructureFeature>(getGetInfrastructureAssetUrl(assetId),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetInfrastructureAssetQueryKey = (assetId: string,) => {
    return [
    `/api/v1/assets/${assetId}`
    ] as const;
    }


export const getGetInfrastructureAssetQueryOptions = <TData = Awaited<ReturnType<typeof getInfrastructureAsset>>, TError = ErrorResponse>(assetId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getInfrastructureAsset>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetInfrastructureAssetQueryKey(assetId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getInfrastructureAsset>>> = ({ signal }) => getInfrastructureAsset(assetId, { signal, ...requestOptions });





   return  { queryKey, queryFn, enabled: assetId !== null && assetId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getInfrastructureAsset>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetInfrastructureAssetQueryResult = NonNullable<Awaited<ReturnType<typeof getInfrastructureAsset>>>
export type GetInfrastructureAssetQueryError = ErrorResponse


export function useGetInfrastructureAsset<TData = Awaited<ReturnType<typeof getInfrastructureAsset>>, TError = ErrorResponse>(
 assetId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getInfrastructureAsset>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getInfrastructureAsset>>,
          TError,
          Awaited<ReturnType<typeof getInfrastructureAsset>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetInfrastructureAsset<TData = Awaited<ReturnType<typeof getInfrastructureAsset>>, TError = ErrorResponse>(
 assetId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getInfrastructureAsset>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getInfrastructureAsset>>,
          TError,
          Awaited<ReturnType<typeof getInfrastructureAsset>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetInfrastructureAsset<TData = Awaited<ReturnType<typeof getInfrastructureAsset>>, TError = ErrorResponse>(
 assetId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getInfrastructureAsset>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Asset
 */

export function useGetInfrastructureAsset<TData = Awaited<ReturnType<typeof getInfrastructureAsset>>, TError = ErrorResponse>(
 assetId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getInfrastructureAsset>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetInfrastructureAssetQueryOptions(assetId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getGetAssetExposureUrl = (assetId: string,
    params?: GetAssetExposureParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/api/v1/assets/${assetId}/exposure?${stringifiedParams}` : `/api/v1/assets/${assetId}/exposure`
}

/**
 * @summary Summary
 */
export const getAssetExposure = async (assetId: string,
    params?: GetAssetExposureParams, options?: Parameters<typeof apiFetch>[1]): Promise<ExposureSummary> => {

  return apiFetch<ExposureSummary>(getGetAssetExposureUrl(assetId,params),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetAssetExposureQueryKey = (assetId: string,
    params?: GetAssetExposureParams,) => {
    return [
    `/api/v1/assets/${assetId}/exposure`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetAssetExposureQueryOptions = <TData = Awaited<ReturnType<typeof getAssetExposure>>, TError = ErrorResponse>(assetId: string,
    params?: GetAssetExposureParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getAssetExposure>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetAssetExposureQueryKey(assetId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getAssetExposure>>> = ({ signal }) => getAssetExposure(assetId,params, { signal, ...requestOptions });





   return  { queryKey, queryFn, enabled: assetId !== null && assetId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getAssetExposure>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetAssetExposureQueryResult = NonNullable<Awaited<ReturnType<typeof getAssetExposure>>>
export type GetAssetExposureQueryError = ErrorResponse


export function useGetAssetExposure<TData = Awaited<ReturnType<typeof getAssetExposure>>, TError = ErrorResponse>(
 assetId: string,
    params: undefined |  GetAssetExposureParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getAssetExposure>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getAssetExposure>>,
          TError,
          Awaited<ReturnType<typeof getAssetExposure>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetAssetExposure<TData = Awaited<ReturnType<typeof getAssetExposure>>, TError = ErrorResponse>(
 assetId: string,
    params?: GetAssetExposureParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getAssetExposure>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getAssetExposure>>,
          TError,
          Awaited<ReturnType<typeof getAssetExposure>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetAssetExposure<TData = Awaited<ReturnType<typeof getAssetExposure>>, TError = ErrorResponse>(
 assetId: string,
    params?: GetAssetExposureParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getAssetExposure>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Summary
 */

export function useGetAssetExposure<TData = Awaited<ReturnType<typeof getAssetExposure>>, TError = ErrorResponse>(
 assetId: string,
    params?: GetAssetExposureParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getAssetExposure>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetAssetExposureQueryOptions(assetId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getGetPointSummaryUrl = (params: GetPointSummaryParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/api/v1/points/summary?${stringifiedParams}` : `/api/v1/points/summary`
}

/**
 * @summary Point Summary
 */
export const getPointSummary = async (params: GetPointSummaryParams, options?: Parameters<typeof apiFetch>[1]): Promise<PointSummary> => {

  return apiFetch<PointSummary>(getGetPointSummaryUrl(params),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetPointSummaryQueryKey = (params?: GetPointSummaryParams,) => {
    return [
    `/api/v1/points/summary`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetPointSummaryQueryOptions = <TData = Awaited<ReturnType<typeof getPointSummary>>, TError = ErrorResponse>(params: GetPointSummaryParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPointSummary>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetPointSummaryQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getPointSummary>>> = ({ signal }) => getPointSummary(params, { signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getPointSummary>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetPointSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getPointSummary>>>
export type GetPointSummaryQueryError = ErrorResponse


export function useGetPointSummary<TData = Awaited<ReturnType<typeof getPointSummary>>, TError = ErrorResponse>(
 params: GetPointSummaryParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPointSummary>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getPointSummary>>,
          TError,
          Awaited<ReturnType<typeof getPointSummary>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetPointSummary<TData = Awaited<ReturnType<typeof getPointSummary>>, TError = ErrorResponse>(
 params: GetPointSummaryParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPointSummary>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getPointSummary>>,
          TError,
          Awaited<ReturnType<typeof getPointSummary>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetPointSummary<TData = Awaited<ReturnType<typeof getPointSummary>>, TError = ErrorResponse>(
 params: GetPointSummaryParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPointSummary>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Point Summary
 */

export function useGetPointSummary<TData = Awaited<ReturnType<typeof getPointSummary>>, TError = ErrorResponse>(
 params: GetPointSummaryParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPointSummary>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetPointSummaryQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getGetTimeSeriesUrl = (params: GetTimeSeriesParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/api/v1/points/timeseries?${stringifiedParams}` : `/api/v1/points/timeseries`
}

/**
 * @summary Get Series
 */
export const getTimeSeries = async (params: GetTimeSeriesParams, options?: Parameters<typeof apiFetch>[1]): Promise<TimeSeries> => {

  return apiFetch<TimeSeries>(getGetTimeSeriesUrl(params),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetTimeSeriesQueryKey = (params?: GetTimeSeriesParams,) => {
    return [
    `/api/v1/points/timeseries`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetTimeSeriesQueryOptions = <TData = Awaited<ReturnType<typeof getTimeSeries>>, TError = ErrorResponse>(params: GetTimeSeriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getTimeSeries>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetTimeSeriesQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getTimeSeries>>> = ({ signal }) => getTimeSeries(params, { signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getTimeSeries>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetTimeSeriesQueryResult = NonNullable<Awaited<ReturnType<typeof getTimeSeries>>>
export type GetTimeSeriesQueryError = ErrorResponse


export function useGetTimeSeries<TData = Awaited<ReturnType<typeof getTimeSeries>>, TError = ErrorResponse>(
 params: GetTimeSeriesParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getTimeSeries>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getTimeSeries>>,
          TError,
          Awaited<ReturnType<typeof getTimeSeries>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetTimeSeries<TData = Awaited<ReturnType<typeof getTimeSeries>>, TError = ErrorResponse>(
 params: GetTimeSeriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getTimeSeries>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getTimeSeries>>,
          TError,
          Awaited<ReturnType<typeof getTimeSeries>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetTimeSeries<TData = Awaited<ReturnType<typeof getTimeSeries>>, TError = ErrorResponse>(
 params: GetTimeSeriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getTimeSeries>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get Series
 */

export function useGetTimeSeries<TData = Awaited<ReturnType<typeof getTimeSeries>>, TError = ErrorResponse>(
 params: GetTimeSeriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getTimeSeries>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetTimeSeriesQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getListProductsUrl = (params?: ListProductsParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/api/v1/products?${stringifiedParams}` : `/api/v1/products`
}

/**
 * @summary Products
 */
export const listProducts = async (params?: ListProductsParams, options?: Parameters<typeof apiFetch>[1]): Promise<ProductInfo[]> => {

  return apiFetch<ProductInfo[]>(getListProductsUrl(params),
  {
    ...options,
    method: 'GET'


  }
);}





export const getListProductsQueryKey = (params?: ListProductsParams,) => {
    return [
    `/api/v1/products`, ...(params ? [params] : [])
    ] as const;
    }


export const getListProductsQueryOptions = <TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorResponse>(params?: ListProductsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListProductsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listProducts>>> = ({ signal }) => listProducts(params, { signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListProductsQueryResult = NonNullable<Awaited<ReturnType<typeof listProducts>>>
export type ListProductsQueryError = ErrorResponse


export function useListProducts<TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorResponse>(
 params: undefined |  ListProductsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listProducts>>,
          TError,
          Awaited<ReturnType<typeof listProducts>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListProducts<TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorResponse>(
 params?: ListProductsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listProducts>>,
          TError,
          Awaited<ReturnType<typeof listProducts>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListProducts<TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorResponse>(
 params?: ListProductsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Products
 */

export function useListProducts<TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorResponse>(
 params?: ListProductsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListProductsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getGetProductUrl = (productId: string,) => {




  return `/api/v1/products/${productId}`
}

/**
 * @summary Get Product
 */
export const getProduct = async (productId: string, options?: Parameters<typeof apiFetch>[1]): Promise<ProductInfo> => {

  return apiFetch<ProductInfo>(getGetProductUrl(productId),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetProductQueryKey = (productId: string,) => {
    return [
    `/api/v1/products/${productId}`
    ] as const;
    }


export const getGetProductQueryOptions = <TData = Awaited<ReturnType<typeof getProduct>>, TError = ErrorResponse>(productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetProductQueryKey(productId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getProduct>>> = ({ signal }) => getProduct(productId, { signal, ...requestOptions });





   return  { queryKey, queryFn, enabled: productId !== null && productId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetProductQueryResult = NonNullable<Awaited<ReturnType<typeof getProduct>>>
export type GetProductQueryError = ErrorResponse


export function useGetProduct<TData = Awaited<ReturnType<typeof getProduct>>, TError = ErrorResponse>(
 productId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getProduct>>,
          TError,
          Awaited<ReturnType<typeof getProduct>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetProduct<TData = Awaited<ReturnType<typeof getProduct>>, TError = ErrorResponse>(
 productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getProduct>>,
          TError,
          Awaited<ReturnType<typeof getProduct>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetProduct<TData = Awaited<ReturnType<typeof getProduct>>, TError = ErrorResponse>(
 productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get Product
 */

export function useGetProduct<TData = Awaited<ReturnType<typeof getProduct>>, TError = ErrorResponse>(
 productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetProductQueryOptions(productId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getGetLegendUrl = (productId: string,) => {




  return `/api/v1/products/${productId}/legend`
}

/**
 * @summary Get Legend
 */
export const getLegend = async (productId: string, options?: Parameters<typeof apiFetch>[1]): Promise<Legend> => {

  return apiFetch<Legend>(getGetLegendUrl(productId),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetLegendQueryKey = (productId: string,) => {
    return [
    `/api/v1/products/${productId}/legend`
    ] as const;
    }


export const getGetLegendQueryOptions = <TData = Awaited<ReturnType<typeof getLegend>>, TError = ErrorResponse>(productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLegend>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetLegendQueryKey(productId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getLegend>>> = ({ signal }) => getLegend(productId, { signal, ...requestOptions });





   return  { queryKey, queryFn, enabled: productId !== null && productId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getLegend>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetLegendQueryResult = NonNullable<Awaited<ReturnType<typeof getLegend>>>
export type GetLegendQueryError = ErrorResponse


export function useGetLegend<TData = Awaited<ReturnType<typeof getLegend>>, TError = ErrorResponse>(
 productId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLegend>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getLegend>>,
          TError,
          Awaited<ReturnType<typeof getLegend>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetLegend<TData = Awaited<ReturnType<typeof getLegend>>, TError = ErrorResponse>(
 productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLegend>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getLegend>>,
          TError,
          Awaited<ReturnType<typeof getLegend>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetLegend<TData = Awaited<ReturnType<typeof getLegend>>, TError = ErrorResponse>(
 productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLegend>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get Legend
 */

export function useGetLegend<TData = Awaited<ReturnType<typeof getLegend>>, TError = ErrorResponse>(
 productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLegend>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetLegendQueryOptions(productId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getGetMetadataUrl = (productId: string,) => {




  return `/api/v1/products/${productId}/metadata`
}

/**
 * @summary Get Metadata
 */
export const getMetadata = async (productId: string, options?: Parameters<typeof apiFetch>[1]): Promise<GetMetadata200> => {

  return apiFetch<GetMetadata200>(getGetMetadataUrl(productId),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetMetadataQueryKey = (productId: string,) => {
    return [
    `/api/v1/products/${productId}/metadata`
    ] as const;
    }


export const getGetMetadataQueryOptions = <TData = Awaited<ReturnType<typeof getMetadata>>, TError = ErrorResponse>(productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getMetadata>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetMetadataQueryKey(productId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getMetadata>>> = ({ signal }) => getMetadata(productId, { signal, ...requestOptions });





   return  { queryKey, queryFn, enabled: productId !== null && productId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getMetadata>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetMetadataQueryResult = NonNullable<Awaited<ReturnType<typeof getMetadata>>>
export type GetMetadataQueryError = ErrorResponse


export function useGetMetadata<TData = Awaited<ReturnType<typeof getMetadata>>, TError = ErrorResponse>(
 productId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getMetadata>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getMetadata>>,
          TError,
          Awaited<ReturnType<typeof getMetadata>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetMetadata<TData = Awaited<ReturnType<typeof getMetadata>>, TError = ErrorResponse>(
 productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getMetadata>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getMetadata>>,
          TError,
          Awaited<ReturnType<typeof getMetadata>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetMetadata<TData = Awaited<ReturnType<typeof getMetadata>>, TError = ErrorResponse>(
 productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getMetadata>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get Metadata
 */

export function useGetMetadata<TData = Awaited<ReturnType<typeof getMetadata>>, TError = ErrorResponse>(
 productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getMetadata>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetMetadataQueryOptions(productId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getGetPopulationExposureUrl = (productId: string,
    params?: GetPopulationExposureParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/api/v1/products/${productId}/population-exposure?${stringifiedParams}` : `/api/v1/products/${productId}/population-exposure`
}

/**
 * @summary Population Summary
 */
export const getPopulationExposure = async (productId: string,
    params?: GetPopulationExposureParams, options?: Parameters<typeof apiFetch>[1]): Promise<PopulationSummary> => {

  return apiFetch<PopulationSummary>(getGetPopulationExposureUrl(productId,params),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetPopulationExposureQueryKey = (productId: string,
    params?: GetPopulationExposureParams,) => {
    return [
    `/api/v1/products/${productId}/population-exposure`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetPopulationExposureQueryOptions = <TData = Awaited<ReturnType<typeof getPopulationExposure>>, TError = ErrorResponse>(productId: string,
    params?: GetPopulationExposureParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPopulationExposure>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetPopulationExposureQueryKey(productId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getPopulationExposure>>> = ({ signal }) => getPopulationExposure(productId,params, { signal, ...requestOptions });





   return  { queryKey, queryFn, enabled: productId !== null && productId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getPopulationExposure>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetPopulationExposureQueryResult = NonNullable<Awaited<ReturnType<typeof getPopulationExposure>>>
export type GetPopulationExposureQueryError = ErrorResponse


export function useGetPopulationExposure<TData = Awaited<ReturnType<typeof getPopulationExposure>>, TError = ErrorResponse>(
 productId: string,
    params: undefined |  GetPopulationExposureParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPopulationExposure>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getPopulationExposure>>,
          TError,
          Awaited<ReturnType<typeof getPopulationExposure>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetPopulationExposure<TData = Awaited<ReturnType<typeof getPopulationExposure>>, TError = ErrorResponse>(
 productId: string,
    params?: GetPopulationExposureParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPopulationExposure>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getPopulationExposure>>,
          TError,
          Awaited<ReturnType<typeof getPopulationExposure>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetPopulationExposure<TData = Awaited<ReturnType<typeof getPopulationExposure>>, TError = ErrorResponse>(
 productId: string,
    params?: GetPopulationExposureParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPopulationExposure>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Population Summary
 */

export function useGetPopulationExposure<TData = Awaited<ReturnType<typeof getPopulationExposure>>, TError = ErrorResponse>(
 productId: string,
    params?: GetPopulationExposureParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPopulationExposure>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetPopulationExposureQueryOptions(productId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getGetProvenanceUrl = (productId: string,) => {




  return `/api/v1/products/${productId}/provenance`
}

/**
 * @summary Get Provenance
 */
export const getProvenance = async (productId: string, options?: Parameters<typeof apiFetch>[1]): Promise<GetProvenance200> => {

  return apiFetch<GetProvenance200>(getGetProvenanceUrl(productId),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetProvenanceQueryKey = (productId: string,) => {
    return [
    `/api/v1/products/${productId}/provenance`
    ] as const;
    }


export const getGetProvenanceQueryOptions = <TData = Awaited<ReturnType<typeof getProvenance>>, TError = ErrorResponse>(productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getProvenance>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetProvenanceQueryKey(productId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getProvenance>>> = ({ signal }) => getProvenance(productId, { signal, ...requestOptions });





   return  { queryKey, queryFn, enabled: productId !== null && productId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getProvenance>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetProvenanceQueryResult = NonNullable<Awaited<ReturnType<typeof getProvenance>>>
export type GetProvenanceQueryError = ErrorResponse


export function useGetProvenance<TData = Awaited<ReturnType<typeof getProvenance>>, TError = ErrorResponse>(
 productId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getProvenance>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getProvenance>>,
          TError,
          Awaited<ReturnType<typeof getProvenance>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetProvenance<TData = Awaited<ReturnType<typeof getProvenance>>, TError = ErrorResponse>(
 productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getProvenance>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getProvenance>>,
          TError,
          Awaited<ReturnType<typeof getProvenance>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetProvenance<TData = Awaited<ReturnType<typeof getProvenance>>, TError = ErrorResponse>(
 productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getProvenance>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get Provenance
 */

export function useGetProvenance<TData = Awaited<ReturnType<typeof getProvenance>>, TError = ErrorResponse>(
 productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getProvenance>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetProvenanceQueryOptions(productId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getGetQualityUrl = (productId: string,) => {




  return `/api/v1/products/${productId}/quality`
}

/**
 * @summary Get Quality
 */
export const getQuality = async (productId: string, options?: Parameters<typeof apiFetch>[1]): Promise<Quality> => {

  return apiFetch<Quality>(getGetQualityUrl(productId),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetQualityQueryKey = (productId: string,) => {
    return [
    `/api/v1/products/${productId}/quality`
    ] as const;
    }


export const getGetQualityQueryOptions = <TData = Awaited<ReturnType<typeof getQuality>>, TError = ErrorResponse>(productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getQuality>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetQualityQueryKey(productId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getQuality>>> = ({ signal }) => getQuality(productId, { signal, ...requestOptions });





   return  { queryKey, queryFn, enabled: productId !== null && productId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getQuality>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetQualityQueryResult = NonNullable<Awaited<ReturnType<typeof getQuality>>>
export type GetQualityQueryError = ErrorResponse


export function useGetQuality<TData = Awaited<ReturnType<typeof getQuality>>, TError = ErrorResponse>(
 productId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getQuality>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getQuality>>,
          TError,
          Awaited<ReturnType<typeof getQuality>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetQuality<TData = Awaited<ReturnType<typeof getQuality>>, TError = ErrorResponse>(
 productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getQuality>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getQuality>>,
          TError,
          Awaited<ReturnType<typeof getQuality>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetQuality<TData = Awaited<ReturnType<typeof getQuality>>, TError = ErrorResponse>(
 productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getQuality>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get Quality
 */

export function useGetQuality<TData = Awaited<ReturnType<typeof getQuality>>, TError = ErrorResponse>(
 productId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getQuality>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetQualityQueryOptions(productId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getListRegionsUrl = (params?: ListRegionsParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/api/v1/regions?${stringifiedParams}` : `/api/v1/regions`
}

/**
 * @summary Regions
 */
export const listRegions = async (params?: ListRegionsParams, options?: Parameters<typeof apiFetch>[1]): Promise<RegionPage> => {

  return apiFetch<RegionPage>(getListRegionsUrl(params),
  {
    ...options,
    method: 'GET'


  }
);}





export const getListRegionsQueryKey = (params?: ListRegionsParams,) => {
    return [
    `/api/v1/regions`, ...(params ? [params] : [])
    ] as const;
    }


export const getListRegionsQueryOptions = <TData = Awaited<ReturnType<typeof listRegions>>, TError = ErrorResponse>(params?: ListRegionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listRegions>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListRegionsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listRegions>>> = ({ signal }) => listRegions(params, { signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listRegions>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListRegionsQueryResult = NonNullable<Awaited<ReturnType<typeof listRegions>>>
export type ListRegionsQueryError = ErrorResponse


export function useListRegions<TData = Awaited<ReturnType<typeof listRegions>>, TError = ErrorResponse>(
 params: undefined |  ListRegionsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listRegions>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listRegions>>,
          TError,
          Awaited<ReturnType<typeof listRegions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListRegions<TData = Awaited<ReturnType<typeof listRegions>>, TError = ErrorResponse>(
 params?: ListRegionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listRegions>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listRegions>>,
          TError,
          Awaited<ReturnType<typeof listRegions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListRegions<TData = Awaited<ReturnType<typeof listRegions>>, TError = ErrorResponse>(
 params?: ListRegionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listRegions>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Regions
 */

export function useListRegions<TData = Awaited<ReturnType<typeof listRegions>>, TError = ErrorResponse>(
 params?: ListRegionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listRegions>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListRegionsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getGetRegionUrl = (regionId: string,) => {




  return `/api/v1/regions/${regionId}`
}

/**
 * @summary Region
 */
export const getRegion = async (regionId: string, options?: Parameters<typeof apiFetch>[1]): Promise<RegionFeature> => {

  return apiFetch<RegionFeature>(getGetRegionUrl(regionId),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetRegionQueryKey = (regionId: string,) => {
    return [
    `/api/v1/regions/${regionId}`
    ] as const;
    }


export const getGetRegionQueryOptions = <TData = Awaited<ReturnType<typeof getRegion>>, TError = ErrorResponse>(regionId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRegion>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetRegionQueryKey(regionId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getRegion>>> = ({ signal }) => getRegion(regionId, { signal, ...requestOptions });





   return  { queryKey, queryFn, enabled: regionId !== null && regionId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getRegion>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetRegionQueryResult = NonNullable<Awaited<ReturnType<typeof getRegion>>>
export type GetRegionQueryError = ErrorResponse


export function useGetRegion<TData = Awaited<ReturnType<typeof getRegion>>, TError = ErrorResponse>(
 regionId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRegion>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getRegion>>,
          TError,
          Awaited<ReturnType<typeof getRegion>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetRegion<TData = Awaited<ReturnType<typeof getRegion>>, TError = ErrorResponse>(
 regionId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRegion>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getRegion>>,
          TError,
          Awaited<ReturnType<typeof getRegion>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetRegion<TData = Awaited<ReturnType<typeof getRegion>>, TError = ErrorResponse>(
 regionId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRegion>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Region
 */

export function useGetRegion<TData = Awaited<ReturnType<typeof getRegion>>, TError = ErrorResponse>(
 regionId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRegion>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetRegionQueryOptions(regionId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getGetRunUrl = (runId: string,) => {




  return `/api/v1/runs/${runId}`
}

/**
 * @summary Get Run
 */
export const getRun = async (runId: string, options?: Parameters<typeof apiFetch>[1]): Promise<RunInfo> => {

  return apiFetch<RunInfo>(getGetRunUrl(runId),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetRunQueryKey = (runId: string,) => {
    return [
    `/api/v1/runs/${runId}`
    ] as const;
    }


export const getGetRunQueryOptions = <TData = Awaited<ReturnType<typeof getRun>>, TError = ErrorResponse>(runId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRun>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetRunQueryKey(runId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getRun>>> = ({ signal }) => getRun(runId, { signal, ...requestOptions });





   return  { queryKey, queryFn, enabled: runId !== null && runId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getRun>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetRunQueryResult = NonNullable<Awaited<ReturnType<typeof getRun>>>
export type GetRunQueryError = ErrorResponse


export function useGetRun<TData = Awaited<ReturnType<typeof getRun>>, TError = ErrorResponse>(
 runId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRun>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getRun>>,
          TError,
          Awaited<ReturnType<typeof getRun>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetRun<TData = Awaited<ReturnType<typeof getRun>>, TError = ErrorResponse>(
 runId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRun>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getRun>>,
          TError,
          Awaited<ReturnType<typeof getRun>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetRun<TData = Awaited<ReturnType<typeof getRun>>, TError = ErrorResponse>(
 runId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRun>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get Run
 */

export function useGetRun<TData = Awaited<ReturnType<typeof getRun>>, TError = ErrorResponse>(
 runId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRun>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetRunQueryOptions(runId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getListSourcesUrl = (params?: ListSourcesParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/api/v1/sources?${stringifiedParams}` : `/api/v1/sources`
}

/**
 * @summary Sources
 */
export const listSources = async (params?: ListSourcesParams, options?: Parameters<typeof apiFetch>[1]): Promise<SourcePage> => {

  return apiFetch<SourcePage>(getListSourcesUrl(params),
  {
    ...options,
    method: 'GET'


  }
);}





export const getListSourcesQueryKey = (params?: ListSourcesParams,) => {
    return [
    `/api/v1/sources`, ...(params ? [params] : [])
    ] as const;
    }


export const getListSourcesQueryOptions = <TData = Awaited<ReturnType<typeof listSources>>, TError = ErrorResponse>(params?: ListSourcesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSources>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListSourcesQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listSources>>> = ({ signal }) => listSources(params, { signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listSources>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListSourcesQueryResult = NonNullable<Awaited<ReturnType<typeof listSources>>>
export type ListSourcesQueryError = ErrorResponse


export function useListSources<TData = Awaited<ReturnType<typeof listSources>>, TError = ErrorResponse>(
 params: undefined |  ListSourcesParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSources>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listSources>>,
          TError,
          Awaited<ReturnType<typeof listSources>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListSources<TData = Awaited<ReturnType<typeof listSources>>, TError = ErrorResponse>(
 params?: ListSourcesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSources>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listSources>>,
          TError,
          Awaited<ReturnType<typeof listSources>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListSources<TData = Awaited<ReturnType<typeof listSources>>, TError = ErrorResponse>(
 params?: ListSourcesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSources>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Sources
 */

export function useListSources<TData = Awaited<ReturnType<typeof listSources>>, TError = ErrorResponse>(
 params?: ListSourcesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSources>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListSourcesQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getGetSourceUrl = (sourceId: string,) => {




  return `/api/v1/sources/${sourceId}`
}

/**
 * @summary Source
 */
export const getSource = async (sourceId: string, options?: Parameters<typeof apiFetch>[1]): Promise<SourceInfo> => {

  return apiFetch<SourceInfo>(getGetSourceUrl(sourceId),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetSourceQueryKey = (sourceId: string,) => {
    return [
    `/api/v1/sources/${sourceId}`
    ] as const;
    }


export const getGetSourceQueryOptions = <TData = Awaited<ReturnType<typeof getSource>>, TError = ErrorResponse>(sourceId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getSource>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetSourceQueryKey(sourceId);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getSource>>> = ({ signal }) => getSource(sourceId, { signal, ...requestOptions });





   return  { queryKey, queryFn, enabled: sourceId !== null && sourceId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getSource>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetSourceQueryResult = NonNullable<Awaited<ReturnType<typeof getSource>>>
export type GetSourceQueryError = ErrorResponse


export function useGetSource<TData = Awaited<ReturnType<typeof getSource>>, TError = ErrorResponse>(
 sourceId: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getSource>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getSource>>,
          TError,
          Awaited<ReturnType<typeof getSource>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetSource<TData = Awaited<ReturnType<typeof getSource>>, TError = ErrorResponse>(
 sourceId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getSource>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getSource>>,
          TError,
          Awaited<ReturnType<typeof getSource>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetSource<TData = Awaited<ReturnType<typeof getSource>>, TError = ErrorResponse>(
 sourceId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getSource>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Source
 */

export function useGetSource<TData = Awaited<ReturnType<typeof getSource>>, TError = ErrorResponse>(
 sourceId: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getSource>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetSourceQueryOptions(sourceId,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getListSourceVersionsUrl = (sourceId: string,
    params?: ListSourceVersionsParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/api/v1/sources/${sourceId}/versions?${stringifiedParams}` : `/api/v1/sources/${sourceId}/versions`
}

/**
 * @summary Versions
 */
export const listSourceVersions = async (sourceId: string,
    params?: ListSourceVersionsParams, options?: Parameters<typeof apiFetch>[1]): Promise<VersionPage> => {

  return apiFetch<VersionPage>(getListSourceVersionsUrl(sourceId,params),
  {
    ...options,
    method: 'GET'


  }
);}





export const getListSourceVersionsQueryKey = (sourceId: string,
    params?: ListSourceVersionsParams,) => {
    return [
    `/api/v1/sources/${sourceId}/versions`, ...(params ? [params] : [])
    ] as const;
    }


export const getListSourceVersionsQueryOptions = <TData = Awaited<ReturnType<typeof listSourceVersions>>, TError = ErrorResponse>(sourceId: string,
    params?: ListSourceVersionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSourceVersions>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListSourceVersionsQueryKey(sourceId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listSourceVersions>>> = ({ signal }) => listSourceVersions(sourceId,params, { signal, ...requestOptions });





   return  { queryKey, queryFn, enabled: sourceId !== null && sourceId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listSourceVersions>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListSourceVersionsQueryResult = NonNullable<Awaited<ReturnType<typeof listSourceVersions>>>
export type ListSourceVersionsQueryError = ErrorResponse


export function useListSourceVersions<TData = Awaited<ReturnType<typeof listSourceVersions>>, TError = ErrorResponse>(
 sourceId: string,
    params: undefined |  ListSourceVersionsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSourceVersions>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listSourceVersions>>,
          TError,
          Awaited<ReturnType<typeof listSourceVersions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListSourceVersions<TData = Awaited<ReturnType<typeof listSourceVersions>>, TError = ErrorResponse>(
 sourceId: string,
    params?: ListSourceVersionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSourceVersions>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listSourceVersions>>,
          TError,
          Awaited<ReturnType<typeof listSourceVersions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListSourceVersions<TData = Awaited<ReturnType<typeof listSourceVersions>>, TError = ErrorResponse>(
 sourceId: string,
    params?: ListSourceVersionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSourceVersions>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Versions
 */

export function useListSourceVersions<TData = Awaited<ReturnType<typeof listSourceVersions>>, TError = ErrorResponse>(
 sourceId: string,
    params?: ListSourceVersionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSourceVersions>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListSourceVersionsQueryOptions(sourceId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getGetLivenessUrl = () => {




  return `/health/live`
}

/**
 * @summary Live
 */
export const getLiveness = async ( options?: Parameters<typeof apiFetch>[1]): Promise<GetLiveness200> => {

  return apiFetch<GetLiveness200>(getGetLivenessUrl(),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetLivenessQueryKey = () => {
    return [
    `/health/live`
    ] as const;
    }


export const getGetLivenessQueryOptions = <TData = Awaited<ReturnType<typeof getLiveness>>, TError = ErrorResponse>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLiveness>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetLivenessQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getLiveness>>> = ({ signal }) => getLiveness({ signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getLiveness>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetLivenessQueryResult = NonNullable<Awaited<ReturnType<typeof getLiveness>>>
export type GetLivenessQueryError = ErrorResponse


export function useGetLiveness<TData = Awaited<ReturnType<typeof getLiveness>>, TError = ErrorResponse>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLiveness>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getLiveness>>,
          TError,
          Awaited<ReturnType<typeof getLiveness>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetLiveness<TData = Awaited<ReturnType<typeof getLiveness>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLiveness>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getLiveness>>,
          TError,
          Awaited<ReturnType<typeof getLiveness>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetLiveness<TData = Awaited<ReturnType<typeof getLiveness>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLiveness>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Live
 */

export function useGetLiveness<TData = Awaited<ReturnType<typeof getLiveness>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getLiveness>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetLivenessQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getGetReadinessUrl = () => {




  return `/health/ready`
}

/**
 * @summary Ready
 */
export const getReadiness = async ( options?: Parameters<typeof apiFetch>[1]): Promise<GetReadiness200> => {

  return apiFetch<GetReadiness200>(getGetReadinessUrl(),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetReadinessQueryKey = () => {
    return [
    `/health/ready`
    ] as const;
    }


export const getGetReadinessQueryOptions = <TData = Awaited<ReturnType<typeof getReadiness>>, TError = ErrorResponse>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getReadiness>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetReadinessQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getReadiness>>> = ({ signal }) => getReadiness({ signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getReadiness>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetReadinessQueryResult = NonNullable<Awaited<ReturnType<typeof getReadiness>>>
export type GetReadinessQueryError = ErrorResponse


export function useGetReadiness<TData = Awaited<ReturnType<typeof getReadiness>>, TError = ErrorResponse>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getReadiness>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getReadiness>>,
          TError,
          Awaited<ReturnType<typeof getReadiness>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetReadiness<TData = Awaited<ReturnType<typeof getReadiness>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getReadiness>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getReadiness>>,
          TError,
          Awaited<ReturnType<typeof getReadiness>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetReadiness<TData = Awaited<ReturnType<typeof getReadiness>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getReadiness>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Ready
 */

export function useGetReadiness<TData = Awaited<ReturnType<typeof getReadiness>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getReadiness>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetReadinessQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getGetTileUrl = (assetId: string,
    z: number,
    x: number,
    y: number,
    params?: GetTileParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/tiles/${assetId}/${z}/${x}/${y}.png?${stringifiedParams}` : `/tiles/${assetId}/${z}/${x}/${y}.png`
}

/**
 * @summary Tile
 */
export const getTile = async (assetId: string,
    z: number,
    x: number,
    y: number,
    params?: GetTileParams, options?: Parameters<typeof apiFetch>[1]): Promise<void> => {

  return apiFetch<void>(getGetTileUrl(assetId,z,x,y,params),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetTileQueryKey = (assetId: string,
    z: number,
    x: number,
    y: number,
    params?: GetTileParams,) => {
    return [
    `/tiles/${assetId}/${z}/${x}/${y}.png`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetTileQueryOptions = <TData = Awaited<ReturnType<typeof getTile>>, TError = ErrorResponse>(assetId: string,
    z: number,
    x: number,
    y: number,
    params?: GetTileParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getTile>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetTileQueryKey(assetId,z,x,y,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getTile>>> = ({ signal }) => getTile(assetId,z,x,y,params, { signal, ...requestOptions });





   return  { queryKey, queryFn, enabled: assetId !== null && assetId !== undefined && z !== null && z !== undefined && x !== null && x !== undefined && y !== null && y !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getTile>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetTileQueryResult = NonNullable<Awaited<ReturnType<typeof getTile>>>
export type GetTileQueryError = ErrorResponse


export function useGetTile<TData = Awaited<ReturnType<typeof getTile>>, TError = ErrorResponse>(
 assetId: string,
    z: number,
    x: number,
    y: number,
    params: undefined |  GetTileParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getTile>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getTile>>,
          TError,
          Awaited<ReturnType<typeof getTile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetTile<TData = Awaited<ReturnType<typeof getTile>>, TError = ErrorResponse>(
 assetId: string,
    z: number,
    x: number,
    y: number,
    params?: GetTileParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getTile>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getTile>>,
          TError,
          Awaited<ReturnType<typeof getTile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetTile<TData = Awaited<ReturnType<typeof getTile>>, TError = ErrorResponse>(
 assetId: string,
    z: number,
    x: number,
    y: number,
    params?: GetTileParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getTile>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Tile
 */

export function useGetTile<TData = Awaited<ReturnType<typeof getTile>>, TError = ErrorResponse>(
 assetId: string,
    z: number,
    x: number,
    y: number,
    params?: GetTileParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getTile>>, TError, TData>>, request?: SecondParameter<typeof apiFetch>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetTileQueryOptions(assetId,z,x,y,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}
