import { type ApplicationIntent } from './application'
import { industrialSensorCategoryTree, type CategoryNode } from './category'
import { getVisibleProductCategoryChildren } from './category-visibility'
import { type IndustryKey } from './industry'
import { containsCjkText, localizeTechnicalValue, localizeTechnicalValues } from './localization'
import {
  filterProductCatalog,
  localizeText,
  productMatchesBarRangeFilter,
  resolveProductDetailPage,
  selectProductSeo,
  type ProductCatalogIndex,
  type ProductDetailPageData,
  type ProductFilterQuery,
  type ProductListItem,
  type ProductListResult,
} from './product-catalog'
import {
  buildBusinessProductCategoryGroups,
  getBusinessProductCategoryLabel,
} from './product-navigation'
import {
  getProductCatalog as getDefaultProductCatalog,
  getProductStaticParams as getDefaultProductStaticParams,
  listProducts as listDefaultProducts,
} from './product-source'
import type {
  ApplicationCanonicalPath,
  ApplicationId,
  CategoryId,
  IndustryCanonicalPath,
  IndustryId,
  LocaleCode,
  ProductId,
  ProductCanonicalPath,
  SeoSlugPath,
  SlugSegment,
} from './primitives'
import type { CertificationCode, MeasurementKind, ProductFamily, ProductRecord, SignalOutputKind } from './product'
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
  readonly media: {
    readonly title: string
    readonly primaryImage?: {
      readonly href: string
      readonly alt: string
    }
    readonly galleryImages: readonly {
      readonly href: string
      readonly alt: string
      readonly kind: string
    }[]
  }
  readonly actions: {
    readonly quoteLabel: string
    readonly datasheetLabel: string
    readonly datasheetHref?: string
    readonly documents: readonly {
      readonly title: string
      readonly href: string
      readonly kind: string
      readonly revision?: string
      readonly contentLocale?: string
    }[]
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
  readonly categoryNavigation: ProductCatalogNavigationViewModel
  readonly productList: ProductListResult
  readonly filterGroups: readonly ProductListFilterGroupViewModel[]
  readonly search: {
    readonly label: string
    readonly placeholder: string
    readonly submitLabel: string
    readonly value: string
    readonly actionPath: string
    readonly clearHref: string
    readonly hiddenInputs: readonly {
      readonly name: string
      readonly value: string
    }[]
  }
  readonly countLabel: string
  readonly pagination: {
    readonly currentPage: number
    readonly totalPages: number
    readonly previousHref?: string
    readonly nextHref?: string
    readonly pages: readonly {
      readonly number: number
      readonly href: string
      readonly current: boolean
    }[]
  }
  readonly labels: {
    readonly eyebrow: string
    readonly allProducts: string
    readonly details: string
    readonly filters: string
    readonly empty: string
  }
}

export interface ProductCatalogNavigationViewModel {
  readonly title: string
  readonly groups: readonly ProductCatalogNavigationGroupViewModel[]
}

export interface ProductCatalogNavigationGroupViewModel {
  readonly id: string
  readonly title: string
  readonly href: string
  readonly active: boolean
  readonly items: readonly ProductCatalogNavigationItemViewModel[]
}

export interface ProductCatalogNavigationItemViewModel {
  readonly id: string
  readonly title: string
  readonly href: string
}

export interface ProductListFilterGroupViewModel {
  readonly title: string
  readonly clearHref?: string
  readonly items: readonly ProductListFilterItemViewModel[]
}

export interface ProductListFilterItemViewModel {
  readonly label: string
  readonly value: string
  readonly count: number
  readonly href: string
  readonly active: boolean
}

interface ProductListViewModelOptions {
  readonly page?: number
  readonly basePath?: string
  readonly search?: string
  readonly categoryIds?: readonly string[]
  readonly families?: readonly string[]
  readonly measurementKinds?: readonly string[]
  readonly industrySlugs?: readonly string[]
  readonly applicationSlugs?: readonly string[]
  readonly outputKinds?: readonly string[]
  readonly accuracyValues?: readonly string[]
  readonly certifications?: readonly string[]
  readonly rangeMinBar?: number
  readonly rangeMaxBar?: number
}

interface NormalizedProductListFilters {
  readonly search?: string
  readonly categoryIds: readonly CategoryId[]
  readonly families: readonly ProductFamily[]
  readonly measurementKinds: readonly MeasurementKind[]
  readonly industrySlugs: readonly SlugSegment[]
  readonly applicationSlugs: readonly SlugSegment[]
  readonly outputKinds: readonly SignalOutputKind[]
  readonly accuracyValues: readonly string[]
  readonly certifications: readonly CertificationCode[]
  readonly rangeMinBar?: number
  readonly rangeMaxBar?: number
}

export interface ProductStaticParam {
  readonly locale: LocaleCode
  readonly slug: readonly string[]
}

export interface ProductViewModelSource {
  readonly getCatalog: (locale: LocaleCode) => ProductCatalogIndex
  readonly listProducts: (locale: LocaleCode, query?: ProductFilterQuery) => ProductListResult
  readonly getStaticParams?: (locales: readonly LocaleCode[]) => readonly ProductStaticParam[]
}

const defaultProductViewModelSource: ProductViewModelSource = {
  getCatalog: getDefaultProductCatalog,
  listProducts: listDefaultProducts,
  getStaticParams: getDefaultProductStaticParams,
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
  readonly news?: EntryNewsSectionViewModel
  readonly ecosystem?: EntryEcosystemSectionViewModel
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

export interface EntryNewsSectionViewModel {
  readonly eyebrow: string
  readonly title: string
  readonly body: string
  readonly emptyLabel: string
  readonly entries: readonly {
    readonly title: string
    readonly description: string
    readonly href: string
    readonly meta: string
  }[]
}

export interface EntryEcosystemContentInput {
  readonly id: string
  readonly title: string
  readonly industryId?: IndustryId
  readonly industryLabel?: string
  readonly scenario: string
  readonly anchorProductId?: ProductId
  readonly recommendedProductIds: readonly ProductId[]
  readonly rationale: string
}

export interface EntryEcosystemSectionViewModel {
  readonly eyebrow: string
  readonly title: string
  readonly body: string
  readonly emptyLabel: string
  readonly quoteLabel: string
  readonly items: readonly {
    readonly id: string
    readonly title: string
    readonly industryLabel: string
    readonly scenario: string
    readonly anchorProduct?: ProductListItem
    readonly recommendedProducts: readonly ProductListItem[]
    readonly sensorProducts: readonly ProductListItem[]
    readonly valveProducts: readonly ProductListItem[]
    readonly rationale: string
  }[]
}

export type CapabilityPageKind = 'quality' | 'manufacturing'

export type StaticInfoPageKind = 'oem' | 'company' | 'resources' | 'contact' | CapabilityPageKind

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
    readonly description: string
    readonly href: string
  }[]
}

export interface CapabilityPageViewModel extends StaticInfoPageViewModel {
  readonly kind: CapabilityPageKind
  readonly heroImage: {
    readonly src: string
    readonly alt: string
  }
  readonly metrics: readonly {
    readonly value: string
    readonly label: string
    readonly description: string
  }[]
  readonly sections: readonly {
    readonly id: string
    readonly eyebrow: string
    readonly title: string
    readonly body: string
    readonly items: readonly {
      readonly title: string
      readonly body: string
      readonly meta: string
    }[]
  }[]
  readonly evidence: readonly {
    readonly label: string
    readonly value: string
    readonly note: string
  }[]
}

export type ResourceCollectionKind = 'blog' | 'cases' | 'manuals'

export interface ResourceCollectionViewModel {
  readonly locale: LocaleCode
  readonly kind: ResourceCollectionKind
  readonly eyebrow: string
  readonly title: string
  readonly body: string
  readonly emptyLabel: string
  readonly countLabel: string
  readonly entries: readonly ResourceEntryViewModel[]
}

export interface ResourceMediaViewModel {
  readonly href: string
  readonly alt: string
}

export interface ResourceContentBlockViewModel {
  readonly title: string
  readonly body: string
  readonly items?: readonly string[]
  readonly links?: readonly {
    readonly label: string
    readonly href: string
  }[]
  readonly video?: {
    readonly label: string
    readonly href: string
  }
}

export interface ResourceNavigationLinkViewModel {
  readonly title: string
  readonly description: string
  readonly href: string
  readonly meta: string
  readonly kindLabel: string
  readonly ctaLabel: string
}

export interface ResourceDetailViewModel {
  readonly locale: LocaleCode
  readonly kind: ResourceCollectionKind
  readonly breadcrumb: readonly { readonly label: string; readonly href: string }[]
  readonly eyebrow: string
  readonly title: string
  readonly body: string
  readonly coverImage?: ResourceMediaViewModel
  readonly statusLabel: string
  readonly meta: string
  readonly contentBlocks: readonly ResourceContentBlockViewModel[]
  readonly childLinks?: readonly ResourceNavigationLinkViewModel[]
  readonly primaryAction?: {
    readonly label: string
    readonly href: string
  }
  readonly relatedProducts: readonly ProductListItem[]
  readonly relatedIndustryIds: readonly IndustryId[]
  readonly backHref: string
}

export interface ResourceEntryViewModel {
  readonly key: string
  readonly title: string
  readonly description: string
  readonly href: string
  readonly meta: string
  readonly kindLabel: string
  readonly contextLabels: readonly string[]
  readonly ctaLabel: string
  readonly downloadHref?: string
  readonly coverImage?: ResourceMediaViewModel
  readonly body?: string
  readonly contentBlocks?: readonly ResourceContentBlockViewModel[]
  readonly childEntries?: readonly ResourceEntryViewModel[]
  readonly hiddenFromCollection?: boolean
  readonly relatedProductIds?: readonly ProductId[]
  readonly relatedIndustryIds?: readonly IndustryId[]
}

