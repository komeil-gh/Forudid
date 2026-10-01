import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { LanguageProvider } from '../../i18n'
import type { TimeSeries } from '../../generated/api/forudid'
import TimeSeriesChart from './TimeSeriesChart'

const chart = vi.hoisted(() => ({ setOption: vi.fn(), dispose: vi.fn(), resize: vi.fn(), dispatchAction: vi.fn() }))
vi.mock('echarts/core', () => ({ use: vi.fn(), init: vi.fn(() => chart) }))
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks() })

it('creates table rows only while expanded, retaining dates, missing observations and chart state', () => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  const data: TimeSeries = { coordinate: { lon: 0, lat: 0 }, is_fixture: true,
    orbit_direction: 'ascending', reference_date: '2026-07-30', reference_point_id: 'test',
    relative_orbit: 0, run_id: 'test', unit: 'm', series: [
      { date: '2026-07-30', displacement: 0, uncertainty: null },
      { date: '2026-07-31', displacement: null, uncertainty: null },
    ] }
  const { container, unmount } = render(<LanguageProvider initialLanguage="fa"><TimeSeriesChart data={data} /></LanguageProvider>)
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
  const details = container.querySelector('details')!
  details.open = true
  fireEvent(details, new Event('toggle'))
  expect(screen.getAllByRole('row')).toHaveLength(3)
  expect(screen.getByText('۹ مرداد ۱۴۰۵')).toBeInTheDocument()
  expect(screen.getByText('ناموجود')).toBeInTheDocument()
  expect(screen.getByText('۰٫۰')).toBeInTheDocument()
  details.open = false
  fireEvent(details, new Event('toggle'))
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
  expect(chart.setOption).toHaveBeenCalledTimes(1)
  expect(chart.dispose).not.toHaveBeenCalled()
  unmount()
  expect(chart.dispose).toHaveBeenCalledTimes(1)
})
