import { type ApplicationIntent } from './application'
import { industrialSensorCategoryTree, type CategoryNode } from './category'
import { type IndustryKey } from './industry'
import {
  filterProductCatalog,
  localizeText,
  resolveProductDetailPage,
  type ProductDetailPageData,
  type ProductListItem,
  type ProductListResult,
} from './product-catalog'
import { getProductCatalog, getProductStaticParams, listProducts } from './product-source'
import type {
  ApplicationCanonicalPath,
  ApplicationId,
  IndustryCanonicalPath,
  IndustryId,
  LocaleCode,
  ProductCanonicalPath,
  SeoSlugPath,
  SlugSegment,
} from './primitives'
import type { ProductRecord } from './product'
import type { IndustrialIconKey } from './site'

export interface DetailSpecGroupViewModel {
  readonly title: string
  readonly values: readonly {
    readonly label: string
    readonly value: string
  }[]
}

export interface DetailTagGroupViewModel {
  readonly title: string
  readonly items: readonly string[]
}

export interface ProductDetailViewModel {
  readonly locale: LocaleCode
  readonly route: {
    readonly path: ProductCanonicalPath
  }
  readonly breadcrumb: readonly {
    readonly label: string
    readonly href: string
  }[]
  readonly hero: {
    readonly eyebrow: string
    readonly title: string
    readonly summary: string
    readonly model: string
    readonly categoryLabel: string
    readonly availabilityLabel: string
    readonly badges: readonly string[]
  }
  readonly actions: {
    readonly quoteLabel: string
    readonly datasheetLabel: string
    readonly datasheetHref?: string
  }
  readonly overviewSpecs: readonly {
    readonly label: string
    readonly value: string
  }[]
  readonly technicalParameters: {
    readonly title: string
    readonly groups: readonly DetailSpecGroupViewModel[]
  }
  readonly applications: {
    readonly title: string
    readonly items: readonly string[]
  }
  readonly compatibility: {
    readonly title: string
    readonly groups: readonly DetailTagGroupViewModel[]
  }
  readonly variants: {
    readonly title: string
    readonly items: readonly {
      readonly code: string
      readonly availabilityLabel: string
      readonly options: readonly string[]
    }[]
  }
  readonly commercial: {
    readonly title: string
    readonly groups: readonly DetailTagGroupViewModel[]
  }
  readonly faq: {
    readonly title: string
    readonly items: readonly {
      readonly question: string
      readonly answer: string
    }[]
  }
  readonly seoContent: {
    readonly title: string
    readonly paragraphs: readonly string[]
  }
  readonly geoSummary?: {
    readonly title: string
    readonly oneSentence: string
    readonly technicalAbstract: string
    readonly facts: readonly {
      readonly label: string
      readonly value: string
    }[]
    readonly evidenceTitle: string
    readonly evidence: readonly {
      readonly title: string
      readonly sourceType: string
      readonly href?: string
    }[]
  }
  readonly relatedProducts: {
    readonly title: string
    readonly items: readonly ProductListItem[]
  }
}

export interface ProductListPageViewModel {
  readonly locale: LocaleCode
  readonly category: {
    readonly name: string
    readonly description: string
    readonly canonicalPath: string
  }
  readonly breadcrumb: readonly {
    readonly label: string
    readonly href: string
  }[]
  readonly productList: ProductListResult
  readonly countLabel: string
  readonly labels: {
    readonly eyebrow: string
    readonly allProducts: string
    readonly details: string
    readonly filters: string
    readonly categories: string
    readonly measurement: string
    readonly availability: string
    readonly empty: string
  }
}

export interface EntryPageViewModel {
  readonly locale: LocaleCode
  readonly eyebrow: string
  readonly title: string
  readonly body: string
  readonly primaryAction: {
    readonly label: string
    readonly href: string
  }
  readonly secondaryAction: {
    readonly label: string
    readonly href: string
  }
  readonly productRailLabel: string
  readonly entries: readonly EntryCardViewModel[]
  readonly proof: readonly {
    readonly label: string
    readonly value: string
  }[]
  readonly rfq: {
    readonly title: string
    readonly body: string
    readonly primary: string
    readonly secondary: string
  }
}

