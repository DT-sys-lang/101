import { architectureFreezeV1 } from './architecture-freeze-v1'
import { industrialSensorCategoryTree, type CategoryNode, type CategoryTree } from './category'
import { getVisibleProductCategoryChildren } from './category-visibility'
import type { ProductCatalogIndex, ProductListItem, ProductListResult } from './product-catalog'
import type { CategoryId, LocaleCode, LocalizedText } from './primitives'

const siteOrigin = normalizeSiteOrigin(process.env.NEXT_PUBLIC_SITE_ORIGIN, 'https://www.yufavor.example')

export const industrialSiteConfig = {
  origin: siteOrigin,
  websiteId: `${siteOrigin}/#website`,
  organizationId: `${siteOrigin}/#organization`,
  brandName: 'YUFAVOR',
} as const

function normalizeSiteOrigin(value: string | undefined, fallback: string) {
  const candidate = value?.trim() || fallback

  try {
    const url = new URL(candidate)
    return url.origin
  } catch {
    return fallback
  }
}

export type IndustrialIconKey =
  | 'pressure'
  | 'level'
  | 'temperature'
  | 'switch'
  | 'factory'
  | 'water'
  | 'hvac'
  | 'energy'
  | 'chemical'
  | 'oem'
  | 'quality'
  | 'catalog'
  | 'pipeline'

export interface SiteNavigationItem {
  readonly label: string
  readonly href: string
}

export interface SiteSearchGroup {
  readonly title: string
  readonly items: readonly SiteNavigationItem[]
}

export interface SiteLayoutProjection {
  readonly architectureVersion: typeof architectureFreezeV1.version
  readonly brand: {
    readonly name: string
    readonly descriptor: string
  }
  readonly navigation: readonly SiteNavigationItem[]
  readonly actions: {
    readonly products: string
    readonly quote: string
    readonly details: string
    readonly viewAll: string
    readonly datasheet: string
  }
  readonly language: {
    readonly currentLabel: string
    readonly alternateLabel: string
  }
  readonly search: {
    readonly label: string
    readonly placeholder: string
    readonly submitLabel: string
    readonly actionPath: string
    readonly groups: readonly SiteSearchGroup[]
  }
  readonly footer: {
    readonly summary: string
    readonly badges: readonly string[]
    readonly contact: {
      readonly title: string
      readonly companyName: string
      readonly phoneLabel: string
      readonly phone: string
      readonly emailLabel: string
      readonly email: string
    }
    readonly columns: readonly {
      readonly title: string
      readonly links: readonly SiteNavigationItem[]
    }[]
  }
}

export interface HomepageCategoryProjection {
  readonly icon: IndustrialIconKey
  readonly title: string
  readonly description: string
  readonly meta: string
  readonly href: string
}

interface CategoryDisplayCopy {
  readonly icon: IndustrialIconKey
  readonly meta: string
  readonly name: LocalizedText
  readonly description: LocalizedText
}

export interface HomepageProjection {
  readonly architectureVersion: typeof architectureFreezeV1.version
  readonly hero: {
    readonly eyebrow: string
    readonly title: string
    readonly body: string
    readonly primary: string
    readonly secondary: string
    readonly imageAlt: string
    readonly media: {
      readonly ariaLabel: string
      readonly previousLabel: string
      readonly nextLabel: string
      readonly slides: readonly {
        readonly kind: 'image' | 'video'
        readonly title: string
        readonly description: string
        readonly imageSrc: string
        readonly imageAlt: string
        readonly videoSrc?: string
        readonly posterSrc?: string
        readonly href?: string
      }[]
    }
    readonly metrics: readonly { readonly value: string; readonly label: string }[]
    readonly entries: readonly { readonly label: string; readonly description: string; readonly href: string }[]
  }
  readonly trust: {
    readonly eyebrow: string
    readonly title: string
    readonly body: string
    readonly metrics: readonly { readonly value: string; readonly label: string }[]
    readonly proof: readonly { readonly label: string; readonly value: string }[]
  }
  readonly applicationProof: {
    readonly eyebrow: string
    readonly title: string
    readonly body: string
    readonly items: readonly { readonly label: string; readonly value: string; readonly href: string }[]
  }
  readonly categories: {
    readonly eyebrow: string
    readonly title: string
    readonly body: string
    readonly linkLabel: string
    readonly items: readonly HomepageCategoryProjection[]
  }
  readonly products: {
    readonly eyebrow: string
    readonly title: string
    readonly body: string
    readonly totalLabel: string
    readonly viewAllLabel: string
    readonly detailsLabel: string
    readonly items: readonly ProductListItem[]
  }
  readonly industries: GatewaySectionProjection
  readonly applications: GatewaySectionProjection
  readonly resources: {
    readonly eyebrow: string
    readonly title: string
    readonly body: string
    readonly linkLabel: string
    readonly items: readonly HomepageCategoryProjection[]
  }
  readonly modules: {
    readonly eyebrow: string
    readonly title: string
    readonly body: string
    readonly items: readonly {
      readonly icon: IndustrialIconKey
      readonly title: string
      readonly description: string
      readonly points: readonly string[]
    }[]
  }
  readonly cta: {
    readonly title: string
    readonly body: string
    readonly primary: string
    readonly secondary: string
  }
}

