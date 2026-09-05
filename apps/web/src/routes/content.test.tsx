import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AboutPage from './about'
import MethodologyPage from './methodology'

describe('scientific content pages', () => {
  it('keeps the methodology scientifically qualified', () => {
    render(<MethodologyPage />)
    expect(screen.getByRole('heading', { name: 'تفسیر و انتشار.' })).toBeInTheDocument()
    expect(document.querySelector('svg[aria-label="برداشت نخست، t₀"]')).toBeInTheDocument()
    expect(document.querySelectorAll('.paper-figure img')).toHaveLength(0)
    expect(document.querySelectorAll('.paper-figure svg')).toHaveLength(3)
    expect(screen.getByText(/بیش از ۶۰۰۰ صحنه/)).toBeInTheDocument()
    expect(document.querySelectorAll('.katex')).toHaveLength(7)
    expect(document.querySelector('.paper')?.textContent).not.toMatch(/ساختگی|آزمایشی/)
    expect(document.querySelector('.paper')?.textContent).not.toContain(String.fromCodePoint(8212))
  })

  it('provides the complete English methodology', () => {
    render(<MethodologyPage />)
    fireEvent.click(screen.getByRole('button', { name: 'English' }))
    expect(screen.getByRole('heading', { name: 'Interferometric observation.' })).toBeInTheDocument()
    expect(screen.getByText(/more than 6,000 Sentinel-1 scenes/)).toBeInTheDocument()
    expect(screen.getByText(/cannot assign confidence intervals/)).toBeInTheDocument()
    expect(document.querySelector('.paper')?.textContent).not.toMatch(/synthetic|fixture/i)
  })

  it('renders the supplied dedication and attribution', () => {
    render(<AboutPage />)
    expect(screen.getByText(/وظیفهٔ هر کس در دانش خویش/)).toBeInTheDocument()
    expect(screen.getByText(/مطبعهٔ مجلس دایرةالمعارف العثمانیه/)).toBeInTheDocument()
    expect(screen.getByText('کمیل')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /معرفی/ })).toHaveLength(8)
    expect(document.querySelector('.about-page')?.textContent).not.toContain(String.fromCodePoint(8212))
  })
})
