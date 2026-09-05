import { type ReactNode, useState } from 'react'
import katex from 'katex'
import { RepeatPassGeometry } from './methodology-figures'

const references = [
  ['[1]', 'Ferretti, A., Monti-Guarnieri, A., Prati, C., Rocca, F., and Massonnet, D. (2007). InSAR Principles: Guidelines for SAR Interferometry Processing and Interpretation. ESA TM-19.', 'https://www.esa.int/esapub/tm/tm19/TM-19_ptA.pdf'],
  ['[2]', 'Alaska Satellite Facility. Sentinel-1 InSAR Product Guide. HyP3 documentation.', 'https://hyp3-docs.asf.alaska.edu/guides/insar_product_guide/'],
  ['[3]', 'Haghshenas Haghighi, M., and Motagh, M. (2024). Uncovering the impacts of depleting aquifers: A remote sensing analysis of land subsidence in Iran. Science Advances, 10, eadk3039.', 'https://doi.org/10.1126/sciadv.adk3039'],
  ['[4]', 'Haghshenas Haghighi, M., and Motagh, M. (2024). Land Subsidence in Iran Estimated from a Nationwide InSAR Analysis of Sentinel-1 Observations 2014-2020. Zenodo, version 1.0.0.', 'https://doi.org/10.5281/zenodo.10815578'],
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
    <figcaption><strong>{label} ۱.</strong> {caption}</figcaption></figure>
}

function References({ title }: { title: string }) {
  return <footer className="paper-references"><h2>{title}</h2><ol>{references.map(([number, citation, href]) =>
    <li key={href}><a href={href} target="_blank" rel="noreferrer"><span>{number}</span> {citation}</a></li>)}</ol></footer>
}

