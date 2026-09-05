import { HoverCard } from 'radix-ui'
import { useLanguage, type Language } from '../i18n'
import './about.css'

const people = [
  {
    name: 'مرتضی موسوی',
    role: 'پژوهشگر پایش زمینی فرونشست',
    note: 'نویسندهٔ نخست پژوهشی بود که در سال ۲۰۰۱ برنامهٔ پایش فرونشست دشت رفسنجان با GPS را گزارش کرد. آن کار از نخستین تلاش‌های ثبت‌شده در ایران برای سنجش مستقیم این پدیده با GPS بود. بدون این اندازه‌گیری‌های آغازین، پیوند میان افت آب زیرزمینی و حرکت واقعی سطح زمین چنین زود مستند نمی‌شد.',
    source: 'مقالهٔ پایش GPS، ۲۰۰۱',
    en: { name: 'Morteza Mousavi', role: 'Researcher in ground-based subsidence monitoring', source: 'GPS monitoring study, 2001', note: 'He was the first author of a 2001 study reporting a GPS programme for monitoring subsidence in the Rafsanjan plain. It was among Iran’s earliest documented efforts to measure the phenomenon directly with GPS. Without those early measurements, the link between groundwater decline and actual ground motion would not have been documented so soon.' },
    href: 'https://doi.org/10.1139/l01-013',
  },
  {
    name: 'ابوالفضل شمسایی',
    role: 'پژوهشگر منابع آب و مهندسی عمران',
    note: 'از هم‌نویسندگان پژوهش GPS رفسنجان و از پژوهشگران دانشگاه صنعتی شریف در حوزهٔ آب زیرزمینی بود. حضور او مسئلهٔ فرونشست را به رفتار آبخوان و برداشت آب پیوند داد. بدون این نگاه میان‌رشته‌ای، اندازهٔ نشست از علت هیدروژئولوژیک آن جدا می‌ماند.',
    source: 'مقالهٔ پایش GPS، ۲۰۰۱',
    en: { name: 'Abolfazl Shamsai', role: 'Researcher in water resources and civil engineering', source: 'GPS monitoring study, 2001', note: 'A co-author of the Rafsanjan GPS study and a Sharif University of Technology researcher in groundwater, he connected subsidence to aquifer behaviour and water withdrawal. Without this interdisciplinary view, the measured settlement would have remained detached from its hydrogeological cause.' },
    href: 'https://doi.org/10.1139/l01-013',
  },
  {
    name: 'ماشاالله خامه‌چیان',
    role: 'پژوهشگر زمین‌شناسی مهندسی',
    note: 'در پژوهش پایهٔ پایش GPS فرونشست رفسنجان، خوانش زمین و لایه‌های متراکم‌شونده را در کنار سنجش ژئودتیک قرار داد. این همراهی یادآور شد که عدد جابه‌جایی بدون شناخت جنس و ساخت زمین کامل نیست. بدون این سهم، تفسیر مهندسی اندازه‌گیری‌ها پشتوانهٔ زمین‌شناختی کمتری داشت.',
    source: 'مقالهٔ پایش GPS، ۲۰۰۱',
    en: { name: 'Mashaallah Khamehchiyan', role: 'Engineering-geology researcher', source: 'GPS monitoring study, 2001', note: 'In the foundational Rafsanjan GPS study, he placed the geology and compacting strata beside the geodetic measurements. This contribution showed that a displacement value is incomplete without knowledge of the ground material and structure. Without it, the engineering interpretation would have had a weaker geological basis.' },
    href: 'https://doi.org/10.1139/l01-013',
  },
  {
    name: 'یحیی جمور',
    role: 'ژئودزی‌دان مرکز نقشه‌برداری کشور',
    note: 'در شکل‌گیری شبکهٔ دائمی GPS ایران و تلفیق ترازیابی، GPS و InSAR برای مطالعهٔ تغییرشکل زمین نقش داشت. پژوهش مشترک او دربارهٔ دشت مشهد، سنجش‌های زمینی را به تصویر ماهواره‌ای پیوند زد. بدون این زیرساخت ژئودتیک، مقایسهٔ بلندمدت حرکت زمین در مقیاس کشور بسیار دشوارتر بود.',
    source: 'پژوهش فرونشست مشهد، ۲۰۰۷',
    en: { name: 'Yahya Djamour', role: 'Geodesist at the National Cartographic Center of Iran', source: 'Mashhad subsidence study, 2007', note: 'He contributed to Iran’s permanent GPS network and to combining levelling, GPS, and InSAR for ground-deformation studies. His joint work on the Mashhad plain connected ground surveys with satellite observations. Without this geodetic infrastructure, long-term comparison of ground motion at national scale would have been far more difficult.' },
    href: 'https://doi.org/10.1111/j.1365-246X.2006.03246.x',
  },
  {
    name: 'سیاوش عربی',
    role: 'پژوهشگر ژئودزی و شبکه‌های ملی',
    note: 'به عنوان پژوهشگر مرکز نقشه‌برداری کشور در مطالعات مشهد و رفسنجان، داده‌های ترازیابی و ژئودتیک ایران را وارد تحلیل‌های InSAR کرد. این کار استمرار میان اندازه‌گیری میدانی و مشاهدهٔ ماهواره‌ای را ممکن ساخت. بدون آن، نقشه‌های فازی از سابقهٔ زمینی لازم برای کنترل و تفسیر بی‌بهره می‌ماندند.',
    source: 'پژوهش فرونشست مشهد، ۲۰۰۷',
    en: { name: 'Siavash Arabi', role: 'Researcher in geodesy and national networks', source: 'Mashhad subsidence study, 2007', note: 'As a National Cartographic Center researcher in the Mashhad and Rafsanjan studies, he brought Iranian levelling and geodetic data into InSAR analyses. This sustained the connection between field measurement and satellite observation. Without it, phase maps would have lacked the necessary ground record for control and interpretation.' },
    href: 'https://doi.org/10.1111/j.1365-246X.2006.03246.x',
  },
  {
    name: 'محمدعلی شریفی',
    role: 'پژوهشگر ژئودزی دانشگاه تهران',
    note: 'از هم‌نویسندگان مطالعه‌ای بود که افت گستردهٔ آب زیرزمینی و تغییرشکل سطح زمین ایران را با داده‌های آب و رادار ماهواره‌ای کنار هم قرار داد. آن پژوهش مسئله را از چند دشت منفرد فراتر برد. بدون این ترکیب داده، گستردگی ملی بحران آبخوان‌ها دیرتر به زبان اندازه‌گیری دیده می‌شد.',
    source: 'پژوهش فرونشست ایران، ۲۰۰۸',
    en: { name: 'Mohammad Ali Sharifi', role: 'Geodesy researcher at the University of Tehran', source: 'Iran subsidence study, 2008', note: 'He co-authored a study that examined extensive groundwater decline and surface deformation across Iran by combining water records with satellite radar data. The work moved the question beyond a handful of individual plains. Without that combination, the national extent of the aquifer crisis would have taken longer to become visible in measurements.' },
    href: 'https://doi.org/10.1029/2008GL033814',
  },
  {
    name: 'مهدی معتق',
    role: 'استاد سنجش از دور راداری و مخاطرات زمین',
    note: 'در پژوهش‌های مشهد، رفسنجان و سراسر ایران، InSAR را به ترازیابی، GPS و داده‌های آب زیرزمینی پیوند داده است. این مسیر، مشاهدهٔ نقطه‌ای را به نقشه و سری زمانی تغییرشکل تبدیل کرد. بدون این تداوم پژوهشی، تصویر ماهواره‌ای فرونشست ایران چنین منسجم و قابل مقایسه نبود.',
    source: 'نمایهٔ علمی GFZ',
    en: { name: 'Mahdi Motagh', role: 'Professor of radar remote sensing and geohazards', source: 'GFZ research profile', note: 'Across studies of Mashhad, Rafsanjan, and Iran as a whole, he has linked InSAR with levelling, GPS, and groundwater data. This work turned point observations into maps and deformation time series. Without that continuity, the satellite record of subsidence in Iran would have been less coherent and comparable.' },
    href: 'https://www.gfz.de/staff/mahdi.motagh',
  },
  {
    name: 'محمود حق‌شناس حقیقی',
    role: 'پژوهشگر تحلیل سری زمانی InSAR',
    note: 'با تحلیل ۶۶ قاب Sentinel-1، یکی از نخستین نقشه‌های جامع و کشوری فرونشست ایران را ارائه کرد و سپس تغییرشکل را در مقیاس زیرساخت بررسی کرد. این کار پراکندگی پهنه‌های درگیر را در یک قاب ملی آشکار ساخت. بدون آن، شناخت ما همچنان به مجموعه‌ای از مطالعات محلی محدود می‌ماند.',
    source: 'تحلیل کشوری Sentinel-1، ۲۰۲۱',
    en: { name: 'Mahmoud Haghshenas Haghighi', role: 'Researcher in InSAR time-series analysis', source: 'Nationwide Sentinel-1 analysis, 2021', note: 'Using 66 Sentinel-1 frames, he produced one of the first comprehensive nationwide maps of subsidence in Iran and later examined deformation at infrastructure scale. The work revealed the distribution of affected areas in a single national frame. Without it, the evidence would have remained a collection of local studies.' },
    href: 'https://doi.org/10.5194/isprs-archives-XLIII-B3-2021-155-2021',
  },
] as const

