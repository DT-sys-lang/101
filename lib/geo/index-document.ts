import { routing, type Locale } from '@/i18n/routing'
import { finalGrowthSystemTarget, getApplicationEntryPageViewModel, getIndustryEntryPageViewModel, industrialSiteConfig } from '@/lib/domain'
import { getRuntimeDomainProductRecords, getRuntimeDomainProductSource, runtimeProductViewModelSource } from '@/lib/runtime/domain-products'
import { getAbsoluteUrl } from '@/lib/seo/canonical'
import { buildGeoProductFeedItems, type GeoProductFeedItem } from './feed'

export interface GeoIndexDocument {
  readonly version: 'geo-index-v2'
  readonly site: {
    readonly name: string
    readonly origin: string
    readonly definition: typeof finalGrowthSystemTarget.definition
  }
  readonly source: {
    readonly sourceKind: 'domain-normalized-products'
    readonly upstreamMode: string
    readonly productSourceVersion: string
    readonly productCount: number
    readonly locales: readonly Locale[]
  }
  readonly endpoints: {
    readonly productFeed: string
    readonly productAnswers: string
    readonly allProducts: string
    readonly perProductPattern: string
    readonly industries: string
    readonly applications: string
    readonly llmsTxt: string
  }
  readonly products: readonly GeoProductFeedItem[]
  readonly industries: readonly {
    readonly title: string
    readonly description: string
    readonly canonicalUrl: string
  }[]
  readonly applications: readonly {
    readonly title: string
    readonly description: string
    readonly canonicalUrl: string
  }[]
}

export function buildGeoIndex(locale: Locale = routing.defaultLocale): GeoIndexDocument {
  const source = getRuntimeDomainProductSource()
  const industries = getIndustryEntryPageViewModel(locale).entries
  const applications = getApplicationEntryPageViewModel(locale, runtimeProductViewModelSource).entries

  return {
    version: 'geo-index-v2',
    site: {
      name: industrialSiteConfig.brandName,
      origin: industrialSiteConfig.origin,
      definition: finalGrowthSystemTarget.definition,
    },
    source: {
      sourceKind: source.sourceKind,
      upstreamMode: source.upstreamMode,
      productSourceVersion: source.sourceVersion,
      productCount: getRuntimeDomainProductRecords().length,
      locales: routing.locales,
    },
    endpoints: {
      productFeed: getAbsoluteUrl('/api/product-feed'),
      productAnswers: getAbsoluteUrl('/api/geo/answers'),
      allProducts: getAbsoluteUrl('/api/geo/products'),
      perProductPattern: getAbsoluteUrl('/{locale}/geo/products/{categorySlugPath}/{productSlug}'),
      industries: getAbsoluteUrl(`/${locale}/industries`),
      applications: getAbsoluteUrl(`/${locale}/applications`),
      llmsTxt: getAbsoluteUrl('/llms.txt'),
    },
    products: buildGeoProductFeedItems(locale),
    industries: industries.map((entry) => ({
      title: entry.title,
      description: entry.description,
      canonicalUrl: getAbsoluteUrl(`/${locale}${entry.href}`),
    })),
    applications: applications.map((entry) => ({
      title: entry.title,
      description: entry.description,
      canonicalUrl: getAbsoluteUrl(`/${locale}${entry.href}`),
    })),
  }
}