export interface EntryCardViewModel {
  readonly key: string
  readonly title: string
  readonly description: string
  readonly href: string
  readonly meta: string
  readonly products: readonly ProductListItem[]
}

export type StaticInfoPageKind = 'oem' | 'resources' | 'contact'

export interface StaticInfoPageViewModel {
  readonly locale: LocaleCode
  readonly icon: IndustrialIconKey
  readonly eyebrow: string
  readonly title: string
  readonly body: string
  readonly primaryAction: {
    readonly label: string
    readonly href: string
  }
  readonly secondaryAction: {
    readonly label: string
    readonly href: string
  }
  readonly quickLinks: readonly {
    readonly label: string
    readonly href: string
  }[]
}

const commonLabels = {
  en: {
    home: 'Home',
    productCenter: 'Product center',
    quote: 'Request Quote',
    datasheet: 'Open Datasheet',
    specs: 'Technical parameters',
    applications: 'Application scenarios',
    compatibility: 'Compatibility',
    variants: 'Available variants',
    commercial: 'Commercial terms',
    faq: 'FAQ',
    seoContent: 'Product selection notes',
    geoSummary: 'GEO AI summary',
    relatedProducts: 'Related products',
    evidence: 'Evidence sources',
    media: 'Media',
    materials: 'Materials',
    certifications: 'Certifications',
    connections: 'Connections',
    terms: 'Terms',
    recommendedProducts: 'Products',
    oemCustomization: 'OEM customization',
    privateLabel: 'Private label',
    activeLifecycle: 'Active',
  },
  zh: {
    home: '首页',
    productCenter: '产品中心',
    quote: '获取报价',
    datasheet: '打开数据手册',
    specs: '技术参数',
    applications: '应用场景',
    compatibility: '兼容性',
    variants: '可选型号',
    commercial: '商务条款',
    faq: '常见问题',
    seoContent: '产品选型说明',
    geoSummary: 'GEO AI 摘要',
    relatedProducts: '相关产品',
    evidence: '证据来源',
    media: '介质',
    materials: '材质',
    certifications: '认证',
    connections: '连接',
    terms: '条款',
    recommendedProducts: '推荐产品',
    oemCustomization: 'OEM 定制',
    privateLabel: '品牌贴牌',
    activeLifecycle: '在售',
  },
} as const satisfies Record<LocaleCode, Record<string, string>>

const productListLabels = {
  en: {
    eyebrow: 'Product center',
    allProducts: 'All products',
    details: 'View Details',
    filters: 'Available filters',
    categories: 'Categories',
    measurement: 'Measurement',
    availability: 'Availability',
    empty: 'No products match this category.',
  },
  zh: {
    eyebrow: '产品中心',
    allProducts: '全部产品',
    details: '查看详情',
    filters: '可用筛选',
    categories: '分类',
    measurement: '测量类型',
    availability: '供货状态',
    empty: '当前分类暂无可展示产品。',
  },
} as const satisfies Record<LocaleCode, ProductListPageViewModel['labels']>