interface GatewaySectionProjection {
  readonly eyebrow: string
  readonly title: string
  readonly body: string
  readonly linkLabel: string
  readonly items: readonly GatewayItem[]
}

interface GatewayItem {
  readonly icon: IndustrialIconKey
  readonly title: string
  readonly description: string
  readonly productCount: string
  readonly href: string
}

const siteText = {
  zh: {
    brand: { name: 'YUFAVOR', descriptor: '工业传感器与阀门' },
    navigation: {
      products: '产品',
      industries: '行业',
      oem: 'OEM 方案',
      company: '公司',
      resources: '资料中心',
      contact: '联系',
    },
    actions: {
      products: '浏览产品',
      quote: '获取报价',
      details: '查看详情',
      viewAll: '查看全部',
      datasheet: '数据手册',
    },
    language: { currentLabel: '中文', alternateLabel: 'EN' },
    footer: {
      summary: '面向海外 OEM、设备制造和工业现场的传感器与阀门产品中心，支持按型号、工况、行业和资料路径快速选型。',
      products: '产品中心',
      industries: '行业方案',
      resources: '资料中心',
      services: '关于我们',
      badges: ['ISO 9001', 'OEM 配套', '全球交付'],
      contact: {
        title: '联系我们',
        companyName: '上海域丰传感仪器有限公司',
        phoneLabel: '电话',
        phone: '+86 21 61318500',
        emailLabel: '邮箱',
        email: 'sales@yufavor.com',
      },
    },
  },
  en: {
    brand: { name: 'YUFAVOR', descriptor: 'Industrial sensors and valves' },
    navigation: {
      products: 'Products',
      industries: 'Industries',
      oem: 'OEM Solutions',
      company: 'Company',
      resources: 'Resources',
      contact: 'Contact',
    },
    actions: {
      products: 'Explore Products',
      quote: 'Request Quote',
      details: 'View Details',
      viewAll: 'View All',
      datasheet: 'Datasheet',
    },
    language: { currentLabel: 'EN', alternateLabel: 'Chinese' },
    footer: {
      summary: 'A product center for sensors and valves serving overseas OEMs, machine builders, and industrial projects, with clear paths by model, operating condition, industry, and resource.',
      products: 'Products',
      industries: 'Industries',
      resources: 'Resources',
      services: 'About Us',
      badges: ['ISO 9001', 'OEM', 'Global Delivery'],
      contact: {
        title: 'Contact Us',
        companyName: 'Shanghai Yufavor Sensor Instrument Co., Ltd.',
        phoneLabel: 'Tel',
        phone: '+86 21 61318500',
        emailLabel: 'Email',
        email: 'sales@yufavor.com',
      },
    },
  },
} as const satisfies Record<LocaleCode, {
  readonly brand: { readonly name: string; readonly descriptor: string }
  readonly navigation: Record<'products' | 'industries' | 'oem' | 'resources' | 'company' | 'contact', string>
  readonly actions: SiteLayoutProjection['actions']
  readonly language: SiteLayoutProjection['language']
  readonly footer: {
    readonly summary: string
    readonly products: string
    readonly industries: string
    readonly resources: string
    readonly services: string
    readonly badges: readonly string[]
    readonly contact: SiteLayoutProjection['footer']['contact']
  }
}>

