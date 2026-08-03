import type { LocaleCode } from './primitives'

const localizedTechnicalTerms: Record<string, Partial<Record<LocaleCode, string>>> = {
  'air': { zh: '空气' },
  'water': { zh: '水' },
  'oil': { zh: '油' },
  'natural gas': { zh: '天然气' },
  'groundwater': { zh: '地下水' },
  'wastewater': { zh: '废水' },
  'seawater': { zh: '海水' },
  'clean water': { zh: '清水' },
  'inert gas': { zh: '惰性气体' },
  'hydraulic oil': { zh: '液压油' },
  'gas': { zh: '气体' },
  'liquid': { zh: '液体' },
  'liquids': { zh: '液体' },
  'compressed air': { zh: '压缩空气' },
  'process media': { zh: '过程介质' },
  'customizable': { zh: '可定制' },
  'custom material': { zh: '定制材质' },
  'custom': { zh: '定制' },
  'standard': { zh: '标准型' },
  'normally closed': { zh: '常闭' },
  '2-position 2-way normally closed solenoid valve': { zh: '二位二通常闭电磁阀' },
  'stainless steel': { zh: '不锈钢' },
  'ceramic': { zh: '陶瓷' },
  '空气': { en: 'Air' },
  '水': { en: 'Water' },
  '油': { en: 'Oil' },
  '天然气': { en: 'Natural gas' },
  '地下水': { en: 'Groundwater' },
  '废水': { en: 'Wastewater' },
  '海水': { en: 'Seawater' },
  '清水': { en: 'Clean water' },
  '惰性气体': { en: 'Inert gas' },
  '液压油': { en: 'Hydraulic oil' },
  '气体': { en: 'Gas' },
  '液体': { en: 'Liquid' },
  '压缩空气': { en: 'Compressed air' },
  '过程介质': { en: 'Process media' },
  '不锈钢': { en: 'Stainless steel' },
  '陶瓷': { en: 'Ceramic' },
  '定制': { en: 'Custom' },
  '定制材质': { en: 'Custom material' },
  '标准型': { en: 'Standard' },
  '常闭': { en: 'Normally closed' },
  '二位二通常闭电磁阀': { en: '2-position 2-way normally closed solenoid valve' },
  '继电器输出': { en: 'Relay output' },
  '其他': { en: 'Other' },
  '2倍额定压力': { en: '2x rated pressure' },
  '2 倍额定压力': { en: '2x rated pressure' },
}

const preservedTechnicalTokens = new Set([
  'ABS',
  'CNG',
  'DIN',
  'EPDM',
  'FKM',
  'IIC',
  'LNG',
  'MOQ',
  'NBR',
  'OEM',
  'PC',
  'PEEK',
  'PTFE',
  'PUR',
  'PVC',
  'PVDF',
  'RFQ',
])

export function localizeTechnicalValue(value: string, locale: LocaleCode): string {
  const localized = localizeEmbeddedTechnicalTerms(value, locale)
    .split(/(\s*[/;,]\s*)/g)
    .map((segment) => localizeTechnicalSegment(segment, locale))
    .join('')

  if (locale === 'en' && containsCjkText(localized)) {
    return 'Contact Yufavor for configured value'
  }

  return localized
}

export function localizeTechnicalValues(values: readonly string[], locale: LocaleCode): readonly string[] {
  return values.map((value) => localizeTechnicalValue(value, locale))
}

function localizeTechnicalSegment(segment: string, locale: LocaleCode): string {
  if (!segment.trim() || /^[/;,\s]+$/.test(segment)) {
    return segment
  }

  const trimmed = segment.trim()
  const preserved = preserveTechnicalToken(trimmed)

  if (preserved) {
    return segment.replace(trimmed, preserved)
  }

  const localized = localizedTechnicalTerms[trimmed.toLowerCase()]?.[locale]
  return localized ? segment.replace(trimmed, localized) : segment
}

function localizeEmbeddedTechnicalTerms(value: string, locale: LocaleCode): string {
  if (locale !== 'en') {
    return value
  }

  return value
    .replace(/防护等级/g, 'ingress protection')
    .replace(/倍额定压力/g, 'x rated pressure')
    .replace(/其他/g, 'Other')
}

function preserveTechnicalToken(value: string): string | undefined {
  if (preservedTechnicalTokens.has(value)) {
    return value
  }

  if (/^\d+(?:\.\d+)?\s*(?:bar|mbar|kpa|mpa|pa|psi|mm|m|v|ma|mv|hz|c)$/i.test(value)) {
    return value
  }

  if (/^(?:IP\d{2}|DN\d+|G\d+(?:\/\d+)?|M\d+|NPT|PNP|NPN|RTD|PT\d+|SS\d+)$/i.test(value)) {
    return value
  }

  if (/^YF-[A-Z0-9]+$/i.test(value)) {
    return value
  }

  return undefined
}

export function containsCjkText(value: string): boolean {
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(value)
}

export function isTextSafeForLocale(value: string | undefined, locale: LocaleCode): value is string {
  const trimmed = value?.trim()

  if (!trimmed) {
    return false
  }

  if (locale === 'en') {
    return !containsCjkText(trimmed)
  }

  return !containsMojibakeText(trimmed)
}

function containsMojibakeText(value: string): boolean {
  return /[�ÃÂ]|(?:涓|浜|鍘|鏁|绋|阃|闃|鎶|鐢|浼|犳|娴|绌)/.test(value)
}
