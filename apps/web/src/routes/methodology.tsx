import { type ReactNode } from 'react'
import katex from 'katex'
import '@fontsource-variable/noto-naskh-arabic'
import 'katex/dist/katex.min.css'
import { RepeatPassGeometry } from './methodology-figures'
import { useLanguage } from '../i18n'
import { formatDateRange } from '../lib/date'

const references = [
  ['[1]', 'Ferretti, A., Monti-Guarnieri, A., Prati, C., Rocca, F., and Massonnet, D. (2007). InSAR Principles: Guidelines for SAR Interferometry Processing and Interpretation. ESA TM-19.', 'https://www.esa.int/esapub/tm/tm19/TM-19_ptA.pdf'],
  ['[2]', 'Alaska Satellite Facility. Sentinel-1 InSAR Product Guide. HyP3 documentation.', 'https://hyp3-docs.asf.alaska.edu/guides/insar_product_guide/'],
  ['[3]', 'Haghshenas Haghighi, M., and Motagh, M. (2024). Uncovering the impacts of depleting aquifers: A remote sensing analysis of land subsidence in Iran. Science Advances, 10, eadk3039.', 'https://doi.org/10.1126/sciadv.adk3039'],
  ['[4]', 'Haghshenas Haghighi, M., and Motagh, M. (2024). Land Subsidence in Iran Estimated from a Nationwide InSAR Analysis of Sentinel-1 Observations 2014-2020. Zenodo, version 1.0.0.', 'https://doi.org/10.5281/zenodo.10815578'],
  ['[5]', 'MintPy contributors. Small-baseline time-series workflow and phase-closure diagnostics.', 'https://mintpy.readthedocs.io/en/latest/'],
  ['[6]', 'U.S. Geological Survey. Aquifer Compaction due to Groundwater Pumping.', 'https://www.usgs.gov/centers/land-subsidence-in-california/science/aquifer-compaction-due-groundwater-pumping'],
  ['[7]', 'Galloway, D., Jones, D. R., and Ingebritsen, S. E., editors (1999). Land Subsidence in the United States. USGS Circular 1182.', 'https://pubs.usgs.gov/circ/circ1182/'],
  ['[8]', 'COMET. LiCS Land Subsidence Portal: Technical Information.', 'https://comet-subsidencedb.org/technical-information'],
  ['[9]', 'COMET. Varamin region 000001, ascending frame 028A_05385_191813.', 'https://comet-subsidencedb.org/region/000001'],
  ['[10]', 'LiCSBAS contributors. Reviewed measurement-contract source revision a145e6c.', 'https://github.com/comet-licsar/LiCSBAS/commit/a145e6c4217b29eb7348ea95630454a099809098'],
] as const

function Equation({ number, children }: { number: number, children: string }) {
  const html = katex.renderToString(children, { displayMode: true, throwOnError: true })
  return <div className="paper-equation" dir="ltr">
    <span aria-label={children} dangerouslySetInnerHTML={{ __html: html }} />
    <b>({number})</b>
  </div>
}

function Figure({ children, label, caption }: { children: ReactNode, label: string, caption: string }) {
  return <figure className="paper-figure"><div className="paper-figure-content">{children}</div>
    <figcaption><strong>{label} {label === 'Figure' ? '1' : '۱'}.</strong> {caption}</figcaption></figure>
}

function References({ title }: { title: string }) {
  return <footer className="paper-references"><h2>{title}</h2><ol>{references.map(([number, citation, href]) =>
    <li key={href}><a href={href} target="_blank" rel="noreferrer"><span>{number}</span> {citation}</a></li>)}</ol></footer>
}