const categoryCopy: Partial<Record<CategoryId, CategoryDisplayCopy>> = {
  cat_pressure_sensors: {
    icon: 'pressure',
    meta: '0-1,000 bar',
    name: { zh: '压力传感器', en: 'Pressure Sensors' },
    description: {
      zh: '用于泵站、液压、压缩机和过程管线的压力测量产品。',
      en: 'Transmitters, transducers, and switches for industrial pressure measurement.',
    },
  },
  cat_level_sensors: {
    icon: 'level',
    meta: 'IP68 / 4-20mA',
    name: { zh: '液位传感器', en: 'Level Sensors' },
    description: {
      zh: '用于水箱、水井、水处理和过程容器的连续液位与点位检测。',
      en: 'Continuous and point-level sensors for tanks, wells, reservoirs, and process vessels.',
    },
  },
  cat_temperature_measurement: {
    icon: 'temperature',
    meta: '-50-600 C',
    name: { zh: '温度测量', en: 'Temperature Measurement' },
    description: {
      zh: '温度变送器、RTD、热电偶和过程安装组件。',
      en: 'Temperature transmitters, RTDs, thermocouples, and process assemblies.',
    },
  },
  cat_industrial_switches: {
    icon: 'switch',
    meta: 'PLC / DCS',
    name: { zh: '工业开关', en: 'Industrial Switches' },
    description: {
      zh: '用于设备保护、联锁控制和自动化回路的压力、温度、流量与液位开关。',
      en: 'Pressure, temperature, flow, and level switches for equipment protection and automation.',
    },
  },
}