const industries = [
  {
    key: 'oil-gas',
    id: 'ind_oil_gas',
    slug: 'oil-gas',
    productQueries: ['pressure', 'differential-pressure'],
    text: {
      en: {
        title: 'Oil & Gas',
        description: 'Pressure, differential pressure, and temperature monitoring for skids, pipelines, and auxiliary systems.',
        meta: 'Process pressure / safety loops',
      },
      zh: {
        title: '石油与天然气',
        description: '面向撬装、管线和辅助系统的压力、差压与温度监测。',
        meta: '过程压力 / 安全回路',
      },
    },
  },
  {
    key: 'water-treatment',
    id: 'ind_water',
    slug: 'water-treatment',
    productQueries: ['level', 'pressure'],
    text: {
      en: {
        title: 'Water Treatment',
        description: 'Level, pump pressure, and filtration monitoring for municipal and industrial water systems.',
        meta: 'Level / pump stations',
      },
      zh: {
        title: '水处理',
        description: '用于市政与工业水系统的液位、泵压和过滤监测。',
        meta: '液位 / 泵站',
      },
    },
  },
  {
    key: 'industrial-automation',
    id: 'ind_automation',
    slug: 'industrial-automation',
    productQueries: ['switch-state', 'pressure'],
    text: {
      en: {
        title: 'Industrial Automation',
        description: 'Sensor inputs for PLC, DCS, equipment protection, interlocks, and repeatable machine builds.',
        meta: 'PLC / DCS ready',
      },
      zh: {
        title: '工业自动化',
        description: '面向 PLC、DCS、设备保护、联锁和批量设备制造的传感器输入。',
        meta: 'PLC / DCS ready',
      },
    },
  },
  {
    key: 'energy',
    id: 'ind_energy',
    slug: 'energy',
    productQueries: ['temperature', 'differential-pressure'],
    text: {
      en: {
        title: 'Energy',
        description: 'Temperature, pressure, and level monitoring for boilers, heat exchange, storage, and utilities.',
        meta: 'Boiler / utility systems',
      },
      zh: {
        title: '能源',
        description: '用于锅炉、换热、储能和公用工程的温度、压力与液位监测。',
        meta: '锅炉 / 公用工程',
      },
    },
  },
  {
    key: 'manufacturing',
    id: 'ind_manufacturing',
    slug: 'manufacturing',
    productQueries: ['pressure', 'temperature'],
    text: {
      en: {
        title: 'Manufacturing',
        description: 'Reliable measurement for hydraulic equipment, compressors, machine tools, and production lines.',
        meta: 'Machines / compressors',
      },
      zh: {
        title: '制造业',
        description: '用于液压设备、压缩机、机床和产线的可靠测量。',
        meta: '设备 / 压缩机',
      },
    },
  },
] as const satisfies readonly {
  readonly key: IndustryKey
  readonly id: IndustryId
  readonly slug: SlugSegment
  readonly productQueries: readonly string[]
  readonly text: Record<LocaleCode, { readonly title: string; readonly description: string; readonly meta: string }>
}[]

const applications = [
  {
    intent: 'high-pressure-measurement',
    id: 'app_high_pressure',
    slug: 'high-pressure-measurement',
    productQueries: ['pressure'],
    text: {
      en: {
        title: 'High pressure measurement',
        description: 'Select transmitters and switches for hydraulic stations, pumps, compressors, and test benches.',
        meta: '0-600 bar examples',
      },
      zh: {
        title: '高压测量',
        description: '为液压站、水泵、压缩机和测试台选择变送器与开关。',
        meta: '0-600 bar 示例',
      },
    },
  },
  {
    intent: 'industrial-pipeline-monitoring',
    id: 'app_pipeline_monitoring',
    slug: 'industrial-pipeline-monitoring',
    productQueries: ['pressure', 'temperature', 'differential-pressure'],
    text: {
      en: {
        title: 'Industrial pipeline monitoring',
        description: 'Monitor pressure, differential pressure, and temperature across process piping and utility lines.',
        meta: 'Pressure / DP / temperature',
      },
      zh: {
        title: '工业管线监测',
        description: '跨过程管线和公用工程管路监测压力、差压与温度。',
        meta: '压力 / 差压 / 温度',
      },
    },
  },
  {
    intent: 'oem-sensor-integration',
    id: 'app_oem_sensor_integration',
    slug: 'oem-sensor-integration',
    productQueries: ['pressure', 'level', 'switch-state'],
    text: {
      en: {
        title: 'OEM sensor integration',
        description: 'Match signals, connectors, housings, labels, and delivery terms for repeatable OEM programs.',
        meta: 'Signal / connector / label',
      },
      zh: {
        title: 'OEM 传感器集成',
        description: '为批量 OEM 项目匹配信号、连接器、外壳、贴牌和交付条款。',
        meta: '信号 / 接口 / 贴牌',
      },
    },
  },
] as const satisfies readonly {
  readonly intent: ApplicationIntent
  readonly id: ApplicationId
  readonly slug: SlugSegment
  readonly productQueries: readonly string[]
  readonly text: Record<LocaleCode, { readonly title: string; readonly description: string; readonly meta: string }>
}[]