function ProductContract({ english = false }: { english?: boolean }) {
  const language = english ? 'en' : 'fa'
  const historical = formatDateRange('2014', '2020', language, 'year')
  const comet = formatDateRange('2014-10-19', '2026-07-31', language)
  return <section className="product-contract" aria-labelledby="product-contract-title">
    <h2 id="product-contract-title">{english ? 'Product contracts currently published by Forudid' : 'قرارداد محصولات منتشرشده در فرودید'}</h2>
    <div className="product-contract-scroll" tabIndex={0} role="region" aria-label={english ? 'Comparison of deformation products' : 'مقایسهٔ محصولات تغییرشکل'}>
      <table><thead><tr><th scope="col">{english ? 'Property' : 'ویژگی'}</th><th scope="col">{english ? 'Nationwide historical product' : 'محصول تاریخی سراسری'}</th><th scope="col">{english ? 'COMET Varamin pilot' : 'پایلوت ورامین COMET'}</th></tr></thead>
        <tbody>
          <tr><th scope="row">{english ? 'Observation period' : 'بازهٔ مشاهده'}</th><td>{historical}</td><td>{comet}</td></tr>
          <tr><th scope="row">{english ? 'Measured component' : 'مؤلفهٔ اندازه‌گیری'}</th><td>{english ? 'Positive subsidence magnitude projected to vertical from descending LOS' : 'بزرگی مثبت فرونشست؛ تصویرشده از LOS نزولی به قائم'}</td><td>{english ? 'Ascending LOS; positive toward the satellite and negative away' : 'LOS صعودی؛ مثبت به‌سوی ماهواره و منفی دور از آن'}</td></tr>
          <tr><th scope="row">{english ? 'Temporal product' : 'محصول زمانی'}</th><td>{english ? 'Annual rate and peak-to-peak seasonal amplitude; no pixel time series' : 'نرخ سالانه و دامنهٔ فصلی قله‌تا‌قله؛ بدون سری زمانی پیکسل'}</td><td>{english ? 'Velocity plus 323 dated displacement epochs' : 'سرعت به‌همراه ۳۲۳ برداشت تاریخ‌دار جابه‌جایی'}</td></tr>
          <tr><th scope="row">{english ? 'Reference and correction' : 'مرجع و تصحیح'}</th><td>{english ? 'Patchwise reference and atmospheric correction reported by the source' : 'مرجع و تصحیح جوی قطعه‌ای، مطابق گزارش منبع'}</td><td>{english ? 'One source reference pixel; unfiltered, with no GACOS correction' : 'یک پیکسل مرجع منبع؛ بدون فیلتر و بدون تصحیح GACOS'}</td></tr>
          <tr><th scope="row">{english ? 'Uncertainty status' : 'وضعیت عدم‌قطعیت'}</th><td>{english ? 'No distributed pixel uncertainty' : 'عدم‌قطعیت پیکسلی توزیع نشده است'}</td><td>{english ? 'No pixel velocity or displacement uncertainty; mean coherence is not temporal coherence' : 'عدم‌قطعیت پیکسلی سرعت و جابه‌جایی ارائه نشده؛ همدوسی میانگین، همدوسی زمانی نیست'}</td></tr>
        </tbody></table>
    </div>
    <p>{english ? 'These products must not be differenced, merged, or treated as independent confirmation without harmonising component, sign, reference frame, observation period, spatial support, and corrections. COMET describes the portal data as not independently verified [8–10].' : 'این دو محصول بدون همسان‌سازی مؤلفه، علامت، چارچوب مرجع، بازهٔ مشاهده، گسترهٔ مکانی و تصحیحات نباید از هم کم، با هم ادغام یا تأیید مستقل یکدیگر تلقی شوند. COMET داده‌های درگاه را فاقد اعتبارسنجی مستقل معرفی می‌کند [۸–۱۰].'}</p>
  </section>
}

