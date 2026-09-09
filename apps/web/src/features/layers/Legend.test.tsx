import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Legend } from './Legend'
it('shows metadata units, sign convention and missing-data explanation', () => {
  render(<Legend data={{ style: 'test', label: 'LOS Velocity', unit: 'm/year', display_unit: 'mm/year',
    ticks: [-0.1, 0, 0.02], colors: ['#9d2933', '#fff', '#087c83'],
    sign_convention: 'منفی دورشدن', nodata: 'بدون داده شفاف', masked: 'ماسک شفاف' }} />)
  expect(screen.getByText('نرخ در راستای دید ماهواره · mm/year')).toBeInTheDocument()
  expect(screen.getByText('-100')).toBeInTheDocument()
  expect(screen.getByText('منفی دورشدن')).toBeInTheDocument()
})
