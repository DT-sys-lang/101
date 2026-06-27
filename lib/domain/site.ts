import { architectureFreezeV1 } from './architecture-freeze-v1'
import { industrialSensorCategoryTree, type CategoryNode } from './category'
import type { ProductListItem, ProductListResult } from './product-catalog'
import type { CategoryId, LocaleCode, LocalizedText } from './primitives'

export const industrialSiteConfig = {
  origin: 'https://www.heiyu-industrial.example',
  websiteId: 'https://www.heiyu-industrial.example/#website',
  organizationId: 'https://www.heiyu-industrial.example/#organization',
  brandName: 'HEIYU Industrial',
} as const

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
  readonly footer: {
    readonly summary: string
    readonly badges: readonly string[]
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
    readonly items: readonly { readonly label: string; readonly value: string }[]
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
    brand: { name: 'HEIYU Industrial', descriptor: '工业测量与 OEM 传感器' },
    navigation: {
      products: '产品中心',
      industries: '行业方案',
      oem: 'OEM 定制',
      resources: '资源中心',
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
      summary: '面向流体、机械、能源与自动化系统的工业测量产品和 OEM 传感器平台。',
      products: '产品',
      industries: '行业',
      services: '服务',
      badges: ['ISO 9001', 'OEM', 'Global Delivery'],
    },
  },
  en: {
    brand: { name: 'HEIYU Industrial', descriptor: 'Industrial measurement and OEM sensors' },
    navigation: {
      products: 'Products',
      industries: 'Industries',
      oem: 'OEM',
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
    language: { currentLabel: 'EN', alternateLabel: '中文' },
    footer: {
      summary: 'Industrial measurement products and OEM sensor systems for fluid, machinery, energy, and automation applications.',
      products: 'Products',
      industries: 'Industries',
      services: 'Services',
      badges: ['ISO 9001', 'OEM', 'Global Delivery'],
    },
  },
} as const satisfies Record<LocaleCode, {
  readonly brand: { readonly name: string; readonly descriptor: string }
  readonly navigation: Record<'products' | 'industries' | 'oem' | 'resources' | 'contact', string>
  readonly actions: SiteLayoutProjection['actions']
  readonly language: SiteLayoutProjection['language']
  readonly footer: {
    readonly summary: string
    readonly products: string
    readonly industries: string
    readonly services: string
    readonly badges: readonly string[]
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
      eyebrow: '工业测量与 OEM 传感器平台',
      title: '面向机械、流体与能源系统的测量产品官网',
      body: '以压力、液位、温度和工业开关为核心，帮助采购、工程与 OEM 团队按产品、行业和应用场景快速进入选型路径。',
      primary: '浏览产品中心',
      secondary: '查看行业方案',
      imageAlt: '安装在金属工艺管路上的工业压力仪表与传感器',
      metrics: [
        { value: '1000+', label: '产品目录容量' },
        { value: '5', label: '重点行业入口' },
        { value: '48h', label: '选型响应窗口' },
      ],
      entries: [
        { label: '按产品类型', description: '压力、液位、温度、开关', href: industrialSensorCategoryTree.root.canonicalPath },
        { label: '按行业场景', description: '油气、水处理、自动化、能源、制造', href: '/industries' },
        { label: '按 OEM 需求', description: '信号、接口、外壳、贴牌', href: '/oem' },
      ],
    },
    categories: {
      eyebrow: '产品入口',
      title: '按工业买家的选型习惯组织产品',
      body: '从压力、液位、温度和工业开关进入目录，型号、量程、输出和供货状态全部来自 Domain 产品索引，适合扩展到千级产品列表。',
      linkLabel: '进入分类',
    },
    trust: {
      eyebrow: '品牌信任体系',
      title: '用工程证据、批量交付和 OEM 配套建立采购信任',
      body: '面向长期供货、重复设备项目和跨区域采购，首页优先呈现认证、数据手册、选型响应、质保和批量交付能力。',
    },
    applicationProof: {
      eyebrow: '应用路径',
      title: '把测量任务转成可报价的产品需求',
      body: '应用入口围绕工况、介质、量程、输出、连接和交付窗口组织，便于工程与采购团队形成 RFQ。',
      items: [
        { label: '高压测量', value: '液压站 / 泵 / 压缩机' },
        { label: '管线监测', value: '压力 / 差压 / 温度' },
        { label: 'OEM 集成', value: '信号 / 接口 / 贴牌' },
      ],
    },
    products: {
      eyebrow: '产品卡片系统',
      title: '面向大规模目录的稳定卡片结构',
      body: '卡片只承载列表索引信息：型号、类别、关键参数和单一操作，便于服务器分页、缓存和批量渲染。',
    },
    industries: {
      eyebrow: '行业入口',
      title: '先定位行业系统，再进入可选产品',
      body: '行业入口按石油与天然气、水处理、工业自动化、能源和制造业组织，让采购与工程团队先建立工况上下文，再进入产品选型。',
      linkLabel: '查看方案',
    },
    applications: {
      eyebrow: '应用场景入口',
      title: '按测量任务连接产品、参数和 RFQ 路径',
      body: '高压测量、工业管线监测和 OEM 传感器集成是工程选型最常见的任务入口。',
      linkLabel: '查看应用',
    },
    modules: {
      eyebrow: 'Section system',
      title: '可复用的工业官网模块',
      body: '每个 section 都是独立 RSC 模块，接收纯 props，便于后续接入 CMS、MDX 或产品索引。',
    },
    cta: {
      title: '从产品目录、行业方案或 OEM 需求开始',
      body: '提交介质、量程、输出、连接、数量和交付窗口，销售与工程团队可按产品、行业或应用路径快速回复。',
      primary: '进入产品中心',
      secondary: '提交选型需求',
    },
  },
  en: {
    hero: {
      eyebrow: 'Industrial measurement and OEM sensor platform',
      title: 'Measurement products for machinery, fluid, and energy systems',
      body: 'A product-discovery surface built around pressure, level, temperature, and industrial switch categories, with direct paths for buyers, engineers, and OEM teams.',
      primary: 'Explore Products',
      secondary: 'View Industries',
      imageAlt: 'Industrial pressure instruments and sensors installed on metal process piping',
      metrics: [
        { value: '1000+', label: 'catalog capacity' },
        { value: '5', label: 'priority industry gateways' },
        { value: '48h', label: 'selection response window' },
      ],
      entries: [
        { label: 'By product type', description: 'Pressure, level, temperature, switches', href: industrialSensorCategoryTree.root.canonicalPath },
        { label: 'By industry', description: 'Oil, water, automation, energy, manufacturing', href: '/industries' },
        { label: 'By OEM need', description: 'Signal, connector, housing, label', href: '/oem' },
      ],
    },
    categories: {
      eyebrow: 'Product entry points',
      title: 'Organized around how industrial buyers select products',
      body: 'The homepage exposes categories and application boundaries while detailed model data stays in the product center for large catalog growth.',
      linkLabel: 'Open category',
    },
    trust: {
      eyebrow: 'Industrial trust system',
      title: 'Build buyer confidence with evidence, supply reliability, and OEM readiness',
      body: 'For repeat machine builds and long-term procurement, the homepage highlights certification, datasheets, selection response, and batch delivery capability.',
    },
    applicationProof: {
      eyebrow: 'Application paths',
      title: 'Translate operating conditions into quote-ready requirements',
      body: 'Application gateways organize media, range, output, connection, quantity, and delivery windows so engineering and purchasing teams can form an RFQ.',
      items: [
        { label: 'High pressure', value: 'Hydraulics / pumps / compressors' },
        { label: 'Pipeline monitoring', value: 'Pressure / DP / temperature' },
        { label: 'OEM integration', value: 'Signal / connector / label' },
      ],
    },
    products: {
      eyebrow: 'Product card system',
      title: 'Stable cards for high-volume catalogs',
      body: 'Cards carry only listing-index data: model, category, key specs, and one clear action, keeping pagination and cache strategy straightforward.',
    },
    industries: {
      eyebrow: 'Industry gateways',
      title: 'Help customers find their system before the product',
      body: 'Industrial websites are not just product shelves. Industry paths create context for procurement and engineering teams.',
      linkLabel: 'View solution',
    },
    applications: {
      eyebrow: 'Application gateways',
      title: 'Connect measurement tasks to products, parameters, and RFQ paths',
      body: 'High pressure measurement, pipeline monitoring, and OEM integration are common engineering entry points for sensor selection.',
      linkLabel: 'View application',
    },
    modules: {
      eyebrow: 'Section system',
      title: 'Reusable modules for industrial websites',
      body: 'Each section is an isolated Server Component that accepts plain props, ready for later CMS, MDX, or product-index integration.',
    },
    cta: {
      title: 'Start from catalog, industry, or OEM requirements',
      body: 'Send media, range, output, connection, quantity, and delivery window so sales and engineering can reply by product, industry, or application path.',
      primary: 'Open Product Center',
      secondary: 'Send Requirements',
    },
  },
} as const satisfies Record<LocaleCode, Omit<HomepageProjection, 'architectureVersion' | 'trust' | 'categories' | 'products' | 'industries' | 'applications' | 'modules'> & {
  readonly categories: Omit<HomepageProjection['categories'], 'items'>
  readonly trust: Pick<HomepageProjection['trust'], 'eyebrow' | 'title' | 'body'>
  readonly products: Pick<HomepageProjection['products'], 'eyebrow' | 'title' | 'body'>
  readonly industries: Omit<GatewaySectionProjection, 'items'>
  readonly applications: Omit<GatewaySectionProjection, 'items'>
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
    { icon: 'catalog', title: '产品发现模块', description: '分类入口、精选产品、参数摘要和规格标签。', points: ['分类网格', '产品卡片', '参数条'] },
    { icon: 'quality', title: '信任证明模块', description: '认证、测试、质保和批量交付能力。', points: ['ISO / CE / RoHS', '校准能力', '交付承诺'] },
    { icon: 'oem', title: 'OEM 转化模块', description: '围绕信号、结构、连接器、贴牌和 MOQ 组织。', points: ['信号定制', '外壳定制', '品牌贴牌'] },
  ],
  en: [
    { icon: 'catalog', title: 'Product Discovery', description: 'Category entries, featured products, parameter summaries, and spec tags.', points: ['Category grid', 'Product cards', 'Spec strips'] },
    { icon: 'quality', title: 'Proof and Quality', description: 'Certification, testing, warranty, and batch delivery confidence.', points: ['ISO / CE / RoHS', 'Calibration', 'Delivery commitments'] },
    { icon: 'oem', title: 'OEM Conversion', description: 'Structured around signals, housing, connectors, labeling, and MOQ.', points: ['Signal design', 'Housing design', 'Private label'] },
  ],
} as const satisfies Record<LocaleCode, HomepageProjection['modules']['items']>

