import type { ProductDetailPageData } from '@/lib/domain'
import type { ProductFaqItem } from '../faq'
import { getLocalizedProductUrl } from '../canonical'
import type { JsonObject } from './product'

export function buildProductFaqSchemaJsonLd(data: ProductDetailPageData, faqItems: readonly ProductFaqItem[]): JsonObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${getLocalizedProductUrl(data.locale, data.seo.slug.canonicalPath)}#faq`,
    mainEntity: faqItems.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}