const homepageText = {
  zh: {
    hero: {
      eyebrow: '工业传感器 + 阀门产品中心',
      title: '面向 OEM 与工业现场的传感器和阀门选型入口',
      body: '覆盖压力变送器、工业阀门与配套应用，帮助海外 OEM、设备制造和工业采购从产品、行业、工况和资料快速进入可询价路径。',
      primary: '浏览产品中心',
      secondary: '查看行业方案',
      imageAlt: '安装在金属工艺管路上的工业压力仪表与传感器',
      media: {
        ariaLabel: '首页产品与应用媒体轮播',
        previousLabel: '上一张',
        nextLabel: '下一张',
        slides: [
          {
            kind: 'image',
            title: '压力测量产品',
            description: '压力传感器、变送器与管路测量场景。',
            imageSrc: '/images/hero/industrial-instrumentation.webp',
            imageAlt: '工业压力仪表与压力传感器安装示意',
            href: '/products?family=sensor&search=pressure',
          },
          {
            kind: 'image',
            title: '工业阀门与气路控制',
            description: '按压力等级、连接、材质、介质和尺寸进入阀门选型。',
            imageSrc: '/images/hero/industrial-instrumentation.webp',
            imageAlt: '工业阀门与气路控制产品展示',
            href: '/products?family=valve',
          },
          {
            kind: 'image',
            title: 'OEM 传感器 + 阀门配套',
            description: '围绕接口、信号、外壳、包装和批量交付组织项目需求。',
            imageSrc: '/images/hero/industrial-instrumentation.webp',
            imageAlt: 'OEM 传感器与阀门配套应用展示',
            href: '/oem',
          },
        ],
      },
      metrics: [
        { value: '2', label: '核心产品族' },
        { value: '5', label: '行业方案入口' },
        { value: '48h', label: 'RFQ 响应窗口' },
      ],
      entries: [
        { label: '压力传感器/变送器', description: '量程、输出、接口、介质', href: '/products?family=sensor&search=pressure' },
        { label: '工业阀门', description: '压力等级、连接、材质、尺寸', href: '/products?family=valve' },
        { label: 'OEM 配套', description: '传感器、阀门、接口和批量供货', href: '/oem' },
      ],
    },
    categories: {
      eyebrow: '产品快速入口',
      title: '先按产品族和分类进入目录',
      body: '产品中心保留分类、行业、应用、族别和关键词筛选；传感器与阀门使用同一 Domain 产品索引，适合继续扩展到千级目录。',
      linkLabel: '进入目录',
    },
    trust: {
      eyebrow: '质量与交付',
      title: '用工程证据、数据手册和批量交付建立采购信任',
      body: '面向长期供货、重复设备项目和跨区域采购，页面优先呈现认证准备、数据手册、选型响应、质保和 OEM 配套能力。',
    },
    applicationProof: {
      eyebrow: '按工况筛选',
      title: '从介质、应用和行业缩小选型范围',
      body: '采购和工程团队可以先按介质、应用场景或行业系统进入，再结合量程、输出、连接、材质和数量形成 RFQ。',
      items: [
        { label: '介质', value: '气体 / 液体 / 天然气', href: '/products?search=media' },
        { label: '应用', value: '高压 / 管线 / OEM', href: '/applications' },
        { label: '行业', value: '油气 / 水处理 / 自动化', href: '/industries' },
      ],
    },
    products: {
      eyebrow: '精选产品',
      title: '先看可询价的传感器与阀门型号',
      body: '产品卡统一展示型号、产品族、分类、关键参数、图片和资料入口，方便工程与采购快速判断是否进入详情页。',
    },
    industries: {
      eyebrow: '行业方案',
      title: '先看行业系统，再进入产品和资料',
      body: '行业页承接典型工况、相关产品、行业资讯和传感器 + 阀门生态搭配，帮助客户从系统场景进入选型。',
      linkLabel: '查看行业',
    },
    applications: {
      eyebrow: '应用场景',
      title: '行业页内承接应用场景',
      body: '应用页保留长尾入口，但不作为主导航；首页只提供高频任务入口，帮助客户进入产品或行业路径。',
      linkLabel: '查看应用',
    },
    resources: {
      eyebrow: '资料中心',
      title: '把文章、案例和手册放到采购路径上',
      body: '资料中心保持轻量结构：博客用于选型知识，案例用于场景证明，产品手册用于下载和规格核对。',
      linkLabel: '进入资料',
    },
    modules: {
      eyebrow: 'OEM 定制能力',
      title: '把传感器、阀门和接口要求变成批量交付方案',
      body: 'OEM 页面承接信号输出、连接器、外壳、贴牌、包装、MOQ 和交付窗口，适合设备制造商建立长期配套。',
    },
    cta: {
      title: '准备询价或确认选型？',
      body: '提交介质、压力范围、输出、连接、材质、数量和交付窗口，销售与工程团队可按产品、行业或应用路径回复。',
      primary: '进入产品中心',
      secondary: '提交 RFQ',
    },
  },
  en: {
    hero: {
      eyebrow: 'Industrial sensors + valves product center',
      title: 'Selection entry for OEM and industrial sensor-valve projects',
      body: 'Pressure transmitters, industrial valves, and application pairings for overseas OEMs, machine builders, and industrial buyers who need a clear path from product, industry, operating condition, and resource to RFQ.',
      primary: 'Open Product Center',
      secondary: 'View Industry Solutions',
      imageAlt: 'Industrial pressure instruments and sensors installed on metal process piping',
      media: {
        ariaLabel: 'Homepage product and application media carousel',
        previousLabel: 'Previous slide',
        nextLabel: 'Next slide',
        slides: [
          {
            kind: 'image',
            title: 'Pressure measurement products',
            description: 'Pressure sensors, transmitters, and pipeline measurement use cases.',
            imageSrc: '/images/hero/industrial-instrumentation.webp',
            imageAlt: 'Industrial pressure gauge and pressure sensor application',
            href: '/products?family=sensor&search=pressure',
          },
          {
            kind: 'image',
            title: 'Industrial valves and gas control',
            description: 'Select by pressure rating, connection, material, media, and size.',
            imageSrc: '/images/hero/industrial-instrumentation.webp',
            imageAlt: 'Industrial valve and gas-line control product display',
            href: '/products?family=valve',
          },
          {
            kind: 'image',
            title: 'OEM sensor + valve pairing',
            description: 'Project paths for interface, signal, housing, packaging, and repeat supply.',
            imageSrc: '/images/hero/industrial-instrumentation.webp',
            imageAlt: 'OEM sensor and valve pairing application display',
            href: '/oem',
          },
        ],
      },
      metrics: [
        { value: '2', label: 'core product families' },
        { value: '5', label: 'industry solution paths' },
        { value: '48h', label: 'RFQ response window' },
      ],
      entries: [
        { label: 'Pressure sensors / transmitters', description: 'Range, output, connection, media', href: '/products?family=sensor&search=pressure' },
        { label: 'Industrial valves', description: 'Pressure rating, connection, material, size', href: '/products?family=valve' },
        { label: 'OEM pairing', description: 'Sensors, valves, interfaces, repeat supply', href: '/oem' },
      ],
    },
    categories: {
      eyebrow: 'Product quick entry',
      title: 'Start by product family and category',
      body: 'The product center keeps category, industry, application, family, and keyword filters visible while sensors and valves stay on the same Domain product index.',
      linkLabel: 'Open catalog',
    },
    trust: {
      eyebrow: 'Quality and delivery',
      title: 'Build buyer confidence with evidence, datasheets, and batch delivery readiness',
      body: 'For repeat machine builds and long-term procurement, the page highlights certification readiness, datasheets, selection response, warranty, and OEM support capability.',
    },
    applicationProof: {
      eyebrow: 'Filter by operating condition',
      title: 'Narrow selection by media, application, and industry',
      body: 'Engineering and purchasing teams can start from media, application scenario, or industry system before confirming range, output, connection, material, quantity, and delivery window.',
      items: [
        { label: 'Media', value: 'Gas / liquid / natural gas', href: '/products?search=media' },
        { label: 'Application', value: 'High pressure / pipeline / OEM', href: '/applications' },
        { label: 'Industry', value: 'Oil & gas / water / automation', href: '/industries' },
      ],
    },
    products: {
      eyebrow: 'Featured products',
      title: 'Start with quote-ready sensor and valve models',
      body: 'Product cards show model, family, category, key specs, image, and material entry in a consistent layout so buyers can decide whether to open the detail page.',
    },
    industries: {
      eyebrow: 'Industry solutions',
      title: 'Find the industry system before selecting products',
      body: 'Industry pages connect operating conditions, related products, industry content, and curated sensor + valve pairings so customers can enter selection from the system context.',
      linkLabel: 'View industry',
    },
    applications: {
      eyebrow: 'Application scenarios',
      title: 'Applications are carried inside industry and product paths',
      body: 'Application pages remain available for long-tail discovery, while the homepage keeps the most common tasks as practical entry points.',
      linkLabel: 'View application',
    },
    resources: {
      eyebrow: 'Resources',
      title: 'Put articles, cases, and manuals into the buyer path',
      body: 'Resources stay simple: blog posts for selection knowledge, cases for application evidence, and product manuals for downloads and specification checks.',
      linkLabel: 'Open resource',
    },
    modules: {
      eyebrow: 'OEM customization capability',
      title: 'Turn sensor, valve, and interface requirements into repeatable supply programs',
      body: 'The OEM path collects signal output, connector, housing, labeling, packaging, MOQ, and delivery-window requirements for machine builders.',
    },
    cta: {
      title: 'Ready to quote or confirm a selection?',
      body: 'Send media, pressure range, output, connection, material, quantity, and delivery window so sales and engineering can reply by product, industry, or application path.',
      primary: 'Open Product Center',
      secondary: 'Send RFQ',
    },
  },
} as const satisfies Record<LocaleCode, Omit<HomepageProjection, 'architectureVersion' | 'trust' | 'categories' | 'products' | 'industries' | 'applications' | 'resources' | 'modules'> & {
  readonly categories: Omit<HomepageProjection['categories'], 'items'>
  readonly trust: Pick<HomepageProjection['trust'], 'eyebrow' | 'title' | 'body'>
  readonly products: Pick<HomepageProjection['products'], 'eyebrow' | 'title' | 'body'>
  readonly industries: Omit<GatewaySectionProjection, 'items'>
  readonly applications: Omit<GatewaySectionProjection, 'items'>
  readonly resources: Omit<HomepageProjection['resources'], 'items'>
  readonly modules: Pick<HomepageProjection['modules'], 'eyebrow' | 'title' | 'body'>
}>

