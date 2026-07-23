import type { GeoAiAudience, ProductDetailPageData, SourceRef } from '@/lib/domain'

export interface ProductFaqItem {
  readonly question: string
  readonly answer: string
  readonly audience: GeoAiAudience
  readonly source: 'geo-ai-profile' | 'measurement' | 'output' | 'compatibility' | 'installation' | 'commercial-terms'
  readonly sourceRefs?: readonly SourceRef[]
}

const faqCopy = {
  en: {
    measurementQuestion: (model: string) => `What measurement range does ${model} support?`,
    measurementAnswer: (model: string, ranges: string) => `${model} supports ${ranges} measurement ranges according to the domain product specifications.`,
    outputQuestion: (model: string) => `What output signal does ${model} provide?`,
    outputAnswer: (model: string, outputs: string) => `${model} provides ${outputs} output options from the domain product record.`,
    compatibilityQuestion: (model: string) => `Which media is ${model} compatible with?`,
    compatibilityAnswer: (model: string, media: string) => `${model} is listed for compatible media including ${media}.`,
    installationQuestion: (model: string) => `How is ${model} connected or installed?`,
    installationAnswer: (model: string, process: string, electrical: string) => `${model} uses ${process} for process connection and ${electrical} for electrical connection.`,
    quoteQuestion: (model: string) => `What information is available for quoting ${model}?`,
    quoteAnswer: (model: string, terms: string) => `${model} commercial terms in the domain record include ${terms}.`,
  },
  zh: {
    measurementQuestion: (model: string) => `${model} supports which measurement range?`,
    measurementAnswer: (model: string, ranges: string) => `${model} supports ${ranges} measurement ranges according to the domain product specifications.`,
    outputQuestion: (model: string) => `${model} provides which output signal?`,
    outputAnswer: (model: string, outputs: string) => `${model} provides ${outputs} output options from the domain product record.`,
    compatibilityQuestion: (model: string) => `${model} is compatible with which media?`,
    compatibilityAnswer: (model: string, media: string) => `${model} is listed for compatible media including ${media}.`,
    installationQuestion: (model: string) => `How is ${model} connected or installed?`,
    installationAnswer: (model: string, process: string, electrical: string) => `${model} uses ${process} for process connection and ${electrical} for electrical connection.`,
    quoteQuestion: (model: string) => `What quotation information is available for ${model}?`,
    quoteAnswer: (model: string, terms: string) => `${model} commercial terms in the domain record include ${terms}.`,
  },
} as const

export function buildProductFaqItems(data: ProductDetailPageData): readonly ProductFaqItem[] {
  const items: ProductFaqItem[] = []
  const copy = faqCopy[data.locale]
  const model = data.product.identity.model

  for (const faq of data.geoAi.faq) {
    addUniqueFaq(items, {
      question: faq.question,
      answer: faq.answer,
      audience: faq.audience,
      source: 'geo-ai-profile',
      sourceRefs: faq.sourceRefs,
    })
  }

  const ranges = data.product.measurements.map((measurement) => measurement.range.display).join(', ')

  if (ranges) {
    addUniqueFaq(items, {
      question: copy.measurementQuestion(model),
      answer: copy.measurementAnswer(model, ranges),
      audience: 'engineer',
      source: 'measurement',
      sourceRefs: getFactSourceRefs(data, 'measurement-range'),
    })
  }

  const outputs = data.product.outputs.map((output) => output.value).join(', ')

  if (outputs) {
    addUniqueFaq(items, {
      question: copy.outputQuestion(model),
      answer: copy.outputAnswer(model, outputs),
      audience: 'engineer',
      source: 'output',
      sourceRefs: getFactSourceRefs(data, 'capability'),
    })
  }

  const compatibleMedia = data.product.environmentalLimits.compatibleMedia?.join(', ')

  if (compatibleMedia) {
    addUniqueFaq(items, {
      question: copy.compatibilityQuestion(model),
      answer: copy.compatibilityAnswer(model, compatibleMedia),
      audience: 'engineer',
      source: 'compatibility',
      sourceRefs: getFactSourceRefs(data, 'compatibility'),
    })
  }

  if (data.product.connections) {
    addUniqueFaq(items, {
      question: copy.installationQuestion(model),
      answer: copy.installationAnswer(model, data.product.connections.process.value, data.product.connections.electrical.value),
      audience: 'engineer',
      source: 'installation',
      sourceRefs: getFactSourceRefs(data, 'installation'),
    })
  } else if (data.product.valveProfile) {
    addUniqueFaq(items, {
      question: copy.installationQuestion(model),
      answer: `${model} uses ${data.product.valveProfile.connection} connection with ${data.product.valveProfile.mode} mode.`,
      audience: 'engineer',
      source: 'installation',
      sourceRefs: getFactSourceRefs(data, 'installation'),
    })
  }

  const commercialTerms = data.product.commercialTerms
    ? [
        data.product.commercialTerms.minimumOrderQuantity ? `MOQ ${data.product.commercialTerms.minimumOrderQuantity}` : null,
        data.product.commercialTerms.standardLeadTime ? `lead time ${data.product.commercialTerms.standardLeadTime}` : null,
        data.product.commercialTerms.warranty ? `warranty ${data.product.commercialTerms.warranty}` : null,
        data.product.commercialTerms.oemCustomizable ? 'OEM customizable' : null,
        data.product.commercialTerms.privateLabelAvailable ? 'private label available' : null,
      ].filter(isString).join(', ')
    : ''

  if (commercialTerms) {
    addUniqueFaq(items, {
      question: copy.quoteQuestion(model),
      answer: copy.quoteAnswer(model, commercialTerms),
      audience: 'buyer',
      source: 'commercial-terms',
    })
  }

  return items.slice(0, 8)
}

function getFactSourceRefs(data: ProductDetailPageData, claimType: ProductDetailPageData['geoAi']['factTable'][number]['claimType']) {
  return data.geoAi.factTable.find((fact) => fact.claimType === claimType)?.sourceRefs
}

function addUniqueFaq(items: ProductFaqItem[], item: ProductFaqItem) {
  if (items.some((existingItem) => existingItem.question === item.question)) {
    return
  }

  items.push(item)
}

function isString(value: string | null): value is string {
  return typeof value === 'string'
}
