import { industrialSiteConfig } from '@/lib/domain'
import type { ProductListPageData } from '../product-list'
import { getAbsoluteUrl, hrefLangByLocale } from '../canonical'
import type { JsonObject } from './product'

export function buildProductListJsonLd(data: ProductListPageData): JsonObject {
  const canonicalUrl = getAbsoluteUrl(`/${data.locale}${data.canonicalPath}`)

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#collection`,
        url: canonicalUrl,
        name: data.title,
        description: data.description,
        inLanguage: hrefLangByLocale[data.locale],
        isPartOf: {
          '@id': industrialSiteConfig.websiteId,
        },
        mainEntity: {
          '@id': `${canonicalUrl}#products`,
        },
      },
      buildProductItemListJsonLd(data),
    ],
  }
}

export function buildProductItemListJsonLd(data: ProductListPageData): JsonObject {
  const canonicalUrl = getAbsoluteUrl(`/${data.locale}${data.canonicalPath}`)

  return {
    '@type': 'ItemList',
    '@id': `${canonicalUrl}#products`,
    numberOfItems: data.productList.pageInfo.total,
    itemListElement: data.productList.items.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: getAbsoluteUrl(`/${data.locale}${product.href}`),
      name: product.title,
    })),
  }
}