function PersianPaper() {
  return <article className="paper" lang="fa" dir="rtl">
    <header className="paper-header">
      <p className="paper-series">یادداشت روش فرودید، بازبینی ۱۴۰۵</p>
      <h1>روش و حدود تفسیر دادهٔ سراسری فرونشست ایران، ۲۰۱۴ تا ۲۰۲۰</h1>
      <p className="paper-author">کمیل، پروژهٔ فرودید</p>
      <section className="paper-abstract" aria-labelledby="abstract-fa"><h2 id="abstract-fa">چکیده</h2>
        <p>این یادداشت، منشأ و روش دادهٔ واقعی ثبت‌شده در فرودید را از روش عمومی InSAR جدا می‌کند. منبع حاضر، مجموعه‌دادهٔ نسخهٔ ۱٫۰٫۰ حق‌شناس حقیقی و معتق است که از بیش از ۶۰۰۰ صحنهٔ Sentinel-1 در ده مسیر نزولی طی سال‌های ۲۰۱۴ تا ۲۰۲۰ ساخته شده است [۳، ۴]. فرودید فایل‌های اصلی و شناسه‌های یکپارچگی آن‌ها را ثبت کرده است، اما تا پایان نرمال‌سازی، کنترل کیفیت و انتشار منبع‌محور، نقشه یا نرخ تحلیلی از این داده نمایش نمی‌دهد.</p></section>
      <p className="paper-keywords"><strong>واژگان کلیدی:</strong> Sentinel-1، InSAR، ایران، فرونشست، سری زمانی، دادهٔ منتشرشده</p>
    </header>

    <div className="paper-body">
      <section><h2>۱. دامنهٔ داده</h2>
        <p>نسخهٔ ثبت‌شده شامل رستر نرخ سالانه، دامنهٔ فصلی و ماسک فرونشست است. ناشر، نرخ و دامنهٔ فصلی را حاصل تصویرکردن اندازه‌گیری راستای دید نزولی به راستای قائم معرفی می‌کند [۴]. بنابراین این دو رستر نباید محصول LOS نامیده شوند. این تبدیل بر فرض ناچیزبودن مؤلفهٔ افقی نسبت به مؤلفهٔ قائم استوار است [۳].</p>
        <p>بازهٔ زمانی، روش و واحد از فرادادهٔ منبع خوانده می‌شوند. پیکسل NoData به معنی نبود مقدار معتبر است، نه زمین پایدار و نه نرخ صفر. ثبت checksum فقط اصالت فایل دریافت‌شده را نشان می‌دهد و جای ارزیابی علمی محصول را نمی‌گیرد.</p>
      </section>

      <section><h2>۲. مشاهدهٔ تداخل‌سنجی</h2>
        <p>هر تصویر SLC دامنه و فاز بازتاب راداری را نگه می‌دارد. برای دو تصویر هم‌ثبت‌شده، تداخل‌نما از ضرب مختلط یک تصویر در مزدوج تصویر دیگر ساخته می‌شود و فاز آن اختلاف فاز دو مشاهده است [۱]. ترتیب تصاویر، علامت فاز را تعیین می‌کند.</p>
        <Equation number={1}>{String.raw`\begin{aligned}I_{12}&=s_1s_2^{*}\\\Delta\phi&=\arg(I_{12})\end{aligned}`}</Equation>
        <p>در قرارداد HyP3، پس از کم‌کردن فاز نقطهٔ مرجع، جابه‌جایی LOS مثبت به سوی سنجنده و منفی دور از آن است [۲]. این قرارداد را نمی‌توان بدون بررسی فراداده به محصول هر پردازشگر تعمیم داد.</p>
        <Equation number={2}>{String.raw`d_{\mathrm{LOS}}=-\frac{\lambda}{4\pi}\left(\Delta\phi-\Delta\phi_{\mathrm{ref}}\right)`}</Equation>
      </section>

      <Figure label="شکل" caption="دو برداشت تکراری فاصله‌های R₁ و R₂ را ثبت می‌کنند. تغییر فاصله به اختلاف فاز تبدیل می‌شود؛ علامت نهایی تابع قرارداد پردازش است.">
        <RepeatPassGeometry labels={['برداشت نخست، t₀', 'برداشت دوم، t₀ + Δt', 'اختلاف فاز و طول موج']} />
      </Figure>

      <section><h2>۳. پردازش گزارش‌شده در منبع</h2>
        <p>در مطالعهٔ اصلی، قاب‌های هم‌تاریخ هر مسیر به نوارهای بلند SLC متصل و یک تاریخ در هر مسیر مرجع هم‌ثبت‌سازی شد. شبکه با فاصلهٔ زمانی مطلوب ۶۰ روز ساخته شد و هر تصویر به دو تصویر نزدیک به این فاصله متصل شد. تداخل‌نماها در راستای برد و آزیموت با ضرایب ۱۰ در ۲ چندنگری شدند [۳].</p>
        <p>مدار دقیق و مدل ارتفاعی SRTM برای حذف مؤلفه‌های هندسی و توپوگرافی به کار رفت. سپس فیلتر تطبیقی، گشودن فاز با روش minimum-cost flow و کاهش نمونهٔ ۲ در ۲ انجام شد که اندازهٔ زمینی را به حدود ۱۰۰ در ۱۰۰ متر رساند. پردازش تداخل‌سنجی با GAMMA و برآورد سری زمانی با وارون‌سازی شبکه انجام شد [۳].</p>
      </section>

      <section><h2>۴. مرجع، جو و مدل زمانی</h2>
        <p>به دلیل وسعت نوارها و پراکندگی پهنه‌های تغییرشکل، مطالعه از یک نقطهٔ مرجع یگانه استفاده نکرد. برای هر تاریخ، سطح اصلاحی در قطعه‌های ۲۵ در ۲۵ کیلومتر برآورد شد؛ جملهٔ نخست مرجع و تأخیر جوی پهن‌مقیاس و جملهٔ دوم تأخیر جوی وابسته به ارتفاع را مدل می‌کند [۳].</p>
        <Equation number={3}>{String.raw`c_i^{(k)}=p_1^{(k)}+p_2^{(k)}\left(h_i-h_0^{(k)}\right)`}</Equation>
        <p>برآورد به صورت تکراری انجام شد: نواحی با قدرمطلق تغییرشکل بیش از ۱ سانتی‌متر در سال از برازش کنار گذاشته و ماسک با هستهٔ ۹ در ۹ گسترش یافت. سپس سری زمانی با روند، شتاب و جملهٔ سالانه مدل شد [۳].</p>
        <Equation number={4}>{String.raw`X(t)=\beta_1+\beta_2t+\beta_3t^2+\beta_4\sin\!\left(\frac{2\pi t}{365}\right)+\beta_5\cos\!\left(\frac{2\pi t}{365}\right)+\varepsilon`}</Equation>
      </section>

      <section><h2>۵. تفسیر و انتشار</h2>
        <p>تبدیل LOS به قائم تنها با فرض صریح نبود حرکت افقی نوشته می‌شود. این یک هویت هندسی نیست و در حضور حرکت افقی می‌تواند سوگیر باشد [۲، ۳].</p>
        <Equation number={5}>{String.raw`u_U\simeq\frac{d_{\mathrm{LOS}}}{\cos\theta}\qquad\left(u_E=u_N=0\right)`}</Equation>
        <p>فرودید نام متغیر، واحد، سال‌های مشاهده، روش تصویرکردن، مجوز و citation منبع را بدون بازتفسیر نگه می‌دارد. نمایش نقشه تنها پس از نرمال‌سازی رستر، حفظ NoData، تطبیق ماسک، کنترل دامنه و ثبت نسخهٔ محصول مجاز است. تا آن زمان، سایت فقط شناسنامهٔ منبع واقعی را ارائه می‌کند.</p>
      </section>
    </div>
    <References title="منابع" />
  </article>
}