const staticInfoPages = {
  en: {
    oem: {
      icon: 'oem',
      eyebrow: 'OEM customization',
      title: 'Sensor programs for repeatable machine builds',
      body: 'Structured paths for signal output, process connection, housing, labeling, packaging, MOQ, and batch delivery requirements.',
      primary: 'Browse OEM-ready Products',
      secondary: 'Send Requirements',
    },
    resources: {
      icon: 'catalog',
      eyebrow: 'Resources',
      title: 'Datasheets, evidence, and selection material',
      body: 'A stable entry for datasheets, product evidence, certificates, and engineering selection notes connected to product records.',
      primary: 'Browse Products',
      secondary: 'Contact Engineering',
    },
    contact: {
      icon: 'quality',
      eyebrow: 'Contact',
      title: 'Send a product selection or quote request',
      body: 'Share model, measurement range, output signal, process connection, media, quantity, and target delivery window.',
      primary: 'Browse Products First',
      secondary: 'Email Requirements',
    },
  },
  zh: {
    oem: {
      icon: 'oem',
      eyebrow: 'OEM 定制',
      title: '面向批量设备的传感器项目',
      body: '围绕信号输出、过程连接、外壳、贴牌、包装、MOQ 和批量交付组织需求。',
      primary: '浏览 OEM 产品',
      secondary: '提交需求',
    },
    resources: {
      icon: 'catalog',
      eyebrow: '资源中心',
      title: '数据手册、证据和选型资料',
      body: '为数据手册、产品证据、证书和工程选型说明提供稳定入口，并关联产品记录。',
      primary: '浏览产品',
      secondary: '联系工程支持',
    },
    contact: {
      icon: 'quality',
      eyebrow: '联系',
      title: '提交选型或报价需求',
      body: '请提供型号、量程、输出信号、过程连接、介质、数量和目标交付周期。',
      primary: '先浏览产品',
      secondary: '发送需求',
    },
  },
} as const satisfies Record<LocaleCode, Record<StaticInfoPageKind, {
  readonly icon: IndustrialIconKey
  readonly eyebrow: string
  readonly title: string
  readonly body: string
  readonly primary: string
  readonly secondary: string
}>>

export function getProductListStaticParams(locales: readonly LocaleCode[]) {
  return getProductStaticParams(locales)
}

export function resolveProductListViewModel(locale: LocaleCode, slug: readonly string[] = []): ProductListPageViewModel | null {
  const index = getProductCatalog(locale)
  const categorySlugPath = (slug.length ? slug.join('/') : industrialSensorCategoryTree.root.slugPath) as SeoSlugPath
  const category = index.categoryBySlugPath.get(categorySlugPath)

  if (!category) {
    return null
  }

  const productList = listProducts(locale, {
    categoryId: category.id,
    categoryMode: 'with-descendants',
    sort: 'category-sort',
    limit: 48,
  })
  const categoryPath = index.categoryPathById.get(category.id) ?? [category]

  return {
    locale,
    category: {
      name: localizeText(category.name, locale),
      description: localizeText(category.description, locale),
      canonicalPath: category.canonicalPath,
    },
    breadcrumb: toCategoryBreadcrumb(locale, categoryPath),
    productList,
    countLabel: locale === 'zh' ? `${productList.pageInfo.total} 款产品` : `${productList.pageInfo.total} products`,
    labels: productListLabels[locale],
  }
}

export function resolveProductDetailViewModel(locale: LocaleCode, slug: readonly string[]): { status: 'found'; data: ProductDetailViewModel } | { status: 'not-found' } {
  const result = resolveProductDetailPage(getProductCatalog(locale), {
    locale,
    pathname: `/products/${slug.join('/')}`,
  })

  if (result.status !== 'found') {
    return { status: 'not-found' }
  }

  return {
    status: 'found',
    data: toProductDetailViewModel(result.data),
  }
}

export function shouldRedirectProductViewModel(data: ProductDetailViewModel, requestedSlug: readonly string[]) {
  return `/products/${requestedSlug.join('/')}` !== data.route.path
}