function BinaryLogoWatermark() {
  return <div className="about-binary-watermark" aria-hidden="true">
    {Array.from({ length: 24 }, (_, row) => <span key={row}>
      {row % 2 ? '10100110100101101001011010010110' : '01011001011010010110100101101001'}
    </span>)}
  </div>
}

function PersonNote({ person, language }: { person: (typeof people)[number], language: Language }) {
  const content = language === 'fa' ? person : person.en
  return <HoverCard.Root openDelay={120} closeDelay={180}>
    <HoverCard.Trigger asChild>
      <button type="button" className="person-trigger" aria-label={language === 'fa' ? `معرفی ${person.name}` : `About ${content.name}`}>{content.name}</button>
    </HoverCard.Trigger>
    <HoverCard.Portal>
      <HoverCard.Content className="person-note" sideOffset={10} collisionPadding={16}>
        <p className="person-note-label">{language === 'fa' ? 'یادداشت سپاس' : 'Acknowledgement'}</p>
        <h2>{content.name}</h2>
        <p className="person-note-role">{content.role}</p>
        <p>{content.note}</p>
        <a href={person.href} target="_blank" rel="noreferrer">{content.source}</a>
        <HoverCard.Arrow className="person-note-arrow" />
      </HoverCard.Content>
    </HoverCard.Portal>
  </HoverCard.Root>
}

