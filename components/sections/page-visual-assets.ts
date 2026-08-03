import type { Locale } from '@/i18n/routing'
import type {
  EntryCardViewModel,
  EntryPageViewModel,
  ResourceCollectionKind,
  ResourceDetailViewModel,
  ResourceEntryViewModel,
  StaticInfoPageKind,
} from '@/lib/domain'

export interface PageVisualAsset {
  readonly href: string
  readonly alt: string
  readonly position?: string
}

const stitchBase = '/stitch/heiyu-trans-industrial-design-system'

const visuals = {
  productSensor: `${stitchBase}/02-product-catalog-industrial-sensors-valves/assets/asset-003.jpg`,
  precisionSensor: `${stitchBase}/03-product-detail-precision-pressure-sensor-series/assets/asset-003.jpg`,
  processBench: `${stitchBase}/04-water-pump-systems-updated-hero-image/assets/asset-003.png`,
  oemLine: `${stitchBase}/05-oem-solutions-enhanced-hero-background/assets/asset-003.jpg`,
  manufacturing: `${stitchBase}/07-manufacturing-global-production-standards/assets/asset-003.jpg`,
  company: `${stitchBase}/08-about-us-modern-industrial-redesign/assets/asset-003.png`,
  resourceDocument: `${stitchBase}/03-product-detail-precision-pressure-sensor-series/assets/asset-003.jpg`,
  contact: `${stitchBase}/11-contact-engineering-rfq-support/assets/asset-003.png`,
  applicationCase: `${stitchBase}/04-water-pump-systems-updated-hero-image/assets/asset-003.png`,
  oemCase: `${stitchBase}/05-oem-solutions-enhanced-hero-background/assets/asset-003.jpg`,
} as const

function localizedAlt(locale: Locale, zh: string, en: string) {
  return locale === 'zh' ? zh : en
}

export function getEntryPageVisual(locale: Locale, data: EntryPageViewModel): PageVisualAsset {
  const keys = data.entries.map((entry) => entry.key)
  const isApplicationPage = keys.some((key) => key === 'high-pressure-measurement' || key === 'industrial-pipeline-monitoring' || key === 'oem-sensor-integration')

  return isApplicationPage
    ? {
        href: visuals.processBench,
        alt: localizedAlt(locale, '工业测量测试台与传感器调试场景', 'Industrial measurement test bench and sensor setup'),
        position: 'center',
      }
    : {
        href: visuals.manufacturing,
        alt: localizedAlt(locale, '工业制造现场与过程测量设备', 'Industrial manufacturing floor with process measurement equipment'),
        position: 'center',
      }
}

export function getEntryCardVisual(locale: Locale, entry: EntryCardViewModel, index = 0): PageVisualAsset {
  const byKey: Record<string, PageVisualAsset> = {
    'high-pressure-measurement': {
      href: visuals.precisionSensor,
      alt: localizedAlt(locale, '高压测量用压力传感器', 'Pressure sensor for high pressure measurement'),
      position: 'center',
    },
    'industrial-pipeline-monitoring': {
      href: visuals.processBench,
      alt: localizedAlt(locale, '工业管线监测与测试设备', 'Industrial pipeline monitoring and test equipment'),
      position: 'center',
    },
    'oem-sensor-integration': {
      href: visuals.oemLine,
      alt: localizedAlt(locale, 'OEM 传感器集成生产线', 'OEM sensor integration production line'),
      position: 'center',
    },
    'oil-gas': {
      href: visuals.processBench,
      alt: localizedAlt(locale, '油气工况的过程测量场景', 'Process measurement scene for oil and gas applications'),
      position: 'center',
    },
    'water-treatment': {
      href: visuals.applicationCase,
      alt: localizedAlt(locale, '水处理与泵站测量应用', 'Water treatment and pump station measurement application'),
      position: 'center',
    },
    'industrial-automation': {
      href: visuals.oemLine,
      alt: localizedAlt(locale, '工业自动化设备与传感器集成', 'Industrial automation equipment and sensor integration'),
      position: 'center',
    },
    energy: {
      href: visuals.manufacturing,
      alt: localizedAlt(locale, '能源系统与工业过程测量', 'Energy system and industrial process measurement'),
      position: 'center',
    },
    manufacturing: {
      href: visuals.manufacturing,
      alt: localizedAlt(locale, '机械工程制造与检测现场', 'Machine engineering manufacturing and inspection floor'),
      position: 'center',
    },
    'chemical-processing': {
      href: visuals.processBench,
      alt: localizedAlt(locale, '化工过程产线测量应用', 'Chemical process line measurement application'),
      position: 'center',
    },
  }

  return byKey[entry.key] ?? getRotatingVisual(locale, index)
}