function InterpretationNotes({ english = false }: { english?: boolean }) {
  return <>
    <section><h2>{english ? 'What the temporal model estimates.' : 'مدل زمانی چه چیزی را برآورد می‌کند؟'}</h2>
      <p>{english ? 'In Eq. (4), t is elapsed time in days from a fixed origin, X is displacement, and ε is the residual. The annual period is 365 days as written in the source model. β₁ is the offset; β₂ and β₃ describe the polynomial trend. The instantaneous trend slope is β₂ + 2β₃t, so β₂ alone is not a time-independent velocity when the quadratic term is retained. The sinusoidal coefficients determine the following amplitude identities; these are algebraic consequences of the model, not additional measured products.' : 'در رابطهٔ (۴)، t زمان سپری‌شده برحسب روز از یک مبدأ ثابت، X جابه‌جایی و ε باقی‌ماندهٔ مدل است. دورهٔ سالانه مطابق مدل منبع ۳۶۵ روز نوشته شده است. β₁ عرض از مبدأ است و β₂ و β₃ روند چندجمله‌ای را توصیف می‌کنند. شیب لحظه‌ای روند برابر β₂ + ۲β₃t است؛ پس با حفظ جملهٔ درجهٔ دوم، β₂ به‌تنهایی سرعت ثابت در تمام بازه نیست. روابط زیر از مدل به‌صورت جبری نتیجه می‌شوند و محصول اندازه‌گیری تازه‌ای نیستند.'}</p>
      <Equation number={6}>{String.raw`A=\sqrt{\beta_4^2+\beta_5^2},\qquad A_{\mathrm{pp}}=2A`}</Equation>
      <p>{english ? 'The published seasonal raster is peak-to-peak amplitude, Aₚₚ [4]. It is neither an error bar nor cumulative subsidence. Rate and amplitude alone cannot reconstruct a pixel time series: seasonal phase, offsets, higher-order coefficients, and residuals are not supplied in this snapshot.' : 'رستر فصلی منتشرشده دامنهٔ قله‌تا‌قله، یعنی Aₚₚ است [۴]. این مقدار نه میلهٔ خطاست و نه فرونشست تجمعی. از نرخ و دامنه به‌تنهایی نمی‌توان سری زمانی پیکسل را بازسازی کرد؛ فاز نوسان، عرض از مبدأ، ضرایب مرتبهٔ بالاتر و باقی‌مانده‌ها در این نسخه ارائه نشده‌اند.'}</p>
    </section>
    <section><h2>{english ? 'Geometry and identifiability.' : 'هندسه و امکان تعیین مؤلفه‌ها.'}</h2>
      <p>{english ? 'Let ℓ be the unit vector from ground to sensor, and let uE, uN, and uU be east, north, and upward displacement. A single LOS measurement constrains one projection of three unknown components. Here θ is the incidence angle measured from the upward vertical, so ℓU = cos θ [1, 2].' : 'بردار یکهٔ ℓ را از زمین به سنجنده و مؤلفه‌های uE، uN و uU را به‌ترتیب جابه‌جایی به شرق، شمال و بالا تعریف می‌کنیم. یک مشاهدهٔ LOS تنها یک تصویر از سه مؤلفهٔ مجهول را مقید می‌کند. در این قرارداد، θ زاویهٔ تابش نسبت به قائمِ رو به بالاست و ℓU = cos θ خواهد بود [۱، ۲].'}</p>
      <Equation number={7}>{String.raw`d_{\mathrm{LOS}}=\ell_Eu_E+\ell_Nu_N+\cos\theta\,u_U`}</Equation>
      <p>{english ? 'Dividing by cos θ introduces a vertical bias of (ℓEuE + ℓNuN)/cos θ if horizontal motion exists. This follows directly from Eq. (7). Two viewing geometries still provide only two equations for three components unless an additional constraint is introduced. The source rate is a positive subsidence magnitude, whereas upward-positive uU has the opposite sign for subsidence. These conventions must remain distinct.' : 'اگر حرکت افقی وجود داشته باشد، تقسیم بر cos θ سوگیری قائمِ (ℓEuE + ℓNuN)/cos θ را وارد می‌کند؛ این نتیجه مستقیماً از رابطهٔ (۷) به دست می‌آید. دو هندسهٔ دید نیز بدون قید اضافی فقط دو معادله برای سه مؤلفه فراهم می‌کنند. نرخ منبع، بزرگی مثبت فرونشست است، درحالی‌که uU با قرارداد رو به بالا برای فرونشست منفی می‌شود. این دو قرارداد نباید با یکدیگر اشتباه شوند.'}</p>
    </section>
    <section><h2>{english ? 'Error structure and independent validation.' : 'ساختار خطا و اعتبارسنجی مستقل.'}</h2>
      <p>{english ? 'An interferometric phase difference contains deformation together with residual atmospheric, topographic, orbital, and scattering contributions [1, 2]. Phase unwrapping also requires resolving integer multiples of 2π. A smooth-looking map is therefore not sufficient evidence of accuracy. Time-series workflows use network consistency, phase closure, and temporal coherence to diagnose inversion problems [5]; MintPy is cited here for these diagnostics, not as the processor of this dataset.' : 'اختلاف فاز تداخل‌سنجی، همراه با تغییرشکل، سهم باقی‌ماندهٔ جو، توپوگرافی، مدار و پراکندگی بازتاب را دربر دارد [۱، ۲]. گشودن فاز نیز به تعیین مضرب‌های صحیح ۲π نیاز دارد. بنابراین ظاهر صاف نقشه شاهد کافی برای دقت نیست. در پردازش سری زمانی، سازگاری شبکه، بستار فاز و همدوسی زمانی برای تشخیص اشکال وارون‌سازی به کار می‌روند [۵]. ارجاع به MintPy در اینجا برای توضیح این آزمون‌هاست و آن را پردازشگر این مجموعه‌داده معرفی نمی‌کند.'}</p>
      <p>{english ? 'Independent comparison with GNSS or levelling must align observation period, spatial support, reference frame, and displacement direction. Residual scatter alone does not capture systematic bias or spatially correlated atmospheric errors. The distributed snapshot has no pixelwise uncertainty or time series, so Forudid cannot assign confidence intervals from its rate raster. A valid zero is retained as zero; an absent pixel remains unknown.' : 'مقایسهٔ مستقل با GNSS یا ترازیابی مستلزم تطبیق بازهٔ مشاهده، گسترهٔ مکانی اندازه‌گیری، چارچوب مرجع و راستای جابه‌جایی است. پراکندگی باقی‌مانده به‌تنهایی سوگیری سیستماتیک یا خطای جوی هم‌بستهٔ مکانی را پوشش نمی‌دهد. نسخهٔ توزیع‌شده عدم‌قطعیت پیکسلی و سری زمانی ندارد؛ ازاین‌رو فرودید نمی‌تواند از رستر نرخ برای هر پیکسل فاصلهٔ اطمینان بسازد. صفر معتبر، صفر باقی می‌ماند و پیکسل فاقد داده، نامعلوم.'}</p>
    </section>
    <section><h2>{english ? 'From displacement to hydrogeological interpretation.' : 'از جابه‌جایی تا تفسیر آب‌زمین‌شناختی.'}</h2>
      <p>{english ? 'Groundwater withdrawal can reduce pore pressure and increase effective stress, compacting susceptible sediments. Fine-grained layers can undergo largely irreversible compaction when historical preconsolidation stress is exceeded [6, 7]. Seasonal motion may include recoverable deformation, but its amplitude alone does not establish elastic storage. Attribution at a site requires groundwater levels, stratigraphy, pumping history, and other evidence. A historical subsidence rate does not by itself quantify groundwater loss, structural damage, or the present-day rate.' : 'برداشت آب زیرزمینی می‌تواند با کاهش فشار آب منفذی و افزایش تنش مؤثر، رسوبات مستعد را متراکم کند. در لایه‌های ریزدانه، عبور از تنش پیش‌تحکیمی تاریخی می‌تواند به تراکم عمدتاً برگشت‌ناپذیر بینجامد [۶، ۷]. حرکت فصلی ممکن است بخشی برگشت‌پذیر داشته باشد، اما دامنهٔ آن به‌تنهایی ذخیرهٔ کشسان آبخوان را تعیین نمی‌کند. انتساب علت در یک محل به تراز آب زیرزمینی، لایه‌بندی، تاریخچهٔ برداشت و شواهد دیگر نیاز دارد. نرخ تاریخی فرونشست به‌تنهایی حجم آب ازدست‌رفته، آسیب سازه یا نرخ امروز را مشخص نمی‌کند.'}</p>
    </section>
  </>
}

