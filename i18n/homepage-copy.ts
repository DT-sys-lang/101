import type { Locale } from './routing'

export type LocalizedIconKey =
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

export interface SiteCopy {
  brand: {
    name: string
    descriptor: string
  }
  navigation: Array<{
    label: string
    href: string
  }>
  actions: {
    products: string
    quote: string
    details: string
    viewAll: string
    datasheet: string
  }
  footer: {
    summary: string
    columns: Array<{
      title: string
      links: Array<{ label: string; href: string }>
    }>
  }
}

export interface HomepageCopy {
  hero: {
    eyebrow: string
    title: string
    body: string
    primary: string
    secondary: string
    imageAlt: string
    metrics: Array<{ value: string; label: string }>
    entries: Array<{ label: string; description: string; href: string }>
  }
  categories: {
    eyebrow: string
    title: string
    body: string
    items: Array<{
      icon: LocalizedIconKey
      title: string
      description: string
      meta: string
      href: string
    }>
  }
  products: {
    eyebrow: string
    title: string
    body: string
    totalLabel: string
    items: Array<{
      id: string
      model: string
      title: string
      category: string
      summary: string
      href: string
      specs: Array<{ label: string; value: string }>
      industries: string[]
      status: string
    }>
  }
  industries: {
    eyebrow: string
    title: string
    body: string
    items: Array<{
      icon: LocalizedIconKey
      title: string
      description: string
      productCount: string
      href: string
    }>
  }
  modules: {
    eyebrow: string
    title: string
    body: string
    items: Array<{
      icon: LocalizedIconKey
      title: string
      description: string
      points: string[]
    }>
  }
  cta: {
    title: string
    body: string
    primary: string
    secondary: string
  }
}

const siteCopy: Record<Locale, SiteCopy> = {
  zh: {
    brand: {
      name: 'HEIYU Industrial',
      descriptor: '工业测量与 OEM 传感器',
    },
    navigation: [
      { label: '产品中心', href: '/products' },
      { label: '行业方案', href: '/industries' },
      { label: 'OEM 定制', href: '/oem' },
      { label: '资源中心', href: '/resources' },
      { label: '联系', href: '/contact' },
    ],
    actions: {
      products: '浏览产品',
      quote: '获取报价',
      details: '查看详情',
      viewAll: '查看全部',
      datasheet: '数据手册',
    },
    footer: {
      summary: '面向流体、机械、能源与自动化系统的工业测量产品与 OEM 传感器平台。',
      columns: [
        {
          title: '产品',
          links: [
            { label: '压力传感器', href: '/products#pressure' },
            { label: '液位传感器', href: '/products#level' },
            { label: '温度传感器', href: '/products#temperature' },
          ],
        },
        {
          title: '行业',
          links: [
            { label: '机械设备', href: '/industries#machine' },
            { label: '水处理', href: '/industries#water' },
            { label: '暖通空调', href: '/industries#hvac' },
          ],
        },
        {
          title: '服务',
          links: [
            { label: 'OEM 定制', href: '/oem' },
            { label: '品牌贴牌', href: '/oem#private-label' },
            { label: '批量交付', href: '/oem#delivery' },
          ],
        },
      ],
    },
  },
  en: {
    brand: {
      name: 'HEIYU Industrial',
      descriptor: 'Industrial measurement and OEM sensors',
    },
    navigation: [
      { label: 'Products', href: '/products' },
      { label: 'Industries', href: '/industries' },
      { label: 'OEM', href: '/oem' },
      { label: 'Resources', href: '/resources' },
      { label: 'Contact', href: '/contact' },
    ],
    actions: {
      products: 'Explore Products',
      quote: 'Request Quote',
      details: 'View Details',
      viewAll: 'View All',
      datasheet: 'Datasheet',
    },
    footer: {
      summary: 'Industrial measurement products and OEM sensor systems for fluid, machinery, energy, and automation applications.',
      columns: [
        {
          title: 'Products',
          links: [
            { label: 'Pressure Sensors', href: '/products#pressure' },
            { label: 'Level Sensors', href: '/products#level' },
            { label: 'Temperature Sensors', href: '/products#temperature' },
          ],
        },
        {
          title: 'Industries',
          links: [
            { label: 'Machine Building', href: '/industries#machine' },
            { label: 'Water Treatment', href: '/industries#water' },
            { label: 'HVAC', href: '/industries#hvac' },
          ],
        },
        {
          title: 'Services',
          links: [
            { label: 'OEM Solutions', href: '/oem' },
            { label: 'Private Label', href: '/oem#private-label' },
            { label: 'Batch Delivery', href: '/oem#delivery' },
          ],
        },
      ],
    },
  },
}

