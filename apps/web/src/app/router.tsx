import { lazy, Suspense } from 'react'
import { createRootRoute, createRoute, createRouter, Link, Outlet } from '@tanstack/react-router'
import { Search, Copy, LocateFixed } from 'lucide-react'
import { useState } from 'react'
import { defaultSearch, searchSchema } from '../lib/search'
import { fa } from '../messages/fa'
import { Button } from '../components/ui/button'
import { Status } from '../components/Status'
import { Boundary } from '../components/Boundary'
import MethodologyPage from '../routes/methodology'
import AboutPage from '../routes/about'
import './navigation.css'

const MapPage = lazy(() => import('../routes/map'))
const SourcesPage = lazy(() => import('../routes/sources'))
function Shell() {
  const [copyStatus, setCopyStatus] = useState('')
  async function copy() {
    try { await navigator.clipboard.writeText(location.href); setCopyStatus(fa.copied) }
    catch { setCopyStatus(fa.copyError) }
  }
  return <><header className="header">
    <Link to="/map" search={defaultSearch} className="brand"><LocateFixed aria-hidden="true" />
      <strong>{fa.brand}</strong><span className="brand-en" dir="ltr">| FORUDID</span></Link>
    <nav aria-label="ناوبری اصلی"><Link to="/map" search={defaultSearch}>{fa.map}</Link>
      <Link to="/sources">منابع داده</Link><Link to="/methodology">{fa.methodology}</Link><Link to="/about">{fa.about}</Link></nav>
    <details className="mobile-navigation"><summary>فهرست</summary>
      <nav aria-label="ناوبری موبایل" onClick={event => event.currentTarget.closest('details')?.removeAttribute('open')}>
        <Link to="/map" search={defaultSearch}>{fa.map}</Link><Link to="/sources">منابع داده</Link>
        <Link to="/methodology">{fa.methodology}</Link><Link to="/about">{fa.about}</Link>
      </nav></details>
    <label className="search"><Search size={18} aria-hidden="true" /><span className="sr-only">{fa.search}</span>
      <select aria-label={fa.search} value="varamin" onChange={() => undefined}><option value="varamin">{fa.varamin}</option></select></label>
    <Button onClick={copy} className="copy" aria-label={fa.copy}><Copy size={16} /><span>{fa.copy}</span></Button>
  </header><div className="copy-status" role="status">{copyStatus}</div>
    <Boundary><Outlet /></Boundary></>
}
const rootRoute = createRootRoute({ component: Shell, notFoundComponent: () =>
  <main className="article"><h1>صفحه پیدا نشد</h1><Link to="/map" search={defaultSearch}>{fa.map}</Link></main> })
export const mapRoute = createRoute({ getParentRoute: () => rootRoute, path: '/map',
  validateSearch: (raw) => searchSchema.parse(raw),
  component: () => <Suspense fallback={<Status />}><MapPage /></Suspense>,
})
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () =>
  <main className="article"><h1>فرودید | FORUDID</h1><p>{fa.scientificNote}</p>
    <p>پایش تغییرشکل زمین، با مرجع روشن و کیفیت قابل بررسی. محدودهٔ نخست: دشت ورامین.</p>
    <p className="notice">{fa.fixture}</p><Button asChild><Link to="/map" search={defaultSearch}>ورود به نقشهٔ ورامین</Link></Button></main> })
const methodologyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/methodology', component: MethodologyPage })
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: AboutPage })
const sourcesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sources',
  component: () => <Suspense fallback={<Status />}><SourcesPage /></Suspense> })
export const router = createRouter({ routeTree: rootRoute.addChildren([
  homeRoute, mapRoute, methodologyRoute, aboutRoute, sourcesRoute,
]) })
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