export function getStaticInfoVisual(locale: Locale, kind: StaticInfoPageKind): PageVisualAsset {
  const byKind: Record<StaticInfoPageKind, PageVisualAsset> = {
    oem: {
      href: visuals.oemLine,
      alt: localizedAlt(locale, 'OEM 定制生产与装配场景', 'OEM customization production and assembly scene'),
      position: 'center',
    },
    company: {
      href: visuals.company,
      alt: localizedAlt(locale, 'Yufavor 公司与工业制造能力', 'Yufavor company and industrial manufacturing capability'),
      position: 'center',
    },
    resources: {
      href: visuals.resourceDocument,
      alt: localizedAlt(locale, '产品资料和技术文档中心', 'Product resources and technical document center'),
      position: 'center',
    },
    contact: {
      href: visuals.contact,
      alt: localizedAlt(locale, '工程询价与客户支持沟通', 'Engineering RFQ and customer support discussion'),
      position: 'center',
    },
    quality: {
      href: visuals.precisionSensor,
      alt: localizedAlt(locale, '工业传感器质量检测与校准', 'Industrial sensor quality inspection and calibration'),
      position: 'center',
    },
    manufacturing: {
      href: visuals.manufacturing,
      alt: localizedAlt(locale, '工业制造能力和生产现场', 'Industrial manufacturing capability and production floor'),
      position: 'center',
    },
  }

  return byKind[kind]
}

export function getResourceEntryVisual(
  locale: Locale,
  kind: ResourceCollectionKind,
  entry: ResourceEntryViewModel,
  index = 0,
): PageVisualAsset {
  if (entry.coverImage) {
    return entry.coverImage
  }

  return getResourceFallbackVisual(locale, kind, entry.key, index)
}

export function getResourceDetailVisual(locale: Locale, data: ResourceDetailViewModel): PageVisualAsset {
  if (data.coverImage) {
    return data.coverImage
  }

  return getResourceFallbackVisual(locale, data.kind, data.title, 0)
}

function getResourceFallbackVisual(locale: Locale, kind: ResourceCollectionKind, key: string, index: number): PageVisualAsset {
  const lowerKey = key.toLowerCase()

  if (lowerKey.includes('oem')) {
    return {
      href: visuals.oemCase,
      alt: localizedAlt(locale, 'OEM 项目资料和应用案例', 'OEM project resources and application case'),
      position: 'center',
    }
  }

  if (kind === 'cases') {
    return {
      href: visuals.applicationCase,
      alt: localizedAlt(locale, '工业应用案例现场', 'Industrial application case scene'),
      position: 'center',
    }
  }

  if (kind === 'manuals') {
    return {
      href: visuals.resourceDocument,
      alt: localizedAlt(locale, '产品手册和数据表资料', 'Product manuals and datasheet resources'),
      position: 'center',
    }
  }

  if (kind === 'blog') {
    return getRotatingVisual(locale, index)
  }

  return getRotatingVisual(locale, index)
}

function getRotatingVisual(locale: Locale, index: number): PageVisualAsset {
  const fallbackVisuals: readonly PageVisualAsset[] = [
    {
      href: visuals.productSensor,
      alt: localizedAlt(locale, '工业压力传感器产品图', 'Industrial pressure sensor product image'),
      position: 'center',
    },
    {
      href: visuals.processBench,
      alt: localizedAlt(locale, '工业测量测试与校准场景', 'Industrial measurement test and calibration scene'),
      position: 'center',
    },
    {
      href: visuals.manufacturing,
      alt: localizedAlt(locale, '工业制造与生产现场', 'Industrial manufacturing and production floor'),
      position: 'center',
    },
  ]

  return fallbackVisuals[index % fallbackVisuals.length]
}
