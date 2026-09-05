import { lazy, Suspense } from 'react'
import { z } from 'zod'
import { createRootRoute, createRoute, createRouter, Link, Outlet } from '@tanstack/react-router'
import { defaultSearch, searchSchema } from '../lib/search'
import { useLanguage, type Language } from '../i18n'
import { Button } from '../components/ui/button'
import { Status } from '../components/Status'
import { Boundary } from '../components/Boundary'
import MethodologyPage from '../routes/methodology'
import AboutPage from '../routes/about'
import './navigation.css'

const MapPage = lazy(() => import('../routes/map'))
const SourcesPage = lazy(() => import('../routes/sources'))
const RegionsPage = lazy(() => import('../routes/regions'))
function Shell() {
  const { language, setLanguage, messages: m } = useLanguage()
  const selectLanguage = (nextLanguage: Language) => {
    if (nextLanguage === language) return
    const viewTransition = (document as Document & { startViewTransition?: (update: () => void) => void }).startViewTransition
    if (viewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      viewTransition.call(document, () => setLanguage(nextLanguage))
    } else setLanguage(nextLanguage)
  }
  return <><header className="header">
    <Link to="/" className="brand" aria-label={m.home}>
      <img className="brand-mark" src="/brand/selected/forudid-mark-black.png" alt="" width="42" height="42" />
      <span className="brand-wordmark"><strong>{language === 'fa' ? 'فرودید' : 'Forudid'}</strong>
        <span className="brand-en">{language === 'fa' ? 'پایش زمین ایران' : 'IRAN EARTH OBSERVATION'}</span></span></Link>
    <nav aria-label={language === 'fa' ? 'ناوبری اصلی' : 'Main navigation'}><Link to="/map" search={defaultSearch}>{m.map}</Link>
      <Link to="/regions">{language === 'fa' ? 'جمعیت و مناطق' : 'Population & regions'}</Link><Link to="/sources">{m.sources}</Link><Link to="/methodology">{m.methodology}</Link><Link to="/about">{m.about}</Link></nav>
    <details className="mobile-navigation"><summary>{m.menu}</summary>
      <nav aria-label={language === 'fa' ? 'ناوبری موبایل' : 'Mobile navigation'} onClick={event => event.currentTarget.closest('details')?.removeAttribute('open')}>
        <Link to="/map" search={defaultSearch}>{m.map}</Link><Link to="/sources">{m.sources}</Link>
        <Link to="/regions">{language === 'fa' ? 'جمعیت و مناطق' : 'Population & regions'}</Link>
        <Link to="/methodology">{m.methodology}</Link><Link to="/about">{m.about}</Link>
      </nav></details>
    <div className="language-switch" role="group" aria-label={m.language}>
      <button type="button" aria-pressed={language === 'fa'} onClick={() => selectLanguage('fa')}>فا</button>
      <button type="button" aria-pressed={language === 'en'} onClick={() => selectLanguage('en')}>EN</button>
    </div>
  </header><Boundary fallback={m.unexpected}><Outlet /></Boundary></>
}
function NotFound() { const { language, messages: m } = useLanguage(); return <main className="article">
  <h1>{language === 'fa' ? 'صفحه پیدا نشد' : 'Page not found'}</h1><Link to="/map" search={defaultSearch}>{m.map}</Link></main> }
const rootRoute = createRootRoute({ component: Shell, notFoundComponent: NotFound })
export const mapRoute = createRoute({ getParentRoute: () => rootRoute, path: '/map',
  validateSearch: (raw) => searchSchema.parse(raw),
  component: () => <Suspense fallback={<Status />}><MapPage /></Suspense>,
})
function Home() { const { language } = useLanguage(); return <main className="article"><h1>فرودید | FORUDID</h1>
  {language === 'fa' ? <><p>مشاهدهٔ دادهٔ تاریخی تغییرشکل زمین ایران، همراه با منبع، نسخه و محدودیت‌های اندازه‌گیری.</p>
    <p>نقشهٔ نخست، مجموعهٔ منتشرشدهٔ Haghighi–Motagh برای سال‌های ۲۰۱۴ تا ۲۰۲۰ است؛ این داده وضعیت کنونی زمین را نشان نمی‌دهد.</p>
    <Button asChild><Link to="/map" search={defaultSearch}>ورود به نقشهٔ ایران</Link></Button></> : <>
    <p>Explore historical land-deformation data for Iran with its source, version, and measurement limitations.</p>
    <p>The initial map is the published Haghshenas Haghighi and Motagh dataset for 2014 to 2020; it does not describe current ground conditions.</p>
    <Button asChild><Link to="/map" search={defaultSearch}>Open the map of Iran</Link></Button></>}</main> }
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Home })
const methodologyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/methodology', component: MethodologyPage })
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: AboutPage })
const sourcesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sources',
  component: () => <Suspense fallback={<Status />}><SourcesPage /></Suspense> })
const regionsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/regions',
  validateSearch: raw => z.object({ region: z.uuid().optional(), product: z.uuid().optional() }).parse(raw),
  component: () => <Suspense fallback={<Status />}><RegionsPage /></Suspense> })
export const router = createRouter({ routeTree: rootRoute.addChildren([
  homeRoute, mapRoute, methodologyRoute, aboutRoute, sourcesRoute, regionsRoute,
]) })
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
