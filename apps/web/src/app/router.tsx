import { lazy, Suspense } from 'react'
import { z } from 'zod'
import { createRootRoute, createRoute, createRouter, Link, Outlet } from '@tanstack/react-router'
import { defaultSearch, searchSchema, assetSearchSchema, defaultAssetSearch, optionalCoordinate } from '../lib/search'
import { useLanguage, type Language } from '../i18n'
import { Button } from '../components/ui/button'
import { Status } from '../components/Status'
import { Boundary } from '../components/Boundary'
import './navigation.css'
import { formatDateRange } from '../lib/date'

const MapPage = lazy(() => import('../routes/map'))
const MethodologyPage = lazy(() => import('../routes/methodology'))
const AboutPage = lazy(() => import('../routes/about'))
const SourcesPage = lazy(() => import('../routes/sources'))
const ComparePage = lazy(() => import('../routes/compare'))
const RegionsPage = lazy(() => import('../routes/regions'))
const AssetsPage = lazy(() => import('../routes/assets'))
const EventsPage = lazy(() => import('../routes/events'))
const EventDetailPage = lazy(() => import('../routes/events').then(module => ({ default: module.EventDetailPage })))
const AssetDetailPage = lazy(() => import('../routes/assets').then(module => ({ default: module.AssetDetailPage })))
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
      <Link to="/events">{language === 'fa' ? 'رخدادها' : 'Events'}</Link>
      <Link to="/assets" search={defaultAssetSearch}>{language === 'fa' ? 'زیرساخت' : 'Infrastructure'}</Link><Link to="/regions">{language === 'fa' ? 'جمعیت و مناطق' : 'Population & regions'}</Link><Link to="/sources">{m.sources}</Link><Link to="/methodology">{m.methodology}</Link><Link to="/about">{m.about}</Link></nav>
    <details className="mobile-navigation"><summary>{m.menu}</summary>
      <nav aria-label={language === 'fa' ? 'ناوبری موبایل' : 'Mobile navigation'} onClick={event => event.currentTarget.closest('details')?.removeAttribute('open')}>
        <Link to="/map" search={defaultSearch}>{m.map}</Link><Link to="/sources">{m.sources}</Link>
        <Link to="/events">{language === 'fa' ? 'رخدادها' : 'Events'}</Link>
        <Link to="/regions">{language === 'fa' ? 'جمعیت و مناطق' : 'Population & regions'}</Link>
        <Link to="/assets" search={defaultAssetSearch}>{language === 'fa' ? 'زیرساخت' : 'Infrastructure'}</Link>
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
    <p>نقشهٔ نخست، مجموعهٔ منتشرشدهٔ Haghighi–Motagh برای بازهٔ {formatDateRange('2014', '2020', language, 'year')} است؛ این داده وضعیت کنونی زمین را نشان نمی‌دهد.</p>
    <Button asChild><Link to="/map" search={defaultSearch}>ورود به نقشهٔ ایران</Link></Button>
    <p>پایلوت ورامین، سری زمانی جداگانه‌ای در راستای دید ماهواره دارد؛ پوشش آن محلی است و مؤلفهٔ قائم محسوب نمی‌شود.</p>
    <Button asChild><Link to="/map" search={{ ...defaultSearch, aoi: 'varamin-comet', layer: 'velocity_los', orbit: 'ascending' }}>پایلوت سری زمانی ورامین</Link></Button>
    <p>برای بررسی یک کار واقعی، قطعهٔ ثبت‌شدهٔ راه‌آهن تهران–مشهد را باز کنید؛ پوشش اندازه‌گیری، پروفایل و بازه‌های آن را برای برنامه‌ریزی بازدید بخوانید. تأیید مسئول مسیر و ارزیابی با کاربر واقعی هنوز انجام نشده است.</p>
    <Button asChild><Link to="/assets" search={{ ...defaultAssetSearch, aoi: 'varamin-comet', product: '5323cc4f-57ec-5347-a85d-14f4887e5d27', q: 'way/1093520814' }}>بررسی قطعهٔ راه‌آهن تهران–مشهد</Link></Button></> : <>
    <p>Explore historical land-deformation data for Iran with its source, version, and measurement limitations.</p>
    <p>The initial map is the published Haghshenas Haghighi and Motagh dataset for 2014 to 2020; it does not describe current ground conditions.</p>
    <Button asChild><Link to="/map" search={defaultSearch}>Open the map of Iran</Link></Button>
    <p>The Varamin pilot provides a separate satellite line-of-sight time series. Its coverage is local and its measurements are not a vertical component.</p>
    <Button asChild><Link to="/map" search={{ ...defaultSearch, aoi: 'varamin-comet', layer: 'velocity_los', orbit: 'ascending' }}>Varamin time-series pilot</Link></Button>
    <p>Open a mapped Tehran–Mashhad railway segment to inspect measurement coverage, its profile and intervals for inspection planning. Route-owner confirmation and evaluation with a real user are still outstanding.</p>
    <Button asChild><Link to="/assets" search={{ ...defaultAssetSearch, aoi: 'varamin-comet', product: '5323cc4f-57ec-5347-a85d-14f4887e5d27', q: 'way/1093520814' }}>Inspect the Tehran–Mashhad railway segment</Link></Button></>}</main> }
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Home })
const methodologyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/methodology', component: () => <Suspense fallback={<Status />}><MethodologyPage /></Suspense> })
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: () => <Suspense fallback={<Status />}><AboutPage /></Suspense> })
const sourcesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sources',
  component: () => <Suspense fallback={<Status />}><SourcesPage /></Suspense> })
const compareRoute = createRoute({ getParentRoute: () => rootRoute, path: '/compare',
  validateSearch: raw => z.object({
    lon: optionalCoordinate(-180, 180),
    lat: optionalCoordinate(-85, 85),
    a: z.uuid().optional().catch(undefined), b: z.uuid().optional().catch(undefined),
    areaA: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/).catch('iran'),
    areaB: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/).catch('iran'),
  }).parse(raw),
  component: () => <Suspense fallback={<Status />}><ComparePage /></Suspense> })
const eventsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/events',
  component: () => <Suspense fallback={<Status />}><EventsPage /></Suspense> })
const eventDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/events/$eventId',
  component: () => <Suspense fallback={<Status />}><EventDetailPage /></Suspense> })
const regionsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/regions',
  validateSearch: raw => z.object({ aoi: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/).optional(), region: z.uuid().optional(), product: z.uuid().optional(), populationVersion: z.uuid().optional() }).parse(raw),
  component: () => <Suspense fallback={<Status />}><RegionsPage /></Suspense> })
const assetsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/assets',
  validateSearch: raw => assetSearchSchema.parse(raw),
  component: () => <Suspense fallback={<Status />}><AssetsPage /></Suspense> })
const assetDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/assets/$assetId',
  validateSearch: raw => z.object({ product: z.uuid().optional(), analysis: z.uuid().optional(), segment: z.coerce.number().int().min(0).max(200000).optional().catch(undefined) }).parse(raw),
  component: () => <Suspense fallback={<Status />}><AssetDetailPage /></Suspense> })
export const router = createRouter({ routeTree: rootRoute.addChildren([
  homeRoute, mapRoute, methodologyRoute, aboutRoute, sourcesRoute, compareRoute, regionsRoute, assetsRoute, assetDetailRoute, eventsRoute, eventDetailRoute,
]) })
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