const industryItems = {
  zh: [
    { icon: 'chemical', title: '石油与天然气', description: '撬装、管线和辅助系统的压力、差压与温度监测。', productCount: '过程压力', href: '/industries/oil-gas' },
    { icon: 'water', title: '水处理', description: '泵站、水箱、过滤系统和市政水务监测。', productCount: '液位 / 泵压', href: '/industries/water-treatment' },
    { icon: 'factory', title: '工业自动化', description: 'PLC、DCS、联锁保护和批量设备制造的传感器输入。', productCount: 'PLC / DCS', href: '/industries/industrial-automation' },
    { icon: 'energy', title: '能源', description: '锅炉、换热、储能辅助系统和电站设备。', productCount: '公用工程', href: '/industries/energy' },
    { icon: 'oem', title: '制造业', description: '液压设备、压缩机、机床和自动化产线。', productCount: '设备配套', href: '/industries/manufacturing' },
  ],
  en: [
    { icon: 'chemical', title: 'Oil & Gas', description: 'Pressure, differential pressure, and temperature monitoring for skids, pipelines, and auxiliary systems.', productCount: 'Process pressure', href: '/industries/oil-gas' },
    { icon: 'water', title: 'Water Treatment', description: 'Pump stations, tanks, filtration systems, and municipal monitoring.', productCount: 'Level / pump pressure', href: '/industries/water-treatment' },
    { icon: 'factory', title: 'Industrial Automation', description: 'Sensor inputs for PLC, DCS, interlocks, protection, and repeatable machine builds.', productCount: 'PLC / DCS', href: '/industries/industrial-automation' },
    { icon: 'energy', title: 'Energy', description: 'Boilers, heat exchange, energy-storage auxiliaries, and power equipment.', productCount: 'Utility systems', href: '/industries/energy' },
    { icon: 'oem', title: 'Manufacturing', description: 'Hydraulic equipment, compressors, machine tools, and automated production lines.', productCount: 'Machine support', href: '/industries/manufacturing' },
  ],
} as const satisfies Record<LocaleCode, readonly GatewayItem[]>

