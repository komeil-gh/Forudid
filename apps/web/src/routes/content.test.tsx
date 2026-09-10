import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AboutPage from './about'
import MethodologyPage from './methodology'
import { LanguageProvider } from '../i18n'

const renderPage = (page: React.ReactNode, language: 'fa' | 'en' = 'fa') => {
  return render(<LanguageProvider initialLanguage={language}>{page}</LanguageProvider>)
}

describe('scientific content pages', () => {
  afterEach(() => vi.unstubAllEnvs())
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
    vi.stubEnv('VITE_SOURCE_MARKS', 'false')
    renderPage(<AboutPage />)
    expect(screen.getByText(/وظیفهٔ هر کس در دانش خویش/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /به یاد آنان/ })).not.toBeInTheDocument()
    expect(screen.getByText(/مطبعهٔ مجلس دایرةالمعارف العثمانیه/)).toBeInTheDocument()
    expect(screen.getByText('کمیل')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toHaveTextContent('فرودید | پایش ماهواره‌ای فرونشست ایران زمین')
    expect(screen.getByRole('contentinfo')).toHaveTextContent('فرودید تلاشی شخصی و مستقل است')
    expect(document.querySelectorAll('.source-group:not([aria-hidden]) img')).toHaveLength(0)
    expect(document.querySelectorAll('.source-group:not([aria-hidden]) .source-name')).toHaveLength(8)
    expect(screen.getByRole('contentinfo').querySelectorAll('.source-group:not([aria-hidden]) a')).toHaveLength(8)
    expect(screen.getAllByRole('button', { name: /معرفی/ })).toHaveLength(8)
    expect(document.querySelector('.about-letter-watermark')).toHaveAttribute('src', '/brand/selected/forudid-mark-black.png')
    expect(document.querySelector('.about-page')?.textContent).not.toContain(String.fromCodePoint(8212))
  })

  it('renders the English dedication without enlarging the author signature', () => {
    vi.stubEnv('VITE_SOURCE_MARKS', 'true')
    renderPage(<AboutPage />, 'en')
    expect(document.querySelectorAll('.source-group:not([aria-hidden]) img')).toHaveLength(8)
    expect(screen.getByText(/duty of each person in their field of knowledge/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /In memory/ })).not.toBeInTheDocument()
    expect(screen.getByText('Komeil')).toBeInTheDocument()
    expect(screen.getByText('A small part of Iran’s Earth-observation community')).toBeInTheDocument()
    expect(screen.getByText('Tehran, 2026')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Forudid | Satellite monitoring of land subsidence in Iran')
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Forudid is an independent personal project')
    expect(screen.getAllByRole('button', { name: /About/ })).toHaveLength(8)
  })
})