function PersianPaper() {
  const historical = formatDateRange('2014', '2020', 'fa', 'year')
  return <article className="paper" lang="fa" dir="rtl">
    <aside className="paper-stamp" aria-hidden="true">FORUDID · METHODS NOTE · ۱۴۰۵</aside>
    <header className="paper-header">
      <h1>روش، منشأ و حدود تفسیر محصولات تغییرشکل زمین فرودید</h1>
      <p className="paper-author">کمیل</p>
      <p className="paper-affiliation">پروژهٔ فرودید، طهران، ایران</p>
      <section className="paper-abstract" aria-label="چکیده">
        <p>این یادداشت مبنای اندازه‌گیری، روش پردازش و حدود تفسیر دو خانوادهٔ داده را بررسی می‌کند: محصول تاریخی سراسری با پوشش تقویمی {historical} و پایلوت سری زمانی LOS ورامین. محصول تاریخی از بیش از ۶۰۰۰ صحنهٔ Sentinel-1 در ده مسیر نزولی ساخته شده است [۳، ۴]. فرودید قرارداد مؤلفه، علامت، واحد، مرجع و تاریخ هر منبع را جدا نگه می‌دارد. در ادامه، مشاهدهٔ فاز از مدل جابه‌جایی، دامنهٔ فصلی از عدم‌قطعیت، و تغییرشکل اندازه‌گیری‌شده از تفسیر آب‌زمین‌شناختی تفکیک می‌شود.</p></section>
    </header>

    <ProductContract />

    <div className="paper-body">
      <section><h2>دامنهٔ داده.</h2>
        <p>نسخهٔ ثبت‌شده شامل رستر نرخ سالانه، دامنهٔ فصلی و ماسک فرونشست است. ناشر، نرخ و دامنهٔ فصلی را حاصل تصویرکردن اندازه‌گیری راستای دید نزولی به راستای قائم معرفی می‌کند [۴]. بنابراین این دو رستر نباید محصول LOS نامیده شوند. این تبدیل بر فرض ناچیزبودن مؤلفهٔ افقی نسبت به مؤلفهٔ قائم استوار است [۳].</p>
        <p>بازهٔ زمانی، روش و واحد از فرادادهٔ منبع خوانده می‌شوند. پیکسل NoData به معنی نبود مقدار معتبر است، نه زمین پایدار و نه نرخ صفر. ثبت checksum فقط اصالت فایل دریافت‌شده را نشان می‌دهد و جای ارزیابی علمی محصول را نمی‌گیرد.</p>
      </section>

      <section><h2>مشاهدهٔ تداخل‌سنجی.</h2>
        <p>هر تصویر SLC دامنه و فاز بازتاب راداری را نگه می‌دارد. برای دو تصویر هم‌ثبت‌شده، تداخل‌نما از ضرب مختلط یک تصویر در مزدوج تصویر دیگر ساخته می‌شود و فاز آن اختلاف فاز دو مشاهده است [۱]. ترتیب تصاویر، علامت فاز را تعیین می‌کند.</p>
        <Equation number={1}>{String.raw`\begin{aligned}I_{12}&=s_1s_2^{*}\\\Delta\phi&=\arg(I_{12})\end{aligned}`}</Equation>
        <p>در قرارداد HyP3، پس از کم‌کردن فاز نقطهٔ مرجع، جابه‌جایی LOS مثبت به سوی سنجنده و منفی دور از آن است [۲]. این قرارداد را نمی‌توان بدون بررسی فراداده به محصول هر پردازشگر تعمیم داد.</p>
        <Equation number={2}>{String.raw`d_{\mathrm{LOS}}=-\frac{\lambda}{4\pi}\left(\Delta\phi-\Delta\phi_{\mathrm{ref}}\right)`}</Equation>
      </section>

      <Figure label="شکل" caption="دو برداشت تکراری فاصله‌های R₁ و R₂ را ثبت می‌کنند. تغییر فاصله به اختلاف فاز تبدیل می‌شود؛ علامت نهایی تابع قرارداد پردازش است.">
        <RepeatPassGeometry labels={['برداشت نخست، t₀', 'برداشت دوم، t₀ + Δt', 'اختلاف فاز و طول موج']} />
      </Figure>

      <section><h2>پردازش گزارش‌شده در منبع.</h2>
        <p>در مطالعهٔ اصلی، قاب‌های هم‌تاریخ هر مسیر به نوارهای بلند SLC متصل و یک تاریخ در هر مسیر مرجع هم‌ثبت‌سازی شد. شبکه با فاصلهٔ زمانی مطلوب ۶۰ روز ساخته شد و هر تصویر به دو تصویر نزدیک به این فاصله متصل شد. تداخل‌نماها در راستای برد و آزیموت با ضرایب ۱۰ در ۲ چندنگری شدند [۳].</p>
        <p>مدار دقیق و مدل ارتفاعی SRTM برای حذف مؤلفه‌های هندسی و توپوگرافی به کار رفت. سپس فیلتر تطبیقی، گشودن فاز با روش minimum-cost flow و کاهش نمونهٔ ۲ در ۲ انجام شد که اندازهٔ زمینی را به حدود ۱۰۰ در ۱۰۰ متر رساند. پردازش تداخل‌سنجی با GAMMA و برآورد سری زمانی با وارون‌سازی شبکه انجام شد [۳].</p>
      </section>

      <section><h2>مرجع، جو و مدل زمانی.</h2>
        <p>به دلیل وسعت نوارها و پراکندگی پهنه‌های تغییرشکل، مطالعه از یک نقطهٔ مرجع یگانه استفاده نکرد. برای هر تاریخ، سطح اصلاحی در قطعه‌های ۲۵ در ۲۵ کیلومتر برآورد شد؛ جملهٔ نخست مرجع و تأخیر جوی پهن‌مقیاس و جملهٔ دوم تأخیر جوی وابسته به ارتفاع را مدل می‌کند [۳].</p>
        <Equation number={3}>{String.raw`c_i^{(k)}=p_1^{(k)}+p_2^{(k)}\left(h_i-h_0^{(k)}\right)`}</Equation>
        <p>برآورد به صورت تکراری انجام شد: نواحی با قدرمطلق تغییرشکل بیش از ۱ سانتی‌متر در سال از برازش کنار گذاشته و ماسک با هستهٔ ۹ در ۹ گسترش یافت. سپس سری زمانی با روند، شتاب و جملهٔ سالانه مدل شد [۳].</p>
        <Equation number={4}>{String.raw`\begin{aligned}X(t)={}&\beta_1+\beta_2t+\beta_3t^2\\&+\beta_4\sin\!\left(\frac{2\pi t}{365}\right)\\&+\beta_5\cos\!\left(\frac{2\pi t}{365}\right)+\varepsilon\end{aligned}`}</Equation>
      </section>

      <section><h2>تفسیر و انتشار.</h2>
        <p>تبدیل LOS به قائم تنها با فرض صریح نبود حرکت افقی نوشته می‌شود. این یک هویت هندسی نیست و در حضور حرکت افقی می‌تواند سوگیر باشد [۲، ۳].</p>
        <Equation number={5}>{String.raw`u_U\simeq\frac{d_{\mathrm{LOS}}}{\cos\theta}\qquad\left(u_E=u_N=0\right)`}</Equation>
        <p>فرودید نام متغیر، واحد، سال‌های مشاهده، روش تصویرکردن، مجوز و ارجاع منبع را حفظ می‌کند. در تبدیل فایل‌های اصلی به COG، شبکه، مقادیر معتبر و NoData حفظ و برابری پیکسل‌های تفکیک پایه بررسی شده است. هرم‌های نمایشی برای نمایش سریع‌ترند؛ مبنای تحلیل باید تفکیک پایه باشد. این کنترل‌ها وفاداری تبدیل را بررسی می‌کنند و جای اعتبارسنجی مستقل اندازه‌گیری ماهواره‌ای را نمی‌گیرند.</p>
      </section>
    </div>
    <div className="paper-body paper-discussion"><InterpretationNotes /></div>
    <References title="منابع" />
  </article>
}