const homepageCopy: Record<Locale, HomepageCopy> = {
  zh: {
    hero: {
      eyebrow: '工业测量与 OEM 传感器平台',
      title: '面向机器、流体与能源系统的测量产品官网',
      body: '以压力、液位、温度和工业开关为核心，帮助采购、工程与 OEM 团队按产品、行业和应用场景快速进入选型路径。',
      primary: '浏览产品中心',
      secondary: '查看行业方案',
      imageAlt: '工业压力仪表与传感器安装在金属管路上的工厂场景',
      metrics: [
        { value: '1,000+', label: 'SKU 列表容量' },
        { value: '12+', label: '行业入口' },
        { value: '48h', label: '选型响应' },
      ],
      entries: [
        { label: '按产品类型', description: '压力、液位、温度、开关', href: '/products' },
        { label: '按行业场景', description: '机械、水处理、暖通、能源', href: '/industries' },
        { label: '按 OEM 需求', description: '信号、接口、外壳、贴牌', href: '/oem' },
      ],
    },
    categories: {
      eyebrow: '产品入口',
      title: '按工业买家的选型习惯组织产品',
      body: '首页优先呈现大类与应用边界，详细型号留给产品中心承载，适合后续扩展到千级产品列表。',
      items: [
        { icon: 'pressure', title: '压力传感器', description: '通用工业、液压、水泵、压缩机与防爆场景。', meta: '0-1,000 bar', href: '/products#pressure' },
        { icon: 'level', title: '液位传感器', description: '投入式、罐体液位、燃油液位与水处理液位。', meta: 'IP68 / 4-20mA', href: '/products#level' },
        { icon: 'temperature', title: '温度测量', description: 'PT100、热电偶、温度变送器与过程连接。', meta: '-50-600 C', href: '/products#temperature' },
        { icon: 'switch', title: '工业开关', description: '压力开关、温度开关与自动化保护回路。', meta: 'PLC / DCS', href: '/products#switches' },
      ],
    },
    products: {
      eyebrow: '产品卡系统',
      title: '面向大规模目录的稳定卡片结构',
      body: '卡片只承载列表索引信息：型号、类别、关键参数、行业标签和单一操作，便于服务器分页、缓存和批量渲染。',
      totalLabel: '示例展示 4 项，组件接口按 1,000+ 产品目录设计',
      items: [
        {
          id: 'p100',
          model: 'YF-P100',
          title: 'P100 工业压力变送器',
          category: '压力传感器',
          summary: '适用于泵站、液压系统和通用过程压力监测的紧凑型变送器。',
          href: '/products/p100',
          specs: [
            { label: '量程', value: '0-600 bar' },
            { label: '输出', value: '4-20mA / 0-10V' },
            { label: '防护', value: 'IP67' },
          ],
          industries: ['水泵', '液压', '机械'],
          status: '常规交付',
        },
        {
          id: 'lt80',
          model: 'YF-LT80',
          title: 'LT80 投入式液位传感器',
          category: '液位传感器',
          summary: '面向水处理、水箱和地下水位监测的投入式液位测量方案。',
          href: '/products/lt80',
          specs: [
            { label: '量程', value: '0-200 mH2O' },
            { label: '电缆', value: 'PUR / PTFE' },
            { label: '防护', value: 'IP68' },
          ],
          industries: ['水处理', '能源', '环保'],
          status: '可定制',
        },
        {
          id: 't20',
          model: 'YF-T20',
          title: 'T20 温度变送器',
          category: '温度测量',
          summary: '支持 PT100 与热电偶输入，适合工业过程与设备温度采集。',
          href: '/products/t20',
          specs: [
            { label: '输入', value: 'PT100 / TC' },
            { label: '输出', value: '4-20mA' },
            { label: '精度', value: '0.2% FS' },
          ],
          industries: ['暖通', '制药', '食品'],
          status: '批量供货',
        },
        {
          id: 'ps30',
          model: 'YF-PS30',
          title: 'PS30 压力开关',
          category: '工业开关',
          summary: '用于压缩机、泵和设备保护回路的可调式压力开关。',
          href: '/products/ps30',
          specs: [
            { label: '设定', value: '0.1-40 bar' },
            { label: '触点', value: 'SPDT' },
            { label: '寿命', value: '1M cycles' },
          ],
          industries: ['压缩机', '机械', '暖通'],
          status: '现货型号',
        },
      ],
    },
    industries: {
      eyebrow: '行业入口',
      title: '让客户先找到自己的系统，再进入产品',
      body: '工业官网不是货架陈列，行业入口帮助采购与工程团队快速建立信任和上下文。',
      items: [
        { icon: 'factory', title: '机械设备', description: '液压站、压缩机、工程机械和自动化产线。', productCount: '86 products', href: '/industries#machine' },
        { icon: 'water', title: '水处理', description: '泵站、水箱、过滤系统和市政水务监测。', productCount: '64 products', href: '/industries#water' },
        { icon: 'hvac', title: '暖通空调', description: '压差、温湿度、制冷回路和楼宇控制。', productCount: '42 products', href: '/industries#hvac' },
        { icon: 'energy', title: '能源系统', description: '锅炉、换热、储能辅助系统和电站设备。', productCount: '58 products', href: '/industries#energy' },
        { icon: 'chemical', title: '化工过程', description: '耐腐蚀材料、隔膜结构和安全监测回路。', productCount: '51 products', href: '/industries#chemical' },
        { icon: 'oem', title: 'OEM 制造商', description: '批量型号、接口定制、品牌贴牌与包装配置。', productCount: 'OEM ready', href: '/oem' },
      ],
    },
    modules: {
      eyebrow: 'Section system',
      title: '可复用的工业官网模块',
      body: '每个 section 都是独立 RSC 模块，接收纯 props，方便后续接入 CMS、MDX 或产品索引。',
      items: [
        { icon: 'catalog', title: '产品发现模块', description: '分类入口、精选产品、参数摘要和规格标签。', points: ['分类网格', '产品卡片', '参数条'] },
        { icon: 'quality', title: '信任证明模块', description: '认证、测试、质保和批量交付能力。', points: ['ISO / CE / RoHS', '校准能力', '交付承诺'] },
        { icon: 'oem', title: 'OEM 转化模块', description: '围绕信号、结构、连接器、贴牌和 MOQ 组织。', points: ['信号定制', '外壳定制', '品牌贴牌'] },
      ],
    },
    cta: {
      title: '从产品目录、行业方案或 OEM 需求开始',
      body: '结构已预留给后续 CMS 与产品索引接入，当前首页先把工业 B2B 的浏览路径、卡片系统和 section 模块跑通。',
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
        { value: '1,000+', label: 'SKU catalog capacity' },
        { value: '12+', label: 'industry gateways' },
        { value: '48h', label: 'selection response' },
      ],
      entries: [
        { label: 'By product type', description: 'Pressure, level, temperature, switches', href: '/products' },
        { label: 'By industry', description: 'Machinery, water, HVAC, energy', href: '/industries' },
        { label: 'By OEM need', description: 'Signal, connector, housing, label', href: '/oem' },
      ],
    },
    categories: {
      eyebrow: 'Product entry points',
      title: 'Organized around how industrial buyers select products',
      body: 'The homepage exposes categories and application boundaries while detailed model data stays in the product center for large catalog growth.',
      items: [
        { icon: 'pressure', title: 'Pressure Sensors', description: 'General industry, hydraulics, pumps, compressors, and hazardous areas.', meta: '0-1,000 bar', href: '/products#pressure' },
        { icon: 'level', title: 'Level Sensors', description: 'Submersible, tank level, fuel level, and water treatment measurement.', meta: 'IP68 / 4-20mA', href: '/products#level' },
        { icon: 'temperature', title: 'Temperature Measurement', description: 'PT100, thermocouples, transmitters, and process connections.', meta: '-50-600 C', href: '/products#temperature' },
        { icon: 'switch', title: 'Industrial Switches', description: 'Pressure switches, temperature switches, and protection loops.', meta: 'PLC / DCS', href: '/products#switches' },
      ],
    },
    products: {
      eyebrow: 'Product card system',
      title: 'Stable cards for high-volume catalogs',
      body: 'Cards carry only listing-index data: model, category, key specs, industry tags, and one clear action, keeping pagination and cache strategy straightforward.',
      totalLabel: 'Showing 4 examples, with component contracts designed for 1,000+ products',
      items: [
        {
          id: 'p100',
          model: 'YF-P100',
          title: 'P100 Industrial Pressure Transmitter',
          category: 'Pressure Sensors',
          summary: 'Compact transmitter for pump stations, hydraulic systems, and process pressure monitoring.',
          href: '/products/p100',
          specs: [
            { label: 'Range', value: '0-600 bar' },
            { label: 'Output', value: '4-20mA / 0-10V' },
            { label: 'Ingress', value: 'IP67' },
          ],
          industries: ['Water pumps', 'Hydraulics', 'Machinery'],
          status: 'Standard lead time',
        },
        {
          id: 'lt80',
          model: 'YF-LT80',
          title: 'LT80 Submersible Level Sensor',
          category: 'Level Sensors',
          summary: 'Submersible level measurement for water treatment, tanks, and groundwater monitoring.',
          href: '/products/lt80',
          specs: [
            { label: 'Range', value: '0-200 mH2O' },
            { label: 'Cable', value: 'PUR / PTFE' },
            { label: 'Ingress', value: 'IP68' },
          ],
          industries: ['Water treatment', 'Energy', 'Environmental'],
          status: 'Configurable',
        },
        {
          id: 't20',
          model: 'YF-T20',
          title: 'T20 Temperature Transmitter',
          category: 'Temperature Measurement',
          summary: 'PT100 and thermocouple input transmitter for industrial process temperature acquisition.',
          href: '/products/t20',
          specs: [
            { label: 'Input', value: 'PT100 / TC' },
            { label: 'Output', value: '4-20mA' },
            { label: 'Accuracy', value: '0.2% FS' },
          ],
          industries: ['HVAC', 'Pharma', 'Food'],
          status: 'Batch supply',
        },
        {
          id: 'ps30',
          model: 'YF-PS30',
          title: 'PS30 Pressure Switch',
          category: 'Industrial Switches',
          summary: 'Adjustable pressure switch for compressors, pumps, and equipment protection circuits.',
          href: '/products/ps30',
          specs: [
            { label: 'Setpoint', value: '0.1-40 bar' },
            { label: 'Contact', value: 'SPDT' },
            { label: 'Life', value: '1M cycles' },
          ],
          industries: ['Compressors', 'Machinery', 'HVAC'],
          status: 'Stock models',
        },
      ],
    },
    industries: {
      eyebrow: 'Industry gateways',
      title: 'Help customers find their system before the product',
      body: 'Industrial websites are not just product shelves. Industry paths create context for procurement and engineering teams.',
      items: [
        { icon: 'factory', title: 'Machine Building', description: 'Hydraulic stations, compressors, construction machinery, and automated lines.', productCount: '86 products', href: '/industries#machine' },
        { icon: 'water', title: 'Water Treatment', description: 'Pump stations, tanks, filtration systems, and municipal monitoring.', productCount: '64 products', href: '/industries#water' },
        { icon: 'hvac', title: 'HVAC', description: 'Differential pressure, temperature, humidity, refrigeration, and building control.', productCount: '42 products', href: '/industries#hvac' },
        { icon: 'energy', title: 'Energy Systems', description: 'Boilers, heat exchange, energy-storage auxiliaries, and power equipment.', productCount: '58 products', href: '/industries#energy' },
        { icon: 'chemical', title: 'Chemical Process', description: 'Corrosion-resistant materials, diaphragm structures, and safety loops.', productCount: '51 products', href: '/industries#chemical' },
        { icon: 'oem', title: 'OEM Manufacturers', description: 'Batch models, interface customization, private label, and packaging.', productCount: 'OEM ready', href: '/oem' },
      ],
    },
    modules: {
      eyebrow: 'Section system',
      title: 'Reusable modules for industrial websites',
      body: 'Each section is an isolated Server Component that accepts plain props, ready for later CMS, MDX, or product-index integration.',
      items: [
        { icon: 'catalog', title: 'Product Discovery', description: 'Category entries, featured products, parameter summaries, and spec tags.', points: ['Category grid', 'Product cards', 'Spec strips'] },
        { icon: 'quality', title: 'Proof and Quality', description: 'Certification, testing, warranty, and batch delivery confidence.', points: ['ISO / CE / RoHS', 'Calibration', 'Delivery commitments'] },
        { icon: 'oem', title: 'OEM Conversion', description: 'Structured around signals, housing, connectors, labeling, and MOQ.', points: ['Signal design', 'Housing design', 'Private label'] },
      ],
    },
    cta: {
      title: 'Start from catalog, industry, or OEM requirements',
      body: 'The structure is ready for CMS and product-index integration. The first pass establishes industrial B2B navigation, product cards, and section modules.',
      primary: 'Open Product Center',
      secondary: 'Send Requirements',
    },
  },
}

export function getSiteCopy(locale: Locale) {
  return siteCopy[locale]
}

export function getHomepageCopy(locale: Locale) {
  return homepageCopy[locale]
}
