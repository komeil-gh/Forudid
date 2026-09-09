import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { LayerPanel } from './LayerPanel'
import { defaultSearch } from '../../lib/search'
import type { ProductInfo } from '../../generated/api/forudid'
vi.mock('../../generated/api/forudid', () => ({ useListAreas: () => ({ data: [] }) }))
it('switches a layer without carrying a conflicting product identifier', () => {
  const update = vi.fn()
  const product: ProductInfo = {
    id: 'seasonal', kind: 'seasonal_amplitude', aoi_id: 'iran', aoi_slug: 'iran',
    assets: [], attribution: 'Test source', bbox: [43, 25, 64, 40], crs: 'EPSG:4326',
    start_date: '2014', end_date: '2020', is_fixture: true, last_acquisition: null,
    measurement_component: 'vertical', measurement_method: 'descending_los_projection',
    orbit_direction: 'descending', processing_run_id: 'run', processing_version: 'test',
    product_version: 'test', reference: null, reference_description: null, relative_orbit: null,
    resolution_metadata: {}, sign_convention: 'nonnegative', source_version_id: 'source',
    status: 'published', time_precision: 'year', timeseries_available: false, unit: 'cm',
  }
  render(<LayerPanel state={defaultSearch} products={[product]} update={update} onMetadata={() => undefined} />)
  expect(screen.queryByRole('radio', { name: 'Temporal Coherence' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('radio', { name: 'دامنهٔ فصلی قله‌تا‌قله' }))
  expect(update).toHaveBeenCalledWith({ layer: 'seasonal_amplitude', product: undefined, run: undefined })
})
