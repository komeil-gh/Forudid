import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fa, layerLabels } from './messages/fa'
import { en, layerLabelsEn } from './messages/en'

export type Language = 'fa' | 'en'
const messages = { fa, en } as const
const labels = { fa: layerLabels, en: layerLabelsEn } as const
const LanguageContext = createContext({
  language: 'fa' as Language,
  setLanguage: (_language: Language) => { void _language },
  messages: fa as typeof fa | typeof en,
  layerLabels: layerLabels as typeof layerLabels | typeof layerLabelsEn,
})

export function LanguageProvider({ children, initialLanguage }: { children: ReactNode, initialLanguage?: Language }) {
  const [language, setLanguage] = useState<Language>(() => initialLanguage ??
    (typeof localStorage?.getItem === 'function' && localStorage.getItem('forudid-language') === 'en' ? 'en' : 'fa'))
  useEffect(() => {
    if (typeof localStorage?.setItem === 'function') localStorage.setItem('forudid-language', language)
    document.documentElement.lang = language
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr'
    document.title = language === 'fa' ? 'فرودید | FORUDID' : 'Forudid | Iran Land Deformation'
  }, [language])
  return <LanguageContext.Provider value={{ language, setLanguage,
    messages: messages[language], layerLabels: labels[language] }}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => useContext(LanguageContext)
