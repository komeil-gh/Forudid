import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LanguageProvider, useLanguage } from './i18n'

function Probe() {
  const { language, setLanguage, messages } = useLanguage()
  return <><span>{messages.map}</span><button onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')}>switch</button></>
}

describe('language selection', () => {
  it('changes copy and document direction', () => {
    render(<LanguageProvider initialLanguage="fa"><Probe /></LanguageProvider>)
    expect(screen.getByText('نقشه')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'switch' }))
    expect(screen.getByText('Map')).toBeInTheDocument()
    expect(document.documentElement.dir).toBe('ltr')
  })
})
