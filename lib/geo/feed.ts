import { type Locale } from '@/i18n/routing'
import { localizeText, selectProductSeo, type ProductRecord } from '@/lib/domain'
import { getRuntimeDomainProductRecords } from '@/lib/runtime/domain-products'
import { getAbsoluteUrl, getLocalizedProductUrl } from '@/lib/seo/canonical'
import { getProductGeoEndpoint } from './product'

export interface GeoProductFeedItem {
  readonly id: string
  readonly model: string
  readonly sku: string
  readonly brand: string
  readonly locale: Locale
  readonly canonicalUrl: string
  readonly title: string
  readonly summary: string
  readonly categoryPath: readonly string[]
  readonly keySpecs: readonly {
    readonly label: string
    readonly value: string
    readonly unit?: string
  }[]
  readonly datasheets: readonly string[]
  readonly geoEndpoint: string
}

export interface GeoProductFeedDocument {
  readonly version: 'geo-product-feed-v1'
  readonly locale: Locale
  readonly products: readonly GeoProductFeedItem[]
}

export function buildGeoProductFeed(locale: Locale): GeoProductFeedDocument {
  return {
    version: 'geo-product-feed-v1',
    locale,
    products: getRuntimeDomainProductRecords().map((product) => buildGeoProductFeedItem(product, locale)),
  }
}

export function buildGeoProductFeedItems(locale: Locale): readonly GeoProductFeedItem[] {
  return buildGeoProductFeed(locale).products
}

function buildGeoProductFeedItem(product: ProductRecord, locale: Locale): GeoProductFeedItem {
  const seo = selectProductSeo(product, locale)

  return {
    id: product.identity.id,
    model: product.identity.model,
    sku: product.identity.sku,
    brand: product.identity.brand,
    locale,
    canonicalUrl: getLocalizedProductUrl(locale, seo.slug.canonicalPath),
    title: seo.title,
    summary: localizeText(product.content.summary, locale),
    categoryPath: seo.slug.categoryPath,
    keySpecs: getFeedSpecs(product),
    datasheets: (product.documents ?? [])
      .filter((document) => document.kind === 'datasheet')
      .map((document) => getAbsoluteUrl(document.href)),
    geoEndpoint: getProductGeoEndpoint(locale, product),
  }
}

function getFeedSpecs(product: ProductRecord) {
  return product.specificationGroups
    .flatMap((group) => group.values)
    .slice(0, 8)
    .map((value) => ({
      label: value.label,
      value: value.display,
      unit: value.unit,
    }))
}
