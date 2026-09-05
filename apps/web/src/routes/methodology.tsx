import { useState } from 'react'
import katex from 'katex'

const references = [
  ['ESA, 2007', 'InSAR Principles: Guidelines for SAR Interferometry Processing and Interpretation, TM-19.', 'https://www.esa.int/About_Us/ESA_Publications/InSAR_Principles_Guidelines_for_SAR_Interferometry_Processing_and_Interpretation_br_ESA_TM-19'],
  ['ASF DAAC', 'Sentinel-1 InSAR Product Guide, HyP3.', 'https://hyp3-docs.asf.alaska.edu/guides/insar_product_guide/'],
  ['Yunjun et al., 2019', 'Small baseline InSAR time series analysis: Unwrapping error correction and noise reduction.', 'https://doi.org/10.1016/j.cageo.2019.104331'],
  ['Copernicus', 'Sentinel-1 mission and technical guides.', 'https://sentinels.copernicus.eu/copernicus/sentinel-1'],
]

function Equation({ number, children }: { number: number, children: string }) {
  const html = katex.renderToString(children, { displayMode: true, throwOnError: true })
  return <div className="paper-equation" dir="ltr">
    <span aria-label={children} dangerouslySetInnerHTML={{ __html: html }} />
    <b>({number})</b>
  </div>
}

function Figure({ src, label, number, alt, caption }: { src: string, label: string, number: number, alt: string, caption: string }) {
  return <figure className="paper-figure"><img src={src} alt={alt} />
    <figcaption><strong>{label} {number}.</strong> {caption}</figcaption></figure>
}