function PeopleList({ language }: { language: Language }) {
  return <>{people.map((person, index) => <span key={person.name}>
    {index > 0 && (language === 'fa' ? (index === people.length - 1 ? ' و ' : '، ') : (index === people.length - 1 ? ', and ' : ', '))}
    <PersonNote person={person} language={language} />
  </span>)}</>
}

export default function AboutPage() {
  const { language } = useLanguage()
  return <main className="scientific-page about-page" lang={language} dir={language === 'fa' ? 'rtl' : 'ltr'}>
    <BinaryLogoWatermark />
    {language === 'fa' ? <>
    <header className="about-heading">
      <h1>به یاد آنان که پیش از ما اندازه گرفتند</h1>
    </header>

    <figure className="biruni-quote">
      <blockquote>وظیفهٔ هر کس در دانش خویش آن است که کوششِ پیشینیان را با سپاس بپذیرد، کاستی را اگر یافت اصلاح کند، و آنچه بر او روشن شد برای آیندگان به یادگار بگذارد.</blockquote>
      <figcaption>ابوریحان محمد بن احمد بیرونی، <cite>قانون مسعودی</cite>، جلد نخست، مقدمهٔ مؤلف، حیدرآباد دکن: مطبعهٔ مجلس دایرةالمعارف العثمانیه، چاپ نخست، ۱۳۷۳ هجری قمری / ۱۹۵۴ میلادی، ص. ۳. نسخهٔ چاپی این اثر بر اساس نسخه‌های خطی کهن تصحیح شده است.</figcaption>
    </figure>

    <article className="about-letter">
      <p className="about-opening">در پیِ گام‌های ایشان، کوشیدم این حساب را اندکی پیش‌تر ببرم.</p>
      <p>غرض از این چند کلمه نه شرح اهمیت این کار است و نه ستایش کسانی که آثارشان خود گواه خدمت ایشان است؛ مقصود، ادای دینی است به آنان که پیش از ما این راه را پیموده و برای پس از خود هموار کرده‌اند.</p>
      <p>آنچه امروز از فرونشست زمین ایران می‌دانیم، یکباره فراهم نیامده است. کسانی اندازه گرفتند و ثبت کردند؛ دیگران بر آن افزودند؛ و هر نسل، حاصل کار خود را برای نسل پس از خویش باقی گذاشت. از ترازیابی و اندازه‌گیری‌های زمینی تا GPS و مشاهدات ماهواره‌ای، هر اندازه بر اندازهٔ پیشین بنا شده است.</p>
      <p>از این رو «فرودید» را، به رسم حق‌شناسی، به پیشگامان و ادامه‌دهندگان این راه، از جمله <PeopleList language="fa" />، و به همهٔ کسانی تقدیم می‌کنم که با تحقیق و اندازه‌گیری، با نگاهداری داده‌ها، با تعلیم، یا با در دسترس نهادن حاصل کار خویش، چیزی بر شناخت فرونشست زمین ایران افزوده‌اند.</p>
      <p className="dedication">این اندک، ادای دِینی است به دانش ژئودزی در ایران و به آنان که پیش از ما اندازه گرفتند، تا ما امروز این سرزمین را بهتر بشناسیم.</p>
      <div className="signature">
        <p>با احترام،</p>
        <strong>کمیل</strong>
        <span>عضوی کوچک از جامعهٔ سنجش و شناخت زمین ایران</span>
        <time dateTime="2026">طهران، ۱۴۰۵ هجری خورشیدی</time>
      </div>
    </article>
    </> : <>
      <header className="about-heading"><h1>In memory of those who measured before us</h1></header>
      <figure className="biruni-quote">
        <blockquote>The duty of each person in their field of knowledge is to receive the efforts of predecessors with gratitude, correct any shortcomings they find, and leave what has become clear to them as a legacy for those who follow.</blockquote>
        <figcaption>Abu Rayhan Muhammad ibn Ahmad al-Biruni, <cite>Al-Qanun al-Masudi</cite>, volume I, author’s preface, Hyderabad Deccan: Osmania Oriental Publications Bureau, first edition, 1373 AH / 1954 CE, p. 3. This printed edition was prepared from early manuscripts.</figcaption>
      </figure>
      <article className="about-letter">
        <p className="about-opening">Following in their steps, I have tried to carry this reckoning a little further.</p>
        <p>These few words are meant neither to explain the importance of this work nor to praise those whose work already bears witness to their service. They are an acknowledgement of the debt owed to those who travelled this road before us and made it easier for those who followed.</p>
        <p>What we know today about land subsidence in Iran did not appear all at once. Some measured and recorded; others added to their work; and every generation left its results to the next. From levelling and ground surveys to GPS and satellite observations, each measurement has been built upon those before it.</p>
        <p>I therefore dedicate Forudid, in gratitude, to the pioneers and those who continued this work, including <PeopleList language="en" />, and to everyone who has added to our understanding of land subsidence in Iran through research and measurement, preserving data, teaching, or making their work available.</p>
        <p className="dedication">This small work is an acknowledgement of a debt to geodesy in Iran and to those who measured before us, so that we may understand this land better today.</p>
        <div className="signature"><p>With respect,</p><strong>Komeil</strong>
          <span>A small member of Iran’s community of Earth observation and measurement</span>
          <time dateTime="2026">Tehran, 1405 Solar Hijri</time></div>
      </article>
    </>}
    <footer className="about-site-footer">
      {language === 'fa' ? 'فرودید | پایش ماهواره‌ای فرونشست ایران زمین' : 'Forudid | Satellite monitoring of land subsidence in Iran'}
    </footer>
  </main>
}
