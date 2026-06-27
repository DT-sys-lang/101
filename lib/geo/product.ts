import { routing, type Locale } from '@/i18n/routing'
import { industrialSiteConfig, selectProductSeo, type ProductRecord } from '@/lib/domain'
import { getRuntimeDomainProductSourceVersion } from '@/lib/runtime/domain-products'
import { getAbsoluteUrl, getLocalizedProductUrl } from '@/lib/seo/canonical'
import { buildProductHrefLangs } from '@/lib/seo/hreflang'
import type { ProductFaqItem } from '@/lib/seo/faq'

export interface AIReadableIndustrialProduct {
  readonly '@context': string
  readonly '@type': 'AIReadableIndustrialProduct'
  readonly source: {
    readonly domainObject: 'ProductRecord' | 'ProductDetailPageData'
    readonly cacheKey?: string
    readonly productSourceVersion: string
  }
  readonly governance: ProductRecord['geoAi']['governance']
  readonly sourceUrl: string
  readonly hreflang: Record<string, string>
  readonly product: Record<string, unknown>
  readonly summary: ProductRecord['geoAi']['answerSummary']
  readonly facts: ProductRecord['geoAi']['factTable']
  readonly specifications: readonly Record<string, unknown>[]
  readonly selectionGuidance: ProductRecord['geoAi']['selectionGuidance']
  readonly evidence: readonly Record<string, unknown>[]
  readonly faq: readonly Record<string, unknown>[]
}

export function buildAiReadableIndustrialProduct(
  product: ProductRecord,
  locale: Locale,
  faqItems: readonly ProductFaqItem[] = [],
  source: { readonly domainObject?: 'ProductRecord' | 'ProductDetailPageData'; readonly cacheKey?: string } = {},
): AIReadableIndustrialProduct {
  const seo = selectProductSeo(product, locale)
  const geoAi = product.localizedGeoAi?.[locale] ?? product.geoAi
  const effectiveFaqItems = faqItems.length
    ? faqItems
    : geoAi.faq.map((faq) => ({
        question: faq.question,
        answer: faq.answer,
        audience: faq.audience,
        source: 'geo-ai-profile' as const,
        sourceRefs: faq.sourceRefs,
      }))

  return {
    '@context': `${industrialSiteConfig.origin}/geo-context/product-detail/v1`,
    '@type': 'AIReadableIndustrialProduct',
    source: {
      domainObject: source.domainObject ?? 'ProductRecord',
      cacheKey: source.cacheKey,
      productSourceVersion: getRuntimeDomainProductSourceVersion(),
    },
    governance: geoAi.governance,
    sourceUrl: getLocalizedProductUrl(locale, seo.slug.canonicalPath),
    hreflang: buildProductHrefLangs(product),
    product: {
      id: product.identity.id,
      name: geoAi.entity.canonicalName,
      model: product.identity.model,
      sku: product.identity.sku,
      brand: product.identity.brand,
      manufacturer: product.identity.manufacturer ?? product.identity.brand,
      canonicalPath: seo.slug.canonicalPath,
      lifecycle: product.identity.lifecycle,
      availability: product.identity.availability,
      categoryIds: product.classification.categoryPath,
      industryIds: product.classification.industryIds,
      applicationIds: product.classification.applicationIds,
    },
    summary: geoAi.answerSummary,
    facts: geoAi.factTable,
    specifications: product.specificationGroups.map((group) => ({
      key: group.key,
      label: group.label,
      values: group.values.map((value) => ({
        key: value.key,
        label: value.label,
        value: String(value.value),
        display: value.display,
        unit: value.unit ?? null,
        sourceRefs: value.sourceRefs ?? [],
      })),
    })),
    selectionGuidance: geoAi.selectionGuidance,
    evidence: buildEvidenceRefs(product, locale),
    faq: effectiveFaqItems.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
      audience: faq.audience,
      source: faq.source,
      sourceRefs: faq.sourceRefs ?? [],
    })),
  }
}

export function buildEvidenceRefs(product: ProductRecord, locale: Locale) {
  const geoAi = product.localizedGeoAi?.[locale] ?? product.geoAi

  return geoAi.evidence.map((evidence) => ({
    ...evidence,
    href: evidence.href ? getAbsoluteUrl(evidence.href) : null,
  }))
}

export function getProductGeoEndpoint(locale: Locale, product: ProductRecord) {
  const seo = selectProductSeo(product, locale)
  return getAbsoluteUrl(`/${locale}/geo${seo.slug.canonicalPath}`)
}

export function getSupportedGeoLocales() {
  return routing.locales
}