export interface ResourceContentInput {
  readonly key: string
  readonly routeSegment?: string
  readonly title: string
  readonly summary: string
  readonly meta: string
  readonly kindLabel: string
  readonly contextLabels?: readonly string[]
  readonly ctaLabel?: string
  readonly downloadHref?: string
  readonly coverImage?: ResourceMediaViewModel
  readonly body?: string
  readonly contentBlocks?: readonly ResourceContentBlockViewModel[]
  readonly childEntries?: readonly ResourceContentInput[]
  readonly hiddenFromCollection?: boolean
  readonly relatedProductIds?: readonly ProductId[]
  readonly relatedIndustryIds?: readonly IndustryId[]
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
    empty: 'No products match this category.',
  },
  zh: {
    eyebrow: '产品中心',
    allProducts: '全部产品',
    details: '查看详情',
    filters: '可用筛选',
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
        title: 'Solar Energy',
        description: 'Temperature, pressure, and differential pressure monitoring for solar thermal loops, utility skids, storage, and power equipment.',
        meta: 'Solar / utility systems',
      },
      zh: {
        title: '能源系统',
        description: '用于太阳能热力回路、公用工程撬装、储能和电力设备的温度、压力与差压监测。',
        meta: '能源 / 公用工程',
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
        title: 'Machine Engineering',
        description: 'Reliable measurement for hydraulic equipment, compressors, machine tools, and production lines.',
        meta: 'Machines / compressors',
      },
      zh: {
        title: '机械工程',
        description: '用于液压设备、压缩机、机床和产线的可靠测量。',
        meta: '设备 / 压缩机',
      },
    },
  },
  {
    key: 'chemical-processing',
    id: 'ind_chemical_processing',
    slug: 'chemical-processing',
    productQueries: ['pressure', 'temperature', 'differential-pressure'],
    text: {
      en: {
        title: 'Chemical Processing Lines',
        description: 'Pressure, differential pressure, and temperature monitoring for reactors, dosing skids, tanks, and corrosion-sensitive process lines.',
        meta: 'Process lines / chemical dosing',
      },
      zh: {
        title: '化工过程产线',
        description: '面向反应釜、加药撬装、储罐和腐蚀性介质管线的压力、差压与温度监测。',
        meta: '过程产线 / 化学加药',
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

type StaticInfoPageCopy = {
  readonly icon: IndustrialIconKey
  readonly eyebrow: string
  readonly title: string
  readonly body: string
  readonly primary: string
  readonly secondary: string
}

const staticInfoPages: Record<LocaleCode, Partial<Record<StaticInfoPageKind, StaticInfoPageCopy>>> = {
  en: {
    oem: {
      icon: 'oem',
      eyebrow: 'OEM customization',
      title: 'Sensor programs for repeatable machine builds',
      body: 'Structured paths for signal output, process connection, housing, labeling, packaging, MOQ, and batch delivery requirements.',
      primary: 'Browse OEM-ready Products',
      secondary: 'Send Requirements',
    },
    company: {
      icon: 'factory',
      eyebrow: 'Company',
      title: 'Industrial sensor partner for long-term supply programs',
      body: 'A company entry for quality capability, engineering support, OEM cooperation, quote handling, and batch delivery confidence.',
      primary: 'Browse Products',
      secondary: 'Request Quote',
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
    quality: {
      icon: 'quality',
      eyebrow: 'Corporate standards',
      title: 'Engineering trust and quality assurance',
      body: 'Quality controls for industrial sensors and valves, from supplier intake and traceability to calibration records and shipment-ready documentation.',
      primary: 'Browse Quality-ready Products',
      secondary: 'Contact Engineering',
    },
    manufacturing: {
      icon: 'factory',
      eyebrow: 'Manufacturing capability',
      title: 'Advanced manufacturing capability',
      body: 'Precision production infrastructure for repeatable industrial measurement programs, OEM batches, calibration, and documented delivery control.',
      primary: 'Browse Products',
      secondary: 'Send Project Brief',
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
    company: {
      icon: 'factory',
      eyebrow: '公司',
      title: '面向长期供货项目的工业传感器合作伙伴',
      body: '公司入口聚焦质量能力、工程支持、OEM 合作、询价处理和批量交付信任。',
      primary: '浏览产品',
      secondary: '获取报价',
    },
    resources: {
      icon: 'catalog',
      eyebrow: '资料中心',
      title: '数据手册、证据和选型资料',
      body: '资料中心承接博客、案例、产品手册和下载入口，并保持与产品记录、行业入口和询价路径一致。',
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
    quality: {
      icon: 'quality',
      eyebrow: '质量标准',
      title: '工程信任与质量保证',
      body: '围绕工业传感器与阀门建立从来料、追溯、测试、校准到出货资料的质量控制路径。',
      primary: '浏览质量适配产品',
      secondary: '联系工程支持',
    },
    manufacturing: {
      icon: 'factory',
      eyebrow: '制造能力',
      title: '先进制造能力',
      body: '面向工业测量项目、OEM 批量配套、校准与可记录交付的精密制造基础设施。',
      primary: '浏览产品',
      secondary: '提交项目需求',
    },
  },
}

const capabilityPageDetails = {
  en: {
    quality: {
      heroImage: {
        src: '/images/hero/industrial-instrumentation.png',
        alt: 'Industrial pressure testing lab with gauges and calibration equipment',
      },
      metrics: [
        { value: 'ISO 9001', label: 'Quality system', description: 'Documented process control for production and shipment records.' },
        { value: '100%', label: 'Traceability path', description: 'Material, assembly, calibration, and batch information are kept reviewable.' },
        { value: '48h', label: 'Engineering response', description: 'RFQ follow-up can include datasheet, test, and certificate requirements.' },
      ],
      sections: [
        {
          id: 'standards',
          eyebrow: 'Quality management system',
          title: 'Control points before every shipment',
          body: 'The quality workflow focuses on evidence buyers can review: supplier intake, process control, calibration records, and final inspection.',
          items: [
            { title: 'Traceability', body: 'Lifecycle tracking from material intake to final calibration and shipment records.', meta: 'Records' },
            { title: 'Calibration control', body: 'Pressure, temperature, and signal checks aligned to the product family and range.', meta: 'Calibration' },
            { title: 'Batch consistency', body: 'Repeatable checks for OEM batches, labels, packaging, and delivery documents.', meta: 'OEM' },
            { title: 'Continuous improvement', body: 'Field feedback and statistical review inform process refinements over time.', meta: 'SPC' },
          ],
        },
        {
          id: 'testing',
          eyebrow: 'Testing evidence',
          title: 'Inspection paths for industrial operating conditions',
          body: 'Testing is organized around pressure range, electrical output, process connection, environmental exposure, and customer documentation needs.',
          items: [
            { title: 'Pressure verification', body: 'Hydraulic or pneumatic checks for selected sensor and valve pressure classes.', meta: 'Pressure' },
            { title: 'Environmental review', body: 'Temperature, ingress protection, vibration, and media compatibility are reviewed by application.', meta: 'Environment' },
            { title: 'Document package', body: 'Datasheets, certificate entries, labels, and packing requirements are prepared for procurement records.', meta: 'Documents' },
          ],
        },
      ],
      evidence: [
        { label: 'Datasheet', value: 'Model-level', note: 'Technical parameters, output, connection, and material options.' },
        { label: 'Inspection', value: 'Batch-level', note: 'Final checks before packing and shipment release.' },
        { label: 'Certificate', value: 'On request', note: 'Certificate and compliance materials can be matched to the RFQ.' },
      ],
    },
    manufacturing: {
      heroImage: {
        src: '/images/hero/industrial-instrumentation.png',
        alt: 'Clean industrial manufacturing floor with organized production equipment',
      },
      metrics: [
        { value: '25k m2', label: 'Production area', description: 'Manufacturing space organized for assembly, calibration, packing, and batch flow.' },
        { value: '85%', label: 'Automated process target', description: 'Production gates designed for repeatability and data capture.' },
        { value: 'ISO', label: 'System readiness', description: 'Quality and environmental management evidence can support buyer review.' },
      ],
      sections: [
        {
          id: 'infrastructure',
          eyebrow: 'Infrastructure',
          title: 'Factory overview for repeatable delivery',
          body: 'Production is arranged around stable material flow, controlled assembly, calibration, packaging, and shipment coordination.',
          items: [
            { title: 'Core facility', body: 'A production campus prepared for sensor, valve, and OEM accessory programs.', meta: 'Facility' },
            { title: 'Automation gates', body: 'Digital records and automated checks support consistency across repeat orders.', meta: 'Industry 4.0' },
            { title: 'Assembly cells', body: 'Process-specific work areas support pressure, temperature, level, and valve products.', meta: 'Assembly' },
            { title: 'Packing flow', body: 'Labels, manuals, certificates, and carton requirements are coordinated with the order.', meta: 'Shipment' },
          ],
        },
        {
          id: 'calibration',
          eyebrow: 'Precision processes',
          title: 'Assembly and calibration paths',
          body: 'Manufacturing capability is connected to the measurement task, so accuracy, signal output, connection, and material options stay reviewable.',
          items: [
            { title: 'Sensor assembly', body: 'Controlled assembly for pressure transmitters, transducers, switches, and related instruments.', meta: 'Sensors' },
            { title: 'Valve pairing', body: 'Support for pressure rating, connection, material, media, and size requirements.', meta: 'Valves' },
            { title: 'OEM batch support', body: 'Repeat orders can include labeling, packaging, MOQ, and delivery-window planning.', meta: 'OEM' },
          ],
        },
      ],
      evidence: [
        { label: 'Production flow', value: 'Material to shipment', note: 'Order handling spans intake, assembly, calibration, packing, and release.' },
        { label: 'Calibration', value: 'Range-specific', note: 'Checks are aligned to pressure, temperature, output, and application requirements.' },
        { label: 'Batch support', value: 'OEM-ready', note: 'Labeling, packaging, and repeat supply details are handled with the RFQ.' },
      ],
    },
  },
  zh: {
    quality: {
      heroImage: {
        src: '/images/hero/industrial-instrumentation.png',
        alt: '带压力表和校准设备的工业压力测试实验室',
      },
      metrics: [
        { value: 'ISO 9001', label: '质量体系', description: '围绕生产与出货资料建立可记录的过程控制。' },
        { value: '100%', label: '追溯路径', description: '材料、装配、校准和批次信息保持可复核。' },
        { value: '48h', label: '工程响应', description: '询价回复可同步确认数据手册、测试和证书需求。' },
      ],
      sections: [
        {
          id: 'standards',
          eyebrow: '质量管理体系',
          title: '每次出货前的控制节点',
          body: '质量流程聚焦采购可复核的证据：来料、过程控制、校准记录和最终检验。',
          items: [
            { title: '全流程追溯', body: '从来料到最终校准和出货记录，形成可回查的生命周期信息。', meta: '记录' },
            { title: '校准控制', body: '按产品族、量程和信号输出执行压力、温度和电气检查。', meta: '校准' },
            { title: '批量一致性', body: '面向 OEM 批次检查标签、包装、资料和交付一致性。', meta: 'OEM' },
            { title: '持续改进', body: '结合现场反馈和统计复核，持续优化制造与检验流程。', meta: 'SPC' },
          ],
        },
        {
          id: 'testing',
          eyebrow: '测试证据',
          title: '面向工业工况的检验路径',
          body: '测试围绕压力范围、电气输出、过程连接、环境暴露和客户资料要求组织。',
          items: [
            { title: '压力验证', body: '按传感器与阀门压力等级执行液压或气压检查。', meta: '压力' },
            { title: '环境复核', body: '按应用确认温度、防护、振动和介质兼容性。', meta: '环境' },
            { title: '资料包', body: '为采购归档准备数据手册、证书条目、标签和包装要求。', meta: '资料' },
          ],
        },
      ],
      evidence: [
        { label: '数据手册', value: '型号级', note: '技术参数、输出、连接和材质选项。' },
        { label: '检验记录', value: '批次级', note: '包装与出货放行前的最终检查。' },
        { label: '证书资料', value: '按需提供', note: '证书和合规材料可随询价要求匹配。' },
      ],
    },
    manufacturing: {
      heroImage: {
        src: '/images/hero/industrial-instrumentation.png',
        alt: '整洁的工业制造车间与有序生产设备',
      },
      metrics: [
        { value: '25k m2', label: '生产面积', description: '制造空间围绕装配、校准、包装和批量流转组织。' },
        { value: '85%', label: '自动化过程目标', description: '生产节点围绕重复一致性和数据记录设计。' },
        { value: 'ISO', label: '体系准备', description: '质量与环境管理资料可支持客户审核。' },
      ],
      sections: [
        {
          id: 'infrastructure',
          eyebrow: '制造基础设施',
          title: '面向稳定交付的工厂概览',
          body: '生产组织围绕稳定物流、受控装配、校准、包装和出货协同展开。',
          items: [
            { title: '核心设施', body: '制造场地支持传感器、阀门和 OEM 配件项目。', meta: '设施' },
            { title: '自动化节点', body: '数字记录和自动检查帮助重复订单保持一致性。', meta: '工业 4.0' },
            { title: '装配单元', body: '按压力、温度、液位和阀门产品建立对应工序区域。', meta: '装配' },
            { title: '包装流转', body: '标签、手册、证书和纸箱要求与订单同步确认。', meta: '出货' },
          ],
        },
        {
          id: 'calibration',
          eyebrow: '精密工序',
          title: '装配与校准路径',
          body: '制造能力与测量任务相连，使精度、信号输出、连接和材质选项保持可复核。',
          items: [
            { title: '传感器装配', body: '支持压力变送器、传感器、开关和相关仪表的受控装配。', meta: '传感器' },
            { title: '阀门配套', body: '支持压力等级、连接方式、材质、介质和尺寸需求。', meta: '阀门' },
            { title: 'OEM 批量支持', body: '重复订单可同步规划标签、包装、MOQ 和交付窗口。', meta: 'OEM' },
          ],
        },
      ],
      evidence: [
        { label: '生产流转', value: '来料到出货', note: '订单处理覆盖来料、装配、校准、包装和放行。' },
        { label: '校准', value: '按量程执行', note: '检查与压力、温度、输出和应用要求匹配。' },
        { label: '批量支持', value: 'OEM-ready', note: '标签、包装和长期供货细节随询价确认。' },
      ],
    },
  },
} as const satisfies Record<LocaleCode, Record<CapabilityPageKind, Omit<CapabilityPageViewModel, keyof StaticInfoPageViewModel | 'kind'>>>

export function getProductListStaticParams(
  locales: readonly LocaleCode[],
  source: ProductViewModelSource = defaultProductViewModelSource,
): ProductStaticParam[] {
  if (source.getStaticParams) {
    return [...source.getStaticParams(locales)]
  }

  return locales.flatMap((locale) =>
    source.getCatalog(locale).products.map((product) => {
      const seo = selectProductSeo(product, locale)

      return {
        locale,
        slug: seo.slug.canonicalPath.replace(/^\/products\//, '').split('/').filter(Boolean),
      }
    }),
  )
}

export function resolveProductListViewModel(
  locale: LocaleCode,
  slug: readonly string[] = [],
  options: ProductListViewModelOptions = {},
  source: ProductViewModelSource = defaultProductViewModelSource,
): ProductListPageViewModel | null {
  const index = source.getCatalog(locale)
  const rootCategory = resolveCatalogRootCategory(index) ?? industrialSensorCategoryTree.root
  const categorySlugPath = (slug.length ? slug.join('/') : rootCategory.slugPath) as SeoSlugPath
  const category = resolveCategoryBySlugPath(index, categorySlugPath)

  if (!category) {
    return null
  }

  const filters = normalizeProductListFilters(options)
  const filterPath = options.basePath?.startsWith('/') ? options.basePath : getProductListFilterPath(category)
  const requestedPage = normalizePageNumber(options.page)
  const pageSize = 48
  const query = {
    categoryId: category.id,
    categoryIds: filters.categoryIds,
    categoryMode: 'with-descendants',
    families: filters.families,
    measurementKinds: filters.measurementKinds,
    industryIds: getIndustryIdsFromSlugs(index, filters.industrySlugs),
    applicationIds: getApplicationIdsFromSlugs(index, filters.applicationSlugs),
    outputKinds: filters.outputKinds,
    accuracyValues: filters.accuracyValues,
    certifications: filters.certifications,
    rangeMinBar: filters.rangeMinBar,
    rangeMaxBar: filters.rangeMaxBar,
    search: filters.search,
    sort: 'category-sort',
    limit: pageSize,
  } as const
  const initialProductList = source.listProducts(locale, {
    ...query,
    offset: (requestedPage - 1) * pageSize,
  })
  const totalPages = Math.max(1, Math.ceil(initialProductList.pageInfo.total / pageSize))
  const currentPage = Math.min(requestedPage, totalPages)
  const productList = currentPage === requestedPage
    ? initialProductList
    : source.listProducts(locale, {
        ...query,
        offset: (currentPage - 1) * pageSize,
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
    categoryNavigation: getProductCategoryNavigation(locale, index, categoryPath),
    productList,
    filterGroups: getProductListFilterGroups(locale, productList, category, filters, filterPath, source),
    search: {
      label: locale === 'zh' ? '关键词' : 'Keyword',
      placeholder: locale === 'zh' ? '搜索行业、场景、型号或参数' : 'Search industry, scenario, model, or spec',
      submitLabel: locale === 'zh' ? '搜索' : 'Search',
      value: filters.search ?? '',
      actionPath: filterPath,
      clearHref: filterPath,
      hiddenInputs: getProductSearchHiddenInputs(filters),
    },
    countLabel: locale === 'zh' ? `${productList.pageInfo.total} 款产品` : `${productList.pageInfo.total} products`,
    pagination: {
      currentPage,
      totalPages,
      previousHref: currentPage > 1 ? buildProductListHref(filterPath, filters, currentPage - 1) : undefined,
      nextHref: currentPage < totalPages ? buildProductListHref(filterPath, filters, currentPage + 1) : undefined,
      pages: getVisiblePageNumbers(currentPage, totalPages).map((page) => ({
        number: page,
        href: buildProductListHref(filterPath, filters, page),
        current: page === currentPage,
      })),
    },
    labels: productListLabels[locale],
  }
}

export function resolveProductDetailViewModel(
  locale: LocaleCode,
  slug: readonly string[],
  source: ProductViewModelSource = defaultProductViewModelSource,
): { status: 'found'; data: ProductDetailViewModel } | { status: 'not-found' } {
  const result = resolveProductDetailPage(source.getCatalog(locale), {
    locale,
    pathname: `/products/${slug.join('/')}`,
  })

  if (result.status !== 'found') {
    return { status: 'not-found' }
  }

  return {
    status: 'found',
    data: toProductDetailViewModel(result.data, source),
  }
}

export function shouldRedirectProductViewModel(data: ProductDetailViewModel, requestedSlug: readonly string[]) {
  return `/products/${requestedSlug.join('/')}` !== data.route.path
}

function resolveCatalogRootCategory(index: ProductCatalogIndex) {
  for (const path of index.categoryPathById.values()) {
    if (path.length === 1) {
      return path[0]
    }
  }

  return undefined
}

function resolveCategoryBySlugPath(index: ProductCatalogIndex, slugPath: SeoSlugPath) {
  const exact = index.categoryBySlugPath.get(slugPath)

  if (exact) {
    return exact
  }

  const legacyPath = findStaticCategoryPathBySlugPath(industrialSensorCategoryTree.root, slugPath)


  if (legacyPath) {
    for (const legacyCategory of [...legacyPath].reverse()) {
      const currentCategory = index.categoryById.get(legacyCategory.id)

      if (currentCategory) {
        return currentCategory
      }
    }
  }

  return [...index.categoryBySlugPath.entries()].find(([currentSlugPath]) => currentSlugPath.endsWith(`/${slugPath}`))?.[1]
}

function findStaticCategoryPathBySlugPath(
  category: CategoryNode,
  slugPath: SeoSlugPath,
  ancestors: readonly CategoryNode[] = [],
): readonly CategoryNode[] | undefined {
  const path = [...ancestors, category]

  if (category.slugPath === slugPath) {
    return path
  }

  for (const child of category.children ?? []) {
    const match = findStaticCategoryPathBySlugPath(child, slugPath, path)

    if (match) {
      return match
    }
  }

  return undefined
}

export function getIndustryEntryPageViewModel(
  locale: LocaleCode,
  source: ProductViewModelSource = defaultProductViewModelSource,
  ecosystemContent: readonly EntryEcosystemContentInput[] = [],
): EntryPageViewModel {
  const productList = source.listProducts(locale, { limit: 200 })
  const entries = industries.map((industry) => toEntryCard(locale, productList, industry, `/industries/${industry.slug}`))

  return {
    locale,
    eyebrow: locale === 'zh' ? '行业入口' : 'Industry entry points',
    title: locale === 'zh' ? '按工业系统场景进入产品选型' : 'Enter product selection by industrial system',
    body: locale === 'zh'
      ? '围绕石油与天然气、水处理、工业自动化、能源系统、机械工程和化工过程产线组织测量需求、推荐产品和 RFQ 路径。'
      : 'Organized around oil and gas, water treatment, automation, energy, manufacturing, and chemical processing requirements, with product recommendations and RFQ paths.',
    primaryAction: { label: locale === 'zh' ? '浏览产品中心' : 'Open Product Center', href: '/products' },
    secondaryAction: { label: locale === 'zh' ? '提交 RFQ' : 'Send RFQ', href: '/contact' },
    productRailLabel: commonLabels[locale].recommendedProducts,
    entries,
    news: getIndustryNewsSection(locale),
    ecosystem: getIndustryEcosystemSection(locale, source, ecosystemContent),
    proof: getEntryProof(locale, productList),
    rfq: getRfqCopy(locale),
  }
}

export function getApplicationEntryPageViewModel(
  locale: LocaleCode,
  source: ProductViewModelSource = defaultProductViewModelSource,
): EntryPageViewModel {
  const productList = source.listProducts(locale, { limit: 200 })
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

export function getStaticInfoPageViewModel(
  locale: LocaleCode,
  kind: StaticInfoPageKind,
  source: ProductViewModelSource = defaultProductViewModelSource,
): StaticInfoPageViewModel {
  const copy = staticInfoPages[locale][kind] ?? staticInfoPages.en[kind]

  if (!copy) {
    throw new Error(`Static info page copy is missing for ${locale}/${kind}`)
  }

  return {
    locale,
    icon: copy.icon,
    eyebrow: copy.eyebrow,
    title: copy.title,
    body: copy.body,
    primaryAction: { label: copy.primary, href: '/products' },
    secondaryAction: { label: copy.secondary, href: '/contact' },
    quickLinks: getStaticInfoQuickLinks(locale, kind, source),
  }
}

export function getCapabilityPageViewModel(
  locale: LocaleCode,
  kind: CapabilityPageKind,
  source: ProductViewModelSource = defaultProductViewModelSource,
): CapabilityPageViewModel {
  return {
    ...getStaticInfoPageViewModel(locale, kind, source),
    kind,
    ...capabilityPageDetails[locale][kind],
  }
}

export function getResourceCollectionPageViewModel(
  locale: LocaleCode,
  kind: ResourceCollectionKind,
  source: ProductViewModelSource = defaultProductViewModelSource,
  content: readonly ResourceContentInput[] = [],
): ResourceCollectionViewModel {
  const copy = getResourceCollectionCopy(locale, kind)
  const contentEntries = content.map((entry) => toResourceEntryViewModel(kind, entry))
  const fallbackEntries = [
    ...getStaticResourceEntries(locale, kind),
    ...(kind === 'manuals' ? getManualResourceEntries(locale, source) : []),
  ]
  const entries = mergeResourceEntries(fallbackEntries, contentEntries)
  const visibleEntries = entries.filter((entry) => !entry.hiddenFromCollection)

  return {
    locale,
    kind,
    eyebrow: copy.eyebrow,
    title: copy.title,
    body: copy.body,
    emptyLabel: copy.emptyLabel,
    countLabel: formatResourceCountLabel(locale, kind, visibleEntries.length),
    entries,
  }
}

export function resolveResourceDetailPageViewModel(
  locale: LocaleCode,
  kind: ResourceCollectionKind,
  slug: readonly string[],
  source: ProductViewModelSource = defaultProductViewModelSource,
  content: readonly ResourceContentInput[] = [],
): ResourceDetailViewModel | null {
  const collection = getResourceCollectionPageViewModel(locale, kind, source, content)
  const requestedSlug = decodeURIComponent(slug.join('/'))
  const resolvedEntry = findResourceEntry(collection.entries, kind, requestedSlug)
  const entry = resolvedEntry?.entry

  if (!entry) {
    return null
  }

  const parentEntry = resolvedEntry.ancestors.at(-1)

  return {
    locale,
    kind,
    breadcrumb: [
      { label: commonLabels[locale].home, href: `/${locale}` },
      { label: locale === 'zh' ? '资料中心' : 'Resources', href: `/${locale}/resources` },
      { label: collection.title, href: `/${locale}/resources/${kind}` },
      ...resolvedEntry.ancestors.map((item) => ({ label: item.title, href: `/${locale}${item.href}` })),
    ],
    eyebrow: collection.eyebrow,
    title: entry.title,
    body: entry.description,
    coverImage: entry.coverImage,
    statusLabel: getResourceDetailStatusLabel(locale, kind),
    meta: entry.meta,
    contentBlocks: entry.contentBlocks ?? getResourceDetailContentBlocks(locale, kind, entry),
    childLinks: entry.childEntries?.map(toResourceNavigationLink),
    primaryAction: entry.downloadHref ? { label: entry.ctaLabel, href: entry.downloadHref } : undefined,
    relatedProducts: getResourceRelatedProducts(locale, entry, source),
    relatedIndustryIds: entry.relatedIndustryIds ?? [],
    backHref: parentEntry?.href ?? `/resources/${kind}`,
  }
}

function findResourceEntry(
  entries: readonly ResourceEntryViewModel[],
  kind: ResourceCollectionKind,
  requestedSlug: string,
  ancestors: readonly ResourceEntryViewModel[] = [],
): { readonly entry: ResourceEntryViewModel; readonly ancestors: readonly ResourceEntryViewModel[] } | undefined {
  for (const entry of entries) {
    if (getResourceEntrySlug(kind, entry) === requestedSlug) {
      return { entry, ancestors }
    }
  }

  for (const entry of entries) {
    const childMatch = findResourceEntry(entry.childEntries ?? [], kind, requestedSlug, [...ancestors, entry])
    if (childMatch) {
      return childMatch
    }
  }

  return undefined
}

function getResourceEntrySlug(kind: ResourceCollectionKind, entry: ResourceEntryViewModel): string {
  return entry.href.replace(`/resources/${kind}/`, '')
}

function toResourceNavigationLink(entry: ResourceEntryViewModel): ResourceNavigationLinkViewModel {
  return {
    title: entry.title,
    description: entry.description,
    href: entry.href,
    meta: entry.meta,
    kindLabel: entry.kindLabel,
    ctaLabel: entry.ctaLabel,
  }
}

function getResourceCollectionCopy(locale: LocaleCode, kind: ResourceCollectionKind) {
  const copy = {
    zh: {
      blog: {
        eyebrow: '博客',
        title: '行业观察与选型文章',
        body: '汇集后续发布的技术文章、选型指南和行业观察，帮助采购与工程团队快速理解应用边界。',
        emptyLabel: '暂无已发布博客文章。',
      },
      cases: {
        eyebrow: '案例',
        title: '应用案例与项目故事',
        body: '承接后续发布的公开案例，关联产品、行业和应用场景，但不拥有产品事实。',
        emptyLabel: '暂无已发布案例。',
      },
      manuals: {
        eyebrow: '产品手册/下载',
        title: '产品手册与数据手册',
        body: '集中展示产品数据手册、使用资料和后续上传的下载内容，方便选型、采购和维护查阅。',
        emptyLabel: '暂无可展示的产品手册。',
      },
    },
    en: {
      blog: {
        eyebrow: 'Blog',
        title: 'Industry notes and selection articles',
        body: 'A focused library for future articles, selection guides, and industry notes that help procurement and engineering teams understand application boundaries.',
        emptyLabel: 'No published blog posts yet.',
      },
      cases: {
        eyebrow: 'Cases',
        title: 'Application cases and project stories',
        body: 'A simple entry for future public case studies connected to products, industries, and application contexts.',
        emptyLabel: 'No published case studies yet.',
      },
      manuals: {
        eyebrow: 'Product manuals / downloads',
        title: 'Manuals and datasheets',
        body: 'A consolidated area for datasheets, manuals, and future downloadable product material for selection, procurement, and maintenance workflows.',
        emptyLabel: 'No product manuals available yet.',
      },
    },
  } as const satisfies Record<LocaleCode, Record<ResourceCollectionKind, { readonly eyebrow: string; readonly title: string; readonly body: string; readonly emptyLabel: string }>>

  return copy[locale][kind]
}

function toResourceEntryViewModel(kind: ResourceCollectionKind, entry: ResourceContentInput, parentRouteSegment?: string): ResourceEntryViewModel {
  const routeSegment = entry.routeSegment ?? entry.key
  const fullRouteSegment = parentRouteSegment ? `${parentRouteSegment}/${routeSegment}` : routeSegment
  const ctaLabel = entry.ctaLabel ?? getFallbackResourceCtaLabel(kind, entry)

  return {
    key: entry.key,
    title: entry.title,
    description: entry.summary,
    href: `/resources/${kind}/${fullRouteSegment}`,
    meta: entry.meta,
    kindLabel: entry.kindLabel,
    contextLabels: entry.contextLabels ?? [],
    ctaLabel,
    downloadHref: entry.downloadHref,
    coverImage: entry.coverImage,
    body: entry.body,
    contentBlocks: entry.contentBlocks,
    childEntries: entry.childEntries?.map((child) => toResourceEntryViewModel(kind, child, fullRouteSegment)),
    hiddenFromCollection: entry.hiddenFromCollection,
    relatedProductIds: entry.relatedProductIds,
    relatedIndustryIds: entry.relatedIndustryIds,
  }
}

function getFallbackResourceCtaLabel(kind: ResourceCollectionKind, entry: ResourceContentInput) {
  if (kind === 'manuals') {
    return /[\u4e00-\u9fff]/.test(entry.title) ? '打开手册' : 'Open manual'
  }

  if (kind === 'cases') {
    return /[\u4e00-\u9fff]/.test(entry.title) ? '查看案例' : 'View case'
  }

  return /[\u4e00-\u9fff]/.test(entry.title) ? '阅读文章' : 'Read more'
}

function dedupeResourceEntries(entries: readonly ResourceEntryViewModel[]): readonly ResourceEntryViewModel[] {
  const seen = new Set<string>()
  const result: ResourceEntryViewModel[] = []

  for (const entry of entries) {
    const dedupeKey = entry.href
    if (seen.has(dedupeKey)) {
      continue
    }

    seen.add(dedupeKey)
    result.push(entry)
  }

  return result
}

function mergeResourceEntries(
  fallbackEntries: readonly ResourceEntryViewModel[],
  contentEntries: readonly ResourceEntryViewModel[],
): readonly ResourceEntryViewModel[] {
  return contentEntries.reduce(
    (entries, incoming) => mergeResourceEntry(entries, incoming).entries,
    fallbackEntries,
  )
}

function mergeResourceEntry(
  entries: readonly ResourceEntryViewModel[],
  incoming: ResourceEntryViewModel,
): { readonly entries: readonly ResourceEntryViewModel[]; readonly merged: boolean } {
  const mergedEntries: ResourceEntryViewModel[] = []
  let merged = false

  for (const entry of entries) {
    if (entry.href === incoming.href) {
      mergedEntries.push({
        ...entry,
        ...incoming,
        childEntries: incoming.childEntries ?? entry.childEntries,
      })
      merged = true
      continue
    }

    const childResult = mergeResourceEntry(entry.childEntries ?? [], incoming)
    if (childResult.merged) {
      mergedEntries.push({ ...entry, childEntries: childResult.entries })
      merged = true
      continue
    }

    if (incoming.href.startsWith(`${entry.href}/`)) {
      mergedEntries.push({ ...entry, childEntries: dedupeResourceEntries([...(entry.childEntries ?? []), incoming]) })
      merged = true
      continue
    }

    mergedEntries.push(entry)
  }

  return merged
    ? { entries: mergedEntries, merged: true }
    : { entries: [...entries, incoming], merged: false }
}

function getManualResourceEntries(
  locale: LocaleCode,
  source: ProductViewModelSource = defaultProductViewModelSource,
): readonly ResourceEntryViewModel[] {
  const index = source.getCatalog(locale)

  return index.products.flatMap((product) => {
    const item = index.listItemById.get(product.identity.id)

    if (!item) {
      return []
    }

    return (product.documents ?? []).map((document) => ({
      key: `${product.identity.id}:${document.id}`,
      title: localizeDatasheetTitle(document.title, product.identity.model, locale),
      description: item.summary,
      href: `/resources/manuals/${normalizeFilterSlug(`${product.identity.model}-${document.kind}`)}`,
      meta: document.revision ? `${document.kind} / ${document.revision}` : document.kind,
      kindLabel: localizeSourceType(document.kind, locale),
      contextLabels: [item.model, item.familyLabel, item.categoryLabel],
      ctaLabel: commonLabels[locale].datasheet,
      downloadHref: document.href,
    }))
  })
}

function getStaticResourceEntries(locale: LocaleCode, kind: ResourceCollectionKind): readonly ResourceEntryViewModel[] {
  const zh = locale === 'zh'
  const commonCover = '/stitch/heiyu-trans-industrial-design-system/03-product-detail-precision-pressure-sensor-series/assets/asset-003.jpg'
  const labCover = '/stitch/heiyu-trans-industrial-design-system/05-oem-solutions-enhanced-hero-background/assets/asset-003.jpg'
  const caseCover = '/stitch/heiyu-trans-industrial-design-system/04-water-pump-systems-updated-hero-image/assets/asset-003.png'
  const oemCover = '/stitch/heiyu-trans-industrial-design-system/05-oem-solutions-enhanced-hero-background/assets/asset-003.jpg'

  const entries: Record<ResourceCollectionKind, readonly ResourceContentInput[]> = {
    manuals: [
      {
        key: 'resource_product_manuals',
        routeSegment: 'product-manuals',
        title: zh ? '产品手册' : 'Product Manuals',
        summary: zh
          ? '集中查看压力传感器、变送器、液位产品和阀门相关数据手册，用于选型、采购和维护归档。'
          : 'A consolidated entry for pressure sensor, transmitter, level product, and valve datasheets used in selection, procurement, and maintenance records.',
        meta: zh ? '产品资料 / 数据手册' : 'Product material / Datasheets',
        kindLabel: zh ? '产品手册' : 'Product Manuals',
        contextLabels: zh ? ['数据手册', '产品选型', '采购资料'] : ['Datasheets', 'Product selection', 'Procurement material'],
        ctaLabel: zh ? '查看产品手册' : 'View Product Manuals',
        coverImage: { href: commonCover, alt: zh ? '产品手册与技术资料' : 'Product manuals and technical documents' },
        contentBlocks: zh
          ? [
              { title: '资料范围', body: '该入口汇总现有产品数据手册，并与产品详情页的下载入口保持一致。后续新增 PDF 会继续出现在产品手册列表中。', items: ['压力传感器数据手册', '液位与温度相关资料', '工业阀门资料'] },
              { title: '使用方式', body: '用于确认型号、量程、输出信号、连接方式、材质、认证和采购沟通信息。' },
            ]
          : [
              { title: 'Material scope', body: 'This entry consolidates available product datasheets and stays aligned with download actions on product detail pages.', items: ['Pressure sensor datasheets', 'Level and temperature materials', 'Industrial valve documents'] },
              { title: 'How to use it', body: 'Use these documents to review models, range, output signal, connection, material, certification, and procurement information.' },
            ],
        relatedProductIds: ['prd_yf_p10', 'prd_yf_p10c', 'prd_yf_p11'],
      },
      {
        key: 'resource_company_materials',
        routeSegment: 'company-materials',
        title: zh ? '公司资料' : 'Company Materials',
        summary: zh
          ? '公司资料集中承接质量与认证、制造能力、工程支持和长期供货信息。'
          : 'Company materials collect quality and certification, manufacturing capability, engineering support, and long-term supply information.',
        meta: zh ? '公司资料 / 质量与认证' : 'Company / Quality & certification',
        kindLabel: zh ? '公司资料' : 'Company Materials',
        contextLabels: zh ? ['质量与认证', '制造能力', '工程支持'] : ['Quality & certification', 'Manufacturing capability', 'Engineering support'],
        ctaLabel: zh ? '查看公司资料' : 'View Company Materials',
        coverImage: { href: labCover, alt: zh ? '质量与制造能力资料' : 'Quality and manufacturing capability material' },
        contentBlocks: zh
          ? [
              { title: '资料入口', body: '公司资料页作为概括入口，后续上传的宣传册、质量体系文件和认证资料会分别归档到下方两个详情页。', items: ['公司宣传册', '质量认证'] },
              { title: '公司能力', body: '覆盖制造基础设施、工程支持、OEM 项目协作、长期供货和出货资料准备。' },
            ]
          : [
              { title: 'Material entries', body: 'This company materials page is an overview hub. Future brochure, quality system, and certification files can be archived in the two detail pages below.', items: ['Company brochure', 'Quality certification'] },
              { title: 'Company capability', body: 'Covers manufacturing infrastructure, engineering support, OEM cooperation, long-term supply, and shipment document preparation.' },
            ],
        childEntries: [
          {
            key: 'resource_company_brochure',
            routeSegment: 'company-brochure',
            title: zh ? '公司宣传册' : 'Company Brochure',
            summary: zh
              ? '用于承接公司介绍、制造能力、工程支持、OEM 协作和长期供货能力等宣传资料。'
              : 'A detail page for company profile, manufacturing capability, engineering support, OEM cooperation, and long-term supply material.',
            meta: zh ? '公司资料 / 宣传册' : 'Company / Brochure',
            kindLabel: zh ? '公司宣传册' : 'Company Brochure',
            contextLabels: zh ? ['公司介绍', '制造能力', '工程支持'] : ['Company profile', 'Manufacturing capability', 'Engineering support'],
            ctaLabel: zh ? '打开公司宣传册' : 'Open Brochure',
            coverImage: { href: oemCover, alt: zh ? '公司宣传册资料页' : 'Company brochure material page' },
            contentBlocks: zh
              ? [
                  { title: '页面用途', body: '后续可在这里上传公司宣传册、工厂能力介绍、工程支持说明和 OEM 配套资料。', items: ['公司简介', '制造与交付能力', '工程支持范围', 'OEM 协作流程'] },
                  { title: '待上传资料', body: '当前先保留稳定页面与入口按钮。正式资料上传后，可替换本说明并加入下载链接、图片和版本信息。' },
                ]
              : [
                  { title: 'Page purpose', body: 'Future uploads can include the company brochure, factory capability profile, engineering support notes, and OEM cooperation material.', items: ['Company profile', 'Manufacturing and delivery capability', 'Engineering support scope', 'OEM cooperation flow'] },
                  { title: 'Pending upload', body: 'This stable page and entry button are reserved first. Once real material is uploaded, replace this note with the download link, images, and version details.' },
                ],
            relatedIndustryIds: ['ind_oem'],
          },
          {
            key: 'resource_quality_certification',
            routeSegment: 'quality-certification',
            title: zh ? '质量认证' : 'Quality Certification',
            summary: zh
              ? '用于承接质量管理体系、认证文件、测试校准、批量一致性和可追溯资料。'
              : 'A detail page for quality management system, certification files, testing and calibration, batch consistency, and traceability material.',
            meta: zh ? '公司资料 / 质量认证' : 'Company / Quality certification',
            kindLabel: zh ? '质量认证' : 'Quality Certification',
            contextLabels: zh ? ['质量体系', '测试校准', '批量一致性'] : ['Quality system', 'Testing and calibration', 'Batch consistency'],
            ctaLabel: zh ? '打开质量认证' : 'Open Certification',
            coverImage: { href: labCover, alt: zh ? '质量认证资料页' : 'Quality certification material page' },
            contentBlocks: zh
              ? [
                  { title: '页面用途', body: '后续可在这里上传质量体系说明、认证证书、测试记录、校准控制和批量一致性资料。', items: ['质量管理体系', '认证证书', '测试与校准', '追溯与批量一致性'] },
                  { title: '待上传资料', body: '当前先保留稳定页面与入口按钮。正式资料上传后，可补充证书编号、有效期、适用产品范围和下载入口。' },
                ]
              : [
                  { title: 'Page purpose', body: 'Future uploads can include quality system notes, certificates, test records, calibration control, and batch consistency material.', items: ['Quality management system', 'Certificates', 'Testing and calibration', 'Traceability and batch consistency'] },
                  { title: 'Pending upload', body: 'This stable page and entry button are reserved first. Once real material is uploaded, add certificate numbers, validity dates, applicable product scope, and download actions.' },
                ],
            relatedIndustryIds: ['ind_oem'],
          },
        ],
        relatedIndustryIds: ['ind_oem'],
      },
    ],
    cases: [
      {
        key: 'resource_iot_application_cases',
        routeSegment: 'iot-application-cases',
        title: zh ? '物联网应用案例' : 'IoT Application Cases',
        summary: zh
          ? '用于承接后续上传的物联网应用案例，展示传感器、边缘采集、行业场景和工程选型之间的关系。'
          : 'An entry for upcoming IoT application cases that connect sensors, edge data collection, application context, and engineering selection paths.',
        meta: zh ? '物联网案例 / 后续上传' : 'IoT cases / Upcoming content',
        kindLabel: zh ? '应用案例' : 'Application Cases',
        contextLabels: zh ? ['物联网连接', '边缘采集', '工程选型'] : ['IoT connectivity', 'Edge collection', 'Engineering selection'],
        ctaLabel: zh ? '查看物联网案例' : 'View IoT Case',
        coverImage: { href: caseCover, alt: zh ? '物联网应用案例场景' : 'IoT application case scene' },
        contentBlocks: zh
          ? [
              { title: '案例定位', body: '该页面用于后续放置真实物联网应用案例。当前先保留稳定路由，并说明案例将关联传感器、行业场景、边缘采集和资料交付。' },
              { title: '后续内容', body: '上传真实案例后，可补充行业背景、技术挑战、数据采集方式、产品组合、实施结果和相关资料。', items: ['行业背景', '技术挑战', '边缘采集', '产品组合', '实施结果'] },
            ]
          : [
              { title: 'Case position', body: 'This page reserves a stable route for future IoT application cases and explains how cases connect sensors, industry context, edge collection, and document delivery.' },
              { title: 'Future content', body: 'Real cases can add industry context, technical challenge, data collection method, product pairing, implementation result, and related material.', items: ['Industry context', 'Technical challenge', 'Edge collection', 'Product pairing', 'Outcome'] },
            ],
        relatedIndustryIds: ['ind_water', 'ind_chemical_processing'],
      },
      {
        key: 'resource_oem_cases',
        routeSegment: 'oem-cases',
        title: zh ? 'OEM 案例' : 'OEM Cases',
        summary: zh
          ? '用于承接 OEM 定制项目案例，说明从需求评审、样品验证到批量交付的工程路径。'
          : 'An entry for OEM custom project cases, covering requirement review, prototype validation, and repeatable supply.',
        meta: zh ? 'OEM / 定制工程' : 'OEM / Custom engineering',
        kindLabel: zh ? 'OEM 案例' : 'OEM Cases',
        contextLabels: zh ? ['定制传感器', '样品验证', '批量供货'] : ['Custom sensors', 'Prototype validation', 'Repeatable supply'],
        ctaLabel: zh ? '查看 OEM 案例' : 'View OEM Cases',
        coverImage: { href: oemCover, alt: zh ? 'OEM 定制传感器案例' : 'OEM custom sensor case' },
        contentBlocks: zh
          ? [
              { title: '项目路径', body: 'OEM 案例围绕信号输出、接口、材料、标签包装、MOQ 和交付窗口组织。' },
              { title: '后续替换内容', body: '真实案例上传后，可替换项目图片、客户需求、测试结果、量产路径和关联产品。', items: ['需求评审', '样品验证', '测试记录', '批量交付'] },
            ]
          : [
              { title: 'Project path', body: 'OEM cases are organized around output signal, connection, material, labeling, MOQ, and delivery window.' },
              { title: 'Future replacement content', body: 'Real case uploads can replace project images, requirements, test results, production path, and related products.', items: ['Requirement review', 'Prototype validation', 'Testing records', 'Repeatable supply'] },
            ],
        relatedProductIds: ['prd_yf_p10c', 'prd_yf_p11'],
        relatedIndustryIds: ['ind_oem'],
      },
    ],
    blog: [
      {
        key: 'resource_technical_knowledge',
        routeSegment: 'technical-knowledge',
        title: zh ? '技术知识' : 'Technical Knowledge',
        summary: zh
          ? '整理压力、液位、温度、输出信号、连接方式和防护等级相关知识，帮助工程团队快速判断选型边界。'
          : 'Technical knowledge for pressure, level, temperature, output signal, connection, and ingress protection selection boundaries.',
        meta: zh ? '技术知识 / 选型说明' : 'Technical knowledge / Selection notes',
        kindLabel: zh ? '技术知识' : 'Technical Knowledge',
        contextLabels: zh ? ['压力测量', '输出信号', '过程连接'] : ['Pressure measurement', 'Output signal', 'Process connection'],
        ctaLabel: zh ? '阅读技术知识' : 'Read Technical Knowledge',
        coverImage: { href: commonCover, alt: zh ? '技术知识与工程文档' : 'Technical knowledge and engineering documents' },
        contentBlocks: zh
          ? [
              { title: '知识范围', body: '覆盖常见测量任务、信号输出、接液材质、防护等级和资料确认方法。', items: ['量程确认', '输出信号', '材质与介质', '防护等级'] },
              { title: '使用建议', body: '用于在进入 RFQ 前统一工程、采购和维护团队对参数的理解。' },
            ]
          : [
              { title: 'Knowledge scope', body: 'Covers common measurement tasks, signal output, wetted material, ingress protection, and document review methods.', items: ['Range review', 'Output signal', 'Material and media', 'Ingress protection'] },
              { title: 'Suggested use', body: 'Use it to align engineering, procurement, and maintenance teams before RFQ.' },
            ],
        relatedProductIds: ['prd_yf_p10', 'prd_yf_p10c'],
      },
      {
        key: 'resource_engineering_blog',
        routeSegment: 'engineering-blog',
        title: zh ? '博客' : 'Blog',
        summary: zh
          ? '博客用于发布行业观察、选型方法、工程应用说明和资料中心更新。'
          : 'The blog publishes industry notes, selection methods, engineering application explainers, and resource center updates.',
        meta: zh ? '博客 / 行业观察' : 'Blog / Industry notes',
        kindLabel: zh ? '博客' : 'Blog',
        contextLabels: zh ? ['行业观察', '选型方法', '工程应用'] : ['Industry notes', 'Selection methods', 'Engineering applications'],
        ctaLabel: zh ? '阅读博客' : 'Read Blog',
        coverImage: { href: labCover, alt: zh ? '工程博客与行业观察' : 'Engineering blog and industry notes' },
        contentBlocks: zh
          ? [
              { title: '内容方向', body: '后续博客将围绕行业应用、产品选型、质量与制造、OEM 项目经验和资料中心更新展开。' },
              { title: '后续发布', body: '真实文章发布后，可在博客列表和该入口中继续扩展。', items: ['行业应用', '选型方法', '质量制造', 'OEM 项目'] },
            ]
          : [
              { title: 'Content direction', body: 'Future blog posts will cover industry applications, product selection, quality and manufacturing, OEM project experience, and resource updates.' },
              { title: 'Future publishing', body: 'Real articles can expand this entry and the blog list after publication.', items: ['Industry applications', 'Selection methods', 'Quality manufacturing', 'OEM projects'] },
            ],
        relatedIndustryIds: ['ind_oem', 'ind_water'],
      },
    ],
  }

  return entries[kind].map((entry) => toResourceEntryViewModel(kind, entry))
}

function formatResourceCountLabel(locale: LocaleCode, kind: ResourceCollectionKind, count: number) {
  if (locale === 'zh') {
    const unit = kind === 'manuals' ? '份资料' : '篇内容'
    return `${count}${unit}`
  }

  const unit = kind === 'manuals' ? 'manual' : 'entry'
  return `${count} ${unit}${count === 1 ? '' : 's'}`
}

function getResourceDetailStatusLabel(locale: LocaleCode, kind: ResourceCollectionKind) {
  const labels: Record<LocaleCode, Record<ResourceCollectionKind, string>> = {
    zh: {
      blog: '已发布文章',
      cases: '已发布案例',
      manuals: '产品资料',
    },
    en: {
      blog: 'Published article',
      cases: 'Published case',
      manuals: 'Product material',
    },
  }

  return labels[locale][kind]
}

function getResourceDetailContentBlocks(locale: LocaleCode, kind: ResourceCollectionKind, entry: ResourceEntryViewModel): readonly ResourceContentBlockViewModel[] {
  if (kind === 'manuals') {
    return locale === 'zh'
      ? [
          { title: '资料说明', body: entry.description, items: entry.contextLabels },
          { title: '使用方式', body: '用于产品选型、规格核对、采购沟通和维护资料归档。下载文件以资料中心提供的入口为准。' },
        ]
      : [
          { title: 'Material overview', body: entry.description, items: entry.contextLabels },
          { title: 'How to use it', body: 'Use this material for product selection, specification review, procurement discussion, and maintenance records. The linked file is the source for the download.' },
        ]
  }

  return locale === 'zh'
    ? [{ title: entry.kindLabel, body: entry.description, items: entry.contextLabels }]
    : [{ title: entry.kindLabel, body: entry.description, items: entry.contextLabels }]
}

function getResourceRelatedProducts(
  locale: LocaleCode,
  entry: ResourceEntryViewModel,
  source: ProductViewModelSource = defaultProductViewModelSource,
) {
  const catalog = source.getCatalog(locale)
  const ids = entry.relatedProductIds?.length ? entry.relatedProductIds : [entry.key.split(':')[0] as ProductRecord['id']]

  return ids.map((productId) => catalog.listItemById.get(productId as ProductRecord['id'])).filter(isProductListItem)
}

function buildFamilyDetailSpecGroup(product: ProductRecord, locale: LocaleCode): DetailSpecGroupViewModel | null {
  if (product.valveProfile) {
    return {
      title: localizeSpecGroupTitle('Valve profile', locale),
      values: [
        { label: localizeSpecLabel('pressureRating', locale), value: product.valveProfile.pressureRating },
        { label: localizeSpecLabel('connection', locale), value: localizeTechnicalValue(product.valveProfile.connection, locale) },
        { label: localizeSpecLabel('material', locale), value: localizeTechnicalValue(product.valveProfile.material, locale) },
        { label: localizeSpecLabel('mode', locale), value: localizeTechnicalValue(product.valveProfile.mode, locale) },
        { label: localizeSpecLabel('media', locale), value: localizeTechnicalValue(product.valveProfile.compatibleMedia.join(' / '), locale) },
        { label: localizeSpecLabel('size', locale), value: localizeTechnicalValue(product.valveProfile.size, locale) },
      ],
    }
  }

  if (product.sensorProfile) {
    const values = [
      { label: localizeSpecLabel('measurement', locale), value: product.sensorProfile.measurements.map((measurement) => measurement.range.display).join(' / ') },
      { label: localizeSpecLabel('output', locale), value: product.sensorProfile.outputs.map((output) => output.value).join(' / ') },
      product.sensorProfile.connections ? { label: localizeSpecLabel('Process connection', locale), value: localizeTechnicalValue(product.sensorProfile.connections.process.value, locale) } : null,
      product.sensorProfile.connections ? { label: localizeSpecLabel('Electrical connection', locale), value: localizeTechnicalValue(product.sensorProfile.connections.electrical.value, locale) } : null,
      { label: localizeSpecLabel('media', locale), value: localizeTechnicalValue(product.sensorProfile.environmentalLimits?.compatibleMedia?.join(' / ') ?? product.environmentalLimits.compatibleMedia?.join(' / ') ?? '-', locale) },
    ].filter((value): value is { readonly label: string; readonly value: string } => Boolean(value?.value))

    return values.length ? { title: localizeSpecGroupTitle('Sensor profile', locale), values } : null
  }

  return null
}

function toProductDetailViewModel(
  data: ProductDetailPageData,
  source: ProductViewModelSource = defaultProductViewModelSource,
): ProductDetailViewModel {
  const locale = data.locale
  const labels = commonLabels[locale]
  const product = data.product
  const documents = product.documents ?? []
  const primaryDocument = documents.find((document) => document.kind === 'datasheet') ?? documents[0]
  const assets = product.assets ?? []
  const primaryAsset = assets.find((asset) => asset.kind === 'primary-image') ?? assets[0]
  const relatedProducts = filterProductCatalog(source.getCatalog(locale), {
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
      badges: [product.identity.brand, product.identity.sku, data.listItem.familyLabel],
    },
    media: {
      title: labels.media,
      primaryImage: primaryAsset
        ? {
            href: primaryAsset.href,
            alt: localizeProductAssetAlt(primaryAsset.alt, data.seo.h1, locale),
          }
        : undefined,
      galleryImages: assets
        .filter((asset) => asset.id !== primaryAsset?.id)
        .map((asset) => ({
          href: asset.href,
          alt: localizeProductAssetAlt(asset.alt, data.seo.h1, locale),
          kind: asset.kind,
        })),
    },
    actions: {
      quoteLabel: labels.quote,
      datasheetLabel: labels.datasheet,
      datasheetHref: primaryDocument?.href,
      documents: documents.map((document) => ({
        title: localizeDatasheetTitle(document.title, product.identity.model, locale),
        href: document.href,
        kind: document.kind,
        revision: document.revision,
        contentLocale: document.contentLocale,
      })),
    },
    overviewSpecs: data.listItem.keySpecs.map((spec) => ({
      label: localizeSpecLabel(spec.label, locale),
      value: localizeTechnicalValue(spec.value, locale),
    })),
    technicalParameters: {
      title: labels.specs,
      groups: [
        buildFamilyDetailSpecGroup(product, locale),
        ...product.specificationGroups.map((group) => ({
          title: localizeSpecGroupTitle(group.label, locale),
          values: group.values.map((value) => ({ label: localizeSpecLabel(value.label, locale), value: localizeTechnicalValue(value.display, locale) })),
        })),
      ].filter((group): group is DetailSpecGroupViewModel => Boolean(group)),
    },
    applications: {
      title: labels.applications,
      items: product.content.applications.map((application) => localizeText(application, locale)).filter(isString),
    },
    compatibility: {
      title: labels.compatibility,
      groups: [
        { title: labels.media, items: localizeTechnicalValues(product.environmentalLimits.compatibleMedia ?? [], locale) },
        { title: labels.materials, items: localizeTechnicalValues(product.environmentalLimits.wettedMaterials, locale) },
        { title: labels.certifications, items: product.certifications ?? [] },
        { title: labels.connections, items: localizeTechnicalValues(product.connections ? [product.connections.process.value, product.connections.electrical.value] : product.valveProfile ? [product.valveProfile.connection, product.valveProfile.mode] : [], locale) },
      ].filter((group) => group.items.length > 0),
    },
    variants: {
      title: labels.variants,
      items: product.variants.map((variant) => ({
        code: variant.orderCode,
        availabilityLabel: data.listItem.availabilityLabel,
        options: variant.optionValues.map((option) => `${localizeSpecLabel(option.label, locale)}: ${localizeTechnicalValue(option.value, locale)}`),
      })),
    },
    commercial: {
      title: labels.commercial,
      groups: [{
        title: labels.terms,
        items: [
          product.commercialTerms?.minimumOrderQuantity ? `MOQ ${product.commercialTerms.minimumOrderQuantity}` : null,
          localizeLeadTime(product.commercialTerms?.standardLeadTime, locale),
          localizeWarranty(product.commercialTerms?.warranty, locale),
          product.commercialTerms?.oemCustomizable ? labels.oemCustomization : null,
          product.commercialTerms?.privateLabelAvailable ? labels.privateLabel : null,
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
          facts: data.geoAi.factTable.map((fact) => ({ label: localizeGeoFactLabel(fact.label, locale), value: localizeTechnicalValue(fact.value, locale) })),
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

function localizeProductAssetAlt(
  value: string | undefined,
  fallback: string,
  locale: LocaleCode,
): string {
  const alt = value?.trim()

  if (!alt) {
    return fallback
  }

  if (locale === 'zh') {
    return containsCjkText(alt) ? alt : fallback
  }

  return containsCjkText(alt) ? fallback : alt
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

function getProductCategoryNavigation(
  locale: LocaleCode,
  index: ProductCatalogIndex,
  categoryPath: readonly CategoryNode[],
): ProductCatalogNavigationViewModel {
  const businessGroups = buildBusinessProductCategoryGroups(locale, index.categoryTree, index, categoryPath)

  return {
    title: locale === 'zh' ? '产品分类' : 'Product categories',
    groups: businessGroups.map((group) => ({
      id: group.id,
      title: group.label,
      href: group.href,
      active: group.active,
      items: group.categories.map((category) => ({
        id: category.id,
        title: getBusinessProductCategoryLabel(category, locale),
        href: category.canonicalPath,
      })),
    })),
  }
}

function getPrimaryCategoryLinks(
  locale: LocaleCode,
  source: ProductViewModelSource = defaultProductViewModelSource,
) {
  const index = source.getCatalog(locale)
  const rootCategory = resolveCatalogRootCategory(index) ?? industrialSensorCategoryTree.root
  const primaryCategories = getVisibleProductCategoryChildren(rootCategory, index)

  return [...primaryCategories].map((category) => ({
    label: localizeText(category.name, locale),
    description: localizeText(category.description, locale),
    href: index.categoryById.get(category.id)?.canonicalPath ?? category.canonicalPath,
  }))
}

function getIndustryNewsSection(locale: LocaleCode): EntryNewsSectionViewModel {
  return {
    eyebrow: locale === 'zh' ? '行业资讯' : 'Industry news',
    title: locale === 'zh' ? '承接行业内容与选型文章' : 'Editorial entry for industry content',
    body: locale === 'zh'
      ? '行业页预留资讯板块，用于承接后续博客、案例和应用说明，帮助工程与采购团队理解典型工况。'
      : 'Industry pages reserve an editorial section for later blogs, case studies, and application notes that help engineering and procurement teams understand typical operating conditions.',
    emptyLabel: locale === 'zh' ? '等待运营发布行业资讯内容。' : 'Waiting for published industry content.',
    entries: [],
  }
}

function getIndustryEcosystemSection(
  locale: LocaleCode,
  source: ProductViewModelSource = defaultProductViewModelSource,
  content: readonly EntryEcosystemContentInput[] = [],
): EntryEcosystemSectionViewModel {
  const catalog = source.getCatalog(locale)
  return {
    eyebrow: locale === 'zh' ? '生态搭配' : 'Ecosystem pairing',
    title: locale === 'zh' ? '人工整理的传感器 + 阀门推荐组合' : 'Curated sensor + valve recommendation sets',
    body: locale === 'zh'
      ? '展示人工整理的行业、应用场景、锚点产品、推荐传感器、推荐阀门和搭配理由。'
      : 'Displays curated industry, application, anchor product, recommended sensor, recommended valve, and rationale pairings.',
    emptyLabel: locale === 'zh' ? '暂无已发布生态搭配。等待运营发布人工推荐组合。' : 'No published ecosystem pairings yet. Waiting for curated operations content.',
    quoteLabel: commonLabels[locale].quote,
    items: content.map((item) => toEcosystemItemViewModel(item, catalog)),
  }
}

function toEcosystemItemViewModel(input: EntryEcosystemContentInput, catalog: ProductCatalogIndex): EntryEcosystemSectionViewModel['items'][number] {
  const anchorProduct = input.anchorProductId ? catalog.listItemById.get(input.anchorProductId) : undefined
  const recommendedProducts = input.recommendedProductIds.map((productId) => catalog.listItemById.get(productId)).filter(isProductListItem)
  const sensorProducts = recommendedProducts.filter((product) => product.family === 'sensor')
  const valveProducts = recommendedProducts.filter((product) => product.family === 'valve')

  return {
    id: input.id,
    title: input.title,
    industryLabel: input.industryLabel ?? input.industryId ?? 'Industry',
    scenario: input.scenario,
    anchorProduct,
    recommendedProducts,
    sensorProducts,
    valveProducts,
    rationale: input.rationale,
  }
}

function getStaticInfoQuickLinks(
  locale: LocaleCode,
  kind: StaticInfoPageKind,
  source: ProductViewModelSource = defaultProductViewModelSource,
) {
  if (kind === 'resources') {
    return [
      { label: locale === 'zh' ? '博客' : 'Blog', description: locale === 'zh' ? '行业观察、选型方法和工程应用说明。' : 'Industry notes, selection methods, and engineering application articles.', href: '/resources/blog' },
      { label: locale === 'zh' ? '案例' : 'Case studies', description: locale === 'zh' ? '项目场景、应用背景和产品组合入口。' : 'Project contexts, application background, and product pairing entries.', href: '/resources/cases' },
      { label: locale === 'zh' ? '产品手册/下载' : 'Product manuals / downloads', description: locale === 'zh' ? '数据手册、产品手册和证书下载入口。' : 'Datasheets, manuals, and certificate download entry points.', href: '/resources/manuals' },
    ]
  }

  if (kind === 'company') {
    return [
      { label: locale === 'zh' ? '质量能力' : 'Quality capability', description: locale === 'zh' ? '围绕认证、测试、追溯和批量一致性建立采购信任。' : 'Certification, testing, traceability, and repeatable batch consistency for procurement confidence.', href: '/resources/manuals/company-materials/quality-certification' },
      { label: locale === 'zh' ? '制造能力' : 'Manufacturing capability', description: locale === 'zh' ? '支持装配、校准、过程记录和 OEM 项目沟通。' : 'Assembly, calibration, process records, and OEM project communication.', href: '/company/manufacturing' },
      { label: locale === 'zh' ? '联系询价' : 'Contact / RFQ', description: locale === 'zh' ? '通过询价入口提交工况、数量和交付窗口。' : 'Send operating conditions, quantity, and delivery window through the RFQ entry.', href: '/contact' },
    ]
  }

  if (kind === 'quality') {
    return [
      { label: locale === 'zh' ? '质量标准' : 'Quality standards', description: locale === 'zh' ? '认证、追溯、校准和批量一致性控制。' : 'Certification, traceability, calibration, and batch consistency controls.', href: '/resources/manuals/company-materials/quality-certification' },
      { label: locale === 'zh' ? '测试证据' : 'Testing evidence', description: locale === 'zh' ? '按压力、环境、电气输出和资料要求组织检验。' : 'Inspection paths organized by pressure, environment, output, and documentation needs.', href: '/resources/manuals/company-materials/quality-certification' },
      { label: locale === 'zh' ? '提交质量要求' : 'Send quality requirements', description: locale === 'zh' ? '随询价同步确认证书、包装和检验资料。' : 'Confirm certificate, packing, and inspection records with the RFQ.', href: '/contact' },
    ]
  }

  if (kind === 'manufacturing') {
    return [
      { label: locale === 'zh' ? '制造基础设施' : 'Manufacturing infrastructure', description: locale === 'zh' ? '生产、装配、校准和出货流转能力。' : 'Production, assembly, calibration, and shipment flow capability.', href: '/manufacturing#infrastructure' },
      { label: locale === 'zh' ? '装配与校准' : 'Assembly and calibration', description: locale === 'zh' ? '按测量任务确认精度、信号、接口和材质。' : 'Review accuracy, signal, interface, and material needs by measurement task.', href: '/manufacturing#calibration' },
      { label: locale === 'zh' ? '提交项目需求' : 'Send project brief', description: locale === 'zh' ? '确认批量、标签、包装、MOQ 和交付窗口。' : 'Confirm batch quantity, labels, packing, MOQ, and delivery window.', href: '/contact' },
    ]
  }

  return getPrimaryCategoryLinks(locale, source).slice(0, 3)
}

function getProductListFilterGroups(
  locale: LocaleCode,
  productList: ProductListResult,
  category: CategoryNode,
  filters: NormalizedProductListFilters,
  filterPath: string,
  source: ProductViewModelSource = defaultProductViewModelSource,
): readonly ProductListFilterGroupViewModel[] {
  const index = source.getCatalog(locale)
  const baseProductList = source.listProducts(locale, {
    categoryId: category.id,
    categoryMode: 'with-descendants',
    sort: 'category-sort',
    limit: 200,
  })
  const baseProducts = baseProductList.matchedProductIds
    .map((productId) => index.byId.get(productId))
    .filter((product): product is ProductRecord => Boolean(product))

  return [
    {
      title: locale === 'zh' ? '测量范围' : 'Measurement range',
      clearHref: buildProductListHref(filterPath, { ...filters, rangeMinBar: undefined, rangeMaxBar: undefined }),
      items: getRangeFilterPresets(locale).map((preset) => ({
        label: preset.label,
        value: preset.value,
        count: countProductsInBarRange(baseProducts, preset.rangeMinBar, preset.rangeMaxBar),
        href: buildRangeProductFilterHref(filterPath, filters, preset.rangeMinBar, preset.rangeMaxBar),
        active: isRangeFilterSelected(filters, preset.rangeMinBar, preset.rangeMaxBar),
      })).filter((item) => item.count > 0 || item.active),
    },
    {
      title: locale === 'zh' ? '测量信号' : 'Measurement signal',
      clearHref: clearProductFilterHref(filterPath, filters, 'output'),
      items: baseProductList.facets.outputKinds.slice(0, 8).map((bucket) => ({
        label: getOutputKindLabel(locale, bucket.key),
        value: bucket.key,
        count: bucket.count,
        href: buildToggleProductFilterHref(filterPath, filters, 'output', bucket.key),
        active: filters.outputKinds.includes(bucket.key),
      })),
    },
    {
      title: locale === 'zh' ? '准确度' : 'Accuracy',
      clearHref: clearProductFilterHref(filterPath, filters, 'accuracy'),
      items: baseProductList.facets.accuracies.slice(0, 8).map((bucket) => ({
        label: getAccuracyLabel(locale, bucket.key),
        value: bucket.key,
        count: bucket.count,
        href: buildToggleProductFilterHref(filterPath, filters, 'accuracy', bucket.key),
        active: filters.accuracyValues.includes(bucket.key),
      })),
    },
  ].filter((group) => group.items.length > 0)
}

function countProductBuckets<TValue extends string = ProductFamily>(
  products: readonly ProductRecord[],
  getKeys: (product: ProductRecord) => string | readonly string[],
  getLabel: (key: string) => string = formatFacetKey,
  getValue: (key: string) => TValue = (key) => key as TValue,
) {
  const counts = new Map<string, number>()

  for (const product of products) {
    const keys = getKeys(product)

    for (const key of typeof keys === 'string' ? [keys] : keys) {
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([key, count]) => ({ key, label: getLabel(key), value: getValue(key), count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 8)
}

function getRangeFilterPresets(locale: LocaleCode): readonly {
  readonly label: string
  readonly value: string
  readonly rangeMinBar?: number
  readonly rangeMaxBar?: number
}[] {
  return [
    {
      label: locale === 'zh' ? '< 0.1 MPa / < 14.5 psi' : '< 0.1 MPa / < 14.5 psi',
      value: 'range-lte-1-bar',
      rangeMaxBar: 1,
    },
    {
      label: locale === 'zh' ? '< 1 MPa / < 145 psi' : '< 1 MPa / < 145 psi',
      value: 'range-lte-10-bar',
      rangeMaxBar: 10,
    },
    {
      label: locale === 'zh' ? '< 10 MPa / < 1,450 psi' : '< 10 MPa / < 1,450 psi',
      value: 'range-lte-100-bar',
      rangeMaxBar: 100,
    },
    {
      label: locale === 'zh' ? '> 10 MPa / > 1,450 psi' : '> 10 MPa / > 1,450 psi',
      value: 'range-gt-100-bar',
      rangeMinBar: 100,
    },
  ] as const satisfies readonly {
    readonly label: string
    readonly value: string
    readonly rangeMinBar?: number
    readonly rangeMaxBar?: number
  }[]
}

function countProductsInBarRange(
  products: readonly ProductRecord[],
  rangeMinBar?: number,
  rangeMaxBar?: number,
) {
  return products.filter((product) => productMatchesBarRangeFilter(product, rangeMinBar, rangeMaxBar)).length
}

function buildRangeProductFilterHref(
  basePath: string,
  filters: NormalizedProductListFilters,
  rangeMinBar?: number,
  rangeMaxBar?: number,
) {
  const selected = isRangeFilterSelected(filters, rangeMinBar, rangeMaxBar)

  return buildProductListHref(basePath, {
    ...filters,
    rangeMinBar: selected ? undefined : rangeMinBar,
    rangeMaxBar: selected ? undefined : rangeMaxBar,
  })
}

function isRangeFilterSelected(
  filters: NormalizedProductListFilters,
  rangeMinBar?: number,
  rangeMaxBar?: number,
) {
  return filters.rangeMinBar === rangeMinBar && filters.rangeMaxBar === rangeMaxBar
}

function clearProductFilterHref(
  basePath: string,
  filters: NormalizedProductListFilters,
  name: 'category' | 'family' | 'measurement' | 'industry' | 'application' | 'output' | 'accuracy' | 'certification',
) {
  return buildProductListHref(basePath, {
    ...filters,
    categoryIds: name === 'category' ? [] : filters.categoryIds,
    families: name === 'family' ? [] : filters.families,
    measurementKinds: name === 'measurement' ? [] : filters.measurementKinds,
    industrySlugs: name === 'industry' ? [] : filters.industrySlugs,
    applicationSlugs: name === 'application' ? [] : filters.applicationSlugs,
    outputKinds: name === 'output' ? [] : filters.outputKinds,
    accuracyValues: name === 'accuracy' ? [] : filters.accuracyValues,
    certifications: name === 'certification' ? [] : filters.certifications,
  })
}

function getOutputKindLabel(locale: LocaleCode, kind: SignalOutputKind) {
  const labels: Record<SignalOutputKind, Record<LocaleCode, string>> = {
    'analog-current': { en: 'Analog current', zh: '电流信号' },
    'analog-voltage': { en: 'Analog voltage', zh: '电压信号' },
    relay: { en: 'Relay signal', zh: '继电器信号' },
    switch: { en: 'Switch signal', zh: '开关信号' },
    pulse: { en: 'Pulse signal', zh: '脉冲信号' },
    fieldbus: { en: 'Fieldbus signal', zh: '总线信号' },
    wireless: { en: 'Wireless signal', zh: '无线信号' },
  }

  return labels[kind]?.[locale] ?? formatFacetKey(kind)
}

function getAccuracyLabel(locale: LocaleCode, accuracy: string) {
  if (locale !== 'zh') {
    return accuracy
  }

  const labels: Record<string, string> = {
    'adjustable setpoint': '可调设定点',
    'switch point': '开关点',
  }

  return labels[accuracy.toLowerCase()] ?? accuracy
}

function getMeasurementKindLabel(locale: LocaleCode, kind: MeasurementKind) {
  const labels: Record<MeasurementKind, Record<LocaleCode, string>> = {
    pressure: { en: 'Pressure', zh: '压力测量' },
    'differential-pressure': { en: 'Differential pressure', zh: '差压测量' },
    level: { en: 'Level', zh: '液位测量' },
    temperature: { en: 'Temperature', zh: '温度测量' },
    flow: { en: 'Flow', zh: '流量测量' },
    humidity: { en: 'Humidity', zh: '湿度测量' },
    conductivity: { en: 'Conductivity', zh: '电导率测量' },
    ph: { en: 'pH', zh: 'pH 测量' },
    position: { en: 'Position', zh: '位置测量' },
    vibration: { en: 'Vibration', zh: '振动测量' },
    speed: { en: 'Speed', zh: '速度测量' },
    'switch-state': { en: 'Switch state', zh: '开关量检测' },
  }

  return labels[kind]?.[locale] ?? formatFacetKey(kind)
}

function getCertificationLabel(locale: LocaleCode, certification: CertificationCode) {
  const labels: Record<CertificationCode, Record<LocaleCode, string>> = {
    ce: { en: 'CE', zh: 'CE' },
    rohs: { en: 'RoHS', zh: 'RoHS' },
    atex: { en: 'ATEX', zh: 'ATEX' },
    iecex: { en: 'IECEx', zh: 'IECEx' },
    sil: { en: 'SIL', zh: 'SIL' },
    iso9001: { en: 'ISO 9001', zh: 'ISO 9001' },
    'food-grade': { en: 'Food grade', zh: '食品级' },
    marine: { en: 'Marine', zh: '船级社' },
    custom: { en: 'Custom', zh: '定制认证' },
  }

  return labels[certification]?.[locale] ?? formatFacetKey(certification)
}

function normalizeProductListFilters(options: ProductListViewModelOptions): NormalizedProductListFilters {
  const search = options.search?.trim()
  const rangeMinBar = normalizeFiniteNumber(options.rangeMinBar)
  const rangeMaxBar = normalizeFiniteNumber(options.rangeMaxBar)
  const normalizedRange = rangeMinBar !== undefined && rangeMaxBar !== undefined && rangeMinBar > rangeMaxBar
    ? { rangeMinBar: rangeMaxBar, rangeMaxBar: rangeMinBar }
    : { rangeMinBar, rangeMaxBar }

  return {
    search: search || undefined,
    categoryIds: normalizeFilterValues(options.categoryIds) as CategoryId[],
    families: normalizeFilterValues(options.families) as ProductFamily[],
    measurementKinds: normalizeFilterValues(options.measurementKinds) as MeasurementKind[],
    industrySlugs: normalizeFilterSlugs(options.industrySlugs),
    applicationSlugs: normalizeFilterSlugs(options.applicationSlugs),
    outputKinds: normalizeFilterValues(options.outputKinds) as SignalOutputKind[],
    accuracyValues: normalizeFilterValues(options.accuracyValues),
    certifications: normalizeFilterValues(options.certifications) as CertificationCode[],
    ...normalizedRange,
  }
}

function getProductListBasePath(category: CategoryNode) {
  return category.parentId === null ? '/products' : category.canonicalPath
}

function getProductListFilterPath(category: CategoryNode) {
  return getProductListBasePath(category)
}

function getProductSearchHiddenInputs(filters: NormalizedProductListFilters) {
  return [
    ...filters.categoryIds.map((value) => ({ name: 'category', value })),
    ...filters.families.map((value) => ({ name: 'family', value })),
    ...filters.measurementKinds.map((value) => ({ name: 'measurement', value })),
    ...filters.industrySlugs.map((value) => ({ name: 'industry', value })),
    ...filters.applicationSlugs.map((value) => ({ name: 'application', value })),
    ...filters.outputKinds.map((value) => ({ name: 'output', value })),
    ...filters.accuracyValues.map((value) => ({ name: 'accuracy', value })),
    ...filters.certifications.map((value) => ({ name: 'certification', value })),
    ...(filters.rangeMinBar !== undefined ? [{ name: 'rangeMinBar', value: String(filters.rangeMinBar) }] : []),
    ...(filters.rangeMaxBar !== undefined ? [{ name: 'rangeMaxBar', value: String(filters.rangeMaxBar) }] : []),
  ]
}

function buildProductCategoryFacetHref(basePath: string, filters: NormalizedProductListFilters, categoryId: CategoryId) {
  return buildToggleProductFilterHref(basePath, filters, 'category', categoryId)
}

function buildProductListHref(basePath: string, filters: NormalizedProductListFilters, page = 1) {
  const params = new URLSearchParams()

  if (filters.search) {
    params.set('search', filters.search)
  }

  for (const value of filters.categoryIds) {
    params.append('category', value)
  }

  for (const value of filters.families) {
    params.append('family', value)
  }

  for (const value of filters.measurementKinds) {
    params.append('measurement', value)
  }

  for (const value of filters.industrySlugs) {
    params.append('industry', value)
  }

  for (const value of filters.applicationSlugs) {
    params.append('application', value)
  }

  for (const value of filters.outputKinds) {
    params.append('output', value)
  }

  for (const value of filters.accuracyValues) {
    params.append('accuracy', value)
  }

  for (const value of filters.certifications) {
    params.append('certification', value)
  }

  if (filters.rangeMinBar !== undefined) {
    params.set('rangeMinBar', String(filters.rangeMinBar))
  }

  if (filters.rangeMaxBar !== undefined) {
    params.set('rangeMaxBar', String(filters.rangeMaxBar))
  }

  if (page > 1) {
    params.set('page', String(page))
  }

  const queryString = params.toString()

  return queryString ? `${basePath}?${queryString}` : basePath
}

function normalizePageNumber(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1
    ? Math.floor(value)
    : 1
}

function getVisiblePageNumbers(currentPage: number, totalPages: number) {
  const firstPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
  const lastPage = Math.min(totalPages, firstPage + 4)

  return Array.from({ length: lastPage - firstPage + 1 }, (_, index) => firstPage + index)
}

function buildToggleProductFilterHref(
  basePath: string,
  filters: NormalizedProductListFilters,
  name: 'category' | 'family' | 'measurement' | 'industry' | 'application' | 'output' | 'accuracy' | 'certification',
  value: CategoryId | ProductFamily | MeasurementKind | SignalOutputKind | CertificationCode | SlugSegment | string,
  aliases: readonly SlugSegment[] = [value as SlugSegment],
) {
  return buildProductListHref(basePath, {
    search: filters.search,
    categoryIds: name === 'category' ? toggleFilterValue(filters.categoryIds, value as CategoryId) : filters.categoryIds,
    families: name === 'family' ? toggleFilterValue(filters.families, value as ProductFamily) : filters.families,
    measurementKinds: name === 'measurement' ? toggleFilterValue(filters.measurementKinds, value as MeasurementKind) : filters.measurementKinds,
    industrySlugs: name === 'industry' ? toggleFilterSlugValue(filters.industrySlugs, value as SlugSegment, aliases) : filters.industrySlugs,
    applicationSlugs: name === 'application' ? toggleFilterSlugValue(filters.applicationSlugs, value as SlugSegment, aliases) : filters.applicationSlugs,
    outputKinds: name === 'output' ? toggleFilterValue(filters.outputKinds, value as SignalOutputKind) : filters.outputKinds,
    accuracyValues: name === 'accuracy' ? toggleFilterValue(filters.accuracyValues, value as string) : filters.accuracyValues,
    certifications: name === 'certification' ? toggleFilterValue(filters.certifications, value as CertificationCode) : filters.certifications,
    rangeMinBar: filters.rangeMinBar,
    rangeMaxBar: filters.rangeMaxBar,
  })
}

function toggleFilterValue<T extends string>(values: readonly T[], value: T): readonly T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

function toggleFilterSlugValue(values: readonly SlugSegment[], value: SlugSegment, aliases: readonly SlugSegment[]): readonly SlugSegment[] {
  return isFilterSlugSelected(values, aliases) ? values.filter((item) => !aliases.includes(item)) : [...values, value]
}

function getIndustryIdsFromSlugs(index: ProductCatalogIndex, slugs: readonly SlugSegment[]): readonly IndustryId[] {
  return getIdsFromFilterSlugs(index.productIdsByIndustryId.keys(), slugs, getIndustrySlugCandidates)
}

function getApplicationIdsFromSlugs(index: ProductCatalogIndex, slugs: readonly SlugSegment[]): readonly ApplicationId[] {
  return getIdsFromFilterSlugs(index.productIdsByApplicationId.keys(), slugs, getApplicationSlugCandidates)
}

function getIndustrySlug(industryId: string) {
  const industry = industries.find((item) => item.id === industryId)

  return industry?.slug ?? getDomainIdSlug(industryId, 'ind_')
}

function getApplicationSlug(applicationId: string) {
  const application = applications.find((item) => item.id === applicationId)

  return application?.slug ?? getDomainIdSlug(applicationId, 'app_')
}

function getIndustrySlugCandidates(industryId: string): readonly SlugSegment[] {
  return getDomainIdSlugCandidates(industryId, getIndustrySlug(industryId), 'ind_')
}

function getApplicationSlugCandidates(applicationId: string): readonly SlugSegment[] {
  return getDomainIdSlugCandidates(applicationId, getApplicationSlug(applicationId), 'app_')
}

function getIdsFromFilterSlugs<TId extends string>(
  ids: Iterable<TId>,
  slugs: readonly SlugSegment[],
  getSlugCandidates: (id: TId) => readonly SlugSegment[],
): readonly TId[] {
  if (slugs.length === 0) {
    return []
  }

  const selected = new Set(slugs)

  return [...ids].filter((id) => getSlugCandidates(id).some((slug) => selected.has(slug)))
}

function isFilterSlugSelected(selectedSlugs: readonly SlugSegment[], candidates: readonly SlugSegment[]) {
  return candidates.some((slug) => selectedSlugs.includes(slug))
}

function getDomainIdSlugCandidates(id: string, canonicalSlug: SlugSegment, prefix: 'ind_' | 'app_') {
  return normalizeFilterSlugs([
    canonicalSlug,
    id,
    id.startsWith(prefix) ? id.slice(prefix.length) : id,
  ])
}

function getDomainIdSlug(id: string, prefix: 'ind_' | 'app_') {
  return normalizeFilterSlug(id.startsWith(prefix) ? id.slice(prefix.length) : id)
}

function normalizeFiniteNumber(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function normalizeFilterValues(values?: readonly string[]) {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(isString))]
}

function normalizeFilterSlugs(values?: readonly string[]): readonly SlugSegment[] {
  return normalizeFilterValues(values)
    .map(normalizeFilterSlug)
    .filter((value): value is SlugSegment => value.length > 0)
}

function normalizeFilterSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') as SlugSegment
}

function getIndustryLabel(locale: LocaleCode, industryId: string) {
  const industry = industries.find((item) => item.id === industryId)

  return industry?.text[locale].title ?? getKnownIndustryLabel(locale, industryId) ?? formatLocalizedFacetKey(locale, industryId)
}

function getApplicationLabel(locale: LocaleCode, applicationId: string) {
  const application = applications.find((item) => item.id === applicationId)

  return application?.text[locale].title ?? getKnownApplicationLabel(locale, applicationId) ?? formatLocalizedFacetKey(locale, applicationId)
}

function getKnownIndustryLabel(locale: LocaleCode, industryId: string) {
  const labels: Partial<Record<string, Record<LocaleCode, string>>> = {
    ind_oem: { en: 'OEM', zh: 'OEM' },
    ind_water: { en: 'Water Treatment', zh: '水处理' },
    ind_chemical_processing: { en: 'Chemical Processing Lines', zh: '化工过程产线' },
  }

  return labels[industryId]?.[locale]
}

function getKnownApplicationLabel(locale: LocaleCode, applicationId: string) {
  const labels: Partial<Record<string, Record<LocaleCode, string>>> = {
    app_fluid_control: { en: 'Fluid Control', zh: '流体控制' },
  }

  return labels[applicationId]?.[locale]
}

function formatLocalizedFacetKey(locale: LocaleCode, key: string) {
  if (locale === 'zh') {
    return key
      .replace(/^(ind|app|cat)_/, '')
      .replace(/[-_]+/g, ' ')
  }

  return formatFacetKey(key)
}

function formatFacetKey(key: string) {
  return key
    .replace(/^(ind|app|cat)_/, '')
    .split(/[-_]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
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

function isProductListItem(value: ProductListItem | undefined): value is ProductListItem {
  return Boolean(value)
}

function getLifecycleLabel(lifecycle: string, locale: LocaleCode, labels: Record<string, string>) {
  if (lifecycle === 'active') {
    return labels.activeLifecycle
  }

  if (locale === 'zh') {
    const zhLabels: Partial<Record<string, string>> = {
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
  const labels: Record<string, Partial<Record<LocaleCode, string>>> = {
    'Technical specifications': { zh: '技术规格' },
    'Sensor profile': { zh: '传感器配置' },
    'Valve profile': { zh: '阀门配置' },
    '技术规格': { en: 'Technical specifications' },
    '传感器配置': { en: 'Sensor profile' },
    '阀门配置': { en: 'Valve profile' },
    防护等级: { en: 'Ingress protection' },
  }

  return labels[label]?.[locale] ?? label
}

function localizeSpecLabel(label: string, locale: LocaleCode) {
  const labels: Record<string, Partial<Record<LocaleCode, string>>> = {
    Range: { zh: '量程' },
    Output: { zh: '输出' },
    Feature: { zh: '特性' },
    measurement: { zh: '测量' },
    output: { zh: '输出' },
    media: { zh: '介质' },
    pressureRating: { zh: '压力等级' },
    connection: { zh: '连接' },
    material: { zh: '材质' },
    size: { zh: '尺寸' },
    mode: { zh: '模式' },
    'Process connection': { zh: '过程连接' },
    'Electrical connection': { zh: '电气连接' },
    'Measurement range': { zh: '测量范围' },
    Accuracy: { zh: '精度' },
    'Overload limit': { zh: '过载极限' },
    'Output signal': { zh: '输出信号' },
    'Supply voltage': { zh: '供电电压' },
    'Ingress protection': { zh: '防护等级' },
    'Wetted materials': { zh: '接液材质' },
    'Compatible media': { zh: '适用介质' },
    'Ambient temperature': { zh: '环境温度' },
    'Media temperature': { zh: '介质温度' },
    量程: { en: 'Range' },
    输出: { en: 'Output' },
    特性: { en: 'Feature' },
    测量: { en: 'Measurement' },
    介质: { en: 'Media' },
    压力等级: { en: 'Pressure rating' },
    连接: { en: 'Connection' },
    材质: { en: 'Material' },
    尺寸: { en: 'Size' },
    模式: { en: 'Mode' },
    过程连接: { en: 'Process connection' },
    电气连接: { en: 'Electrical connection' },
    最低工作压力: { en: 'Minimum operating pressure' },
    最高工作压力: { en: 'Maximum operating pressure' },
    出口压力: { en: 'Outlet pressure' },
    最低环境温度: { en: 'Minimum ambient temperature' },
    最高环境温度: { en: 'Maximum ambient temperature' },
    最低工作温度: { en: 'Minimum operating temperature' },
    最高工作温度: { en: 'Maximum operating temperature' },
    额定工作压力: { en: 'Rated operating pressure' },
    适配介质: { en: 'Compatible media' },
    内部泄漏量: { en: 'Internal leakage' },
    内部泄漏: { en: 'Internal leakage' },
    外部泄漏量: { en: 'External leakage' },
    外部泄漏: { en: 'External leakage' },
    最大流量: { en: 'Maximum flow rate' },
    耐压压力: { en: 'Proof pressure' },
    爆破压力: { en: 'Burst pressure' },
    阀体类型: { en: 'Valve body type' },
    最小通径: { en: 'Minimum orifice' },
    循环寿命: { en: 'Cycle life' },
    工作电压下限: { en: 'Minimum operating voltage' },
    工作电压上限: { en: 'Maximum operating voltage' },
    额定功率: { en: 'Rated power' },
    线圈电阻: { en: 'Coil resistance' },
    额定电流: { en: 'Rated current' },
    防护等级: { en: 'Ingress protection' },
    'IP 防护等级': { en: 'IP ingress protection' },
    安装方向: { en: 'Mounting orientation' },
    开启压力: { en: 'Opening pressure' },
    阀门结构类型: { en: 'Valve structure type' },
    流通孔径: { en: 'Flow orifice' },
  }

  return labels[label]?.[locale] ?? label
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