function EnglishPaper() {
  const historical = formatDateRange('2014', '2020', 'en', 'year')
  return <article className="paper paper-en" lang="en" dir="ltr">
    <aside className="paper-stamp" aria-hidden="true">FORUDID · METHODS NOTE · 2026</aside>
    <header className="paper-header">
      <h1>Method, Provenance, and Interpretation Limits of Forudid Ground-Deformation Products</h1>
      <p className="paper-author">Komeil</p>
      <p className="paper-affiliation">Forudid Project, Tehran, Iran</p>
      <section className="paper-abstract" aria-label="Abstract">
        <p>This note examines the measurement basis, processing method, and interpretation limits of two data families: the nationwide historical product covering {historical}, and the Varamin LOS time-series pilot. The historical product derives from more than 6,000 Sentinel-1 scenes on ten descending tracks [3, 4]. Forudid keeps each source's component, sign, unit, reference, and dates separate. The discussion distinguishes phase observations from displacement models, seasonal amplitude from uncertainty, and measured deformation from hydrogeological interpretation.</p></section>
    </header>

    <ProductContract english />

    <div className="paper-body">
      <section><h2>Data scope.</h2>
        <p>The registered version contains annual-rate, seasonal-amplitude, and subsidence-mask rasters. The publisher describes the rate and seasonal amplitude as descending line-of-sight measurements projected to the vertical [4]. They must therefore not be labelled as LOS products. The projection assumes that horizontal deformation is negligible relative to vertical deformation [3].</p>
        <p>Time span, method, and units are read from source metadata. A NoData pixel means that no valid value is available; it does not indicate stable ground or a zero rate. Checksum verification establishes file identity, not scientific validity.</p>
      </section>

      <section><h2>Interferometric observation.</h2>
        <p>An SLC image retains the amplitude and phase of the radar return. For two co-registered images, the interferogram is formed by multiplying one complex image by the conjugate of the other; its argument is the phase difference [1]. Image order determines the phase sign.</p>
        <Equation number={1}>{String.raw`\begin{aligned}I_{12}&=s_1s_2^{*}\\\Delta\phi&=\arg(I_{12})\end{aligned}`}</Equation>
        <p>Under the HyP3 convention, after spatial referencing, positive LOS displacement is toward the sensor and negative displacement is away from it [2]. This convention must not be transferred to another processor without checking its metadata.</p>
        <Equation number={2}>{String.raw`d_{\mathrm{LOS}}=-\frac{\lambda}{4\pi}\left(\Delta\phi-\Delta\phi_{\mathrm{ref}}\right)`}</Equation>
      </section>

      <Figure label="Figure" caption="Two repeat acquisitions measure ranges R₁ and R₂. Their range change appears as a phase difference; the final sign depends on the processing convention.">
        <RepeatPassGeometry labels={['First acquisition, t₀', 'Second acquisition, t₀ + Δt', 'Phase difference and wavelength']} />
      </Figure>

      <section><h2>Processing reported by the source.</h2>
        <p>The source study concatenated same-date frames within each track into long SLC strips and selected one date per track as the co-registration reference. Its network used an ideal temporal baseline of 60 days and connected each image to the two images closest to that interval. Interferograms were multilooked by factors of 10 in range and 2 in azimuth [3].</p>
        <p>Precise orbits and the SRTM elevation model were used to remove geometric and topographic phase. Adaptive filtering, minimum-cost-flow unwrapping, and 2 by 2 downsampling followed, producing an approximately 100 m by 100 m ground spacing. Interferometric processing used GAMMA, followed by network inversion for the phase time series [3].</p>
      </section>

      <section><h2>Reference, atmosphere, and temporal model.</h2>
        <p>Because the strips are extensive and deformation is spatially distributed, the study did not use one reference point. For each date, a correction surface was estimated in 25 km by 25 km patches. The first term accounts for the reference and broad-scale tropospheric delay; the second models elevation-correlated delay [3].</p>
        <Equation number={3}>{String.raw`c_i^{(k)}=p_1^{(k)}+p_2^{(k)}\left(h_i-h_0^{(k)}\right)`}</Equation>
        <p>The fit was iterative: areas with absolute deformation above 1 cm/year were excluded and the mask was dilated with a 9 by 9 kernel. The corrected series was then modelled with trend, acceleration, and annual terms [3].</p>
        <Equation number={4}>{String.raw`\begin{aligned}X(t)={}&\beta_1+\beta_2t+\beta_3t^2\\&+\beta_4\sin\!\left(\frac{2\pi t}{365}\right)\\&+\beta_5\cos\!\left(\frac{2\pi t}{365}\right)+\varepsilon\end{aligned}`}</Equation>
      </section>

      <section><h2>Interpretation and publication.</h2>
        <p>A LOS-to-vertical conversion requires an explicit zero-horizontal-motion assumption. It is not a geometric identity and can be biased where horizontal motion is present [2, 3].</p>
        <Equation number={5}>{String.raw`u_U\simeq\frac{d_{\mathrm{LOS}}}{\cos\theta}\qquad\left(u_E=u_N=0\right)`}</Equation>
        <p>Forudid preserves the source variable name, unit, observation years, projection method, licence, and citation. Conversion to COG preserves the original grid, valid values, and NoData, with base-resolution pixel equality checked against the originals. Display overviews support navigation; analysis must use the base grid. These checks establish conversion fidelity and do not replace independent validation of satellite measurements.</p>
      </section>
    </div>
    <div className="paper-body paper-discussion"><InterpretationNotes english /></div>
    <References title="References" />
  </article>
}

export default function MethodologyPage() {
  const { language } = useLanguage()
  return <main className="methodology-paper-page">
    {language === 'fa' ? <PersianPaper /> : <EnglishPaper />}
  </main>
}
