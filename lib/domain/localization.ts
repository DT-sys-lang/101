import type { LocaleCode } from './primitives'

const localizedTechnicalTerms: Record<string, Partial<Record<LocaleCode, string>>> = {
  'air': { zh: '空气' },
  'water': { zh: '水' },
  'oil': { zh: '油' },
  'natural gas': { zh: '天然气' },
  'inert gas': { zh: '惰性气体' },
  'hydraulic oil': { zh: '液压油' },
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
  '惰性气体': { en: 'Inert gas' },
  '液压油': { en: 'Hydraulic oil' },
  '压缩空气': { en: 'Compressed air' },
  '过程介质': { en: 'Process media' },
  '不锈钢': { en: 'Stainless steel' },
  '陶瓷': { en: 'Ceramic' },
  '定制': { en: 'Custom' },
  '定制材质': { en: 'Custom material' },
  '标准型': { en: 'Standard' },
  '常闭': { en: 'Normally closed' },
  '二位二通常闭电磁阀': { en: '2-position 2-way normally closed solenoid valve' },
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
  return localizeEmbeddedTechnicalTerms(value, locale)
    .split(/(\s*[/;,]\s*)/g)
    .map((segment) => localizeTechnicalSegment(segment, locale))
    .join('')
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
