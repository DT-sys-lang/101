import Link from 'next/link'
import { ProductDetailDataTabs } from '@/components/products/product-detail-data-tabs'
import { ContactInquiryForm } from '@/components/sections/contact-inquiry-form'
import { HomeHeroCarousel, type HomeHeroSlide } from '@/components/stitch/home-hero-carousel'
import { MobileProductNavigation, ProductMegaMenu } from '@/components/stitch/product-mega-menu'
import { OptimizedImage as Image } from '@/components/ui/optimized-image'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronUp,
  Download,
  Factory,
  FileCheck2,
  Gauge,
  Mail,
  Search,
  Settings2,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import type { Locale } from '@/i18n/routing'
import type { CompanyPageContent } from '@/lib/runtime/domain-company'
import type { EntryPageResolution } from '@/lib/domain/entry-pages'
import type { ProductDetailViewModel, ProductListFilterGroupViewModel, ProductListPageViewModel } from '@/lib/domain/page-view-models'
import type { ProductNavigationViewModel } from '@/lib/domain/product-navigation'
import { getRuntimeProductNavigation } from '@/lib/runtime/domain-products'

const exportBasePath = '/stitch/heiyu-trans-industrial-design-system'

const screenFolders = {
  home: '01-yufavor-industry-sections-with-image-carousel',
  industries: '01-yufavor-industry-sections-with-image-carousel',
  products: '02-product-catalog-industrial-sensors-valves',
  productDetail: '03-product-detail-precision-pressure-sensor-series',
  waterPumpSystems: '04-water-pump-systems-updated-hero-image',
  oem: '05-oem-solutions-enhanced-hero-background',
  manufacturing: '07-manufacturing-global-production-standards',
  company: '08-about-us-modern-industrial-redesign',
  search: '09-search-products-industrial-sensor-database',
  resources: '10-resources-technical-documents-knowledge-center',
  contact: '11-contact-engineering-rfq-support',
} as const

export type StitchNativeScreen = keyof typeof screenFolders

type Product = {
  readonly model: string
  readonly title: string
  readonly family: string
  readonly specs: readonly string[]
  readonly image: string
  readonly href: string
}

type Card = {
  readonly title: string
  readonly body: string
  readonly href?: string
  readonly meta?: string
}

const products: readonly Product[] = [
  {
    model: 'YF-P10',
    title: 'Precision Pressure Sensor',
    family: 'Pressure sensor',
    specs: ['0-10 bar', '4-20mA', 'IP67'],
    image: '/assets/products/p10/main.jpg',
    href: '/products/industrial-products/pressure-sensors/yf-p10',
  },
  {
    model: 'YF-P10C',
    title: 'Compact Pressure Transmitter',
    family: 'Pressure transmitter',
    specs: ['0-16 bar', 'M12', '316L'],
    image: '/assets/products/p10c/main.jpg',
    href: '/products/industrial-products/pressure-sensors/yf-p10c',
  },
  {
    model: 'YF-P11',
    title: 'OEM Ceramic Sensor',
    family: 'OEM sensor',
    specs: ['Ceramic cell', 'Voltage output', 'OEM'],
    image: '/assets/products/p11/main.jpg',
    href: '/products/industrial-products/pressure-sensors/yf-p11',
  },
  {
    model: 'YF-F1',
    title: 'Industrial Control Valve',
    family: 'Industrial valve',
    specs: ['Water / air', 'Threaded', 'Brass'],
    image: '/assets/products/F1/main.jpg',
    href: '/products/industrial-products/industrial-valves/yf-f1',
  },
]

function asset(screen: StitchNativeScreen, file: string) {
  return `${exportBasePath}/${screenFolders[screen]}/assets/${file}`
}

function siteImage(file: string) {
  return `/images/site/${file}`
}

export function StitchNativePage({
  locale,
  screen,
  productListData,
  productDetailData,
  companyPageContent,
}: {
  readonly locale: Locale
  readonly screen: StitchNativeScreen
  readonly productListData?: ProductListPageViewModel
  readonly productDetailData?: ProductDetailViewModel
  readonly companyPageContent?: CompanyPageContent
}) {
  const productNavigation = getRuntimeProductNavigation(locale)
  return (
    <>
      <style>{`
        body > div > header,
        body > div > footer {
          display: none !important;
        }

      `}</style>
      <div className="stitch-native-page" aria-hidden="true" />
      <StitchHeader locale={locale} active={screen} productNavigation={productNavigation} />
      {renderNativePage(locale, screen, productListData, productDetailData, companyPageContent)}
      <StitchFooter locale={locale} />
    </>
  )
}

export function StitchIndustryDetailPage({
  locale,
  resolution,
}: {
  readonly locale: Locale
  readonly resolution: EntryPageResolution
}) {
  const productNavigation = getRuntimeProductNavigation(locale)
  return (
    <>
      <style>{`
        body > div > header,
        body > div > footer {
          display: none !important;
        }
      `}</style>
      <div className="stitch-native-page" aria-hidden="true" />
      <StitchHeader locale={locale} active="industries" productNavigation={productNavigation} />
      <IndustryDetailNativePage locale={locale} resolution={resolution} />
      <StitchFooter locale={locale} />
    </>
  )
}

function renderNativePage(
  locale: Locale,
  screen: StitchNativeScreen,
  productListData?: ProductListPageViewModel,
  productDetailData?: ProductDetailViewModel,
  companyPageContent?: CompanyPageContent,
) {
  switch (screen) {
    case 'industries':
      return <IndustriesNativePage locale={locale} />
    case 'products':
      return <ProductCatalogPage locale={locale} searchMode={false} productListData={productListData} />
    case 'productDetail':
      return <ProductDetailDataPage locale={locale} productDetailData={productDetailData} />
    case 'waterPumpSystems':
      return <WaterPumpSystemsPage locale={locale} />
    case 'oem':
      return <OemPage locale={locale} />
    case 'manufacturing':
      return <ManufacturingPage locale={locale} />
    case 'company':
      return <CompanyPage locale={locale} companyPageContent={companyPageContent} />
    case 'search':
      return <ProductCatalogPage locale={locale} searchMode productListData={productListData} />
    case 'resources':
      return <ResourcesPage locale={locale} />
    case 'contact':
      return <ContactPage locale={locale} />
    case 'home':
    default:
      return <HomeNativePage locale={locale} />
  }
}

