import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { LayerPanel } from './LayerPanel'
import { defaultSearch } from '../../lib/search'
it('switches a layer without carrying a conflicting product identifier', () => {
  const update = vi.fn()
  render(<LayerPanel state={defaultSearch} products={[]} update={update} onMetadata={() => undefined} />)
  fireEvent.click(screen.getByRole('radio', { name: 'Temporal Coherence' }))
  expect(update).toHaveBeenCalledWith({ layer: 'temporal_coherence', product: undefined })
})