export function getIndustryEntryPageViewModel(locale: LocaleCode): EntryPageViewModel {
  const productList = listProducts(locale, { limit: 200 })
  const entries = industries.map((industry) => toEntryCard(locale, productList, industry, `/industries/${industry.slug}`))

  return {
    locale,
    eyebrow: locale === 'zh' ? '行业入口' : 'Industry entry points',
    title: locale === 'zh' ? '按工业系统场景进入产品选型' : 'Enter product selection by industrial system',
    body: locale === 'zh'
      ? '围绕石油与天然气、水处理、工业自动化、能源和制造业组织测量需求、推荐产品和 RFQ 路径。'
      : 'Organized around oil and gas, water treatment, automation, energy, and manufacturing requirements, with product recommendations and RFQ paths.',
    primaryAction: { label: locale === 'zh' ? '浏览产品中心' : 'Open Product Center', href: '/products' },
    secondaryAction: { label: locale === 'zh' ? '提交 RFQ' : 'Send RFQ', href: '/contact' },
    productRailLabel: commonLabels[locale].recommendedProducts,
    entries,
    proof: getEntryProof(locale, productList),
    rfq: getRfqCopy(locale),
  }
}

export function getApplicationEntryPageViewModel(locale: LocaleCode): EntryPageViewModel {
  const productList = listProducts(locale, { limit: 200 })
  const entries = applications.map((application) => toEntryCard(locale, productList, application, `/applications/${application.slug}`))

  return {
    locale,
    eyebrow: locale === 'zh' ? '应用场景入口' : 'Application entry points',
    title: locale === 'zh' ? '按测量任务进入传感器选型' : 'Enter sensor selection by measurement task',
    body: locale === 'zh'
      ? '为高压测量、工业管线监测和 OEM 传感器集成提供长尾入口、AI 可读答案和推荐产品。'
      : 'Long-tail entry points for high pressure measurement, industrial pipeline monitoring, and OEM sensor integration with AI-readable answers and recommended products.',
    primaryAction: { label: locale === 'zh' ? '查看应用入口' : 'View applications', href: '/applications' },
    secondaryAction: { label: locale === 'zh' ? '提交需求' : 'Send requirements', href: '/contact' },
    productRailLabel: commonLabels[locale].recommendedProducts,
    entries,
    proof: getEntryProof(locale, productList),
    rfq: getRfqCopy(locale),
  }
}

export function getStaticInfoPageViewModel(locale: LocaleCode, kind: StaticInfoPageKind): StaticInfoPageViewModel {
  const copy = staticInfoPages[locale][kind]

  return {
    locale,
    icon: copy.icon,
    eyebrow: copy.eyebrow,
    title: copy.title,
    body: copy.body,
    primaryAction: { label: copy.primary, href: '/products' },
    secondaryAction: { label: copy.secondary, href: '/contact' },
    quickLinks: getPrimaryCategoryLinks(locale).slice(0, 3),
  }
}