const applicationItems = {
  zh: [
    { icon: 'pressure', title: '高压测量', description: '液压站、水泵、压缩机和测试台的压力测量入口。', productCount: '压力测量', href: '/applications/high-pressure-measurement' },
    { icon: 'pipeline', title: '工业管线监测', description: '过程管线和公用工程管路的压力、差压与温度监测。', productCount: '管线监测', href: '/applications/industrial-pipeline-monitoring' },
    { icon: 'oem', title: 'OEM 传感器集成', description: '围绕信号、接口、外壳、贴牌和批量交付组织选型。', productCount: 'OEM 集成', href: '/applications/oem-sensor-integration' },
  ],
  en: [
    { icon: 'pressure', title: 'High pressure measurement', description: 'Pressure measurement entry for hydraulic stations, pumps, compressors, and test benches.', productCount: 'Pressure', href: '/applications/high-pressure-measurement' },
    { icon: 'pipeline', title: 'Industrial pipeline monitoring', description: 'Pressure, differential pressure, and temperature monitoring for process and utility lines.', productCount: 'Pipeline', href: '/applications/industrial-pipeline-monitoring' },
    { icon: 'oem', title: 'OEM sensor integration', description: 'Selection organized around signals, connectors, housings, labels, and batch delivery.', productCount: 'OEM', href: '/applications/oem-sensor-integration' },
  ],
} as const satisfies Record<LocaleCode, readonly GatewayItem[]>

const moduleItems = {
  zh: [
    { icon: 'oem', title: '传感器接口定制', description: '围绕量程、输出、电气连接、过程接口和外壳结构确认 OEM 配套要求。', points: ['信号输出', '连接器', '外壳结构'] },
    { icon: 'pipeline', title: '阀门组合配套', description: '结合压力等级、连接方式、材质、介质和尺寸，为气路、管线和设备系统配套。', points: ['压力等级', '材质/介质', '尺寸/连接'] },
    { icon: 'quality', title: '批量供货协同', description: '围绕样品确认、数据手册、包装标签、MOQ 和交付窗口建立长期采购节奏。', points: ['样品确认', '资料归档', '批量交付'] },
  ],
  en: [
    { icon: 'oem', title: 'Sensor interface customization', description: 'Confirm OEM requirements around range, output, electrical connection, process interface, and housing structure.', points: ['Signal output', 'Connector', 'Housing'] },
    { icon: 'pipeline', title: 'Valve pairing support', description: 'Match pressure rating, connection, material, media, and size for gas lines, pipelines, and equipment systems.', points: ['Pressure rating', 'Material/media', 'Size/connection'] },
    { icon: 'quality', title: 'Repeat supply coordination', description: 'Build long-term procurement rhythm around sample approval, datasheets, packaging labels, MOQ, and delivery windows.', points: ['Sample approval', 'Material records', 'Batch delivery'] },
  ],
} as const satisfies Record<LocaleCode, HomepageProjection['modules']['items']>

