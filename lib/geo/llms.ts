import { routing, type Locale } from '@/i18n/routing'
import { getApplicationEntryPageViewModel, getIndustryEntryPageViewModel, industrialSiteConfig, searchIntentMappingContract, selectProductSeo } from '@/lib/domain'
import { getRuntimeDomainProductRecords, getRuntimeDomainProductSource, runtimeProductViewModelSource } from '@/lib/runtime/domain-products'
import { getAbsoluteUrl, getLocalizedProductUrl } from '@/lib/seo/canonical'
import { getProductGeoEndpoint } from './product'

export interface LlmsTxtSourceEntry {
  readonly title: string
  readonly url: string
  readonly description: string
}

export function buildLlmsTxtSourceEntries(locale: Locale = routing.defaultLocale): readonly LlmsTxtSourceEntry[] {
  const products = getRuntimeDomainProductRecords().slice(0, 100)
  const industryPage = getIndustryEntryPageViewModel(locale)
  const applicationPage = getApplicationEntryPageViewModel(locale, runtimeProductViewModelSource)

  return [
    {
      title: 'GEO index',
      url: getAbsoluteUrl('/api/geo/index'),
      description: 'Machine-readable index of domain-normalized products, product GEO endpoints, and source metadata.',
    },
    {
      title: 'Product feed',
      url: getAbsoluteUrl('/api/product-feed'),
      description: 'Domain-derived industrial product feed with canonical URLs, key specs, datasheets, and GEO endpoints.',
    },
    {
      title: 'GEO products',
      url: getAbsoluteUrl('/api/geo/products'),
      description: 'AI-readable industrial product records generated from ProductRecord and ProductGeoAiProfile projections.',
    },
    {
      title: 'GEO answer blocks',
      url: getAbsoluteUrl('/api/geo/answers'),
      description: 'Source-backed product FAQ blocks plus application answer blocks generated from domain view models.',
    },
    {
      title: 'Industry hub',
      url: getAbsoluteUrl(`/${locale}/industries`),
      description: 'Industry CollectionPage entry generated from the domain industry view model.',
    },
    {
      title: 'Application hub',
      url: getAbsoluteUrl(`/${locale}/applications`),
      description: 'Application CollectionPage entry generated from the domain application view model.',
    },
    ...industryPage.entries.map((entry) => ({
      title: `${entry.title} industry page`,
      url: getAbsoluteUrl(`/${locale}${entry.href}`),
      description: entry.description,
    })),
    ...applicationPage.entries.map((entry) => ({
      title: `${entry.title} application page`,
      url: getAbsoluteUrl(`/${locale}${entry.href}`),
      description: entry.description,
    })),
    ...products.map((product) => {
      const seo = selectProductSeo(product, locale)

      return {
        title: `${product.identity.model} GEO product record`,
        url: getProductGeoEndpoint(locale, product),
        description: `AI-readable product facts for ${seo.title}. Canonical page: ${getLocalizedProductUrl(locale, seo.slug.canonicalPath)}.`,
      }
    }),
  ]
}

export function buildLlmsTxt(locale: Locale = routing.defaultLocale) {
  const source = getRuntimeDomainProductSource()
  const entries = buildLlmsTxtSourceEntries(locale)

  return [
    `# ${industrialSiteConfig.brandName}`,
    '',
    `> ${industrialSiteConfig.brandName} exposes domain-normalized industrial product, industry, and application data for search engines and AI answer systems.`,
    '',
    '## Source Policy',
    '',
    `- Source kind: ${source.sourceKind}`,
    `- Upstream mode: ${source.upstreamMode}`,
    `- Product source version: ${source.sourceVersion}`,
    `- Product count: ${source.productCount}`,
    `- Intent mapping version: ${searchIntentMappingContract.version}`,
    '- SEO/GEO modules consume ProductRecord, ProductCatalogIndex, ProductSeoFields, ProductGeoAiProfile, and EntryPageViewModel projections only.',
    '- Hidden or unsupported AI claims are not included; answer blocks include source references when available.',
    '',
    '## Machine-readable endpoints and pages',
    '',
    ...entries.map((entry) => `- [${entry.title}](${entry.url}): ${entry.description}`),
    '',
  ].join('\n')
}
