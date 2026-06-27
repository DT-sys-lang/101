import { routing, type Locale } from '@/i18n/routing'
import {
  resolveProductDetailPage,
  selectProductSeo,
  type ProductCanonicalPath,
  type ProductDetailPageData,
  type ProductDetailPageResult,
} from '@/lib/domain'
import { buildAiReadableIndustrialProduct } from '@/lib/geo/product'
import { getRuntimeDomainProductCatalog, getRuntimeDomainProductRecords } from '@/lib/runtime/domain-products'
import type { ProductFaqItem } from './faq'
export { getAbsoluteUrl, getLocalizedPath, getLocalizedProductUrl } from './canonical'
export { buildProductFaqItems, type ProductFaqItem } from './faq'
export { buildProductHrefLangs } from './hreflang'
export { buildProductFaqSchemaJsonLd } from './jsonld/faq'
export { buildProductListJsonLd, buildProductItemListJsonLd } from './jsonld/item-list'
export { buildProductSchemaJsonLd } from './jsonld/product'
export { buildProductMetadata } from './metadata'

export function resolveDomainProductDetail(locale: Locale, slug: readonly string[]): ProductDetailPageResult {
  return resolveProductDetailPage(getRuntimeDomainProductCatalog(locale), {
    locale,
    pathname: `/products/${slug.join('/')}`,
  })
}

export function getProductStaticParams() {
  return routing.locales.flatMap((locale) =>
    getRuntimeDomainProductRecords().map((product) => {
      const seo = selectProductSeo(product, locale)

      return {
        locale,
        slug: toProductSlugSegments(seo.slug.canonicalPath),
      }
    }),
  )
}

export function shouldRedirectToCanonical(data: { readonly route: { readonly canonicalPath: ProductCanonicalPath } }, requestedSlug: readonly string[]) {
  return `/products/${requestedSlug.join('/')}` !== data.route.canonicalPath
}

export function toProductCanonicalPath(slug: readonly string[]) {
  return `/products/${slug.join('/')}` as ProductCanonicalPath
}

export function toJsonScriptValue(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function buildAiReadableGeoBlock(data: ProductDetailPageData, faqItems: readonly ProductFaqItem[]) {
  return buildAiReadableIndustrialProduct(data.product, data.locale, faqItems, {
    domainObject: 'ProductDetailPageData',
    cacheKey: data.cacheKey,
  })
}

function toProductSlugSegments(canonicalPath: ProductCanonicalPath) {
  return canonicalPath.replace(/^\/products\//, '').split('/').filter(Boolean)
}