const resourceItems = {
  zh: [
    { icon: 'catalog', title: '博客', description: '选型方法、工况解释和行业观察，帮助客户理解传感器与阀门应用边界。', meta: '选型知识', href: '/resources/blog' },
    { icon: 'factory', title: '案例', description: '项目背景、应用场景和产品组合入口，用于承接后续公开案例内容。', meta: '应用证明', href: '/resources/cases' },
    { icon: 'quality', title: '产品手册/下载', description: '数据手册、产品手册和证书下载入口，用于规格核对和采购归档。', meta: '资料下载', href: '/resources/manuals' },
  ],
  en: [
    { icon: 'catalog', title: 'Blog', description: 'Selection methods, operating-condition notes, and industry observations that clarify sensor and valve application boundaries.', meta: 'Selection knowledge', href: '/resources/blog' },
    { icon: 'factory', title: 'Case studies', description: 'Project context, application scenarios, and product pairing entries prepared for future public case content.', meta: 'Application proof', href: '/resources/cases' },
    { icon: 'quality', title: 'Product manuals / downloads', description: 'Datasheets, product manuals, and certificate entries for specification checks and procurement records.', meta: 'Downloads', href: '/resources/manuals' },
  ],
} as const satisfies Record<LocaleCode, HomepageProjection['resources']['items']>

function localize(text: LocalizedText, locale: LocaleCode) {
  return text[locale] ?? text.en
}

