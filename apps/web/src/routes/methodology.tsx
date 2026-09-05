import { fa } from '../messages/fa'

export default function MethodologyPage() {
  return <main className="scientific-page methodology-page">
    <header className="method-hero">
      <div className="method-heading">
        <p className="scientific-kicker">یادداشت روش‌شناسی فرودید — نسخهٔ ۰.۱</p>
        <h1>از فاز رادار تا جابه‌جایی نسبی زمین</h1>
        <p className="method-lead">فرودید نتیجه را از زمینهٔ اندازه‌گیری جدا نمی‌کند. هر مقدار باید همراه هندسهٔ دید، مرجع، عدم قطعیت و سابقهٔ پردازش خوانده شود.</p>
      </div>
      <dl className="method-spec" aria-label="مشخصات روش">
        <div><dt>سنجندهٔ هدف</dt><dd dir="ltr">Sentinel-1 SAR</dd></div>
        <div><dt>کمیت اصلی</dt><dd dir="ltr">LOS displacement</dd></div>
        <div><dt>واحد انتشار</dt><dd dir="ltr">mm · mm yr<sup>−1</sup></dd></div>
        <div><dt>وضعیت فعلی</dt><dd>دادهٔ ساختگی</dd></div>
      </dl>
    </header>

    <figure className="method-figure method-figure-hero">
      <img src="/methodology/repeat-pass-los.png" alt="شمای مفهومی دو برداشت راداری از یک نقطه و بردار جابه‌جایی در راستای دید ماهواره" />
      <figcaption><span>شکل ۱</span> هندسهٔ برداشت تکراری. پیکان رنگی، تغییر فاصله در راستای دید را نشان می‌دهد و نمایشگر حرکت قائم نیست.</figcaption>
    </figure>

    <section className="method-intro" aria-labelledby="method-principle">
      <div>
        <p className="section-label">۱. اصل اندازه‌گیری</p>
        <h2 id="method-principle">آنچه اندازه می‌گیریم، فاصله در راستای دید است</h2>
      </div>
      <div>
        <p>رادار دهانهٔ مصنوعی، فاصلهٔ سنجنده تا سطح زمین را از فاز موج بازگشتی می‌سنجد. اختلاف فاز میان برداشت‌های هم‌هندسه، پس از حذف سهم توپوگرافی و خطاهای شناخته‌شده، به تغییر فاصلهٔ نسبی تبدیل می‌شود.</p>
        <p className="equation" dir="ltr" aria-label="تغییر فاصله متناسب با طول موج ضرب در تغییر فاز تقسیم بر چهار پی است">ΔR ∝ λΔφ / 4π</p>
        <p className="method-note">علامت نهایی به قرارداد فاز و فرادادهٔ محصول وابسته است؛ رابط کاربر اجازه ندارد آن را حدس بزند.</p>
      </div>
    </section>

    <section className="method-sequence" aria-labelledby="method-sequence-title">
      <header className="section-heading">
        <p className="section-label">۲. زنجیرهٔ پردازش</p>
        <h2 id="method-sequence-title">پنج ایستگاه تا محصول قابل بررسی</h2>
        <p>این مراحل مسیر علمی هدف‌اند. نسخهٔ فعلی هنوز پردازش واقعی HyP3/MintPy را منتشر نمی‌کند.</p>
      </header>
      <ol>
        <li><span className="method-index" aria-hidden="true">۰۱</span><div><h3>داده و هندسه</h3><p>برداشت‌های سازگار Sentinel-1، مدار دقیق و مدل ارتفاعی گردآوری می‌شوند. burst، مسیر مداری و پوشش محدوده پیش از پردازش تثبیت می‌شوند.</p><small dir="ltr">SLC · precise orbit · DEM</small></div></li>
        <li><span className="method-index" aria-hidden="true">۰۲</span><div><h3>هم‌ثبت‌سازی و تداخل‌سنجی</h3><p>تصاویر روی یک هندسهٔ مشترک هم‌ثبت و جفت‌های تداخل‌سنجی با baselineهای ثبت‌شده ساخته می‌شوند؛ انتخاب آستانه‌ها متعلق به پروفایل نسخه‌دار است.</p><small dir="ltr">coregistration · interferogram</small></div></li>
        <li><span className="method-index" aria-hidden="true">۰۳</span><div><h3>اصلاح و گشودن فاز</h3><p>سهم توپوگرافی، خطای مدار و مؤلفه‌های جوی تا حد روش انتخابی برآورد می‌شوند. ناحیهٔ کم‌همدوسی باید ماسک شود، نه اینکه با عدد ظاهراً دقیق پنهان بماند.</p><small dir="ltr">unwrap · atmosphere · mask</small></div></li>
        <li><span className="method-index" aria-hidden="true">۰۴</span><div><h3>سری زمانی و مرجع</h3><p>جابه‌جایی نسبت به تاریخ و نقطه یا ناحیهٔ مرجع محاسبه می‌شود. تاریخ‌های گمشده حفظ می‌شوند و عدم قطعیت کنار روند گزارش می‌شود.</p><small dir="ltr">MintPy · reference · uncertainty</small></div></li>
        <li><span className="method-index" aria-hidden="true">۰۵</span><div><h3>کنترل کیفیت و انتشار</h3><p>محصول، QC ماشین‌خوان و سابقهٔ پردازش را با خود حمل می‌کند. انتشار علمی پس از بازبینی انسانی و ثبت شواهد مجاز است.</p><small dir="ltr">QC · provenance · review</small></div></li>
      </ol>
    </section>

    <figure className="method-figure method-figure-process">
      <img src="/methodology/phase-to-timeseries.png" alt="شمای مفهومی تبدیل اختلاف فاز راداری به تداخل‌نما و سپس سری زمانی جابه‌جایی" />
      <figcaption><span>شکل ۲</span> مسیر مفهومی از اختلاف فاز تا تداخل‌نما و سری زمانی. داده‌های تصویر برای توضیح روش تولید شده‌اند و مشاهدهٔ واقعی ورامین نیستند.</figcaption>
    </figure>

    <section className="method-limit" aria-labelledby="los-limit-title">
      <p className="section-label">۳. حدود تفسیر</p>
      <div>
        <h2 id="los-limit-title">LOS همان فرونشست قائم نیست</h2>
        <p>{fa.scientificNote} جداسازی مؤلفهٔ قائم به هندسه و دادهٔ کافی—برای نمونه ترکیب مدارهای صعودی و نزولی با فرض‌های روشن—نیاز دارد.</p>
      </div>
      <dl>
        <div><dt>مرجع</dt><dd>تاریخ و نقطه/ناحیهٔ مرجع همراه هر سری</dd></div>
        <div><dt>کیفیت</dt><dd>همدوسی، عدم قطعیت و تعداد مشاهده</dd></div>
        <div><dt>ردیابی</dt><dd>مدار، ترک، نسخه و شناسهٔ اجرای پردازش</dd></div>
      </dl>
    </section>

    <aside className="method-status" aria-label="وضعیت علمی نسخه">
      <strong>مرز انتشار این نسخه</strong>
      <p>{fa.fixture}. دادهٔ کنونی فقط زنجیرهٔ نقشه، نمونه‌برداری و نمودار را آزمایش می‌کند و از آن نمی‌توان نتیجه‌ای دربارهٔ تغییرشکل واقعی ورامین گرفت.</p>
    </aside>
  </main>
}
