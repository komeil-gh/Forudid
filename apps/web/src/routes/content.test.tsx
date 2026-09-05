import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AboutPage from './about'
import MethodologyPage from './methodology'
import { LanguageProvider } from '../i18n'

const renderPage = (page: React.ReactNode, language: 'fa' | 'en' = 'fa') => {
  return render(<LanguageProvider initialLanguage={language}>{page}</LanguageProvider>)
}

describe('scientific content pages', () => {
  it('keeps the methodology scientifically qualified', () => {
    renderPage(<MethodologyPage />)
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
    renderPage(<MethodologyPage />, 'en')
    expect(screen.getByRole('heading', { name: 'Interferometric observation.' })).toBeInTheDocument()
    expect(screen.getByText(/more than 6,000 Sentinel-1 scenes/)).toBeInTheDocument()
    expect(screen.getByText(/cannot assign confidence intervals/)).toBeInTheDocument()
    expect(document.querySelector('.paper')?.textContent).not.toMatch(/synthetic|fixture/i)
  })

  it('renders the supplied dedication and attribution', () => {
    renderPage(<AboutPage />)
    expect(screen.getByText(/وظیفهٔ هر کس در دانش خویش/)).toBeInTheDocument()
    expect(screen.getByText(/مطبعهٔ مجلس دایرةالمعارف العثمانیه/)).toBeInTheDocument()
    expect(screen.getByText('کمیل')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toHaveTextContent('فرودید | پایش ماهواره‌ای فرونشست ایران زمین')
    expect(screen.getAllByRole('button', { name: /معرفی/ })).toHaveLength(8)
    expect(document.querySelector('.about-binary-watermark')?.textContent).toMatch(/^[01]+$/)
    expect(document.querySelector('.about-page')?.textContent).not.toContain(String.fromCodePoint(8212))
  })

  it('renders the English dedication without enlarging the author signature', () => {
    renderPage(<AboutPage />, 'en')
    expect(screen.getByText(/duty of each person in their field of knowledge/)).toBeInTheDocument()
    expect(screen.getByText('Komeil')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Forudid | Satellite monitoring of land subsidence in Iran')
    expect(screen.getAllByRole('button', { name: /About/ })).toHaveLength(8)
  })
})