function getPrimaryCategories(categoryTree: CategoryTree = industrialSensorCategoryTree, catalog?: ProductCatalogIndex) {
  if (catalog) {
    return [...getVisibleProductCategoryChildren(categoryTree.root, catalog)]
  }

  return [...(categoryTree.root.children ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
}

function getCategoryCopy(node: CategoryNode, locale: LocaleCode) {
  const override = categoryCopy[node.id]

  return {
    icon: override?.icon ?? 'catalog',
    title: override ? localize(override.name, locale) : localize(node.name, locale),
    description: override ? localize(override.description, locale) : localize(node.description, locale),
    meta: override?.meta ?? node.facetKeys.slice(0, 2).join(' / '),
  }
}

function getProductTotalLabel(locale: LocaleCode, productList: ProductListResult) {
  if (locale === 'zh') {
    return `已索引 ${productList.pageInfo.total} 个公开产品，当前展示 ${productList.items.length} 个`
  }

  return `${productList.pageInfo.total} public products indexed, showing ${productList.items.length}`
}

function getSiteSearchProjection(locale: LocaleCode): SiteLayoutProjection['search'] {
  return {
    label: locale === 'zh' ? '全站搜索' : 'Site search',
    placeholder: locale === 'zh' ? '搜索产品、行业、应用场景或资料' : 'Search products, industries, applications, or resources',
    submitLabel: locale === 'zh' ? '搜索' : 'Search',
    actionPath: '/products',
    groups: [
      {
        title: locale === 'zh' ? '产品与场景' : 'Products & scenarios',
        items: [
          { label: locale === 'zh' ? '压力变送器' : 'Pressure transmitters', href: toProductSearchHref('pressure transmitter') },
          { label: applicationItems[locale][0].title, href: toProductSearchHref(applicationItems.en[0].title) },
          { label: applicationItems[locale][1].title, href: toProductSearchHref(applicationItems.en[1].title) },
        ],
      },
      {
        title: locale === 'zh' ? '行业与生态' : 'Industries & ecosystem',
        items: [
          ...industryItems[locale].slice(0, 2).map((industry) => ({ label: industry.title, href: industry.href })),
          { label: locale === 'zh' ? '生态搭配' : 'Ecosystem pairings', href: '/industries#ecosystem' },
        ],
      },
      {
        title: locale === 'zh' ? '资料中心' : 'Resources',
        items: [
          { label: locale === 'zh' ? '博客' : 'Blog', href: '/resources/blog' },
          { label: locale === 'zh' ? '案例' : 'Case studies', href: '/resources/cases' },
          { label: locale === 'zh' ? '产品手册/下载' : 'Product manuals / downloads', href: '/resources/manuals' },
        ],
      },
    ],
  }
}

function toProductSearchHref(query: string) {
  return `/products?search=${encodeURIComponent(query)}`
}

export function getIndustrialSiteLayout(locale: LocaleCode, categoryTree: CategoryTree = industrialSensorCategoryTree, catalog?: ProductCatalogIndex): SiteLayoutProjection {
  const copy = siteText[locale]
  const categories = getPrimaryCategories(categoryTree, catalog)

  return {
    architectureVersion: architectureFreezeV1.version,
    brand: copy.brand,
    navigation: [
      { label: copy.navigation.products, href: '/products' },
      { label: copy.navigation.industries, href: '/industries' },
      { label: copy.navigation.oem, href: '/oem' },
      { label: copy.navigation.resources, href: '/resources' },
      { label: copy.navigation.company, href: '/company' },
      { label: copy.navigation.contact, href: '/contact' },
    ],
    actions: copy.actions,
    language: copy.language,
    search: getSiteSearchProjection(locale),
    footer: {
      summary: copy.footer.summary,
      badges: copy.footer.badges,
      contact: copy.footer.contact,
      columns: [
        {
          title: copy.footer.products,
          links: categories.slice(0, 3).map((category) => ({
            label: getCategoryCopy(category, locale).title,
            href: category.canonicalPath,
          })),
        },
        {
          title: copy.footer.industries,
          links: industryItems[locale].slice(0, 3).map((industry) => ({
            label: industry.title,
            href: industry.href,
          })),
        },
        {
          title: copy.footer.resources,
          links: resourceItems[locale].map((resource) => ({
            label: resource.title,
            href: resource.href,
          })),
        },
        {
          title: copy.footer.services,
          links: [
            { label: copy.navigation.company, href: '/company' },
            { label: locale === 'zh' ? '认证' : 'Certification', href: '/resources/manuals/company-materials/quality-certification' },
            { label: locale === 'zh' ? '制造' : 'Manufacturing', href: '/manufacturing' },
            { label: 'FAQ', href: '/resources' },
          ],
        },
      ],
    },
  }
}

export function getIndustrialHomepage(
  locale: LocaleCode,
  productList: ProductListResult,
  categoryTree: CategoryTree = industrialSensorCategoryTree,
  catalog?: ProductCatalogIndex,
): HomepageProjection {
  const copy = homepageText[locale]
  const site = siteText[locale]
  const categories = getPrimaryCategories(categoryTree, catalog)

  return {
    architectureVersion: architectureFreezeV1.version,
    hero: copy.hero,
    categories: {
      ...copy.categories,
      items: categories.map((category) => ({
        ...getCategoryCopy(category, locale),
        href: category.canonicalPath,
      })),
    },
    trust: {
      ...copy.trust,
      metrics: [
        { value: `${productList.pageInfo.total}`, label: locale === 'zh' ? '公开产品记录' : 'public product records' },
        { value: 'ISO / CE / RoHS', label: locale === 'zh' ? '认证与合规准备' : 'certification-ready' },
        { value: 'OEM', label: locale === 'zh' ? '批量配套与贴牌' : 'repeat program support' },
      ],
      proof: [
        { label: locale === 'zh' ? '数据手册' : 'Datasheets', value: locale === 'zh' ? '可追溯' : 'Traceable' },
        { label: locale === 'zh' ? '选型响应' : 'Selection response', value: '48h' },
        { label: locale === 'zh' ? '目标目录规模' : 'Catalog scale', value: '1000+' },
      ],
    },
    applicationProof: copy.applicationProof,
    products: {
      ...copy.products,
      totalLabel: getProductTotalLabel(locale, productList),
      viewAllLabel: site.actions.viewAll,
      detailsLabel: site.actions.details,
      items: productList.items,
    },
    industries: {
      ...copy.industries,
      items: industryItems[locale],
    },
    applications: {
      ...copy.applications,
      items: applicationItems[locale],
    },
    resources: {
      ...copy.resources,
      items: resourceItems[locale],
    },
    modules: {
      ...copy.modules,
      items: moduleItems[locale],
    },
    cta: copy.cta,
  }
}
