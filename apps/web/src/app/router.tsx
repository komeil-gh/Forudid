import { lazy, Suspense } from 'react'
import { createRootRoute, createRoute, createRouter, Link, Outlet } from '@tanstack/react-router'
import { Copy } from 'lucide-react'
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
    <Link to="/" className="brand" aria-label="فرودید، صفحهٔ نخست">
      <img className="brand-mark" src="/brand/selected/forudid-mark-black.png" alt="" width="42" height="42" />
      <span className="brand-wordmark"><strong>{fa.brand}</strong><span className="brand-en" dir="ltr">FORUDID</span></span></Link>
    <nav aria-label="ناوبری اصلی"><Link to="/map" search={defaultSearch}>{fa.map}</Link>
      <Link to="/sources">منابع داده</Link><Link to="/methodology">{fa.methodology}</Link><Link to="/about">{fa.about}</Link></nav>
    <details className="mobile-navigation"><summary>فهرست</summary>
      <nav aria-label="ناوبری موبایل" onClick={event => event.currentTarget.closest('details')?.removeAttribute('open')}>
        <Link to="/map" search={defaultSearch}>{fa.map}</Link><Link to="/sources">منابع داده</Link>
        <Link to="/methodology">{fa.methodology}</Link><Link to="/about">{fa.about}</Link>
      </nav></details>
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
  <main className="article"><h1>فرودید | FORUDID</h1>
    <p>مشاهدهٔ دادهٔ تاریخی تغییرشکل زمین ایران، همراه با منبع، نسخه و محدودیت‌های اندازه‌گیری.</p>
    <p>نقشهٔ نخست، مجموعهٔ منتشرشدهٔ Haghighi–Motagh برای سال‌های ۲۰۱۴ تا ۲۰۲۰ است؛ این داده وضعیت کنونی زمین را نشان نمی‌دهد.</p>
    <Button asChild><Link to="/map" search={defaultSearch}>ورود به نقشهٔ ایران</Link></Button></main> })
const methodologyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/methodology', component: MethodologyPage })
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: AboutPage })
const sourcesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sources',
  component: () => <Suspense fallback={<Status />}><SourcesPage /></Suspense> })
export const router = createRouter({ routeTree: rootRoute.addChildren([
  homeRoute, mapRoute, methodologyRoute, aboutRoute, sourcesRoute,
]) })
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