function EnglishPaper() {
  return <article className="paper paper-en" lang="en" dir="ltr">
    <header className="paper-header">
      <p className="paper-series">FORUDID METHODS NOTE, 2026 REVISION</p>
      <h1>Method and Interpretation Limits of the Nationwide Iran Subsidence Dataset, 2014 to 2020</h1>
      <p className="paper-author">Komeil, Forudid Project</p>
      <section className="paper-abstract" aria-labelledby="abstract-en"><h2 id="abstract-en">Abstract</h2>
        <p>This note separates general InSAR physics from the provenance of the real dataset registered by Forudid. The current source is version 1.0.0 of the Haghshenas Haghighi and Motagh dataset, derived from more than 6,000 Sentinel-1 scenes acquired on ten descending tracks between 2014 and 2020 [3, 4]. Forudid has registered the original files and their integrity identifiers, but displays no analytical map or rate until source-aware normalization, quality control, and publication are complete.</p></section>
      <p className="paper-keywords"><strong>Keywords:</strong> Sentinel-1, InSAR, Iran, land subsidence, time series, published data</p>
    </header>

    <div className="paper-body">
      <section><h2>1. Data scope</h2>
        <p>The registered version contains annual-rate, seasonal-amplitude, and subsidence-mask rasters. The publisher describes the rate and seasonal amplitude as descending line-of-sight measurements projected to the vertical [4]. They must therefore not be labelled as LOS products. The projection assumes that horizontal deformation is negligible relative to vertical deformation [3].</p>
        <p>Time span, method, and units are read from source metadata. A NoData pixel means that no valid value is available; it does not indicate stable ground or a zero rate. Checksum verification establishes file identity, not scientific validity.</p>
      </section>

      <section><h2>2. Interferometric observation</h2>
        <p>An SLC image retains the amplitude and phase of the radar return. For two co-registered images, the interferogram is formed by multiplying one complex image by the conjugate of the other; its argument is the phase difference [1]. Image order determines the phase sign.</p>
        <Equation number={1}>{String.raw`\begin{aligned}I_{12}&=s_1s_2^{*}\\\Delta\phi&=\arg(I_{12})\end{aligned}`}</Equation>
        <p>Under the HyP3 convention, after spatial referencing, positive LOS displacement is toward the sensor and negative displacement is away from it [2]. This convention must not be transferred to another processor without checking its metadata.</p>
        <Equation number={2}>{String.raw`d_{\mathrm{LOS}}=-\frac{\lambda}{4\pi}\left(\Delta\phi-\Delta\phi_{\mathrm{ref}}\right)`}</Equation>
      </section>

      <Figure label="Figure" caption="Two repeat acquisitions measure ranges R₁ and R₂. Their range change appears as a phase difference; the final sign depends on the processing convention.">
        <RepeatPassGeometry labels={['First acquisition, t₀', 'Second acquisition, t₀ + Δt', 'Phase difference and wavelength']} />
      </Figure>

      <section><h2>3. Processing reported by the source</h2>
        <p>The source study concatenated same-date frames within each track into long SLC strips and selected one date per track as the co-registration reference. Its network used an ideal temporal baseline of 60 days and connected each image to the two images closest to that interval. Interferograms were multilooked by factors of 10 in range and 2 in azimuth [3].</p>
        <p>Precise orbits and the SRTM elevation model were used to remove geometric and topographic phase. Adaptive filtering, minimum-cost-flow unwrapping, and 2 by 2 downsampling followed, producing an approximately 100 m by 100 m ground spacing. Interferometric processing used GAMMA, followed by network inversion for the phase time series [3].</p>
      </section>

      <section><h2>4. Reference, atmosphere, and temporal model</h2>
        <p>Because the strips are extensive and deformation is spatially distributed, the study did not use one reference point. For each date, a correction surface was estimated in 25 km by 25 km patches. The first term accounts for the reference and broad-scale tropospheric delay; the second models elevation-correlated delay [3].</p>
        <Equation number={3}>{String.raw`c_i^{(k)}=p_1^{(k)}+p_2^{(k)}\left(h_i-h_0^{(k)}\right)`}</Equation>
        <p>The fit was iterative: areas with absolute deformation above 1 cm/year were excluded and the mask was dilated with a 9 by 9 kernel. The corrected series was then modelled with trend, acceleration, and annual terms [3].</p>
        <Equation number={4}>{String.raw`X(t)=\beta_1+\beta_2t+\beta_3t^2+\beta_4\sin\!\left(\frac{2\pi t}{365}\right)+\beta_5\cos\!\left(\frac{2\pi t}{365}\right)+\varepsilon`}</Equation>
      </section>

      <section><h2>5. Interpretation and publication</h2>
        <p>A LOS-to-vertical conversion requires an explicit zero-horizontal-motion assumption. It is not a geometric identity and can be biased where horizontal motion is present [2, 3].</p>
        <Equation number={5}>{String.raw`u_U\simeq\frac{d_{\mathrm{LOS}}}{\cos\theta}\qquad\left(u_E=u_N=0\right)`}</Equation>
        <p>Forudid preserves the source variable name, unit, observation years, projection method, licence, and citation without reinterpretation. Map display requires raster normalization, NoData preservation, mask consistency checks, range checks, and a recorded product version. Until those gates pass, the site exposes only the verified real-source record.</p>
      </section>
    </div>
    <References title="References" />
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