function toProductDetailViewModel(data: ProductDetailPageData): ProductDetailViewModel {
  const locale = data.locale
  const labels = commonLabels[locale]
  const product = data.product
  const primaryDocument = product.documents.find((document) => document.kind === 'datasheet') ?? product.documents[0]
  const relatedProducts = filterProductCatalog(getProductCatalog(locale), {
    categoryId: product.classification.primaryCategoryId,
    categoryMode: 'with-descendants',
    sort: 'model-asc',
    limit: 4,
  }).items.filter((item) => item.id !== product.identity.id)

  return {
    locale,
    route: {
      path: data.route.canonicalPath,
    },
    breadcrumb: [
      { label: labels.home, href: `/${locale}` },
      ...data.seo.breadcrumb.map((item) => ({
        label: item.label,
        href: `/${locale}${item.canonicalPath}`,
      })),
    ],
    hero: {
      eyebrow: labels.productCenter,
      title: data.seo.h1,
      summary: data.geoAi.answerSummary.shortParagraph || data.listItem.summary,
      model: product.identity.model,
      categoryLabel: data.listItem.categoryLabel,
      availabilityLabel: data.listItem.availabilityLabel,
      badges: [product.identity.brand, product.identity.sku, getLifecycleLabel(product.identity.lifecycle, locale, labels)],
    },
    actions: {
      quoteLabel: labels.quote,
      datasheetLabel: labels.datasheet,
      datasheetHref: primaryDocument?.href,
    },
    overviewSpecs: data.listItem.keySpecs,
    technicalParameters: {
      title: labels.specs,
      groups: product.specificationGroups.map((group) => ({
        title: localizeSpecGroupTitle(group.label, locale),
        values: group.values.map((value) => ({ label: localizeSpecLabel(value.label, locale), value: value.display })),
      })),
    },
    applications: {
      title: labels.applications,
      items: product.content.applications.map((application) => localizeText(application, locale)),
    },
    compatibility: {
      title: labels.compatibility,
      groups: [
        { title: labels.media, items: product.environmentalLimits.compatibleMedia ?? [] },
        { title: labels.materials, items: product.environmentalLimits.wettedMaterials },
        { title: labels.certifications, items: product.certifications },
        { title: labels.connections, items: [product.connections.process.value, product.connections.electrical.value] },
      ].filter((group) => group.items.length > 0),
    },
    variants: {
      title: labels.variants,
      items: product.variants.map((variant) => ({
        code: variant.orderCode,
        availabilityLabel: data.listItem.availabilityLabel,
        options: variant.optionValues.map((option) => `${localizeSpecLabel(option.label, locale)}: ${option.value}`),
      })),
    },
    commercial: {
      title: labels.commercial,
      groups: [{
        title: labels.terms,
        items: [
          product.commercialTerms.minimumOrderQuantity ? `MOQ ${product.commercialTerms.minimumOrderQuantity}` : null,
          localizeLeadTime(product.commercialTerms.standardLeadTime, locale),
          localizeWarranty(product.commercialTerms.warranty, locale),
          product.commercialTerms.oemCustomizable ? labels.oemCustomization : null,
          product.commercialTerms.privateLabelAvailable ? labels.privateLabel : null,
        ].filter(isString),
      }].filter((group) => group.items.length > 0),
    },
    faq: {
      title: labels.faq,
      items: toProductFaq(product, locale),
    },
    seoContent: {
      title: labels.seoContent,
      paragraphs: [
        data.seo.metaDescription,
        data.geoAi.selectionGuidance.bestFor.join(' '),
        data.geoAi.selectionGuidance.decisionCriteria.join(' '),
      ].filter(Boolean),
    },
    geoSummary: data.geoAi
      ? {
          title: labels.geoSummary,
          oneSentence: data.geoAi.answerSummary.oneSentence,
          technicalAbstract: data.geoAi.answerSummary.technicalAbstract,
          facts: data.geoAi.factTable.map((fact) => ({ label: localizeGeoFactLabel(fact.label, locale), value: fact.value })),
          evidenceTitle: labels.evidence,
          evidence: data.geoAi.evidence.map((source) => ({
            title: localizeDatasheetTitle(source.title, product.identity.model, locale),
            sourceType: localizeSourceType(source.sourceType, locale),
            href: source.href,
          })),
        }
      : undefined,
    relatedProducts: {
      title: labels.relatedProducts,
      items: relatedProducts,
    },
  }
}

function toProductFaq(product: ProductRecord, locale: LocaleCode) {
  const name = localizeText(product.content.shortName, locale)
  const summary = localizeText(product.content.summary, locale)
  const range = product.measurements[0]?.range.display
  const output = product.outputs[0]?.value

  if (locale === 'zh') {
    return [
      { question: `${name} 适合哪些场景？`, answer: summary },
      { question: `${name} 的主要量程是什么？`, answer: range ? `主要量程为 ${range}。` : '请参考技术参数表确认量程。' },
      { question: `${name} 支持哪些输出？`, answer: output ? `标准输出为 ${output}。` : '请参考数据手册确认输出配置。' },
    ]
  }

  return [
    { question: `What is ${name} used for?`, answer: summary },
    { question: `What measurement range does ${name} support?`, answer: range ? `The primary range is ${range}.` : 'Check the technical parameter table for available ranges.' },
    { question: `What output does ${name} provide?`, answer: output ? `The standard output is ${output}.` : 'Check the datasheet for output configurations.' },
  ]
}

function toCategoryBreadcrumb(locale: LocaleCode, categoryPath: readonly CategoryNode[]) {
  return [
    { label: commonLabels[locale].home, href: `/${locale}` },
    ...categoryPath.map((category) => ({
      label: localizeText(category.name, locale),
      href: `/${locale}${category.canonicalPath}`,
    })),
  ]
}

function getPrimaryCategoryLinks(locale: LocaleCode) {
  const index = getProductCatalog(locale)

  return [...(industrialSensorCategoryTree.root.children ?? [])].map((category) => ({
    label: localizeText(category.name, locale),
    href: index.categoryById.get(category.id)?.canonicalPath ?? category.canonicalPath,
  }))
}