function localize(text: LocalizedText, locale: LocaleCode) {
  return text[locale] ?? text.en
}

function getPrimaryCategories() {
  return [...(industrialSensorCategoryTree.root.children ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
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

export function getIndustrialSiteLayout(locale: LocaleCode): SiteLayoutProjection {
  const copy = siteText[locale]
  const categories = getPrimaryCategories()

  return {
    architectureVersion: architectureFreezeV1.version,
    brand: copy.brand,
    navigation: [
      { label: copy.navigation.products, href: industrialSensorCategoryTree.root.canonicalPath },
      { label: copy.navigation.industries, href: '/industries' },
      { label: copy.navigation.oem, href: '/oem' },
      { label: copy.navigation.resources, href: '/resources' },
      { label: copy.navigation.contact, href: '/contact' },
    ],
    actions: copy.actions,
    language: copy.language,
    footer: {
      summary: copy.footer.summary,
      badges: copy.footer.badges,
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
          title: copy.footer.services,
          links: [
            { label: copy.navigation.oem, href: '/oem' },
            { label: locale === 'zh' ? '品牌贴牌' : 'Private Label', href: '/oem#private-label' },
            { label: locale === 'zh' ? '批量交付' : 'Batch Delivery', href: '/oem#delivery' },
          ],
        },
      ],
    },
  }
}

export function getIndustrialHomepage(locale: LocaleCode, productList: ProductListResult): HomepageProjection {
  const copy = homepageText[locale]
  const site = siteText[locale]

  return {
    architectureVersion: architectureFreezeV1.version,
    hero: copy.hero,
    categories: {
      ...copy.categories,
      items: getPrimaryCategories().map((category) => ({
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
    modules: {
      ...copy.modules,
      items: moduleItems[locale],
    },
    cta: copy.cta,
  }
}