function StitchHeader({
  locale,
  active,
  productNavigation,
}: {
  readonly locale: Locale
  readonly active: StitchNativeScreen
  readonly productNavigation: ProductNavigationViewModel
}) {
  const zh = locale === 'zh'
  const nav = [
    { label: zh ? '产品' : 'Products', href: '/products', active: active === 'products' || active === 'productDetail' || active === 'search' },
    { label: zh ? '行业' : 'Industries', href: '/industries', active: active === 'industries' || active === 'waterPumpSystems' },
    { label: 'OEM', href: '/oem', active: active === 'oem' },
    { label: zh ? '资料中心' : 'Resources', href: '/resources', active: active === 'resources' },
    { label: zh ? '公司' : 'Company', href: '/company', active: active === 'company' || active === 'manufacturing' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#D7DBDF] bg-white/95 text-[#1A1A1A] shadow-[0_1px_0_rgba(0,0,0,0.02)] backdrop-blur relative">
      <div className="hidden md:block">
        <div className="flex w-full items-center justify-between gap-12 px-16 pb-2 pt-5 lg:px-20">
          <div className="flex min-w-0 items-center gap-7 lg:ml-[max(0px,calc((100vw-1440px)/2-80px))]">
            <StitchBrandLogo locale={locale} />
            <nav className="flex min-w-0 items-center gap-5" aria-label={zh ? '主导航' : 'Primary navigation'}>
              {nav.map((item) => item.href === '/products' ? (
                <ProductMegaMenu
                  key={item.href}
                  locale={locale}
                  label={item.label}
                  active={item.active}
                  navigation={productNavigation}
                />
              ) : (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  aria-current={item.active ? 'page' : undefined}
                  className={item.active
                    ? 'border-b-2 border-[#005EB8] pb-1 text-[17px] font-semibold leading-none text-[#005EB8]'
                    : 'text-[17px] font-medium leading-none text-[#202426] transition-colors hover:text-[#005EB8]'}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-12 pt-1">
            <Link href={`/${locale}/contact`} className="border border-[#1A1A1A] bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#1A1A1A] transition-colors hover:border-[#005EB8] hover:text-[#005EB8]">
              {zh ? '联系工程师' : 'Contact Engineering'}
            </Link>
            <Link href={`/${locale === 'zh' ? 'en' : 'zh'}`} className="text-xs font-semibold text-[#1A1A1A]">
              {zh ? '中文 | EN' : 'EN | ZH'}
            </Link>
          </div>
        </div>
        <div className="w-full px-16 pb-4 lg:px-20">
          <form action={`/${locale}/search`} className="relative flex h-11 max-w-[720px] items-center lg:ml-[max(0px,calc((100vw-1440px)/2-80px))]">
            <label htmlFor={`stitch-search-${locale}`} className="sr-only">{zh ? '搜索' : 'Search'}</label>
            <input
              id={`stitch-search-${locale}`}
              name="search"
              type="search"
              placeholder={zh ? '搜索产品、行业或资料...' : 'Search products, industries, or resources...'}
              className="h-full w-full border border-[#C9D2DA] bg-[#F7FAFC] px-4 py-2.5 pr-11 text-sm font-medium text-[#1A1A1A] outline-none transition-all placeholder:text-[#66717A] hover:border-[#8AA8C2] focus:border-[#005EB8] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,94,184,0.10)]"
            />
            <button type="submit" aria-label={zh ? '搜索' : 'Search'} title={zh ? '搜索' : 'Search'} className="absolute right-2 grid size-8 place-items-center text-[#005EB8] transition-colors hover:text-[#003F7A]">
              <Search className="size-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
      <div className="relative flex items-center px-4 py-3 pr-16 md:hidden">
        <StitchBrandLogo locale={locale} compact />
        <details className="absolute right-4 top-1/2 -translate-y-1/2">
          <summary className="grid size-10 cursor-pointer list-none place-items-center border border-[#C9D2DA] bg-white text-[#005EB8] shadow-[0_1px_2px_rgba(0,0,0,0.06)] marker:content-none [&::-webkit-details-marker]:hidden">
            <Settings2 className="size-5" aria-hidden="true" />
          </summary>
          <nav className="absolute right-0 top-12 z-50 grid w-64 border border-[#E5E5E5] bg-white p-3 shadow-lg" aria-label={zh ? '移动导航' : 'Mobile navigation'}>
            {nav.map((item) => item.href === '/products' ? (
              <MobileProductNavigation
                key={item.href}
                locale={locale}
                label={item.label}
                navigation={productNavigation}
              />
            ) : (
              <Link key={item.href} href={`/${locale}${item.href}`} className="px-3 py-3 text-sm font-medium text-[#1A1A1A] hover:text-[#005EB8]">
                {item.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  )
}

function StitchBrandLogo({ locale, compact = false }: { readonly locale: Locale; readonly compact?: boolean }) {
  return (
    <Link
      href={`/${locale}`}
      className={compact
        ? 'flex w-fit max-w-[176px] shrink items-center justify-start gap-2'
        : 'flex w-[184px] shrink-0 items-center justify-start gap-2.5 lg:w-[196px]'}
      aria-label="YUFAVOR"
    >
      <Image
        src="/images/brand/yufavor-mark.png"
        alt=""
        width={196}
        height={188}
        preload
        className={compact ? 'h-10 w-10 object-contain' : 'h-12 w-12 object-contain lg:h-[52px] lg:w-[52px]'}
      />
      <span className={compact
        ? 'flex items-baseline whitespace-nowrap font-serif text-[21px] font-bold italic leading-none tracking-normal text-[#005EB8]'
        : 'flex items-baseline whitespace-nowrap font-serif text-[24px] font-bold italic leading-none tracking-normal text-[#005EB8] lg:text-[26px]'}
      >
        Yufavor
      </span>
    </Link>
  )
}

function StitchFooter({ locale }: { readonly locale: Locale }) {
  const zh = locale === 'zh'
  const columns = [
    {
      title: zh ? '产品与服务' : 'Products & Services',
      links: [
        [zh ? '产品' : 'Products', '/products'],
        [zh ? '行业方案' : 'Solutions', '/industries'],
        ['OEM', '/oem'],
        [zh ? '技术支持' : 'Support', '/contact'],
        [zh ? '知识中心' : 'Knowledge', '/resources'],
      ],
    },
    {
      title: zh ? '关于我们' : 'About Us',
      links: [
        [zh ? '公司' : 'Company', '/company'],
        [zh ? '认证' : 'Certification', '/resources/manuals/company-materials/quality-certification'],
        [zh ? '制造' : 'Manufacturing', '/manufacturing'],
        ['FAQ', '/resources'],
      ],
    },
    {
      title: zh ? '资料' : 'Resources',
      links: [
        [zh ? '产品手册' : 'Manuals', '/resources/manuals'],
        [zh ? '案例' : 'Cases', '/resources/cases'],
        [zh ? '博客' : 'Blog', '/resources/blog'],
        [zh ? '联系' : 'Contact', '/contact'],
      ],
    },
  ]

  return (
    <footer className="mt-auto w-full border-t border-[#E5E5E5] bg-white text-[#1A1A1A]">
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-12 px-4 py-16 md:grid-cols-4 md:px-16">
        {columns.map((column) => (
          <div key={column.title} className="flex flex-col gap-4">
            <h2 className="border-b border-[#E5E5E5] pb-3 text-xs font-bold uppercase tracking-[0.15em]">{column.title}</h2>
            <nav className="flex flex-col gap-3">
              {column.links.map(([label, href]) => (
                <Link key={href} href={`/${locale}${href}`} className="text-base font-light text-[#5D5F5F] transition-colors hover:text-[#005EB8] hover:underline">
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        ))}
        <div className="flex flex-col gap-4">
          <h2 className="border-b border-[#E5E5E5] pb-3 text-xs font-bold uppercase tracking-[0.15em]">{zh ? '联系我们' : 'Contact Us'}</h2>
          <p className="text-base font-semibold">{zh ? '上海域丰传感仪器有限公司' : 'Shanghai Yufavor Sensor Instrument Co., Ltd.'}</p>
          <p className="text-base font-light text-[#5D5F5F]">{zh ? '电话' : 'Tel'}: +86 21 61318500</p>
          <p className="text-base font-light text-[#5D5F5F]">{zh ? '邮箱' : 'Email'}: sales@yufavor.com</p>
        </div>
      </div>
    </footer>
  )
}

function HomeNativePage({ locale }: { readonly locale: Locale }) {
  const heroSlides = [
    { kind: 'video', src: '/videos/home/home_hero_01_video.mp4', poster: '/images/home/home_hero_01_poster.webp' },
    { kind: 'video', src: '/videos/home/home_hero_02_video.mp4', poster: '/images/home/home_hero_02_poster.webp' },
    { kind: 'video', src: '/videos/home/home_hero_03_video.mp4', poster: '/images/home/home_hero_03_poster.webp' },
    { kind: 'image', src: '/images/home/home_hero_04_poster.webp' },
    { kind: 'video', src: '/videos/home/home_hero_05_video.mp4', poster: '/images/home/home_hero_05_poster.webp' },
  ] as const satisfies readonly HomeHeroSlide[]

  return (
    <article className="bg-white">
      <HomeHeroCarousel slides={heroSlides} />

      <HomeStitchContentSections locale={locale} />
    </article>
  )
}

function IndustriesNativePage({ locale }: { readonly locale: Locale }) {
  const zh = locale === 'zh'
  const sectors = [
    {
      title: zh ? '石油与天然气' : 'Oil & Gas',
      href: `/${locale}/industries/oil-gas`,
      image: siteImage('offshore-platform.webp'),
      position: '50% 50%',
    },
    {
      title: zh ? '水处理' : 'Water Treatment',
      href: `/${locale}/industries/water-treatment`,
      image: siteImage('industry-water-treatment.webp'),
      position: '50% 50%',
    },
    {
      title: zh ? '能源系统' : 'Solar Energy',
      href: `/${locale}/industries/energy`,
      image: siteImage('industry-solar-energy.webp'),
      position: '50% 50%',
    },
    {
      title: zh ? '工业自动化' : 'Industrial Automation',
      href: `/${locale}/industries/industrial-automation`,
      image: siteImage('automation-production-line.webp'),
      position: '52% 50%',
    },
    {
      title: zh ? '机械工程' : 'Machine Engineering',
      href: `/${locale}/industries/manufacturing`,
      image: siteImage('manufacturing-robotics-bench.webp'),
      position: '50% 50%',
    },
    {
      title: zh ? '化工过程产线' : 'Chemical Processing Lines',
      href: `/${locale}/industries/chemical-processing`,
      image: siteImage('chemical-processing-plant.webp'),
      position: '50% 50%',
    },
  ] as const
  const ecosystem = [
    {
      icon: <SlidersHorizontal className="size-8 text-[#005EB8]" aria-hidden="true" />,
      title: zh ? '边缘仪表层' : 'Edge Instrumentation',
      body: zh ? '以高精度压力、流量和温度测量为现场设备提供稳定清晰的信号输出。' : 'High-accuracy pressure, flow, and temperature measurement with clean signal output for field devices.',
      bullets: zh ? ['4-20mA / 电压输出', 'IP 防护现场外壳', '量程匹配支持'] : ['4-20mA / voltage output', 'IP-rated field housings', 'Range matching support'],
    },
    {
      icon: <Settings2 className="size-8 text-[#005EB8]" aria-hidden="true" />,
      title: zh ? '传输可靠性' : 'Transmission Reliability',
      body: zh ? '面向 PLC、DCS、网关和控制柜集成，提供稳定的设备选型与信号连接方案。' : 'Stable device selection for PLC, DCS, gateways, and panel integration across industrial networks.',
      bullets: zh ? ['连接器 / 线缆选择', '信号稳定性验证', 'OEM 接线规范'] : ['Connector / cable selection', 'Signal stability validation', 'OEM wiring standards'],
    },
    {
      icon: <Factory className="size-8 text-[#005EB8]" aria-hidden="true" />,
      title: zh ? '管理与资料层' : 'Management Software',
      body: zh ? '通过清晰的技术资料和产品数据，帮助工程团队从咨询快速推进到 RFQ。' : 'Clear technical documents and product data that help engineering teams move from inquiry to RFQ.',
      bullets: zh ? ['数据手册与产品手册', '型号配置资料', 'RFQ 准备支持'] : ['Datasheets and manuals', 'Model configuration', 'RFQ preparation'],
    },
  ] as const

  return (
    <article className="bg-white">
      <section className="relative mx-auto h-[clamp(330px,36vw,520px)] max-w-[1440px] overflow-hidden bg-[#12181d]">
      <Image src={asset('industries', 'asset-003.png')} alt="" fill preload sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/15" />
        <div className="relative z-10 mx-auto flex h-full max-w-[1280px] flex-col justify-center px-4 md:px-16">
          <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2d9cff]">
            {zh ? '行业物联网解决方案' : 'INDUSTRIAL IOT SOLUTIONS'}
          </p>
          <h1 className="max-w-[560px] text-4xl font-bold leading-[1.05] tracking-normal text-white md:text-5xl lg:text-6xl">
            {zh ? '面向全球工业的智能物联连接' : 'Smart IoT Connectivity for Global Industry'}
          </h1>
          <p className="mt-6 max-w-[610px] text-base font-light leading-7 text-white/82">
            {zh
              ? '集成传感、边缘数据采集与云端兼容架构，为高性能测量和自动化系统提供可靠连接。'
              : 'Integrated sensing solutions and edge computing architectures designed for high-performance measurement and seamless data transparency.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href={`/${locale}/contact`} className="inline-flex h-11 items-center bg-white px-6 text-xs font-bold uppercase tracking-[0.08em] text-[#111820] transition-colors hover:bg-[#005EB8] hover:text-white">
              {zh ? '咨询工程师' : 'Contact Engineering'}
            </Link>
            <Link href={`/${locale}/resources/cases/iot-application-cases`} className="inline-flex h-11 items-center border border-white/70 px-6 text-xs font-bold uppercase tracking-[0.08em] text-white transition-colors hover:border-white hover:bg-white hover:text-[#111820]">
              {zh ? '查看物联网案例' : 'View IoT Case'}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 py-20 md:px-16">
        <div className="mb-10 max-w-[720px]">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#005EB8]">{zh ? '行业领域' : 'Industry Sectors'}</p>
          <h2 className="text-3xl font-semibold leading-tight tracking-normal text-[#1A1A1A]">{zh ? '面向不同工况的测量与控制场景' : 'Industrial sectors connected by reliable measurement'}</h2>
          <p className="mt-5 text-sm font-light leading-7 text-[#697179]">
            {zh
              ? '从能源、水处理到制造设备，我们帮助工程团队围绕实际工况选择压力、温度、流量和阀门控制方案。'
              : 'Everyday millions of field sensor values arrive to the world’s most demanding environments, from deep water to grid energy and industrial process loops.'}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-px bg-white sm:grid-cols-2 lg:grid-cols-3">
          {sectors.map((sector) => (
            <Link key={sector.title} href={sector.href} className="group relative h-[230px] overflow-hidden bg-[#111820]">
              <Image src={sector.image} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" style={{ objectPosition: sector.position }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/28 to-transparent transition-colors group-hover:from-[#005EB8]/85" />
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-5">
                <h3 className="max-w-[220px] text-xl font-bold leading-tight tracking-normal text-white">{sector.title}</h3>
                <ArrowRight className="size-5 text-white opacity-80 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#F6F8FA] px-4 py-20 md:px-16">
        <div className="mx-auto max-w-[1280px]">
          <div className="mx-auto mb-12 max-w-[620px] text-center">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#005EB8]">{zh ? '物联网生态' : 'The IoT Ecosystem'}</p>
            <h2 className="text-3xl font-semibold tracking-normal text-[#1A1A1A]">{zh ? '从现场仪表到工程决策的数据链路' : 'From field instruments to actionable intelligence'}</h2>
            <p className="mt-4 text-sm font-light leading-7 text-[#697179]">
              {zh ? '围绕传感、传输和管理软件构建完整工业数据路径。' : 'A unified framework connecting physical assets to digital intelligence through sensors and smart layers of business integration.'}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {ecosystem.map((item) => (
              <div key={item.title} className="border border-[#E1E6EA] bg-white px-8 py-10 text-center">
                <div className="mx-auto mb-7 grid size-14 place-items-center bg-[#EEF6FD]">{item.icon}</div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#005EB8]">Layer 0{ecosystem.indexOf(item) + 1}</p>
                <h3 className="mb-5 text-xl font-semibold tracking-normal text-[#1A1A1A]">{item.title}</h3>
                <p className="mx-auto mb-8 max-w-[290px] text-sm font-light leading-6 text-[#697179]">{item.body}</p>
                <ul className="mx-auto grid max-w-[250px] gap-3 text-left">
                  {item.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-xs font-medium leading-5 text-[#4B555E]">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#005EB8]" aria-hidden="true" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#EEF1F4] px-4 py-12 md:px-16">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-normal text-[#1A1A1A]">{zh ? '准备构建您的物联网生态系统？' : 'Ready to Engineer Your Ecosystem?'}</h2>
            <p className="mt-3 max-w-[740px] text-sm font-light leading-6 text-[#697179]">
              {zh
                ? '我们的应用专家可协助梳理工况、选型传感器，并输出适合项目采购和工程交付的资料。'
                : 'Our application specialists are ready to connect your specific industry requirements. From sensor specification to system development, Yufavor ensures architecture every step of the way.'}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-4">
            <Link href={`/${locale}/contact`} className="inline-flex h-11 items-center bg-[#111820] px-6 text-xs font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#005EB8]">
              {zh ? '开始项目咨询' : 'Start Project Inquiry'}
            </Link>
            <Link href={`/${locale}/products`} className="inline-flex h-11 items-center border border-[#C7D0D8] bg-white px-6 text-xs font-bold uppercase tracking-[0.08em] text-[#111820] transition-colors hover:border-[#005EB8] hover:text-[#005EB8]">
              {zh ? '浏览产品' : 'Explore Products'}
            </Link>
          </div>
        </div>
      </section>
    </article>
  )
}

function IndustryDetailNativePage({
  locale,
  resolution,
}: {
  readonly locale: Locale
  readonly resolution: EntryPageResolution
}) {
  const zh = locale === 'zh'
  const page = resolution.page
  const entry = page.entries[0]
  const products = entry?.products ?? []
  const visual = getIndustryDetailVisual(resolution.seo.canonicalPath)
  const featuredProducts = products.slice(0, 3)
  const schematicProducts = products.slice(0, 2)
  const proofItems = page.proof.slice(0, 4)
  const quickLinks = [
    { label: zh ? '石油与天然气' : 'Oil & Gas', href: `/${locale}/industries/oil-gas` },
    { label: zh ? '水处理' : 'Water Treatment', href: `/${locale}/industries/water-treatment` },
    { label: zh ? '能源系统' : 'Solar Energy', href: `/${locale}/industries/energy` },
    { label: zh ? '工业自动化' : 'Industrial Automation', href: `/${locale}/industries/industrial-automation` },
    { label: zh ? '机械工程' : 'Machine Engineering', href: `/${locale}/industries/manufacturing` },
    { label: zh ? '化工过程产线' : 'Chemical Processing Lines', href: `/${locale}/industries/chemical-processing` },
  ] as const

  return (
    <article className="bg-[#F5F6F7] pb-16">
      <main className="mx-auto max-w-[1280px] px-4 py-10 md:px-16">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <nav className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A9298]">
              <Link href={`/${locale}`} className="hover:text-[#005EB8]">{zh ? '首页' : 'Home'}</Link>
              <span>/</span>
              <Link href={`/${locale}/industries`} className="hover:text-[#005EB8]">{zh ? '行业' : 'Industries'}</Link>
              <span>/</span>
              <span className="text-[#1A1A1A]">{page.title}</span>
            </nav>
            <h1 className="text-4xl font-bold leading-none tracking-normal text-[#1A1A1A] md:text-5xl">{page.title}</h1>
            <p className="mt-4 max-w-2xl text-sm font-light leading-7 text-[#697179]">{entry?.meta ?? page.eyebrow}</p>
          </div>
          <Link href={`/${locale}/industries`} className="inline-flex h-10 items-center justify-center border border-[#C9D2DA] bg-white px-4 text-xs font-bold text-[#1A1A1A] transition-colors hover:border-[#005EB8] hover:text-[#005EB8]">
            {zh ? '行业应用' : 'Industry Applications'}
            <ArrowRight className="ml-2 size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <section className="relative mb-12 h-[clamp(330px,38vw,560px)] overflow-hidden bg-[#111820]">
      <Image src={visual.image} alt="" fill preload sizes="(min-width: 1280px) 1152px, 100vw" className="object-cover" style={{ objectPosition: visual.position }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <div className="absolute bottom-7 left-7 border-l-4 border-[#005EB8] bg-white px-5 py-4 shadow-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#005EB8]">{zh ? '行业性能' : 'Industry Performance'}</p>
            <p className="mt-1 text-sm font-semibold text-[#1A1A1A]">{entry?.meta ?? (zh ? '工程选型支持' : 'Engineering selection support')}</p>
          </div>
          <div className="absolute bottom-7 right-7 hidden w-56 bg-black/72 p-5 text-white backdrop-blur md:block">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">{zh ? '关键路径' : 'Critical Path'}</p>
            <p className="mt-3 text-2xl font-bold leading-none">{String(products.length).padStart(2, '0')}</p>
            <p className="mt-2 text-xs leading-5 text-white/72">{zh ? '可用于该行业的推荐产品与资料节点。' : 'Recommended product and document nodes for this sector.'}</p>
          </div>
        </section>

        <div className="grid gap-10 lg:grid-cols-[1fr_330px]">
          <div className="space-y-12">
            <section className="bg-white p-8 md:p-10">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#005EB8]">{zh ? '行业挑战' : 'Accepting the Challenge'}</p>
              <h2 className="text-2xl font-bold tracking-normal text-[#1A1A1A]">{zh ? '围绕真实工况组织产品和资料' : `Measurement architecture for ${page.title}`}</h2>
              <p className="mt-5 text-base font-light leading-8 text-[#697179]">{page.body}</p>
            </section>

            <section className="bg-white p-8 md:p-10">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#005EB8]">{zh ? '安全保障' : 'Safety Assurance'}</p>
              <h2 className="text-2xl font-bold tracking-normal text-[#1A1A1A]">{zh ? '从传感器输入到工程交付的控制点' : 'Control points from sensor input to delivery'}</h2>
              <p className="mt-5 text-base font-light leading-8 text-[#697179]">
                {zh
                  ? '通过量程、输出、连接、防护等级和认证资料的组合，帮助工程与采购团队减少选型风险。'
                  : 'Reliability is maintained across handling, signal validation, documentation, and RFQ handoff so teams can compare options without losing technical context.'}
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {(proofItems.length > 0 ? proofItems : [
                  { label: 'Selection Support', value: 'RFQ ready' },
                  { label: 'Signal Output', value: '4-20mA / 0-10V' },
                  { label: 'Documentation', value: 'Datasheets' },
                  { label: 'Application Review', value: 'Engineering' },
                ]).map((item) => (
                  <div key={item.label} className="flex items-start gap-3 border border-[#E5E9ED] bg-[#FAFBFC] p-4">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#005EB8]" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-[#1A1A1A]">{item.label}</p>
                      <p className="mt-1 text-xs font-light leading-5 text-[#697179]">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#005EB8]">{zh ? '技术图纸与系统' : 'Technical Schematics & Systems'}</p>
                  <h2 className="text-2xl font-bold tracking-normal text-[#1A1A1A]">{zh ? '推荐产品路径' : 'Recommended product paths'}</h2>
                </div>
                <Link href={`/${locale}/products`} className="hidden text-xs font-bold uppercase tracking-[0.12em] text-[#005EB8] hover:text-[#1A1A1A] md:inline-flex">{zh ? '查看全部' : 'View all'}</Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {(schematicProducts.length > 0 ? schematicProducts : products).slice(0, 2).map((product) => (
                  <Link key={product.id} href={`/${locale}${product.href}`} className="group border border-[#E1E6EA] bg-white p-5 transition-all hover:border-[#005EB8] hover:shadow-lg">
                    <div className="relative mb-5 h-44 bg-[#F2F4F6]">
                      <Image src={product.media.primaryImage?.href ?? '/images/hero/industrial-instrumentation.png'} alt={product.media.primaryImage?.alt ?? product.title} fill sizes="(min-width: 768px) 360px, 100vw" className="object-contain p-6 transition" />
                    </div>
                    <p className="font-mono text-xs text-[#005EB8]">{product.model}</p>
                    <h3 className="mt-2 text-lg font-bold tracking-normal text-[#1A1A1A]">{product.title}</h3>
                    <p className="mt-3 line-clamp-2 text-sm font-light leading-6 text-[#697179]">{product.summary}</p>
                    <span className="mt-5 inline-flex items-center text-xs font-bold uppercase tracking-[0.12em] text-[#005EB8]">
                      {zh ? '查看规格' : 'View Specifications'}
                      <ArrowRight className="ml-2 size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="border border-[#E1E6EA] bg-white p-7">
              <h2 className="mb-6 text-xl font-bold tracking-normal text-[#1A1A1A]">{zh ? '资料与产品' : 'Brochures & Flyers'}</h2>
              <div className="space-y-4">
                {featuredProducts.map((product) => (
                  <Link key={product.id} href={`/${locale}${product.href}`} className="group flex items-start gap-3">
                    <span className="mt-1 grid size-8 shrink-0 place-items-center bg-[#EEF6FD]">
                      <Download className="size-4 text-[#005EB8]" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold leading-5 text-[#1A1A1A] group-hover:text-[#005EB8]">{product.title}</span>
                      <span className="mt-1 block text-xs text-[#697179]">{product.categoryLabel}</span>
                    </span>
                  </Link>
                ))}
              </div>
              <Link href={`/${locale}/resources/manuals`} className="mt-7 inline-flex w-full items-center justify-center border border-[#C9D2DA] px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-[#1A1A1A] hover:border-[#005EB8] hover:text-[#005EB8]">
                {zh ? '请求资料包' : 'Request information package'}
              </Link>
            </section>

            <section className="border border-[#E1E6EA] bg-white">
              <div className="relative h-44 bg-[#111820]">
          <Image src={siteImage('quality-test-bench.webp')} alt="" fill sizes="330px" className="object-cover" />
              </div>
              <div className="p-7">
                <h2 className="text-xl font-bold tracking-normal text-[#1A1A1A]">{zh ? '工程支持' : 'Engineering Support'}</h2>
                <p className="mt-4 text-sm font-light leading-6 text-[#697179]">
                  {zh ? '围绕当前行业工况提供量程、输出、连接和认证资料确认。' : 'Need project advice for your specific process? Our engineering team can review working conditions before RFQ.'}
                </p>
                <Link href={`/${locale}/contact`} className="mt-6 inline-flex w-full items-center justify-center bg-[#111820] px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-white hover:bg-[#005EB8]">
                  {zh ? '联系工程师' : 'Contact Engineering'}
                </Link>
              </div>
            </section>

            <section className="border border-[#E1E6EA] bg-white p-7">
              <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[#1A1A1A]">{zh ? '行业快速入口' : 'Industry quick links'}</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {quickLinks.map((item) => (
                  <Link key={item.href} href={item.href} className="border border-[#E5E9ED] bg-[#FAFBFC] px-3 py-3 text-center text-xs font-bold text-[#4B555E] transition-colors hover:border-[#005EB8] hover:text-[#005EB8]">
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </article>
  )
}

function getIndustryDetailVisual(path: string) {
  if (path.includes('water')) {
    return { image: asset('industries', 'asset-006.png'), position: '48% 50%' }
  }

  if (path.includes('automation') || path.includes('manufacturing')) {
    return { image: asset('industries', 'asset-008.png'), position: '50% 50%' }
  }

  if (path.includes('energy')) {
    return { image: asset('industries', 'asset-003.png'), position: '74% 50%' }
  }

  if (path.includes('chemical-processing')) {
    return { image: asset('industries', 'asset-006.png'), position: '86% 50%' }
  }

  return { image: asset('industries', 'asset-006.png'), position: '24% 50%' }
}

function HomeStitchContentSections({ locale }: { readonly locale: Locale }) {
  const zh = locale === 'zh'

  return (
    <>
      <section className="mx-auto max-w-[1280px] bg-white px-4 py-24 md:px-16">
        <div className="mb-12 flex items-center justify-between">
          <h1 className="flex items-center text-xs font-medium uppercase tracking-[0.15em] text-gray-500">
            <span className="mr-4 h-px w-12 bg-[#005EB8]" />
            {zh ? '行业应用' : 'Industry Applications'}
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Link href={`/${locale}/industries`} className="group relative min-h-[450px] cursor-pointer overflow-hidden border border-[#E5E5E5] bg-gray-50 shadow-sm transition-shadow duration-500 hover:shadow-md lg:col-span-8">
            <div className="relative z-10 flex h-full max-w-[68%] flex-col justify-between bg-gradient-to-r from-gray-50 via-gray-50/90 to-transparent p-8 md:p-12">
              <div>
                <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#005EB8]">{zh ? '重点系统' : 'Featured System'}</span>
                <h2 className="text-4xl font-bold leading-tight text-[#1A1A1A] transition-colors duration-500 group-hover:text-[#005EB8] md:text-5xl">
                  {zh ? '行业解决方案' : 'Industry Solutions'}
                </h2>
              </div>
              <p className="mt-8 max-w-sm text-sm font-light leading-6 text-gray-500">
                {zh ? '面向多行业工况的高精度检测解决方案。' : 'Multi-industry high-precision detection solutions for diverse working conditions.'}
              </p>
            </div>
            <div className="absolute right-0 top-0 z-0 h-full w-1/2 overflow-hidden opacity-95 transition-opacity duration-700 group-hover:opacity-100">
              <Image src={siteImage('industry-water-wide.webp')} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
            </div>
          </Link>
          <div className="relative z-20 flex flex-col justify-between gap-5 lg:col-span-4 lg:-ml-20 lg:py-4">
            <HomeIndustryMiniCard
              title={zh ? '水处理' : 'Water Treatment'}
              href={`/${locale}/industries/water-treatment`}
              image={siteImage('industry-water-treatment.webp')}
              imagePosition="50% 50%"
              offset
            />
            <HomeIndustryMiniCard
              title={zh ? '工业自动化' : 'Industrial Automation'}
              href={`/${locale}/industries/industrial-automation`}
              image={siteImage('automation-production-line.webp')}
              imagePosition="50% 50%"
            />
            <HomeIndustryMiniCard
              title={zh ? '更多行业方案' : 'More Industry Solutions'}
              href={`/${locale}/industries`}
              image={siteImage('chemical-processing-plant.webp')}
              imagePosition="78% 50%"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1280px] gap-12 border-y border-[#E5E5E5] bg-white px-4 py-20 md:px-16 lg:grid-cols-[minmax(320px,420px)_1fr] lg:gap-16">
        <div className="group relative aspect-[900/1200] w-full max-w-[420px] overflow-hidden bg-gray-50">
          <div className="absolute inset-0 z-0 bg-gray-200/20 opacity-50" />
          <Image src={siteImage('custom-sensor-development-vertical.webp')} alt="" fill sizes="(min-width: 1024px) 420px, 100vw" className="relative z-10 object-cover transition duration-700 group-hover:scale-105" />
        </div>
        <div className="flex flex-col justify-center bg-white py-4 lg:max-w-[560px]">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.15em] text-gray-500">{zh ? 'OEM 工程' : 'OEM Engineering'}</p>
          <h2 className="mb-8 font-serif text-4xl leading-[1.08] tracking-normal text-[#1A1A1A] lg:text-5xl">
            {zh ? '定制传感器' : 'Custom Sensor'} <br />
            <span className="inline-flex flex-wrap items-baseline gap-x-5 gap-y-2">
              <span className="font-sans font-light italic text-gray-400">{zh ? '开发' : 'Development'}</span>
              <Link href={`/${locale}/oem`} className="group inline-flex items-center gap-2 font-sans text-xs font-bold not-italic uppercase tracking-[0.14em] text-[#005EB8] transition-colors hover:text-[#1A1A1A]">
                {zh ? '查看 OEM 方案' : 'View OEM Solutions'}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </span>
          </h2>
          <p className="mb-10 max-w-xl text-base font-light leading-relaxed text-gray-600">
            {zh ? '我们为特殊测量需求提供全生命周期工程支持，从初始结构设计到认证设施中的原型验证。' : 'We provide full-lifecycle engineering for specialized measurement requirements. From initial topological design to prototype validation in accredited facilities.'}
          </p>
          <div className="space-y-6">
            <HomeCapabilityLine title={zh ? '定制规格' : 'Custom Specifications'} body={zh ? '按量程、接口、输出和机械结构定制。' : 'Range, interface, output, and mechanical housing customization.'} />
            <HomeCapabilityLine title={zh ? '信号校准' : 'Signal Calibration'} body={zh ? '围绕目标工况执行校准和输出验证。' : 'Calibration and output verification around the target operating condition.'} />
            <HomeCapabilityLine title={zh ? '材料选择' : 'Material Selection'} body={zh ? '依据介质、温度和腐蚀性选择接液材料。' : 'Wetted material selection based on media, temperature, and corrosion risk.'} />
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-[1280px] px-4 py-24 md:px-16">
        <div className="mb-10 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-gray-500">{zh ? '质量与制造' : 'Quality & Manufacturing'}</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href={`/${locale}/manufacturing`} className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#005EB8] hover:text-[#1A1A1A]">
              {zh ? '查看制造能力' : 'View Manufacturing'}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link href={`/${locale}/resources/manuals/company-materials/quality-certification`} className="text-xs font-bold uppercase tracking-[0.15em] text-[#005EB8] hover:text-[#1A1A1A]">
              {zh ? '查看认证' : 'View Certifications'}
            </Link>
          </div>
        </div>
        <div className="group relative min-h-[430px] overflow-visible">
          <div className="relative ml-auto h-[430px] w-full overflow-hidden md:w-[78%]">
            <Image src={siteImage('quality-test-bench.webp')} alt="" fill sizes="(min-width: 768px) 78vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
          </div>
          <div className="absolute -bottom-10 left-0 z-10 max-w-lg border-t-4 border-[#005EB8] bg-white p-8 shadow-2xl md:left-24 md:p-10">
            <h2 className="mb-6 text-3xl font-light tracking-normal text-[#1A1A1A]">{zh ? '精密制造' : 'Precision Manufacturing'}</h2>
            <p className="mb-8 font-light leading-relaxed text-gray-600">
              {zh ? '每台设备都在受控环境中进行自动化多点校准，确保偏差可控。' : 'Every unit undergoes automated, multi-point calibration in controlled environmental chambers to ensure zero-tolerance deviation.'}
            </p>
            <Link href={`/${locale}/manufacturing`} className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#005EB8] transition-colors hover:text-[#1A1A1A]">
              {zh ? '查看制造能力' : 'View Manufacturing'}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

function HomeIndustryMiniCard({
  title,
  href,
  image,
  imagePosition = '50% 50%',
  offset = false,
}: {
  readonly title: string
  readonly href: string
  readonly image: string
  readonly imagePosition?: string
  readonly offset?: boolean
}) {
  return (
    <Link href={href} className={`group relative z-10 h-[126px] overflow-hidden border border-white/60 bg-[#111820] shadow-[0_18px_45px_rgba(17,24,32,0.16)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(0,94,184,0.22)] ${offset ? 'lg:-ml-8 lg:z-30' : ''}`}>
      <Image src={image} alt="" fill sizes="(min-width: 1024px) 360px, 100vw" className="object-cover transition duration-700 group-hover:scale-105" style={{ objectPosition: imagePosition }} />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B1116]/92 via-[#0B1116]/60 to-[#005EB8]/10 transition-colors duration-500 group-hover:from-[#005EB8]/88 group-hover:via-[#0B1116]/60" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-[#005EB8]" />
      <div className="relative flex h-full flex-col justify-between p-5">
        <h3 className="max-w-[280px] text-[22px] font-semibold leading-tight tracking-normal text-white transition-colors md:text-2xl">
          {title}
        </h3>
        <ArrowRight className="ml-auto size-5 text-white transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </div>
    </Link>
  )
}

function HomeCapabilityLine({ title, body }: { readonly title: string; readonly body: string }) {
  return (
    <div className="flex gap-5 border-t border-[#E5E5E5] pt-5">
      <span className="mt-1 h-3 w-3 shrink-0 border border-[#005EB8] bg-[#005EB8]/10" aria-hidden="true" />
      <div>
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#1A1A1A]">{title}</h3>
        <p className="mt-2 text-sm font-light leading-6 text-gray-500">{body}</p>
      </div>
    </div>
  )
}

function ProductCatalogPage({
  locale,
  searchMode,
  productListData,
}: {
  readonly locale: Locale
  readonly searchMode: boolean
  readonly productListData?: ProductListPageViewModel
}) {
  const zh = locale === 'zh'
  const defaultHeroTitle = searchMode
    ? (zh ? '工业传感器数据库' : 'Industrial Sensor Database')
    : (zh ? '工业测量产品' : 'Industrial Measurement Products')
  const defaultHeroBody = zh
    ? '适用于关键工业应用的精密工程传感器与变送器，按照严格欧洲性能标准制造，在严苛环境中保持可靠。'
    : 'Precision-engineered sensors and transmitters for critical industrial applications. Built to strict European performance standards ensuring uncompromising reliability in demanding environments.'
  const heroTitle = searchMode ? defaultHeroTitle : productListData?.category.name ?? defaultHeroTitle
  const heroBody = searchMode ? defaultHeroBody : productListData?.category.description || defaultHeroBody
  const fallbackCatalogProducts = [
    {
      category: zh ? '压力传感器' : 'PRESSURE SENSOR',
      name: 'PT-X 1000 Heavy Duty',
      image: asset('products', 'asset-003.jpg'),
      href: `/${locale}/products/industrial-products/pressure-sensors/yf-p10`,
      specs: [
        [zh ? '量程' : 'Range', '0...10 to 0...1000 bar'],
        [zh ? '输出' : 'Output', '4...20 mA'],
        [zh ? '精度' : 'Accuracy', '< 0.25% span'],
      ],
    },
    {
      category: zh ? '温度传感器' : 'TEMPERATURE SENSOR',
      name: 'TR-34 RTD Assembly',
      image: asset('products', 'asset-004.jpg'),
      href: `/${locale}/products/industrial-products/pressure-sensors/yf-p10c`,
      specs: [
        [zh ? '元件' : 'Element', 'PT100, Class A'],
        [zh ? '温度范围' : 'Temp. Range', '-50...250 °C'],
        [zh ? '连接' : 'Connection', 'M12 x 1, 4-pin'],
      ],
    },
    {
      category: zh ? '液位传感器' : 'LEVEL SENSOR',
      name: 'LS-10 Submersible',
      image: asset('products', 'asset-005.jpg'),
      href: `/${locale}/products/industrial-products/pressure-sensors/yf-p11`,
      specs: [
        [zh ? '量程' : 'Range', '0...01 to...25 bar'],
        [zh ? '输出' : 'Output', '4...20 mA'],
        [zh ? '防护' : 'Protection', 'IP68'],
      ],
    },
  ] as const
  const hasProductListData = Boolean(productListData)
  const importedProducts = productListData?.productList.items ?? []
  const catalogProducts = hasProductListData
    ? importedProducts.map((product) => ({
        category: product.categoryLabel.toUpperCase(),
        name: product.title.replace(/\s+\|\s+Yufavor$/i, ''),
        image: product.media.primaryImage?.href ?? product.media.galleryImages[0]?.href ?? asset('products', 'asset-003.jpg'),
        href: `/${locale}${product.href}`,
        status: product.availabilityLabel,
        specs: product.keySpecs.slice(0, 3).map((spec) => [spec.label, spec.value] as const),
      }))
    : fallbackCatalogProducts
  const filterGroups = productListData?.filterGroups ?? []
  const hasActiveFilters = filterGroups.some((group) => group.items.some((item) => item.active))
  const resetAllHref = `/${locale}${productListData?.search.clearHref ?? '/products'}`
  const primaryFilterGroup = filterGroups[0]
  const secondaryFilterGroup = filterGroups[1]
  const primaryFilterName = getCatalogFilterInputName(primaryFilterGroup, 'category')
  const secondaryFilterName = getCatalogFilterInputName(secondaryFilterGroup, 'industry')
  const selectedFilterValues = getSelectedCatalogFilterValues(productListData?.search.hiddenInputs)
  const primaryFilterItems = primaryFilterGroup?.items.slice(0, 4).map((item) => toCatalogFilterItem(item, primaryFilterName, selectedFilterValues))
  const secondaryFilterItems = secondaryFilterGroup?.items.slice(0, 4).map((item) => toCatalogFilterItem(item, secondaryFilterName, selectedFilterValues))
  const rangeMinBar = productListData?.productList.query.rangeMinBar
  const rangeMaxBar = productListData?.productList.query.rangeMaxBar
  const primaryFilterTitle = primaryFilterGroup?.title ?? (zh ? '产品类别' : 'Product Category')
  const secondaryFilterTitle = secondaryFilterGroup?.title ?? (zh ? '行业' : 'Industry')
  const countLabel = productListData?.countLabel ?? (zh ? '显示 24 个产品' : 'Showing 24 products')
  const pagination = productListData?.pagination
  const productSectionTitle = productListData?.category.name ?? (searchMode ? (zh ? '搜索结果' : 'Search Results') : (zh ? '产品列表' : 'Product List'))
  const emptyProductTitle = zh ? '当前分类暂无产品' : 'No products in this category yet'
  const emptyProductBody = zh ? '后续上传到该分类后会显示在这里。' : 'Products assigned to this category will appear here.'

  return (
    <article className="bg-[#F7F7F7] text-[#1A1A1A]">
      <section className="border-b border-[#D9DDDF] bg-white">
        <div className="mx-auto max-w-[1280px] px-4 pb-20 pt-24 md:px-14 lg:px-16">
          <h1 className="max-w-[980px] text-5xl font-semibold leading-[1.08] tracking-normal text-[#1A1A1A] md:text-[56px]">
            {heroTitle}
          </h1>
          <p className="mt-5 max-w-[760px] text-[15px] font-medium leading-7 text-[#30383E]">
            {heroBody}
          </p>
        </div>
      </section>

      <section id="product-list" className="scroll-mt-28 mx-auto grid max-w-[1280px] gap-8 px-4 py-14 md:px-14 lg:grid-cols-[290px_minmax(0,1fr)] lg:px-16">
        <aside className="h-fit lg:sticky lg:top-32">
          <h2 className="mb-5 border-b border-[#DDE1E4] pb-4 text-[11px] font-bold uppercase tracking-[0.08em] text-[#1A1A1A]">{zh ? '工程筛选' : 'Engineered Filters'}</h2>
          <div className="grid gap-3">
            {filterGroups.map((group) => (
              <CatalogLinkFilterSection key={group.title} locale={locale} group={group} />
            ))}
          </div>
          {hasActiveFilters ? (
            <Link href={resetAllHref} scroll={false} className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#005EB8] underline-offset-2 transition-colors hover:text-[#003F7A] hover:underline">
              <X className="size-3" aria-hidden="true" />
              {zh ? '重置所有' : 'Reset all'}
            </Link>
          ) : null}
          <form className="hidden" action={`/${locale}${searchMode ? '/search' : '/products'}`} method="get" aria-hidden="true">
            {productListData?.search.value ? <input type="hidden" name="search" value={productListData.search.value} /> : null}
            <CatalogFilterSection
              title={primaryFilterTitle}
              inputName={primaryFilterName}
              items={primaryFilterItems ?? [
                { label: zh ? '压力变送器' : 'Pressure Transmitters', value: 'cat_pressure_transmitters', checked: isCatalogFilterSelected(selectedFilterValues, primaryFilterName, 'cat_pressure_transmitters') },
                { label: zh ? '差压测量' : 'Differential Pressure', value: 'cat_differential_pressure', checked: isCatalogFilterSelected(selectedFilterValues, primaryFilterName, 'cat_differential_pressure') },
                { label: zh ? '液位传感器' : 'Level Sensors', value: 'cat_submersible_level', checked: isCatalogFilterSelected(selectedFilterValues, primaryFilterName, 'cat_submersible_level') },
                { label: zh ? '工业阀门' : 'Industrial Valves', value: 'cat_industrial_valves', checked: isCatalogFilterSelected(selectedFilterValues, primaryFilterName, 'cat_industrial_valves') },
              ]}
            />
            <CatalogFilterSection
              title={secondaryFilterTitle}
              inputName={secondaryFilterName}
              items={secondaryFilterItems ?? [
                { label: zh ? '水处理' : 'Water Treatment', value: 'water-treatment', checked: isCatalogFilterSelected(selectedFilterValues, secondaryFilterName, 'water-treatment') },
                { label: 'OEM', value: 'oem', checked: isCatalogFilterSelected(selectedFilterValues, secondaryFilterName, 'oem') },
                { label: zh ? '能源系统' : 'Energy Systems', value: 'energy', checked: isCatalogFilterSelected(selectedFilterValues, secondaryFilterName, 'energy') },
                { label: zh ? '工业自动化' : 'Industrial Automation', value: 'automation', checked: isCatalogFilterSelected(selectedFilterValues, secondaryFilterName, 'automation') },
              ]}
            />
            <section className="border-b border-[#DDE1E4] py-5">
              <h3 className="mb-4 text-[12px] font-semibold text-[#1A1A1A]">{zh ? '测量范围' : 'Measurement Range'}</h3>
              <div className="grid grid-cols-[76px_76px_auto] items-center gap-2">
                <input name="rangeMinBar" type="number" step="any" aria-label={zh ? '最小量程' : 'Minimum range'} placeholder="Min" defaultValue={formatNumberInputValue(rangeMinBar)} className="h-9 w-[76px] border border-[#C9D2DA] bg-white px-3 text-xs font-medium text-[#1A1A1A] outline-none placeholder:text-[#7C858C] focus:border-[#005EB8]" />
                <input name="rangeMaxBar" type="number" step="any" aria-label={zh ? '最大量程' : 'Maximum range'} placeholder="Max" defaultValue={formatNumberInputValue(rangeMaxBar)} className="h-9 w-[76px] border border-[#C9D2DA] bg-white px-3 text-xs font-medium text-[#1A1A1A] outline-none placeholder:text-[#7C858C] focus:border-[#005EB8]" />
                <span className="text-xs font-medium text-[#30383E]">bar</span>
              </div>
            </section>
            <button type="submit" className="mt-7 h-10 w-full border border-[#D6DCE0] bg-white text-[11px] font-bold uppercase tracking-[0.08em] text-[#1A1A1A] transition-colors hover:border-[#005EB8] hover:text-[#005EB8]">
              {zh ? '应用筛选' : 'Apply Filters'}
            </button>
          </form>
        </aside>

        <div className="min-w-0">
          <div className="mb-8 flex flex-col gap-4 border-b border-[#DDE1E4] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold leading-tight tracking-normal text-[#1A1A1A]">{productSectionTitle}</h2>
              <p className="mt-2 text-[12px] font-medium text-[#30383E]">{countLabel}</p>
            </div>
            <label className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#1A1A1A]">
              {zh ? '排序：' : 'Sort By:'}
              <select className="h-8 border-0 bg-transparent text-[12px] font-medium normal-case tracking-normal text-[#1A1A1A] outline-none">
                <option>{zh ? '相关性' : 'Relevance'}</option>
                <option>{zh ? '型号' : 'Model'}</option>
                <option>{zh ? '类别' : 'Category'}</option>
              </select>
            </label>
          </div>
          {catalogProducts.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-3">
                {catalogProducts.map((product) => <CatalogProductTile key={product.name} product={product} />)}
              </div>
              {pagination && pagination.totalPages > 1 ? (
                <div className="mt-12 border-t border-[#DDE1E4] pt-8">
                  <nav className="flex justify-center gap-2" aria-label={zh ? '产品分页' : 'Product pagination'}>
                    {pagination.previousHref ? (
                      <Link aria-label={zh ? '上一页' : 'Previous page'} href={`/${locale}${pagination.previousHref}#product-list`} className="grid size-9 place-items-center border border-[#D6DCE0] bg-white text-sm font-medium text-[#4B555E] hover:border-[#005EB8] hover:text-[#005EB8]">‹</Link>
                    ) : null}
                    {pagination.pages.map((page) => (
                      <Link key={page.number} aria-current={page.current ? 'page' : undefined} href={`/${locale}${page.href}#product-list`} className={page.current ? 'grid size-9 place-items-center border border-[#005EB8] bg-white text-sm font-semibold text-[#005EB8]' : 'grid size-9 place-items-center border border-[#D6DCE0] bg-white text-sm font-medium text-[#4B555E] hover:border-[#005EB8] hover:text-[#005EB8]'}>
                        {page.number}
                      </Link>
                    ))}
                    {pagination.nextHref ? (
                      <Link aria-label={zh ? '下一页' : 'Next page'} href={`/${locale}${pagination.nextHref}#product-list`} className="grid size-9 place-items-center border border-[#D6DCE0] bg-white text-sm font-medium text-[#4B555E] hover:border-[#005EB8] hover:text-[#005EB8]">›</Link>
                    ) : null}
                  </nav>
                </div>
              ) : null}
            </>
          ) : (
            <div className="border border-[#DDE1E4] bg-white p-8">
              <h3 className="text-lg font-semibold tracking-normal text-[#1A1A1A]">{emptyProductTitle}</h3>
              <p className="mt-3 max-w-[560px] text-sm leading-6 text-[#4B555E]">{emptyProductBody}</p>
            </div>
          )}
        </div>
      </section>
    </article>
  )
}

type CatalogFilterInputName = 'category' | 'family' | 'industry' | 'application'

type CatalogFilterItem = {
  readonly label: string
  readonly value: string
  readonly checked: boolean
}

type CatalogSelectedFilterValues = Partial<Record<CatalogFilterInputName, ReadonlySet<string>>>

type CatalogFilterGroupLike = {
  readonly items: readonly {
    readonly label: string
    readonly value: string
    readonly href: string
    readonly active: boolean
  }[]
}

function CatalogCategoryBrowser({
  locale,
  navigation,
}: {
  readonly locale: Locale
  readonly navigation: ProductListPageViewModel['categoryNavigation']
}) {
  const activeGroup = navigation.groups.find((group) => group.active) ?? navigation.groups[0]

  if (!activeGroup) {
    return null
  }

  return (
    <section className="border-b border-[#DDE1E4] bg-white">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 md:px-14 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-16">
        <aside className="min-w-0">
          <h2 className="mb-4 text-[13px] font-bold tracking-normal text-[#1A1A1A]">{navigation.title}</h2>
          <nav className="grid gap-2" aria-label={navigation.title}>
            {navigation.groups.map((group) => (
              <Link
                key={group.id}
                href={`/${locale}${group.href}`}
                scroll={false}
                className={group.active
                  ? 'flex min-h-12 items-center justify-between gap-3 border border-[#005EB8] bg-[#F6FAFE] px-4 text-[14px] font-semibold text-[#005EB8] shadow-[inset_3px_0_0_#005EB8]'
                  : 'flex min-h-12 items-center justify-between gap-3 border border-[#DDE1E4] bg-white px-4 text-[14px] font-medium text-[#1A3350] transition-colors hover:border-[#005EB8] hover:text-[#005EB8]'}
              >
                <span className="min-w-0 truncate">{group.title}</span>
                <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <div className="grid gap-3 sm:grid-cols-2">
            {activeGroup.items.map((item) => (
              <Link
                key={item.id}
                href={`/${locale}${item.href}#product-list`}
                className="group grid min-h-[104px] grid-cols-[112px_minmax(0,1fr)_32px] items-center gap-4 border border-[#D6DCE0] bg-white px-4 transition-all hover:border-[#005EB8] hover:shadow-[0_10px_28px_rgba(0,94,184,0.12)]"
              >
                <span className="relative block h-20 overflow-hidden bg-[#F3F6F8]">
                  <Image
                    src={getCatalogCategoryImage(item.id)}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-contain p-3 transition duration-500 group-hover:scale-105"
                  />
                </span>
                <span className="min-w-0 text-[16px] font-semibold leading-6 text-[#063C72]">{item.title}</span>
                <ArrowRight className="size-4 text-[#005EB8] transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function getCatalogCategoryImage(categoryId: string) {
  if (categoryId.includes('valve')) {
    return '/assets/products/F1/main.jpg'
  }

  if (categoryId.includes('level')) {
    return '/assets/products/p11/main.jpg'
  }

  if (categoryId.includes('temperature') || categoryId.includes('rtd') || categoryId.includes('thermocouple')) {
    return asset('products', 'asset-004.jpg')
  }

  if (categoryId.includes('gauge')) {
    return asset('products', 'asset-003.jpg')
  }

  if (categoryId.includes('wireless')) {
    return asset('products', 'asset-005.jpg')
  }

  if (categoryId.includes('switch')) {
    return '/assets/products/p13/main.jpg'
  }

  return '/assets/products/p10/main.jpg'
}

function toCatalogFilterItem(
  item: CatalogFilterGroupLike['items'][number],
  inputName: CatalogFilterInputName,
  selectedValues: CatalogSelectedFilterValues,
): CatalogFilterItem {
  return {
    label: item.label,
    value: item.value,
    checked: item.active || isCatalogFilterSelected(selectedValues, inputName, item.value),
  }
}

function getSelectedCatalogFilterValues(inputs: readonly { readonly name: string; readonly value: string }[] = []): CatalogSelectedFilterValues {
  const result: Partial<Record<CatalogFilterInputName, Set<string>>> = {}

  for (const input of inputs) {
    if (!isCatalogFilterInputName(input.name)) {
      continue
    }

    result[input.name] ??= new Set<string>()
    result[input.name]?.add(input.value)
  }

  return result
}

function isCatalogFilterSelected(selectedValues: CatalogSelectedFilterValues, inputName: CatalogFilterInputName, value: string) {
  return selectedValues[inputName]?.has(value) ?? false
}

function isCatalogFilterInputName(value: string): value is CatalogFilterInputName {
  return value === 'category' || value === 'family' || value === 'industry' || value === 'application'
}

function getCatalogFilterInputName(group: CatalogFilterGroupLike | undefined, fallback: CatalogFilterInputName): CatalogFilterInputName {
  const firstHref = group?.items[0]?.href
  const queryString = firstHref?.split('?')[1]

  if (queryString) {
    const params = new URLSearchParams(queryString)

    if (params.has('family')) return 'family'
    if (params.has('industry')) return 'industry'
    if (params.has('application')) return 'application'
  }

  if (group?.items.some((item) => item.value.startsWith('cat_'))) {
    return 'category'
  }

  return fallback
}

function formatNumberInputValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : undefined
}

function CatalogFilterSection({
  title,
  inputName,
  items,
}: {
  readonly title: string
  readonly inputName: CatalogFilterInputName
  readonly items: readonly CatalogFilterItem[]
}) {
  return (
    <section className="border-b border-[#DDE1E4] py-5">
      <h3 className="mb-4 text-[12px] font-semibold text-[#1A1A1A]">{title}</h3>
      <div className="grid gap-3">
        {items.map((item) => (
          <label key={`${inputName}-${item.value}`} className="flex items-center gap-3 text-[12px] font-medium text-[#30383E]">
            <input name={inputName} value={item.value} type="checkbox" defaultChecked={item.checked} className="size-3.5 border border-[#D6DCE0] accent-[#005EB8]" />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
    </section>
  )
}

function CatalogLinkFilterSection({
  locale,
  group,
}: {
  readonly locale: Locale
  readonly group: ProductListFilterGroupViewModel
}) {
  const zh = locale === 'zh'
  const hasActiveItems = group.items.some((item) => item.active)

  return (
    <section className="rounded-md border border-[#DDE1E4] bg-white shadow-[0_1px_5px_rgba(15,23,42,0.08)]">
      <div className="flex min-h-9 items-center justify-between gap-3 px-3 py-2.5">
        <h3 className="min-w-0 text-[12px] font-bold leading-4 text-[#1A1A1A]">{group.title}</h3>
        <ChevronUp className="size-3.5 shrink-0 text-[#1A1A1A]" aria-hidden="true" />
      </div>
      <div className="grid gap-1.5 px-3 pb-3">
        {group.items.map((item) => (
          <Link
            key={`${group.title}-${item.value}`}
            href={`/${locale}${item.href}`}
            scroll={false}
            aria-pressed={item.active}
            className="group/filter flex min-h-5 items-start gap-2 text-[11px] font-medium leading-4 text-[#172333] transition-colors hover:text-[#005EB8]"
          >
            <span
              className={item.active
                ? 'mt-0.5 grid size-3 shrink-0 place-items-center rounded-[2px] border border-[#0099FF] bg-white text-[#0099FF]'
                : 'mt-0.5 size-3 shrink-0 rounded-[2px] border border-[#9AA6B2] bg-white group-hover/filter:border-[#005EB8]'}
              aria-hidden="true"
            >
              {item.active ? <Check className="size-2.5" strokeWidth={3} aria-hidden="true" /> : null}
            </span>
            <span className="min-w-0 flex-1 break-words">{item.label}</span>
            <span className="shrink-0 text-[#1A3350]">({item.count})</span>
          </Link>
        ))}
        {hasActiveItems && group.clearHref ? (
          <Link href={`/${locale}${group.clearHref}`} scroll={false} className="mt-1 inline-flex w-fit items-center gap-1 text-[11px] font-medium text-[#005EB8] underline-offset-2 transition-colors hover:text-[#003F7A] hover:underline">
            <X className="size-3" aria-hidden="true" />
            {zh ? '重置选择' : 'Reset selection'}
          </Link>
        ) : null}
      </div>
    </section>
  )
}

function CatalogProductTile({
  product,
}: {
  readonly product: {
    readonly category: string
    readonly name: string
    readonly image: string
    readonly href: string
    readonly status?: string
    readonly specs: readonly (readonly [string, string])[]
  }
}) {
  return (
    <Link href={product.href} className="group block border border-[#DDE1E4] bg-white transition-all hover:border-[#005EB8] hover:shadow-lg">
      <div className="relative h-[210px] border-b border-[#DDE1E4] bg-[#F0F3F5]">
        <Image src={product.image} alt={product.name} fill sizes="(min-width: 768px) 30vw, 100vw" className="object-contain p-8 transition duration-500 group-hover:scale-105" />
        <span className="absolute right-4 top-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#148C3A]">
          <span className="size-2 bg-[#2FBF5B]" aria-hidden="true" />
          {product.status ?? 'Stock'}
        </span>
      </div>
      <div className="p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#4B555E]">{product.category}</p>
        <h3 className="mt-3 min-h-[54px] text-2xl font-semibold leading-[1.15] tracking-normal text-[#1A1A1A]">{product.name}</h3>
        <dl className="mt-5 grid gap-3">
          {product.specs.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 border-b border-[#EEF1F3] pb-2 last:border-b-0">
              <dt className="text-[11px] font-medium text-[#4B555E]">{label}</dt>
              <dd className="text-right text-[11px] font-medium text-[#1A1A1A]">{value}</dd>
            </div>
          ))}
        </dl>
        <span className="mt-6 inline-flex items-center text-[11px] font-bold uppercase tracking-[0.08em] text-[#005EB8]">
          {product.href.startsWith('/zh') ? '查看详情' : 'View Details'}
          <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

function ProductDetailPage({ locale }: { readonly locale: Locale }) {
  const zh = locale === 'zh'
  const product = products[0]

  return (
    <article className="bg-white">
      <section className="border-b border-[#E5E5E5]">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-14 md:px-16 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
          <div className="group relative min-h-[460px] border border-[#E5E5E5] bg-[#F7F7F7]">
            <Image src={asset('productDetail', 'asset-003.jpg')} alt={product.title} fill preload sizes="(min-width: 1024px) 46vw, 100vw" className="object-cover transition duration-500" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="eyebrow">{zh ? '产品详情' : 'Product Detail'}</p>
            <h1 className="mt-4 display-title">{zh ? '精密压力传感器系列' : 'Precision Pressure Sensor Series'}</h1>
            <p className="mt-6 text-lg leading-8 text-[#5D5F5F]">{zh ? '适用于泵系统、流体控制和 OEM 设备的紧凑型压力测量平台。' : 'A compact pressure measurement platform for pump systems, fluid control, and OEM equipment.'}</p>
            <div className="mt-8 grid gap-px border border-[#E5E5E5] bg-[#E5E5E5] sm:grid-cols-3">
              {['0-10 bar', '4-20mA', 'IP67'].map((item) => (
                <div key={item} className="bg-white p-5">
                  <div className="font-mono text-xl font-semibold">{item}</div>
                  <div className="mt-2 text-xs uppercase text-[#5D5F5F]">{zh ? '关键参数' : 'Key spec'}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink locale={locale} href="/contact">{zh ? '获取报价' : 'Request RFQ'}</PrimaryLink>
              <SecondaryLink locale={locale} href="/products">{zh ? '返回产品中心' : 'Back to Catalog'}</SecondaryLink>
            </div>
          </div>
        </div>
      </section>
      <SpecSection locale={locale} />
    </article>
  )
}

function ProductDetailDataPage({
  locale,
  productDetailData,
}: {
  readonly locale: Locale
  readonly productDetailData?: ProductDetailViewModel
}) {
  const zh = locale === 'zh'
  const fallbackImage = asset('productDetail', 'asset-003.jpg')
  const image = productDetailData?.media.primaryImage ?? { href: fallbackImage, alt: zh ? '产品图片' : 'Product image' }
  const title = productDetailData?.hero.title ?? (zh ? '精密压力传感器系列' : 'Precision Pressure Sensor Series')
  const summary = productDetailData?.hero.summary ?? (zh ? '适用于泵系统、流体控制和 OEM 设备的紧凑型压力测量平台。' : 'A compact pressure measurement platform for pump systems, fluid control, and OEM equipment.')
  const model = productDetailData?.hero.model ?? 'YPT-500'

  return (
    <article className="bg-white">
      <main className="mx-auto max-w-[1280px] px-4 py-12 md:px-16">
        <nav className="mb-8 text-xs font-semibold text-[#5D5F5F]">
          <Link href={`/${locale}/products`} className="hover:text-[#005EB8]">{zh ? '产品' : 'Products'}</Link>
          <span className="px-2">&gt;</span>
          <span className="text-[#1A1A1A]">{title}</span>
        </nav>

        <section className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex h-[500px] items-center justify-center border border-[#E5E5E5] bg-white p-8">
            <Image src={image.href} alt={image.alt} width={720} height={720} preload className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-[#5D5F5F]">{zh ? '型号' : 'Model'}: {model}</span>
            <h1 className="mb-4 text-4xl font-semibold leading-tight text-[#1A1A1A] md:text-5xl">{title}</h1>
            <p className="mb-8 text-lg font-medium leading-8 text-[#30383E]">{summary}</p>
            <div className="mb-8 grid overflow-hidden border border-[#DDE1E4] bg-white sm:grid-cols-3">
              {(productDetailData?.overviewSpecs.slice(0, 3) ?? [
                { label: zh ? '量程' : 'Range', value: '0-10 bar' },
                { label: zh ? '输出' : 'Output', value: '4-20mA' },
                { label: zh ? '防护' : 'Protection', value: 'IP67' },
              ]).map((spec) => <ProductOverviewSpecCard key={spec.label} label={spec.label} value={spec.value} />)}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <PrimaryLink locale={locale} href="/contact">{productDetailData?.actions.quoteLabel ?? (zh ? '请求报价' : 'Request Quote')}</PrimaryLink>
              <SecondaryLink locale={locale} href={productDetailData?.actions.datasheetHref ?? '/resources/manuals'} documentLink={Boolean(productDetailData?.actions.datasheetHref)}>
                <Download className="size-4" aria-hidden="true" />
                {productDetailData?.actions.datasheetLabel ?? (zh ? '数据表 PDF' : 'Datasheet (PDF)')}
              </SecondaryLink>
            </div>
          </div>
        </section>

        <ProductDetailDataSections locale={locale} productDetailData={productDetailData} />
      </main>
    </article>
  )
}

function ProductDetailDataSections({
  locale,
  productDetailData,
}: {
  readonly locale: Locale
  readonly productDetailData?: ProductDetailViewModel
}) {
  const zh = locale === 'zh'
  const specRows = filterElectricalConnectionRows(productDetailData?.technicalParameters.groups.flatMap((group) => group.values) ?? [
    { label: zh ? '测量范围' : 'Measuring Range', value: '0...1 bar to 0...1000 bar' },
    { label: zh ? '输出信号' : 'Output Signal', value: '4...20 mA' },
    { label: zh ? '防护等级' : 'Protection Rating', value: 'IP65 / IP67' },
  ])
  const dimensionRows = filterElectricalConnectionRows([
    ...(productDetailData?.overviewSpecs ?? []),
    ...(productDetailData?.variants.items[0]?.options.map((option) => ({ label: zh ? '可选项' : 'Option', value: option })) ?? []),
  ])
  const downloads = [
    ...(productDetailData?.actions.datasheetHref ? [{ title: productDetailData.actions.datasheetLabel, href: productDetailData.actions.datasheetHref, meta: zh ? '产品数据手册' : 'Product datasheet' }] : []),
    ...(productDetailData?.geoSummary?.evidence.filter((item) => item.href).map((item) => ({ title: item.title, href: item.href as string, meta: item.sourceType })) ?? []),
  ]
  const primaryDownload = downloads[0] ?? { title: zh ? '联系工程师获取数据手册' : 'Contact engineering for datasheet', href: `/${locale}/contact`, meta: zh ? '资料请求' : 'Document request' }
  const features = productDetailData?.hero.badges.length ? productDetailData.hero.badges : [productDetailData?.hero.availabilityLabel ?? (zh ? '在售' : 'Available')]

  return (
    <ProductDetailDataTabs
      locale={locale}
      specRows={specRows}
      dimensionRows={dimensionRows.length ? dimensionRows : specRows.slice(0, 4)}
      features={features}
      downloads={downloads}
      primaryDownload={primaryDownload}
      dimensionImage={{
        href: productDetailData?.media.primaryImage?.href ?? asset('productDetail', 'asset-003.jpg'),
        alt: productDetailData?.media.primaryImage?.alt ?? (zh ? '产品尺寸图片' : 'Product dimension image'),
      }}
    />
  )
}

function ProductOverviewSpecCard({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <section className="flex min-h-[148px] flex-col justify-between border-b border-[#DDE1E4] px-6 py-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <h2 className="text-lg font-semibold leading-none tracking-normal text-[#1A1A1A]">{label}</h2>
      <p className="mt-5 min-h-[44px] break-words font-mono text-[15px] font-semibold leading-6 text-[#1A1A1A]">{value}</p>
    </section>
  )
}

function filterElectricalConnectionRows(rows: readonly { readonly label: string; readonly value: string }[]) {
  return rows.filter((row) => !/electrical\s*connection|电气连接/i.test(row.label))
}

function ProductDetailStitchPage({ locale }: { readonly locale: Locale }) {
  const zh = locale === 'zh'

  return (
    <article className="bg-white">
      <main className="mx-auto max-w-[1280px] px-4 py-12 md:px-16">
        <nav className="mb-8 text-xs font-semibold text-[#5D5F5F]">
          <Link href={`/${locale}/products`} className="hover:text-[#005EB8]">{zh ? '产品' : 'Products'}</Link>
          <span className="px-2">&gt;</span>
          <Link href={`/${locale}/products?search=pressure`} className="hover:text-[#005EB8]">{zh ? '压力测量' : 'Pressure Measurement'}</Link>
          <span className="px-2">&gt;</span>
          <span className="text-[#1A1A1A]">{zh ? 'YPT-500 高精度变送器' : 'YPT-500 High-Precision Transmitter'}</span>
        </nav>

        <section className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex h-[500px] items-center justify-center border border-[#E5E5E5] bg-white p-8">
            <Image
              src={asset('productDetail', 'asset-003.jpg')}
              alt={zh ? '高精度工业压力变送器' : 'High-precision industrial pressure transmitter'}
              width={640}
              height={640}
              preload
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-[#5D5F5F]">{zh ? '型号' : 'Model'}: YPT-500</span>
            <h1 className="mb-4 text-4xl font-semibold leading-tight text-[#1A1A1A] md:text-5xl">
              {zh ? '高精度工业压力变送器' : 'High-Precision Industrial Pressure Transmitter'}
            </h1>
            <p className="mb-8 text-lg leading-8 text-[#444748]">
              {zh
                ? '专为要求极高精度和长期稳定性的工业应用而设计。YPT-500 采用先进压阻式传感技术，并封装在坚固的不锈钢外壳中，确保在严苛环境中可靠测量。'
                : 'Engineered for demanding industrial applications requiring extreme accuracy and long-term stability. The YPT-500 utilizes advanced piezoresistive sensing technology housed in a robust stainless steel enclosure, ensuring reliable measurement in harsh environments.'}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <PrimaryLink locale={locale} href="/contact">{zh ? '请求报价' : 'Request Quote'}</PrimaryLink>
              <SecondaryLink locale={locale} href="/resources/manuals">
                <Download className="size-4" aria-hidden="true" />
                {zh ? '数据表 PDF' : 'Datasheet (PDF)'}
              </SecondaryLink>
            </div>
          </div>
        </section>

        <ProductDetailTechnicalSection locale={locale} />
      </main>
    </article>
  )
}

function ProductDetailTechnicalSection({ locale }: { readonly locale: Locale }) {
  const zh = locale === 'zh'
  const rows = [
    [zh ? '测量范围' : 'Measuring Range', '0...1 bar to 0...1000 bar (Gauge, Absolute, Sealed Gauge)'],
    [zh ? '精度（非线性）' : 'Accuracy (Non-linearity)', '≤ ±0.1% FS (BFSL) standard, optionally 0.05%'],
    [zh ? '输出信号' : 'Output Signal', '4...20 mA (2-wire), 0...10 V (3-wire), HART®, RS485 Modbus'],
    [zh ? '工作温度' : 'Operating Temperature', '-40°C ... +125°C (Media)'],
    [zh ? '接液材质' : 'Wetted Parts Material', 'Stainless Steel 316L, Titanium alloy (optional)'],
    [zh ? '防护等级' : 'Protection Rating', 'IP65 / IP67 / IP68 (depending on electrical connection)'],
  ] as const
  const features = zh
    ? ['高过载能力', '优异长期稳定性', '紧凑坚固设计']
    : ['High overload resistance', 'Excellent long-term stability', 'Compact and rugged design']
  const related = [
    [zh ? '温度' : 'Temperature', 'YTT-200 RTD Sensor'],
    [zh ? '液位' : 'Level', 'YLT-Submersible Transmitter'],
    [zh ? '附件' : 'Accessories', 'Manifold Valves'],
  ] as const

  return (
    <>
      <section className="mb-8 flex gap-8 overflow-x-auto border-b border-[#E5E5E5]">
        {[zh ? '技术规格' : 'Technical Specifications', zh ? '尺寸' : 'Dimensions', zh ? '电气连接' : 'Electrical Connection', zh ? '下载' : 'Downloads'].map((tab, index) => (
          <button
            key={tab}
            type="button"
            className={index === 0
              ? 'whitespace-nowrap border-b-2 border-[#005EB8] pb-4 text-xs font-semibold uppercase tracking-[0.05em] text-[#005EB8]'
              : 'whitespace-nowrap pb-4 text-xs font-semibold uppercase tracking-[0.05em] text-[#5D5F5F] transition-colors hover:text-[#1A1A1A]'}
          >
            {tab}
          </button>
        ))}
      </section>

      <section className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="overflow-x-auto border border-[#E5E5E5] bg-white md:col-span-8">
          <table className="w-full text-left text-base text-[#1A1A1A]">
            <thead>
              <tr>
                <th className="w-1/3 border-b border-[#E5E5E5] px-4 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#5D5F5F]">
                  {zh ? '参数' : 'Parameter'}
                </th>
                <th className="border-b border-[#E5E5E5] px-4 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#5D5F5F]">
                  {zh ? '数值 / 描述' : 'Value / Description'}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, value], index) => (
                <tr key={label} className={index % 2 === 1 ? 'bg-[#F7F7F7]/50' : undefined}>
                  <td className="border-b border-[#E5E5E5] px-4 py-3">{label}</td>
                  <td className="border-b border-[#E5E5E5] px-4 py-3">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <aside className="flex flex-col gap-6 border border-[#E5E5E5] bg-white p-8 md:col-span-4">
          <h2 className="text-2xl font-medium text-[#1A1A1A]">{zh ? '关键特性' : 'Key Features'}</h2>
          <ul className="flex flex-col gap-3 text-base text-[#444748]">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#005EB8]" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="mb-16">
        <h2 className="mb-8 border-b border-[#E5E5E5] pb-4 text-3xl font-semibold text-[#1A1A1A]">{zh ? '相关产品' : 'Related Products'}</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {related.map(([meta, title]) => (
            <article key={title} className="group cursor-pointer border border-[#E5E5E5] bg-white p-6 transition-colors hover:border-[#005EB8]">
              <div className="mb-4 flex h-48 items-center justify-center bg-[#F7F7F7]">
                <span className="text-sm font-semibold text-[#5D5F5F]">{zh ? '图片占位' : 'Image Placeholder'}</span>
              </div>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.05em] text-[#5D5F5F]">{meta}</span>
              <h3 className="text-2xl font-medium text-[#1A1A1A] transition-colors group-hover:text-[#005EB8]">{title}</h3>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

function WaterPumpSystemsPage({ locale }: { readonly locale: Locale }) {
  const zh = locale === 'zh'

  return (
    <article className="bg-white">
      <PageHero
        locale={locale}
        image={asset('waterPumpSystems', 'asset-003.png')}
        eyebrow={zh ? '行业方案' : 'Industry Solution'}
        title={zh ? '水泵与水处理系统' : 'Water Pump Systems'}
        body={zh ? '围绕压力监测、干转保护、管路控制和阀门联动建立完整的系统入口。' : 'A complete selection path for pressure monitoring, dry-run protection, pipe control, and valve coordination.'}
      />
      <SectionIntro
        eyebrow={zh ? '系统模块' : 'System Modules'}
        title={zh ? '传感器与阀门组合推荐' : 'Sensor and valve combinations'}
        body={zh ? '以工况为主线组织产品，而不是只展示孤立型号。' : 'Products are organized around operating scenarios instead of isolated model numbers.'}
      />
      <section className="mx-auto grid max-w-[1280px] gap-6 px-4 pb-24 md:grid-cols-3 md:px-16">
        {[
          [zh ? '泵出口压力监测' : 'Pump outlet monitoring', siteImage('industry-water-treatment.webp')],
          [zh ? '过滤器压差检测' : 'Filter differential pressure', siteImage('industry-process-tanks.webp')],
          [zh ? '补水阀门联动' : 'Make-up valve control', siteImage('sensor-waterproof-test.webp')],
        ].map(([title, image], index) => (
          <ImageCard key={title} index={index + 1} title={title} image={image} body={zh ? '推荐压力传感器、变送器和阀门形成可询价组合。' : 'Recommended sensors, transmitters, and valves form a quote-ready package.'} />
        ))}
      </section>
    </article>
  )
}

function OemPage({ locale }: { readonly locale: Locale }) {
  const zh = locale === 'zh'
  const oemCaseHref = `/${locale}/resources/cases/oem-cases`
  const lifecycle = [
    zh ? '定制压力范围' : 'Custom Pressure Ranges',
    zh ? '专业材料' : 'Specialized Materials',
    zh ? '定制温度校准' : 'Custom Temperature Calibration',
    zh ? 'IoT 集成' : 'IoT Integration',
    zh ? '信号编程' : 'Signal Programming',
    zh ? '私有标签' : 'Private Labeling',
  ] as const

  return (
    <article className="bg-[#F5F6F7] pb-12 text-[#1A1A1A]">
      <main className="mx-auto max-w-[1280px] px-4 py-10 md:px-16">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <nav className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A9298]">
            <Link href={`/${locale}`} className="hover:text-[#005EB8]">{zh ? '首页' : 'Home'}</Link>
            <span>/</span>
            <span className="text-[#1A1A1A]">OEM</span>
          </nav>
          <Link href={`/${locale}/contact`} className="inline-flex h-9 items-center justify-center border border-[#C9D2DA] bg-white px-4 text-xs font-bold text-[#1A1A1A] transition-colors hover:border-[#005EB8] hover:text-[#005EB8]">
            {zh ? '定制工程' : 'Custom Engineering'}
            <ArrowRight className="ml-2 size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <section className="relative mb-12 h-[clamp(330px,36vw,520px)] overflow-hidden bg-[#111820]">
          <Image src={asset('oem', 'asset-003.jpg')} alt="" fill preload sizes="(min-width: 1280px) 1152px, 100vw" className="object-cover" style={{ objectPosition: '50% 50%' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          <div className="absolute bottom-7 left-7 border-l-4 border-[#005EB8] bg-white px-5 py-4 shadow-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#005EB8]">{zh ? '定制工程' : 'Custom Engineering'}</p>
            <p className="mt-1 text-sm font-semibold text-[#1A1A1A]">{zh ? '面向独特规格的精密传感器方案' : 'Precision Engineering for Your Unique Specifications'}</p>
          </div>
          <div className="absolute bottom-7 right-7 hidden w-56 bg-black/72 p-5 text-white backdrop-blur md:block">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">{zh ? '工程支持' : 'Engineering'}</p>
            <p className="mt-3 text-2xl font-bold leading-none">OEM</p>
            <p className="mt-2 text-xs leading-5 text-white/72">{zh ? '从参数确认到批量供货的定制流程。' : 'Custom workflow from specification to repeatable supply.'}</p>
          </div>
        </section>

        <div className="grid gap-10 lg:grid-cols-[1fr_330px]">
          <div className="space-y-12">
            <section className="bg-white p-8 md:p-10">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#005EB8]">{zh ? '接受挑战' : 'Accepting the Challenge'}</p>
              <h1 className="text-2xl font-bold tracking-normal text-[#1A1A1A]">{zh ? '把特殊需求转化为可交付的传感器项目' : 'Turning unique specifications into repeatable sensor programs'}</h1>
              <p className="mt-5 text-base font-medium leading-8 text-[#30383E]">
                {zh
                  ? 'Yufavor 专注于面向特殊工况的工程定制，包括传感器结构、测量范围、材料、输出信号、标签包装和长期供货维护。我们的 OEM 路径帮助设备制造商把需求转化为可验证、可采购、可批量交付的产品方案。'
                  : 'Yufavor specializes in the design, prototyping, and manufacturing of custom sensors tailored for complex industrial applications. Our OEM services support sensor structure, measuring range, pressure connections, output signals, labels, packaging, and long-term product maintenance.'}
              </p>
            </section>

            <section className="bg-white p-8 md:p-10">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#005EB8]">{zh ? '定制开发生命周期' : 'Custom Development Lifecycle'}</p>
              <h2 className="text-2xl font-bold tracking-normal text-[#1A1A1A]">{zh ? '从需求评审到批量交付' : 'From requirement review to controlled supply'}</h2>
              <p className="mt-5 text-base font-medium leading-8 text-[#30383E]">
                {zh
                  ? '我们的工程流程围绕规格评审、样品确认、测试记录、包装标签和交付窗口推进，让采购和工程团队能够在同一套资料中评估项目。'
                  : 'Our engineering process is built for special-purpose sensors. From initial requirement entry and sample prototyping to validation testing and final documentation, we provide a transparent development path.'}
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {lifecycle.map((item) => (
                  <div key={item} className="flex items-start gap-3 border border-[#E5E9ED] bg-[#FAFBFC] p-4">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#005EB8]" aria-hidden="true" />
                    <p className="text-sm font-semibold text-[#1A1A1A]">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-6">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#005EB8]">{zh ? '项目案例' : 'Custom Project Showcase'}</p>
                <h2 className="text-2xl font-bold tracking-normal text-[#1A1A1A]">{zh ? '定制工程项目示例' : 'Examples of custom engineering programs'}</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <OemProjectCard
                  href={oemCaseHref}
                  image={siteImage('quality-test-bench.webp')}
                  title={zh ? '欧洲压力变送器定制' : 'European Pressure Transmitter for Aerospace'}
                  body={zh ? '针对高压力、高精度和特殊标签需求进行定制。' : 'Ultra-lightweight structure, extended range, and custom documentation for a demanding application.'}
                  ctaLabel={zh ? '查看 OEM 案例' : 'View OEM Case'}
                />
                <OemProjectCard
                  href={oemCaseHref}
                  image={siteImage('thread-calibration-machine.webp')}
                  title={zh ? '高温液位传感器' : 'High-Temperature Level Sensor for Food Grade'}
                  body={zh ? '围绕食品级材料、温度范围和输出信号建立样品方案。' : 'PTFE compatible material, wide temperature window, and application-specific output configuration.'}
                  ctaLabel={zh ? '查看 OEM 案例' : 'View OEM Case'}
                />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="border border-[#E1E6EA] bg-white p-7">
              <h2 className="mb-6 text-xl font-bold tracking-normal text-[#1A1A1A]">{zh ? 'OEM 资源' : 'OEM Resources'}</h2>
              <div className="space-y-4">
                <Link href={oemCaseHref} className="group flex items-start gap-3">
                  <span className="mt-1 grid size-8 shrink-0 place-items-center bg-[#EEF6FD]">
                    <Download className="size-4 text-[#005EB8]" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold leading-5 text-[#1A1A1A] group-hover:text-[#005EB8]">{zh ? '查看 OEM 案例' : 'View OEM Cases'}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#697179]">{zh ? '真实案例上传后将在案例列表中展示。' : 'Real project stories will appear in the case list after upload.'}</span>
                  </span>
                </Link>
              </div>
              <Link href={oemCaseHref} className="mt-7 inline-flex w-full items-center justify-center border border-[#C9D2DA] px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-[#1A1A1A] hover:border-[#005EB8] hover:text-[#005EB8]">
                {zh ? '查看 OEM 案例' : 'View OEM case'}
              </Link>
            </section>

            <section className="border border-[#D6DCE3] bg-[#B8C0CB] p-7 shadow-sm">
              <div className="flex items-center gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/25 text-[#111820]">
                  <Mail className="size-5" aria-hidden="true" />
                </span>
                <h2 className="text-2xl font-bold tracking-normal text-[#111820]">{zh ? '联系销售' : 'Contact Sales'}</h2>
              </div>
              <div className="mt-7 space-y-5 text-[#111820]">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3F4852]">Telephone</p>
                  <p className="mt-2 text-xl font-bold">+86 21 61318500</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3F4852]">Email</p>
                  <p className="mt-2 text-sm font-medium">sales@yufavor.com</p>
                </div>
              </div>
              <Link href={`/${locale}/contact`} className="mt-7 inline-flex w-full items-center justify-center gap-3 bg-[#111820] px-4 py-4 text-sm font-bold text-white transition-colors hover:bg-[#005EB8]">
                <Mail className="size-4" aria-hidden="true" />
                {zh ? '联系表格' : 'Contact Form'}
              </Link>
            </section>

            <section className="border border-[#E1E6EA] bg-white p-7">
              <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[#1A1A1A]">{zh ? '快速链接' : 'Relevant quick links'}</h2>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  [zh ? '案例' : 'Cases', '/resources/cases'],
                  [zh ? '产品' : 'Products', '/products'],
                  [zh ? '联系' : 'RFQ', '/contact'],
                ].map(([label, href]) => (
                  <Link key={href} href={`/${locale}${href}`} className="border border-[#E5E9ED] bg-[#FAFBFC] px-2 py-3 text-center text-xs font-bold text-[#4B555E] hover:border-[#005EB8] hover:text-[#005EB8]">
                    {label}
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </article>
  )
}

function ManufacturingPage({ locale }: { readonly locale: Locale }) {
  const zh = locale === 'zh'

  return (
    <article className="bg-white">
      <PageHero
        locale={locale}
        image={asset('manufacturing', 'asset-003.jpg')}
        eyebrow={zh ? '制造能力' : 'Manufacturing'}
        title={zh ? '全球生产与交付标准' : 'Global Production Standards'}
        body={zh ? '围绕稳定批量、工程确认和交付节奏建立工业产品制造页面。' : 'Production pages organized around stable batches, engineering confirmation, and delivery rhythm.'}
      />
      <section className="mx-auto grid max-w-[1280px] gap-6 px-4 py-20 md:grid-cols-3 md:px-16">
        {[siteImage('automation-production-line.webp'), siteImage('quality-test-bench.webp'), siteImage('thread-calibration-machine.webp')].map((image, index) => (
          <ImageCard
            key={image}
            index={index + 1}
            title={[zh ? '装配标准' : 'Assembly standards', zh ? '过程记录' : 'Process records', zh ? '交付节奏' : 'Delivery rhythm'][index]}
            image={image}
            body={zh ? '用可验证流程支持稳定供应。' : 'Verified processes support stable supply.'}
          />
        ))}
      </section>
    </article>
  )
}

function CompanyHeroMedia({
  companyPageContent,
  zh,
}: {
  readonly companyPageContent?: CompanyPageContent
  readonly zh: boolean
}) {
  const video = companyPageContent?.heroVideo
  const image = companyPageContent?.heroImage
  const fallbackAlt = zh ? 'Yufavor 公司建筑与工业能力展示' : 'Yufavor company building and industrial capability display'

  if (video) {
    return (
      <div className="group relative z-10 overflow-hidden rounded-xl border border-[#E5E5E5] bg-black shadow-lg">
        <video
          aria-label={video.alt}
          className="aspect-[16/9] h-full w-full object-contain"
          controls
          playsInline
          poster={image?.href}
          preload="metadata"
        >
          <source src={video.href} />
        </video>
      </div>
    )
  }

  if (image) {
    return (
      <div
        aria-label={image.alt}
        className="group relative z-10 aspect-[16/9] overflow-hidden rounded-xl border border-[#E5E5E5] bg-cover bg-center bg-[#E8ECEF] shadow-lg transition duration-500"
        role="img"
        style={{ backgroundImage: `url("${image.href}")` }}
      />
    )
  }

  return (
    <div className="group relative z-10 overflow-hidden rounded-xl border border-[#E5E5E5] shadow-lg">
      <Image src={asset('company', 'asset-003.png')} alt={fallbackAlt} width={900} height={420} className="h-full w-full object-cover transition duration-500" />
    </div>
  )
}

function CompanyPage({ locale, companyPageContent }: { readonly locale: Locale; readonly companyPageContent?: CompanyPageContent }) {
  const zh = locale === 'zh'
  const heroTitle = companyPageContent?.title ?? (zh ? '工业仪表长期供应与工程支持伙伴' : 'Industrial instrumentation partner for long-term supply')
  const heroSummary = companyPageContent?.summary ?? (zh ? '围绕质量、制造、资料和询盘响应，把公司能力组织成采购可验证的信息。' : 'Company capability organized around quality, manufacturing, resource evidence, and RFQ response.')
  const heroBody = companyPageContent?.body ?? (zh ? '于 Yufavor 而言，精密不是目标，而是前提。我们以严格质量管理确保每件仪表满足工业性能与可靠性要求。' : 'At Yufavor, precision is not a goal; it is a prerequisite. Our uncompromising approach to quality management ensures every instrument meets rigorous global standards for industrial performance and reliability.')
  const metrics = [
    [zh ? '产品资料' : 'Product records', '20+', zh ? '覆盖传感器、阀门和下载资料入口。' : 'Sensor, valve, and document entries available for review.'],
    [zh ? '资料手册' : 'Datasheets', '5+', zh ? '本地产品数据手册已接入资料中心。' : 'Local product datasheets are connected to the resource center.'],
    [zh ? '行业入口' : 'Industry paths', '6', zh ? '覆盖能源、水处理、自动化、化工等行业场景。' : 'Industry paths span energy, water, automation, chemical, and related sectors.'],
    [zh ? 'RFQ 响应' : 'RFQ response', '48h', zh ? '围绕工况、参数和交付窗口组织工程回复。' : 'Engineering replies are organized around conditions, parameters, and delivery window.'],
  ] as const
  const milestones = [
    [zh ? '质量体系建立' : 'Quality system established', zh ? '建立来料、校准、测试和出货资料的可追溯流程。' : 'Traceable intake, calibration, testing, and shipment document flow.'],
    [zh ? '制造能力扩展' : 'Manufacturing capability expanded', zh ? '围绕传感器、阀门和 OEM 配套形成稳定装配与校准能力。' : 'Stable assembly and calibration capability for sensors, valves, and OEM programs.'],
    [zh ? '资料中心上线' : 'Resource center launched', zh ? '产品手册、案例、知识、公司资料和博客形成统一资料入口。' : 'Manuals, cases, knowledge, company materials, and blog content share one resource entry.'],
    [zh ? '行业方案完善' : 'Industry solution paths refined', zh ? '将产品、行业、OEM 和 RFQ 入口统一到工程选型路径。' : 'Products, industries, OEM, and RFQ entry points are aligned around engineering selection.'],
  ] as const
  const capabilityLinks = [
    {
      title: zh ? '质量与认证' : 'Quality & Certification',
      body: zh ? '查看认证、测试、校准和追溯标准。' : 'Review certification, testing, calibration, and traceability standards.',
      href: `/${locale}/resources/manuals/company-materials/quality-certification`,
      icon: FileCheck2,
    },
    {
      title: zh ? '制造能力' : 'Manufacturing Capability',
      body: zh ? '了解装配、校准、过程记录和交付节奏。' : 'Explore assembly, calibration, process records, and delivery rhythm.',
      href: `/${locale}/company/manufacturing`,
      icon: Factory,
    },
    {
      title: zh ? '公司资料' : 'Company Materials',
      body: zh ? '进入资料中心查看公司资料与质量认证内容。' : 'Open company materials and quality content in the resource center.',
      href: `/${locale}/resources/manuals/company-materials/company-brochure`,
      icon: Download,
    },
  ] as const
  const values = [
    [zh ? '欢迎改变' : 'Willingness to Change', zh ? '持续提升测量、制造与客户响应能力。' : 'Embracing innovation and adapting to evolving industry needs with proactive solutions.'],
    [zh ? '公平' : 'Fairness', zh ? '以透明沟通和稳定标准建立长期关系。' : 'Upholding integrity and equitable practices in partnerships and operations.'],
    [zh ? '信任' : 'Trust', zh ? '通过一致质量和可追溯资料建立信任。' : 'Building reliable relationships through consistent quality and transparent communication.'],
    [zh ? '客户导向' : 'Customer Orientation', zh ? '围绕工况、参数和交付目标提供工程支持。' : 'Placing client success at the core of engineering and service strategies.'],
    [zh ? '赋能' : 'Empowerment', zh ? '让团队在清晰流程下快速响应项目。' : 'Equipping teams to take initiative and drive excellence.'],
    [zh ? '团队协作' : 'Teamwork', zh ? '跨职能协作完成从选型到交付的闭环。' : 'Collaborating across disciplines to deliver robust industrial solutions.'],
  ] as const

  return (
    <article className="bg-white">
      <section className="relative overflow-hidden bg-[#F7F7F7]">
        <div className="relative z-10 mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-4 py-12 md:px-16 md:py-24 lg:grid-cols-12">
          <div className="flex flex-col gap-6 md:pr-8 lg:col-span-5">
            <nav className="mb-2 flex items-center gap-2 text-sm text-[#5D5F5F]">
              <Link href={`/${locale}`} className="hover:text-[#005EB8]">{zh ? '首页' : 'Home'}</Link>
              <span>/</span>
              <Link href={`/${locale}/company`} className="hover:text-[#005EB8]">{zh ? '公司' : 'Company'}</Link>
              <span>/</span>
              <span className="text-[#1A1A1A]">{zh ? '关于我们' : 'About Us'}</span>
            </nav>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#005EB8]">{zh ? '关于 Yufavor' : 'About Yufavor'}</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#1A1A1A] md:text-5xl">{heroTitle}</h1>
              <p className="mt-5 text-base leading-8 text-[#5D5F5F] md:text-lg">{heroSummary}</p>
            </div>
            <div className="border-l-4 border-[#005EB8] py-2 pl-6 text-lg leading-8 text-[#5D5F5F]">
              <p>{heroBody}</p>
            </div>
          </div>
          <div className="relative lg:col-span-7">
            <CompanyHeroMedia companyPageContent={companyPageContent} zh={zh} />
            <div className="absolute -bottom-6 -right-6 z-0 size-32 rounded-full bg-[#005EB8]/10 blur-3xl" />
          </div>
        </div>
        <div className="absolute right-0 top-0 z-0 hidden h-full w-1/3 bg-[#EEEEEE] opacity-50 lg:block" />
      </section>

      <main className="mx-auto grid max-w-[1280px] grid-cols-1 gap-16 px-4 py-16 md:px-16 md:py-24 lg:grid-cols-12">
        <section className="lg:col-span-8">
          <div className="mb-12 flex flex-col justify-between gap-6 border-b border-[#E5E5E5] pb-6 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-semibold leading-tight text-[#1A1A1A]">{zh ? '我们的使命和价值观' : 'Our mission and values'}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#5D5F5F]">{zh ? '作为值得信赖的合作伙伴，我们提供卓越的传感解决方案，让工业流程安全、高效、可持续。' : 'As a trusted partner, we deliver excellent sensing solutions that keep industrial processes safe, efficient, and sustainable.'}</p>
            </div>
            <div className="flex gap-6 overflow-x-auto whitespace-nowrap text-sm">
              <a href="#mission" className="border-b-2 border-[#005EB8] pb-1 font-bold text-[#005EB8]">{zh ? '使命和价值观' : 'Mission & Values'}</a>
              <a href="#facts" className="pb-1 font-medium text-[#5D5F5F] hover:text-[#005EB8]">{zh ? '数据概览' : 'Facts & Figures'}</a>
              <a href="#milestones" className="pb-1 font-medium text-[#5D5F5F] hover:text-[#005EB8]">{zh ? '发展里程碑' : 'Milestones'}</a>
            </div>
          </div>
          <div id="mission" className="grid scroll-mt-28 gap-8 md:grid-cols-2">
            {values.map(([title, body], index) => (
              <div key={title} className="group border border-[#E5E5E5] bg-white p-8 transition-all duration-300 hover:border-[#005EB8] hover:shadow-lg">
                <div className="grid size-16 place-items-center bg-[#F7F7F7] text-2xl font-semibold text-[#005EB8] transition-colors group-hover:bg-[#005EB8] group-hover:text-white">{index + 1}</div>
                <h2 className="mt-6 text-xl font-bold text-[#1A1A1A]">{title}</h2>
                <p className="mt-3 text-base leading-7 text-[#5D5F5F]">{body}</p>
              </div>
            ))}
          </div>

          <section id="facts" className="mt-16 scroll-mt-28 border-t border-[#E5E5E5] pt-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#005EB8]">{zh ? '数据概览' : 'Facts & Figures'}</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#1A1A1A]">{zh ? '围绕采购信任建立可验证资料' : 'Verifiable context for procurement trust'}</h2>
            <div className="mt-8 grid gap-px bg-[#E5E5E5] md:grid-cols-2">
              {metrics.map(([label, value, body]) => (
                <div key={label} className="bg-white p-7">
                  <p className="font-mono text-3xl font-bold text-[#005EB8]">{value}</p>
                  <h3 className="mt-4 text-lg font-bold text-[#1A1A1A]">{label}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5D5F5F]">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="milestones" className="mt-16 scroll-mt-28 border-t border-[#E5E5E5] pt-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#005EB8]">{zh ? '发展里程碑' : 'Milestones'}</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#1A1A1A]">{zh ? '从质量能力到资料化交付' : 'From quality capability to documented delivery'}</h2>
            <div className="mt-8 space-y-4">
              {milestones.map(([title, body], index) => (
                <div key={title} className="grid gap-5 border border-[#E5E5E5] bg-white p-6 md:grid-cols-[88px_1fr]">
                  <div className="font-mono text-sm font-bold text-[#005EB8]">0{index + 1}</div>
                  <div>
                    <h3 className="text-xl font-bold text-[#1A1A1A]">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#5D5F5F]">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="capabilities" className="mt-16 scroll-mt-28 border-t border-[#E5E5E5] pt-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#005EB8]">{zh ? '能力入口' : 'Capability Links'}</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#1A1A1A]">{zh ? '继续查看质量、制造与公司资料' : 'Continue to quality, manufacturing, and company materials'}</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {capabilityLinks.map((item) => {
                const Icon = item.icon

                return (
                  <Link key={item.href} href={item.href} className="group border border-[#E5E5E5] bg-white p-6 transition-colors hover:border-[#005EB8]">
                    <Icon className="size-7 text-[#005EB8]" aria-hidden="true" />
                    <h3 className="mt-5 text-lg font-bold text-[#1A1A1A] group-hover:text-[#005EB8]">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#5D5F5F]">{item.body}</p>
                    <ArrowRight className="mt-6 size-4 text-[#005EB8] transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                )
              })}
            </div>
          </section>
        </section>
        <aside className="space-y-8 lg:col-span-4">
          <div className="bg-[#B8C0CB] p-8 text-[#1A1A1A] shadow-lg">
            <div className="mb-6 flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-full bg-black/10">
                <Mail className="size-5" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold">{zh ? '联系销售' : 'Contact Sales'}</h2>
            </div>
            <p className="text-xs uppercase tracking-[0.15em] opacity-60">Telephone</p>
            <p className="mt-1 text-xl font-semibold">+86 21 61318500</p>
            <p className="mt-4 text-xs uppercase tracking-[0.15em] opacity-60">Email</p>
            <p className="mt-1 text-sm">sales@yufavor.com</p>
            <Link href={`/${locale}/contact`} className="mt-8 inline-flex w-full items-center justify-center gap-3 bg-[#1A1A1A] px-5 py-4 text-sm font-bold text-white hover:bg-[#005EB8]">
              <Mail className="size-4" aria-hidden="true" />
              {zh ? '联系表格' : 'Contact Form'}
            </Link>
          </div>
          <SidebarDownload title={zh ? '公司资料' : 'Company Materials'} body={zh ? '了解质量、制造、工程支持和长期供货资料。' : 'Review quality, manufacturing, engineering support, and long-term supply materials.'} label={zh ? '查看公司资料' : 'View company materials'} href={`/${locale}/resources/manuals/company-materials/company-brochure`} />
          <SidebarDownload title={zh ? '质量与认证' : 'Quality & Certification'} body={zh ? '查看认证、测试、追溯和校准控制。' : 'Review certification, testing, traceability, and calibration control.'} label={zh ? '查看质量认证' : 'View quality certification'} href={`/${locale}/resources/manuals/company-materials/quality-certification`} />
        </aside>
      </main>
    </article>
  )
}

function ResourcesPage({ locale }: { readonly locale: Locale }) {
  const zh = locale === 'zh'
  const cards = [
    {
      eyebrow: zh ? '文档资料' : 'Documentation',
      meta: zh ? '产品文件 / 数据资料' : 'Product files / data',
      title: zh ? '产品手册' : 'Product Manuals',
      description: zh ? '产品手册、数据手册和规格资料会按型号逐条归档，便于后续上传和下载。' : 'Product manuals, datasheets, and specification files are organized as individual records for upload and download.',
      status: zh ? '已接入资料列表' : 'Connected to file list',
      action: zh ? '打开资料' : 'Open Files',
      href: '/resources/manuals',
      icon: Download,
    },
    {
      eyebrow: zh ? '应用案例' : 'Application',
      meta: zh ? '应用文件 / 案例内容' : 'Application files / cases',
      title: zh ? '物联网应用案例' : 'IoT Application Cases',
      description: zh ? '物联网、自动化和现场应用内容后续会按案例逐条展示。' : 'IoT, automation, and field application content will be shown as individual case records.',
      status: zh ? '等待上传内容' : 'Ready for uploads',
      action: zh ? '打开板块' : 'Open Section',
      href: '/resources/cases/iot-application-cases',
      icon: FileCheck2,
    },
    {
      eyebrow: zh ? '技术资料' : 'Technical',
      meta: zh ? '技术文件 / 选型知识' : 'Technical files / selection',
      title: zh ? '技术知识' : 'Technical Knowledge',
      description: zh ? '选型方法、参数说明和工程技术内容会以单条资料形式维护。' : 'Selection methods, parameter notes, and engineering content will be maintained as single resource records.',
      status: zh ? '等待上传内容' : 'Ready for uploads',
      action: zh ? '打开板块' : 'Open Section',
      href: '/resources/blog/technical-knowledge',
      icon: Settings2,
    },
    {
      eyebrow: zh ? '解决方案' : 'Solutions',
      meta: zh ? '项目文件 / OEM 案例' : 'Project files / OEM cases',
      title: zh ? 'OEM 案例' : 'OEM Cases',
      description: zh ? 'OEM 定制案例、项目背景和交付资料后续会按文件或内容逐条发布。' : 'OEM customization cases, project context, and delivery materials will be published file by file.',
      status: zh ? '等待上传内容' : 'Ready for uploads',
      action: zh ? '打开板块' : 'Open Section',
      href: '/resources/cases/oem-cases',
      icon: SlidersHorizontal,
    },
    {
      eyebrow: zh ? '质量与认证' : 'Quality & Certification',
      meta: zh ? '公司文件 / 认证资料' : 'Company files / certification',
      title: zh ? '公司资料' : 'Company Materials',
      description: zh ? '公司介绍、质量能力、认证和制造资料会作为文件记录集中展示。' : 'Company profiles, quality capability, certifications, and manufacturing materials will be shown as file records.',
      status: zh ? '等待上传内容' : 'Ready for uploads',
      action: zh ? '打开板块' : 'Open Section',
      href: '/resources/manuals/company-materials',
      icon: Factory,
    },
    {
      eyebrow: zh ? '行业洞察' : 'Insight',
      meta: zh ? '文章内容 / 更新记录' : 'Articles / updates',
      title: zh ? '博客' : 'Blog',
      description: zh ? '行业观察、产品选型说明和资料中心更新会逐条发布。' : 'Industry notes, product selection explainers, and resource updates will be published as separate entries.',
      status: zh ? '等待上传内容' : 'Ready for uploads',
      action: zh ? '打开板块' : 'Open Section',
      href: '/resources/blog/engineering-blog',
      icon: Gauge,
    },
  ]

  return (
    <article className="bg-[#F6F6F6]">
      <section className="mx-auto max-w-[1280px] px-4 pt-10 md:px-16">
        <div className="relative h-[210px] overflow-hidden bg-[#DDE4EA] md:h-[300px]">
          <Image
            src={asset('oem', 'asset-003.jpg')}
            alt={zh ? '自动化实验室与测试设备' : 'Automation laboratory and test equipment'}
            fill
            preload
            sizes="(min-width: 1280px) 1152px, calc(100vw - 32px)"
            className="object-cover"
          />
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 py-16 md:px-16 md:py-20">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#D8DEE4] pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#005EB8]">{zh ? '资料中心' : 'Resource Center'}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-normal text-[#1A1A1A] md:text-4xl">{zh ? '资料板块' : 'Resource Sections'}</h1>
          </div>
          <span className="font-mono text-xs text-[#697179]">{cards.length} {zh ? '个资料板块' : 'resource sections'}</span>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon

            return (
              <Link
                key={card.title}
                href={`/${locale}${card.href}`}
                className="group flex min-h-[356px] flex-col border border-[#DEE3E7] bg-white transition-all hover:border-[#005EB8] hover:shadow-[0_16px_38px_rgba(20,33,44,0.10)]"
              >
                <div className="grid aspect-[16/8] place-items-center border-b border-[#DEE3E7] bg-[#F1F4F7] text-[#005EB8]">
                  <Icon className="size-7" aria-hidden="true" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-[#EAF3FB] px-2 py-1 text-[10px] font-bold text-[#005EB8]">{card.eyebrow}</span>
                    <span className="font-mono text-[11px] text-[#697179]">{card.meta}</span>
                  </div>
                  <h2 className="mt-5 text-xl font-bold leading-7 tracking-normal text-[#1A1A1A] group-hover:text-[#005EB8]">{card.title}</h2>
                  <p className="mt-3 text-sm font-light leading-6 text-[#697179]">{card.description}</p>
                  <div className="mt-5 border-t border-[#E1E6EA] pt-4">
                    <span className="inline-flex border border-[#DDE5EC] bg-[#FAFBFC] px-2.5 py-1 text-[11px] font-semibold text-[#4B555E]">{card.status}</span>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-2 border-t border-[#E1E6EA] pt-4 text-xs font-bold uppercase tracking-[0.08em] text-[#005EB8]">
                    {card.action}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </article>
  )
}

function ContactPage({ locale }: { readonly locale: Locale }) {
  const zh = locale === 'zh'

  return (
    <article className="bg-white">
      <section className="mx-auto grid max-w-[1280px] gap-10 px-4 py-16 md:px-16 lg:grid-cols-[0.9fr_1.1fr] lg:py-24">
        <div>
          <div className="group relative mb-10 h-52 overflow-hidden">
            <Image src={asset('contact', 'asset-003.png')} alt="" fill preload sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover transition duration-500" />
          </div>
          <p className="eyebrow">{zh ? '联系工程团队' : 'Contact Engineering'}</p>
          <h1 className="mt-4 display-title">{zh ? '提交 RFQ 与选型需求' : 'RFQ & Support'}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#5D5F5F]">{zh ? '请提供介质、量程、连接方式、数量和目标交期，便于工程团队快速判断。' : 'Share media, pressure range, connection, quantity, and target delivery date so engineering can respond with context.'}</p>
          <div className="mt-10 grid gap-4">
            <ContactLine icon={<Mail className="size-5" />} title="sales@yufavor.com" body={zh ? '销售与询价' : 'Sales and RFQ'} />
            <ContactLine icon={<Settings2 className="size-5" />} title="bruce@yufavor.com" body={zh ? '工程选型支持' : 'Engineering selection support'} />
          </div>
        </div>
        <div className="border border-[#E5E5E5] bg-[#F7F7F7] p-6 md:p-8">
          <ContactInquiryForm locale={locale} />
        </div>
      </section>
    </article>
  )
}

function PageHero({
  locale,
  image,
  eyebrow,
  title,
  body,
}: {
  readonly locale: Locale
  readonly image: string
  readonly eyebrow: string
  readonly title: string
  readonly body: string
}) {
  const zh = locale === 'zh'

  return (
    <section className="border-b border-[#E5E5E5] bg-white">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-14 md:px-16 lg:grid-cols-[0.98fr_1.02fr] lg:items-center lg:py-20">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-4 display-title">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5D5F5F]">{body}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryLink locale={locale} href="/contact">{zh ? '获取工程支持' : 'Get Engineering Support'}</PrimaryLink>
            <SecondaryLink locale={locale} href="/products">{zh ? '查看产品' : 'View Products'}</SecondaryLink>
          </div>
        </div>
        <div className="group relative aspect-[16/10] border border-[#E5E5E5] bg-[#F7F7F7]">
          <Image src={image} alt="" fill preload sizes="(min-width: 1024px) 48vw, 100vw" className="object-cover transition duration-500" />
        </div>
      </div>
    </section>
  )
}

function SectionIntro({ eyebrow, title, body }: { readonly eyebrow: string; readonly title: string; readonly body: string }) {
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-20 md:px-16">
      <p className="eyebrow">{eyebrow}</p>
      <div className="mt-4 grid gap-6 lg:grid-cols-[0.82fr_1fr] lg:items-end">
        <h2 className="text-3xl font-semibold leading-tight md:text-5xl">{title}</h2>
        <p className="text-base leading-7 text-[#5D5F5F]">{body}</p>
      </div>
    </section>
  )
}

function FeaturePanel({ className, image, title, body, href, locale = 'en' }: { readonly className?: string; readonly image: string; readonly title: string; readonly body: string; readonly href: string; readonly locale?: Locale }) {
  return (
    <Link href={href} className={`group relative min-h-[430px] overflow-hidden border border-[#E5E5E5] bg-[#F7F7F7] ${className ?? ''}`}>
      <Image src={image} alt="" fill sizes="66vw" className="object-cover transition duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent" />
      <div className="relative flex h-full max-w-xl flex-col justify-between p-8 md:p-12">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#005EB8]">{locale === 'zh' ? '重点系统' : 'Featured System'}</p>
          <h3 className="mt-5 text-4xl font-bold leading-tight text-[#1A1A1A] transition-colors group-hover:text-[#005EB8] md:text-5xl">{title}</h3>
        </div>
        <p className="mt-12 text-base leading-7 text-[#5D5F5F]">{body}</p>
      </div>
    </Link>
  )
}

function CompactPanel({ title, href }: { readonly title: string; readonly href: string }) {
  return (
    <Link href={href} className="group flex min-h-[202px] flex-col justify-between border border-[#E5E5E5] bg-white p-8 transition hover:border-[#005EB8]">
      <h3 className="text-3xl font-semibold leading-tight group-hover:text-[#005EB8]">{title}</h3>
      <ArrowRight className="ml-auto size-5 text-[#005EB8] transition-transform group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  )
}

function SplitEngineeringBlock({ locale, image, eyebrow, title, body, href }: { readonly locale: Locale; readonly image: string; readonly eyebrow: string; readonly title: string; readonly body: string; readonly href: string }) {
  return (
    <section className="grid border-y border-[#E5E5E5] bg-white lg:grid-cols-2">
      <div className="group relative min-h-[440px] bg-[#F7F7F7]">
        <Image src={image} alt="" fill sizes="50vw" className="object-cover transition duration-500" />
      </div>
      <div className="flex flex-col justify-center p-8 md:p-16">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-5 text-3xl font-semibold leading-tight md:text-5xl">{title}</h2>
        <p className="mt-6 max-w-xl text-base leading-7 text-[#5D5F5F]">{body}</p>
        <div className="mt-10">
          <PrimaryLink locale={locale} href={href}>{locale === 'zh' ? '查看能力' : 'View Capability'}</PrimaryLink>
        </div>
      </div>
    </section>
  )
}

function QualityStrip({ locale, image }: { readonly locale: Locale; readonly image: string }) {
  const zh = locale === 'zh'
  return (
    <section className="bg-[#F7F7F7] py-20">
      <div className="mx-auto max-w-[1280px] px-4 md:px-16">
        <div className="group relative min-h-[420px] border border-[#E5E5E5]">
          <Image src={image} alt="" fill sizes="100vw" className="object-cover opacity-95 transition duration-500 group-hover:opacity-100" />
          <div className="absolute bottom-6 left-6 max-w-lg border border-[#E5E5E5] bg-white p-8">
            <p className="eyebrow">{zh ? '质量与制造' : 'Quality Assurance'}</p>
            <h2 className="mt-4 text-3xl font-semibold">{zh ? '精密制造与多点校准' : 'Precision manufacturing and multi-point calibration'}</h2>
            <p className="mt-4 text-sm leading-6 text-[#5D5F5F]">{zh ? '每个关键节点都围绕工程可验证性组织。' : 'Every critical checkpoint is organized around engineering verifiability.'}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function ProductCard({ locale, product }: { readonly locale: Locale; readonly product: Product }) {
  return (
    <Link href={`/${locale}${product.href}`} className="group grid border border-[#E5E5E5] bg-white transition hover:border-[#005EB8] md:grid-cols-[180px_1fr]">
      <div className="relative min-h-[180px] bg-[#F7F7F7]">
        <Image src={product.image} alt={product.title} fill sizes="180px" className="object-cover transition" />
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-[#005EB8]">{product.model}</p>
            <h3 className="mt-2 text-xl font-semibold">{product.title}</h3>
          </div>
          <ArrowRight className="size-5 text-[#005EB8] transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </div>
        <p className="mt-3 text-sm text-[#5D5F5F]">{product.family}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {product.specs.map((spec) => <span key={spec} className="border border-[#E5E5E5] bg-[#F7F7F7] px-2 py-1 font-mono text-[11px] text-[#5D5F5F]">{spec}</span>)}
        </div>
      </div>
    </Link>
  )
}

function FilterGroup({ title, items }: { readonly title: string; readonly items: readonly string[] }) {
  return (
    <section className="mt-7 border-t border-[#E5E5E5] pt-5">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <label key={item} className="flex items-center gap-3 text-sm text-[#5D5F5F]">
            <span className="size-4 border border-[#E5E5E5] bg-white" />
            {item}
          </label>
        ))}
      </div>
    </section>
  )
}

function SpecSection({ locale }: { readonly locale: Locale }) {
  const zh = locale === 'zh'
  const rows = [
    ['Pressure range', '0-10 bar / 0-16 bar / custom'],
    ['Output', '4-20mA, 0-10V, I2C options'],
    ['Protection', 'IP65 / IP67'],
    ['Media', 'Water, air, hydraulic oil'],
  ]

  return (
    <section className="mx-auto grid max-w-[1280px] gap-10 px-4 py-20 md:px-16 lg:grid-cols-[0.7fr_1.3fr]">
      <div>
        <p className="eyebrow">{zh ? '技术规格' : 'Technical Data'}</p>
        <h2 className="mt-4 text-3xl font-semibold">{zh ? '用于快速选型的核心参数' : 'Core parameters for fast selection'}</h2>
      </div>
      <div className="border border-[#E5E5E5]">
        {rows.map(([label, value]) => (
          <div key={label} className="grid border-b border-[#E5E5E5] p-5 last:border-b-0 md:grid-cols-[220px_1fr]">
            <dt className="text-sm font-semibold text-[#1A1A1A]">{label}</dt>
            <dd className="text-sm text-[#5D5F5F]">{value}</dd>
          </div>
        ))}
      </div>
    </section>
  )
}

function ImageCard({ index, title, body, image }: { readonly index: number; readonly title: string; readonly body: string; readonly image: string }) {
  return (
    <article className="group overflow-hidden border border-[#E5E5E5] bg-white transition hover:border-[#005EB8] hover:shadow-lg">
      <div className="relative h-52 bg-[#F7F7F7]">
      <Image src={image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="p-7">
        <span className="font-mono text-xs text-[#005EB8]">0{index}</span>
        <h3 className="mt-4 text-xl font-semibold">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-[#5D5F5F]">{body}</p>
      </div>
    </article>
  )
}

function DataCard({ index, title, body }: { readonly index: number; readonly title: string; readonly body: string }) {
  return (
    <article className="border border-[#E5E5E5] bg-white p-8 transition hover:border-[#005EB8]">
      <span className="font-mono text-xs text-[#005EB8]">0{index}</span>
      <h3 className="mt-5 text-xl font-semibold">{title}</h3>
      <p className="mt-4 text-sm leading-6 text-[#5D5F5F]">{body}</p>
    </article>
  )
}

function OemProjectCard({
  href,
  image,
  title,
  body,
  ctaLabel,
}: {
  readonly href: string
  readonly image: string
  readonly title: string
  readonly body: string
  readonly ctaLabel: string
}) {
  return (
    <Link href={href} className="group block border border-[#E1E6EA] bg-white p-5 transition-all hover:border-[#005EB8] hover:shadow-lg">
      <div className="relative mb-5 h-44 bg-[#F2F4F6]">
        <Image src={image} alt={title} fill sizes="(min-width: 768px) 360px, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <h3 className="text-lg font-bold tracking-normal text-[#1A1A1A]">{title}</h3>
      <p className="mt-3 text-sm font-medium leading-6 text-[#30383E]">{body}</p>
      <span className="mt-5 inline-flex items-center text-xs font-bold uppercase tracking-[0.12em] text-[#005EB8]">
        {ctaLabel}
        <ArrowRight className="ml-2 size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </Link>
  )
}

function ResourceCard({ locale, card, index }: { readonly locale: Locale; readonly card: Card; readonly index: number }) {
  return (
    <Link href={`/${locale}${card.href ?? '/resources'}`} className="group flex min-h-[260px] flex-col justify-between border border-[#E5E5E5] bg-white p-8 transition hover:border-[#005EB8] hover:shadow-lg">
      <div>
        <span className="font-mono text-xs text-[#005EB8]">0{index}</span>
        <h2 className="mt-6 text-2xl font-semibold">{card.title}</h2>
        <p className="mt-4 text-sm leading-6 text-[#5D5F5F]">{card.body}</p>
      </div>
      <Download className="ml-auto size-5 text-[#005EB8] transition-transform group-hover:translate-y-1" aria-hidden="true" />
    </Link>
  )
}

function SidebarDownload({
  title,
  body,
  label,
  href,
}: {
  readonly title: string
  readonly body: string
  readonly label: string
  readonly href: string
}) {
  return (
    <div className="group border border-[#E5E5E5] bg-white p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#1A1A1A]">{title}</h3>
          <p className="mt-1 text-sm text-[#5D5F5F]">{body}</p>
        </div>
        <Download className="size-8 text-[#C6C6C6] transition-colors group-hover:text-[#005EB8]" aria-hidden="true" />
      </div>
      <Link className="flex items-center gap-3 text-sm font-bold text-[#005EB8] transition-transform group-hover:translate-x-2" href={href}>
        <Download className="size-4" aria-hidden="true" />
        {label}
      </Link>
    </div>
  )
}

function ContactLine({ icon, title, body }: { readonly icon: React.ReactNode; readonly title: string; readonly body: string }) {
  return (
    <div className="flex items-start gap-4 border border-[#E5E5E5] bg-white p-5">
      <div className="grid size-10 place-items-center bg-[#F7F7F7] text-[#005EB8]">{icon}</div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-[#5D5F5F]">{body}</p>
      </div>
    </div>
  )
}

function Input({ label, name, type = 'text', required = false }: { readonly label: string; readonly name: string; readonly type?: string; readonly required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input name={name} type={type} required={required} className="border border-[#E5E5E5] bg-white px-3 py-3 text-sm outline-none focus:border-[#005EB8]" />
    </label>
  )
}

function PrimaryLink({ locale, href, children }: { readonly locale: Locale; readonly href: string; readonly children: React.ReactNode }) {
  return (
    <Link href={`/${locale}${href}`} className="inline-flex items-center justify-center gap-2 bg-[#1A1A1A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#005EB8]">
      {children}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  )
}

function SecondaryLink({ locale, href, children, documentLink = false }: { readonly locale: Locale; readonly href: string; readonly children: React.ReactNode; readonly documentLink?: boolean }) {
  return (
    documentLink ? (
      <a href={href} className="inline-flex items-center justify-center border border-[#1A1A1A] px-6 py-3 text-sm font-semibold text-[#1A1A1A] hover:border-[#005EB8] hover:text-[#005EB8]">
        {children}
      </a>
    ) : (
      <Link href={`/${locale}${href}`} className="inline-flex items-center justify-center border border-[#1A1A1A] px-6 py-3 text-sm font-semibold text-[#1A1A1A] hover:border-[#005EB8] hover:text-[#005EB8]">
      {children}
    </Link>
    )
  )
}
