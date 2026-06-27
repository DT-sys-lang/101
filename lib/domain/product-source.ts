import { industrialSensorCategoryTree } from './category'
import { mockProducts as productRecords, mockProductSource as productSource } from './mock-products'
import {
  createProductCatalogIndex,
  filterProductCatalog,
  selectProductSeo,
  type ProductCatalogIndex,
  type ProductFilterQuery,
  type ProductListResult,
} from './product-catalog'
import type { LocaleCode } from './primitives'

const productCatalogs = {
  en: createProductCatalogIndex({
    locale: 'en',
    products: productRecords,
    categoryTree: industrialSensorCategoryTree,
  }),
  zh: createProductCatalogIndex({
    locale: 'zh',
    products: productRecords,
    categoryTree: industrialSensorCategoryTree,
  }),
} as const satisfies Readonly<Record<LocaleCode, ProductCatalogIndex>>

export function getDomainProductRecords() {
  return productRecords
}

export function getDomainProductSource() {
  return productSource
}

export function getProductCatalog(locale: LocaleCode): ProductCatalogIndex {
  return productCatalogs[locale]
}

export function listProducts(locale: LocaleCode, query: ProductFilterQuery = {}): ProductListResult {
  return filterProductCatalog(getProductCatalog(locale), query)
}

export function listHomepageProducts(locale: LocaleCode): ProductListResult {
  return listProducts(locale, {
    categoryId: industrialSensorCategoryTree.root.id,
    categoryMode: 'with-descendants',
    sort: 'category-sort',
    limit: 4,
  })
}

export function getProductStaticParams(locales: readonly LocaleCode[]) {
  return locales.flatMap((locale) =>
    productRecords.map((product) => {
      const seo = selectProductSeo(product, locale)

      return {
        locale,
        slug: seo.slug.canonicalPath.replace(/^\/products\//, '').split('/').filter(Boolean),
      }
    }),
  )
}

export { productCatalogs }
