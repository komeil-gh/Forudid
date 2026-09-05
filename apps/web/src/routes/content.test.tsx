import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AboutPage from './about'
import MethodologyPage from './methodology'

describe('scientific content pages', () => {
  it('keeps the methodology scientifically qualified', () => {
    render(<MethodologyPage />)
    expect(screen.getByRole('heading', { name: '۵. مرجع و تفسیر هندسی' })).toBeInTheDocument()
    expect(screen.getByAltText(/هندسهٔ دو برداشت Sentinel-1/)).toHaveAttribute('src', '/methodology/repeat-pass-los.png')
    expect(screen.getByText(/هیچ عددی از این نسخه نباید/)).toBeInTheDocument()
    expect(document.querySelectorAll('.katex')).toHaveLength(7)
    expect(document.querySelector('.paper')?.textContent).not.toContain(String.fromCodePoint(8212))
  })

  it('provides the complete English methodology', () => {
    render(<MethodologyPage />)
    fireEvent.click(screen.getByRole('button', { name: 'English' }))
    expect(screen.getByRole('heading', { name: '2. Observation model' })).toBeInTheDocument()
    expect(screen.getByText(/λ = 0.055465763 m/)).toBeInTheDocument()
    expect(screen.getByText(/reports no geophysical result/)).toBeInTheDocument()
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