function toEntryCard(
  locale: LocaleCode,
  productList: ProductListResult,
  entry: (typeof industries)[number] | (typeof applications)[number],
  href: IndustryCanonicalPath | ApplicationCanonicalPath,
): EntryCardViewModel {
  const products = productList.items
    .filter((product) => entry.productQueries.some((query) => product.measurementKinds.includes(query as never) || product.sortText.includes(query)))
    .slice(0, 3)

  return {
    key: 'key' in entry ? entry.key : entry.intent,
    title: entry.text[locale].title,
    description: entry.text[locale].description,
    href,
    meta: entry.text[locale].meta,
    products,
  }
}

function getEntryProof(locale: LocaleCode, productList: ProductListResult) {
  if (locale === 'zh') {
    return [
      { label: '公开产品', value: `${productList.pageInfo.total}` },
      { label: '目标规模', value: '1000+' },
      { label: 'RFQ 路径', value: '48h' },
    ]
  }

  return [
    { label: 'Public products', value: `${productList.pageInfo.total}` },
    { label: 'Target scale', value: '1000+' },
    { label: 'RFQ path', value: '48h' },
  ]
}

function getRfqCopy(locale: LocaleCode) {
  return locale === 'zh'
    ? {
        title: '需要按工况选型？',
        body: '提交介质、量程、输出、连接、数量和交付窗口，工程团队可按应用路径回复。',
        primary: '提交 RFQ',
        secondary: '浏览产品中心',
      }
    : {
        title: 'Need selection by operating conditions?',
        body: 'Send media, range, output, connection, quantity, and delivery window so engineering can reply by application path.',
        primary: 'Send RFQ',
        secondary: 'Browse products',
      }
}

function isString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.length > 0
}

function getLifecycleLabel(lifecycle: ProductRecord['identity']['lifecycle'], locale: LocaleCode, labels: Record<string, string>) {
  if (lifecycle === 'active') {
    return labels.activeLifecycle
  }

  if (locale === 'zh') {
    const zhLabels: Partial<Record<ProductRecord['identity']['lifecycle'], string>> = {
      draft: '草稿',
      'phase-out': '逐步停产',
      discontinued: '已停产',
      hidden: '隐藏',
    }

    return zhLabels[lifecycle] ?? lifecycle
  }

  return lifecycle
}

function localizeSpecGroupTitle(label: string, locale: LocaleCode) {
  if (locale !== 'zh') {
    return label
  }

  const labels: Record<string, string> = {
    'Technical specifications': '技术规格',
  }

  return labels[label] ?? label
}

function localizeSpecLabel(label: string, locale: LocaleCode) {
  if (locale !== 'zh') {
    return label
  }

  const labels: Record<string, string> = {
    Range: '量程',
    Output: '输出',
    Feature: '特性',
  }

  return labels[label] ?? label
}

function localizeGeoFactLabel(label: string, locale: LocaleCode) {
  if (locale !== 'zh') {
    return label
  }

  const labels: Record<string, string> = {
    Model: '型号',
    'Measurement range': '测量量程',
    'Output signal': '输出信号',
    'Ingress protection': '防护等级',
  }

  return labels[label] ?? label
}

function localizeLeadTime(value: string | undefined, locale: LocaleCode) {
  if (!value) {
    return undefined
  }

  if (locale !== 'zh') {
    return value
  }

  return value.replace('days', '天').replace('weeks', '周')
}

function localizeWarranty(value: string | undefined, locale: LocaleCode) {
  if (!value) {
    return undefined
  }

  if (locale !== 'zh') {
    return value
  }

  return value.replace('months', '个月')
}

function localizeDatasheetTitle(title: string, model: string, locale: LocaleCode) {
  if (locale !== 'zh') {
    return title
  }

  return `${model} 数据手册`
}

function localizeSourceType(sourceType: string, locale: LocaleCode) {
  if (locale !== 'zh') {
    return sourceType
  }

  const labels: Record<string, string> = {
    datasheet: '数据手册',
    manual: '手册',
    certificate: '证书',
    'test-report': '测试报告',
    catalog: '产品目录',
    'engineering-note': '工程说明',
  }

  return labels[sourceType] ?? sourceType
}
