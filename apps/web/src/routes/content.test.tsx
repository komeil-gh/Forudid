import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AboutPage from './about'
import MethodologyPage from './methodology'

describe('scientific content pages', () => {
  it('keeps the methodology scientifically qualified', () => {
    render(<MethodologyPage />)
    expect(screen.getByRole('heading', { name: 'LOS همان فرونشست قائم نیست' })).toBeInTheDocument()
    expect(screen.getByAltText(/دو برداشت راداری/)).toHaveAttribute('src', '/methodology/repeat-pass-los.png')
    expect(screen.getByText(/مشاهدهٔ واقعی ورامین نیستند/)).toBeInTheDocument()
  })

  it('renders the supplied dedication and attribution', () => {
    render(<AboutPage />)
    expect(screen.getByText(/وظیفهٔ هر کس در دانش خویش/)).toBeInTheDocument()
    expect(screen.getByText(/مطبعهٔ مجلس دایرةالمعارف العثمانیه/)).toBeInTheDocument()
    expect(screen.getByText('کمیل')).toBeInTheDocument()
  })
})
