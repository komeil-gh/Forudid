import { lazy, Suspense } from 'react'
import { createRootRoute, createRoute, createRouter, Link, Outlet } from '@tanstack/react-router'
import { Search, Copy, LocateFixed } from 'lucide-react'
import { useState } from 'react'
import { defaultSearch, searchSchema } from '../lib/search'
import { fa } from '../messages/fa'
import { Button } from '../components/ui/button'
import { Status } from '../components/Status'
import { Boundary } from '../components/Boundary'

const MapPage = lazy(() => import('../routes/map'))
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
      <Link to="/methodology">{fa.methodology}</Link><Link to="/about">{fa.about}</Link></nav>
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
const methodologyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/methodology', component: () =>
  <main className="article"><h1>{fa.methodology}</h1><p>{fa.scientificNote}</p>
    <h2>اندازه‌گیری نسبی</h2><p>جابه‌جایی نسبت به تاریخ و نقطهٔ مرجع هر محصول تعریف می‌شود. قرارداد علامت، مدار و ترک از فرادادهٔ همان محصول خوانده می‌شوند.</p>
    <h2>از داده تا محصول علمی</h2><p>مسیر علمی هدف Sentinel-1، HyP3 و MintPy است. انتشار محصول واقعی به کنترل کیفیت و تأیید علمی نیاز دارد.</p>
    <h2>وضعیت این نسخه</h2><p>{fa.fixture} دادهٔ کنونی ساختگی است و تنها زنجیرهٔ نقشه، نمونه‌برداری و نمودار را آزمایش می‌کند. هیچ نتیجه‌ای دربارهٔ تغییرشکل واقعی ورامین از آن قابل برداشت نیست.</p>
    <h2>پشتیبانی مرورگر</h2><p>نمایش نقشه به WebGL2 نیاز دارد. داده‌های نقطه و جدول سری زمانی در متن رابط نیز قابل خواندن هستند.</p></main> })
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: () =>
  <main className="article"><h1>دربارهٔ فرودید</h1><p>فرودید یک سامانهٔ علمی و عملیاتی برای مشاهدهٔ تغییرشکل سطح زمین ایران در راستای دید ماهواره است.</p>
    <blockquote>اول یک دشت را درست اندازه بگیر، بعد ایران را اندازه بگیر.</blockquote>
    <p>این نسخه فقط به‌صورت محلی اجرا می‌شود. نام فرودید، کیفیت اندازه‌گیری و قابلیت بازتولید را در مرکز کار قرار می‌دهد.</p>
    <p className="notice">{fa.fixture}</p></main> })
export const router = createRouter({ routeTree: rootRoute.addChildren([
  homeRoute, mapRoute, methodologyRoute, aboutRoute,
]) })
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
