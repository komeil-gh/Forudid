import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './app/router'
import { LanguageProvider } from './i18n'
import '@fontsource-variable/vazirmatn'
import '@fontsource-variable/estedad'
import '@fontsource-variable/noto-naskh-arabic'
import '@fontsource-variable/source-serif-4'
import 'katex/dist/katex.min.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import './styles.css'
const client = new QueryClient({ defaultOptions: { queries: {
  staleTime: 60_000, retry: 1, refetchOnWindowFocus: false,
} } })
createRoot(document.getElementById('root')!).render(<StrictMode>
  <LanguageProvider><QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider></LanguageProvider>
</StrictMode>)
