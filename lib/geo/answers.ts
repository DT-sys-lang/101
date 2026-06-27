import { type Locale } from '@/i18n/routing'
import { selectProductSeo } from '@/lib/domain'
import { getRuntimeDomainProductRecords } from '@/lib/runtime/domain-products'
import { getLocalizedProductUrl } from '@/lib/seo/canonical'
import { buildApplicationGeoAnswerBlocks } from './application-answers'

export interface GeoProductAnswerBlock {
  readonly kind: 'product'
  readonly id: string
  readonly productId: string
  readonly model: string
  readonly locale: Locale
  readonly question: string
  readonly answer: string
  readonly audience: string
  readonly sourceRefs: readonly unknown[]
  readonly productUrl: string
}

export type GeoAnswerBlock = GeoProductAnswerBlock | ReturnType<typeof buildApplicationGeoAnswerBlocks>[number]

export interface GeoAnswerBlocksDocument {
  readonly version: 'geo-answer-blocks-v2'
  readonly locale: Locale
  readonly answers: readonly GeoAnswerBlock[]
}

export function buildGeoAnswerBlocksDocument(locale: Locale): GeoAnswerBlocksDocument {
  return {
    version: 'geo-answer-blocks-v2',
    locale,
    answers: [...buildGeoAnswerBlocks(locale), ...buildApplicationGeoAnswerBlocks(locale)],
  }
}

export function buildGeoAnswerBlocks(locale: Locale): readonly GeoProductAnswerBlock[] {
  return getRuntimeDomainProductRecords().flatMap((product) => {
    const seo = selectProductSeo(product, locale)
    const geoAi = product.localizedGeoAi?.[locale] ?? product.geoAi
    const productUrl = getLocalizedProductUrl(locale, seo.slug.canonicalPath)

    return geoAi.faq.map((faq, index) => ({
      kind: 'product' as const,
      id: `${product.identity.id}:faq:${index + 1}`,
      productId: product.identity.id,
      model: product.identity.model,
      locale,
      question: faq.question,
      answer: faq.answer,
      audience: faq.audience,
      sourceRefs: faq.sourceRefs,
      productUrl,
    }))
  })
}