function PersianPaper() {
  return <article className="paper" lang="fa" dir="rtl">
    <header className="paper-header">
      <p className="paper-series">یادداشت روش فرودید، شمارهٔ ۱، نسخهٔ ۰.۱</p>
      <h1>چارچوب بازتولیدپذیر برای برآورد جابه‌جایی نسبی زمین از سری زمانی تداخل‌سنجی راداری Sentinel-1</h1>
      <p className="paper-author">کمیل، پروژهٔ فرودید</p>
      <p className="paper-affiliation">طهران، ایران، ۱۴۰۵ هجری خورشیدی</p>
      <section className="paper-abstract" aria-labelledby="abstract-fa"><h2 id="abstract-fa">چکیده</h2>
        <p>این مقاله، قرارداد اندازه‌گیری و مسیر پردازش هدف در فرودید را تعریف می‌کند. ورودی هدف، دادهٔ مختلط تک‌نگر Sentinel-1 در مد IW است. زوج‌های تداخل‌سنجی پس از به‌روزرسانی مدار، هم‌ثبت‌سازی، حذف فاز زمین تخت و توپوگرافی، فیلتر و گشودن فاز به یک شبکهٔ زمانی متصل وارد می‌شوند. جابه‌جایی در راستای دید ماهواره، نسبت به یک تاریخ و نقطه یا ناحیهٔ مرجع گزارش می‌شود. تبدیل این کمیت به حرکت قائم فقط با فرض صریح نبود حرکت افقی مجاز است. نسخهٔ کنونی فرودید دادهٔ ساختگی دارد و این متن نتیجهٔ ژئوفیزیکی برای دشت ورامین گزارش نمی‌کند.</p></section>
      <p className="paper-keywords"><strong>واژگان کلیدی:</strong> تداخل‌سنجی راداری، Sentinel-1، سری زمانی، جابه‌جایی LOS، MintPy، فرونشست زمین</p>
    </header>

    <div className="paper-body">
      <section><h2>۱. مقدمه</h2><p>تداخل‌سنجی راداری اختلاف فاز دو مشاهدهٔ مختلط از یک سطح را برای سنجش تغییر فاصلهٔ نسبی میان زمین و سنجنده به‌کار می‌گیرد [۱، ۲]. این کمیت یک جابه‌جایی یک‌بعدی در راستای دید است. بنابراین نقشهٔ LOS نه به‌تنهایی نقشهٔ فرونشست قائم است و نه حرکت در راستای آزیموت ماهواره را مشاهده می‌کند [۲].</p><p>هدف این متن ثبت یک قرارداد قابل ممیزی برای فرودید است. هر محصول باید ورودی‌ها، زوج‌ها، مرجع، قرارداد علامت، اصلاحات، ماسک‌ها، شاخص‌های کیفیت و نسخهٔ نرم‌افزار را همراه داشته باشد. یک تداخل‌نما برای نتیجه‌گیری کافی نیست. راهنمای HyP3 نیز استفاده از سری زمانی را به‌جای اتکا به یک زوج توصیه می‌کند [۲].</p></section>

      <section><h2>۲. مدل مشاهده</h2><p>برای نمونه‌های مختلط هم‌ثبت‌شدهٔ <i>s₁</i> و <i>s₂</i>، فاز تداخل‌سنجی از آرگومان حاصل‌ضرب یکی در مزدوج مختلط دیگری به‌دست می‌آید. فاز مشاهده‌شده جمع مؤلفه‌های هندسی، توپوگرافی، تغییرشکل، جو، مدار و نویز است [۱].</p>
        <Equation number={1}>{String.raw`\begin{aligned}\phi_{\mathrm{int}}&=\operatorname{arg}(s_2s_1^{*})\\&=\phi_{\mathrm{flat}}+\phi_{\mathrm{topo}}+\phi_{\mathrm{def}}\\&\quad+\phi_{\mathrm{atm}}+\phi_{\mathrm{orb}}+\phi_{\mathrm{noise}}\end{aligned}`}</Equation>
        <p>پس از حذف فاز زمین تخت و توپوگرافی و انتخاب مرجع، قرارداد HyP3 جابه‌جایی LOS را از فاز گشوده‌شده مطابق رابطهٔ ۲ محاسبه می‌کند. علامت مثبت در محصول LOS به معنی حرکت به سوی سنجنده و علامت منفی به معنی دورشدن از سنجنده است [۲].</p>
        <Equation number={2}>{String.raw`d_{\mathrm{LOS}}^{*}=-\frac{\lambda}{4\pi}\left(\phi_{\mathrm{unw}}-\phi_{\mathrm{ref}}\right)`}</Equation>
        <p>برای Sentinel-1 مقدار طول موج مورد استفاده در راهنمای HyP3 برابر ۰٫۰۵۵۴۶۵۷۶۳ متر است [۲]. هر چرخهٔ کامل فاز، یعنی ۲π، معادل نصف طول موج و نزدیک به ۲٫۸ سانتی‌متر جابه‌جایی LOS است.</p></section>

      <Figure src="/methodology/repeat-pass-los.png" label="شکل" number={1} alt="هندسهٔ دو برداشت Sentinel-1، خط دید، خط مبنا و بردار جابه‌جایی سطح" caption="هندسهٔ برداشت تکراری. تداخل‌سنجی فقط تصویر بردار جابه‌جایی روی راستای دید سنجنده را اندازه می‌گیرد." />

      <section><h2>۳. داده و تشکیل تداخل‌نما</h2><p>ورودی هدف، زوج‌های هم‌قطبش Sentinel-1 IW SLC با burstهای هم‌پوشان است. مدار بازسازی‌شده یا دقیق جایگزین مدار پیش‌بینی‌شده می‌شود. مدل ارتفاعی Copernicus GLO-30 برای محاسبه و حذف سهم توپوگرافی به‌کار می‌رود [۲، ۴]. زوج‌ها باید از یک مسیر نسبی، هندسهٔ سازگار و قطبش یکسان باشند.</p><p>هم‌ثبت‌سازی باید دقت زیرپیکسلی داشته باشد. پس از تشکیل تداخل‌نما، فاز زمین تخت و فاز توپوگرافی حذف می‌شوند. فیلتر فاز و ماسک نواحی آب یا همدوسی پایین پیش از گشودن فاز ثبت می‌شوند. آستانه‌ها ثابت و جهانی نیستند. مقدار هر آستانه باید با شناسهٔ پروفایل پردازش ذخیره شود.</p><p>همدوسی نرمال‌شده شاخصی میان صفر و یک برای پایداری رابطهٔ فازی دو مشاهده است. برآورد نمونه‌ای آن به صورت رابطهٔ ۳ نوشته می‌شود.</p><Equation number={3}>{String.raw`\gamma=\frac{\left|\langle s_1s_2^{*}\rangle\right|}{\sqrt{\langle |s_1|^2\rangle\,\langle |s_2|^2\rangle}}`}</Equation></section>

      <section><h2>۴. وارون‌سازی سری زمانی</h2><p>تداخل‌نماهای گشوده‌شده یک شبکه می‌سازند که رأس‌های آن تاریخ‌های برداشت و یال‌های آن زوج‌های پردازش‌شده‌اند. شبکه باید به تاریخ مرجع متصل باشد. MintPy این شبکه را با کمترین مربعات وزن‌دار وارون می‌کند و سپس خطای گشودن فاز و مؤلفه‌های نویزی را در حوزهٔ زمان بررسی می‌کند [۳].</p><Equation number={4}>{String.raw`\mathbf d=\mathbf G\mathbf m+\boldsymbol\varepsilon`}</Equation><Equation number={5}>{String.raw`\begin{aligned}\widehat{\mathbf m}={}&\left(\mathbf G^{\mathsf T}\mathbf W\mathbf G\right)^{-1}\\&\mathbf G^{\mathsf T}\mathbf W\mathbf d\end{aligned}`}</Equation><p>در روابط ۴ و ۵، بردار <i>d</i> شامل فاز یا جابه‌جایی زوجی، ماتریس <i>G</i> اتصال زوج‌ها به تاریخ‌ها، <i>W</i> ماتریس وزن و <i>m̂</i> سری زمانی برآوردشده است. اگر شبکه رتبهٔ کامل نداشته باشد، یا به چند زیرشبکه تقسیم شود، محصول نباید منتشر شود.</p></section>

      <Figure src="/methodology/phase-to-timeseries.png" label="شکل" number={2} alt="شبکهٔ تاریخ‌های برداشت، زوج‌های تداخل‌سنجی و وارون‌سازی به سری زمانی" caption="زنجیرهٔ مفهومی برداشت تکراری، فاز تداخل‌سنجی و برآورد سری زمانی. برچسب‌ها و مقادیر عددی در متن مقاله تعریف شده‌اند." />

      <section><h2>۵. مرجع و تفسیر هندسی</h2><p>جابه‌جایی InSAR مطلق نیست. مقدار هر پیکسل نسبت به تاریخ مرجع و پیکسل یا ناحیهٔ مرجع تعیین می‌شود. مرجع باید همدوسی پایدار داشته باشد، بیرون از پهنهٔ تغییرشکل مورد انتظار باشد و از پهنهٔ تحلیل با شکاف کم‌همدوس جدا نشده باشد [۲]. مختصات، شعاع، روش تجمیع و دلیل انتخاب مرجع جزئی از محصول‌اند.</p><p>رابطهٔ میان بردار جابه‌جایی سه‌بعدی <i>u</i> و مشاهدهٔ LOS با بردار یکهٔ نگاه <i>l</i>، از زمین به سوی سنجنده، چنین است:</p><Equation number={6}>{String.raw`d_{\mathrm{LOS}}=l_Eu_E+l_Nu_N+l_Uu_U`}</Equation><p>تنها اگر مؤلفه‌های افقی صفر فرض شوند، می‌توان با زاویهٔ برخورد θ تقریب زیر را نوشت:</p><Equation number={7}>{String.raw`u_U\simeq\frac{d_{\mathrm{LOS}}}{\cos\theta}\qquad (u_E=u_N=0)`}</Equation><p>این فرض باید روی محصول قائم درج شود. برای جداسازی مؤلفه‌ها، ترکیب هندسه‌های صعودی و نزولی و در صورت امکان GNSS لازم است. حتی در این حالت، حساسیت به مؤلفهٔ شمالی معمولاً ضعیف می‌ماند.</p></section>

      <section><h2>۶. اصلاح خطا و کنترل کیفیت</h2><p>تأخیر تروپوسفری، خطای مدار، خطای باقیماندهٔ DEM، دکورلیشن و خطای گشودن فاز می‌توانند با تغییرشکل اشتباه شوند [۲، ۳]. هر اصلاح باید به عنوان یک مرحلهٔ نسخه‌دار ثبت شود. خروجی پیش و پس از اصلاح، پارامترها و منبع دادهٔ کمکی باید قابل بازیابی باشند.</p><p>حداقل کنترل انتشار شامل اتصال شبکه، تعداد مشاهده، همدوسی زمانی، باقیماندهٔ بست فاز، پوشش ماسک، پایداری مرجع، عدم قطعیت سرعت و بازبینی دیداری است. عبور از آستانهٔ عددی به تنهایی اثبات صحت ژئوفیزیکی نیست.</p></section>

      <Figure src="/methodology/quality-control.png" label="شکل" number={3} alt="نمونهٔ علمی کنترل کیفیت شامل شبکه، همدوسی، باقیمانده، عدم قطعیت و ماسک معتبر" caption="چهار نمای کنترل کیفیت. شبکهٔ زوج‌ها، کیفیت مکانی، باقیمانده‌های بست فاز و عدم قطعیت باید پیش از انتشار هم‌زمان بررسی شوند." />

      <section><h2>۷. مرز اعتبار نسخهٔ کنونی</h2><p>داده‌های فعلی فرودید ساختگی‌اند. نقشه، نمونه‌برداری نقطه و نمودار فقط قرارداد رابط و جریان داده را آزمایش می‌کنند. تا زمانی که شناسهٔ برداشت‌های واقعی، خروجی پردازش، مرجع، QC و بازبینی متخصص ثبت نشده باشد، هیچ عددی از این نسخه نباید به عنوان نرخ واقعی فرونشست دشت ورامین نقل شود.</p></section>
    </div>
    <footer className="paper-references"><h2>منابع</h2><ol>{references.map(([author, title, href]) => <li key={href}><a href={href}>{author}. {title}</a></li>)}</ol></footer>
  </article>
}

function EnglishPaper() {
  return <article className="paper paper-en" lang="en" dir="ltr">
    <header className="paper-header"><p className="paper-series">FORUDID METHODS NOTE 1, VERSION 0.1</p>
      <h1>A Reproducible Framework for Estimating Relative Ground Displacement from Sentinel-1 Interferometric Time Series</h1>
      <p className="paper-author">Komeil, Forudid Project</p><p className="paper-affiliation">Tehran, Iran, 2026</p>
      <section className="paper-abstract" aria-labelledby="abstract-en"><h2 id="abstract-en">Abstract</h2><p>This paper defines the measurement convention and target processing chain for Forudid. The intended inputs are Sentinel-1 Interferometric Wide swath single-look complex data. Interferograms are formed after orbit update and co-registration, corrected for flat-Earth and topographic phase, filtered, unwrapped, and assembled into a connected temporal network. Displacement is reported along the satellite line of sight relative to an explicit reference date and reference point or area. Conversion to vertical motion is permitted only under a stated zero-horizontal-motion assumption. The current Forudid release uses synthetic data and reports no geophysical result for the Varamin Plain.</p></section>
      <p className="paper-keywords"><strong>Keywords:</strong> InSAR, Sentinel-1, time series, line-of-sight displacement, MintPy, land subsidence</p></header>

    <div className="paper-body">
      <section><h2>1. Introduction</h2><p>Interferometric synthetic aperture radar uses the phase difference between repeated complex observations to measure a relative change in sensor-to-ground range [1, 2]. The result is a one-dimensional displacement projected onto the radar line of sight. A LOS map is therefore not, by itself, a map of vertical subsidence and is insensitive to motion along the satellite azimuth direction [2].</p><p>This note defines an auditable contract for Forudid. Every product must retain its inputs, pair network, reference, sign convention, corrections, masks, quality evidence, and software version. A single interferogram is not sufficient evidence for a displacement conclusion. The HyP3 guide likewise recommends a time-series approach [2].</p></section>
      <section><h2>2. Observation model</h2><p>For co-registered complex samples <i>s₁</i> and <i>s₂</i>, the interferometric phase is the argument of one sample multiplied by the complex conjugate of the other. The observation contains geometric, topographic, deformation, atmospheric, orbital, and noise terms [1].</p><Equation number={1}>{String.raw`\begin{aligned}\phi_{\mathrm{int}}&=\operatorname{arg}(s_2s_1^{*})\\&=\phi_{\mathrm{flat}}+\phi_{\mathrm{topo}}+\phi_{\mathrm{def}}\\&\quad+\phi_{\mathrm{atm}}+\phi_{\mathrm{orb}}+\phi_{\mathrm{noise}}\end{aligned}`}</Equation><p>After removal of flat-Earth and topographic phase and after spatial referencing, the HyP3 convention converts unwrapped phase to LOS displacement using Eq. 2. Positive LOS values indicate motion toward the sensor and negative values indicate motion away from it [2].</p><Equation number={2}>{String.raw`d_{\mathrm{LOS}}^{*}=-\frac{\lambda}{4\pi}\left(\phi_{\mathrm{unw}}-\phi_{\mathrm{ref}}\right)`}</Equation><p>The HyP3 guide uses λ = 0.055465763 m for Sentinel-1 [2]. One complete 2π phase cycle corresponds to one half-wavelength, approximately 2.8 cm of LOS displacement.</p></section>
      <Figure src="/methodology/repeat-pass-los.png" label="Figure" number={1} alt="Repeat-pass Sentinel-1 geometry with look direction, baseline, and ground displacement" caption="Repeat-pass geometry. InSAR measures only the projection of the displacement vector onto the sensor look direction." />
      <section><h2>3. Data and interferogram formation</h2><p>The intended inputs are co-polarized Sentinel-1 IW SLC pairs with overlapping bursts. Restituted or precise orbit data replace predicted state vectors. Copernicus GLO-30 provides the elevation model used to simulate and remove topographic phase [2, 4]. All pairs must share a relative orbit, compatible geometry, and polarization.</p><p>Co-registration must achieve sub-pixel precision. Flat-Earth and topographic phase are removed after interferogram formation. Phase filtering and masks for water or low-coherence regions are applied before unwrapping and recorded. Thresholds are not universal constants. Each value belongs to a versioned processing profile.</p><p>Normalized coherence is a bounded indicator of phase stability. Its sample estimate is expressed by Eq. 3.</p><Equation number={3}>{String.raw`\gamma=\frac{\left|\langle s_1s_2^{*}\rangle\right|}{\sqrt{\langle |s_1|^2\rangle\,\langle |s_2|^2\rangle}}`}</Equation></section>
      <section><h2>4. Time-series inversion</h2><p>Unwrapped interferograms form a graph whose nodes are acquisition dates and whose edges are processed pairs. The network must be connected to the reference date. MintPy solves the network using weighted least squares and evaluates unwrapping errors and noise in the time domain [3].</p><Equation number={4}>{String.raw`\mathbf d=\mathbf G\mathbf m+\boldsymbol\varepsilon`}</Equation><Equation number={5}>{String.raw`\begin{aligned}\widehat{\mathbf m}={}&\left(\mathbf G^{\mathsf T}\mathbf W\mathbf G\right)^{-1}\\&\mathbf G^{\mathsf T}\mathbf W\mathbf d\end{aligned}`}</Equation><p>Here, <i>d</i> contains pairwise phase or displacement, <i>G</i> maps pairs to acquisition dates, <i>W</i> is the weight matrix, and <i>m̂</i> is the estimated time series. A rank-deficient or disconnected network must not be published.</p></section>
      <Figure src="/methodology/phase-to-timeseries.png" label="Figure" number={2} alt="Acquisition geometry, interferometric phase, and time-series inversion" caption="Conceptual chain from repeat-pass acquisition to interferometric phase and a displacement time series. Quantities and conventions are defined in the text." />
      <section><h2>5. Reference and geometric interpretation</h2><p>InSAR displacement is relative. Every value depends on a reference date and reference pixel or area. The spatial reference should remain coherent, lie outside the expected deformation field, and not be separated from the analysis area by an incoherent gap [2]. Its coordinates, radius, aggregation rule, and selection rationale are product metadata.</p><p>The relation between the three-dimensional displacement vector <i>u</i> and the LOS measurement uses the unit look vector <i>l</i>, directed from ground to sensor:</p><Equation number={6}>{String.raw`d_{\mathrm{LOS}}=l_Eu_E+l_Nu_N+l_Uu_U`}</Equation><p>Only under an explicit zero-horizontal-motion assumption can incidence angle θ be used to write:</p><Equation number={7}>{String.raw`u_U\simeq\frac{d_{\mathrm{LOS}}}{\cos\theta}\qquad (u_E=u_N=0)`}</Equation><p>This assumption must remain attached to every vertical product. Separating components requires ascending and descending geometries and, where possible, GNSS constraints. Sensitivity to northward motion generally remains weak.</p></section>
      <section><h2>6. Error correction and quality control</h2><p>Tropospheric delay, orbit error, residual DEM error, decorrelation, and phase-unwrapping errors can mimic deformation [2, 3]. Every correction is a versioned operation. Inputs, parameters, auxiliary data, and pre-correction and post-correction outputs must remain recoverable.</p><p>Minimum release evidence includes graph connectivity, observation count, temporal coherence, phase-closure residuals, valid-mask coverage, reference stability, velocity uncertainty, and visual review. Passing a numerical threshold alone does not establish geophysical validity.</p></section>
      <Figure src="/methodology/quality-control.png" label="Figure" number={3} alt="Scientific quality control showing network, coherence, residuals, uncertainty, and valid mask" caption="Four quality-control views. Pair-network integrity, spatial quality, phase-closure residuals, and uncertainty must be reviewed together before release." />
      <section><h2>7. Validity boundary of the current release</h2><p>The current Forudid dataset is synthetic. Its map, point sampling, and chart validate only the interface and data contract. No value from this release may be cited as an observed Varamin subsidence rate until real acquisition identifiers, processing outputs, reference definition, quality evidence, and expert review are recorded.</p></section>
    </div>
    <footer className="paper-references"><h2>References</h2><ol>{references.map(([author, title, href]) => <li key={href}><a href={href}>{author}. {title}</a></li>)}</ol></footer>
  </article>
}

export default function MethodologyPage() {
  const [language, setLanguage] = useState<'fa' | 'en'>('fa')
  return <main className="methodology-paper-page">
    <div className="paper-language" role="group" aria-label="زبان مقاله">
      <button type="button" aria-pressed={language === 'fa'} onClick={() => setLanguage('fa')}>فارسی</button>
      <button type="button" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button>
    </div>
    {language === 'fa' ? <PersianPaper /> : <EnglishPaper />}
  </main>
}
