import {
  getCmsCategoryTree,
  getCmsProductCatalog,
  getCmsProductMode,
  getCmsProductRecords,
  getCmsProductSourceVersion,
  listCmsHomepageProducts,
  listCmsProducts,
  preloadCmsProductSnapshotAsync,
  type CmsProductSourceMode,
} from '@/lib/cms/products'
import type {
  CategoryTree,
  LocaleCode,
  ProductCatalogIndex,
  ProductFilterQuery,
  ProductListResult,
  ProductNavigationViewModel,
  ProductRecord,
} from '@/lib/domain'
import {
  buildProductNavigationViewModel,
  getCategoryProductCount,
  isStructuralProductCategory,
  selectProductSeo,
  type ProductStaticParam,
  type ProductViewModelSource,
} from '@/lib/domain'

export interface DomainProductRuntimeSource {
  readonly sourceKind: 'domain-normalized-products'
  readonly upstreamMode: CmsProductSourceMode
  readonly sourceVersion: string
  readonly productCount: number
}

export async function preloadRuntimeDomainProducts(): Promise<void> {
  await preloadCmsProductSnapshotAsync()
}

export function getRuntimeDomainProductRecords(): readonly ProductRecord[] {
  return getCmsProductRecords()
}

export function getRuntimeDomainCategoryTree(): CategoryTree {
  return getCmsCategoryTree()
}

export function getRuntimeDomainProductCatalog(locale: LocaleCode): ProductCatalogIndex {
  return getCmsProductCatalog(locale)
}

export function getRuntimeProductNavigation(locale: LocaleCode): ProductNavigationViewModel {
  return buildProductNavigationViewModel(
    locale,
    getRuntimeDomainCategoryTree(),
    getRuntimeDomainProductCatalog(locale),
  )
}

export function listRuntimeDomainProducts(locale: LocaleCode, query: ProductFilterQuery = {}): ProductListResult {
  return listCmsProducts(locale, query)
}

export function listRuntimeDomainHomepageProducts(locale: LocaleCode): ProductListResult {
  return listCmsHomepageProducts(locale)
}

export function getRuntimeProductStaticParams(locales: readonly LocaleCode[]): readonly ProductStaticParam[] {
  const params = locales.flatMap((locale) => {
    const productParams = getRuntimeDomainProductRecords().map((product) => {
      const seo = selectProductSeo(product, locale)

      return {
        locale,
        slug: seo.slug.canonicalPath.replace(/^\/products\//, '').split('/').filter(Boolean),
      }
    })
    const catalog = getRuntimeDomainProductCatalog(locale)
    const categoryParams = [...catalog.categoryBySlugPath.values()]
      .filter((category) => category.parentId !== null && !isStructuralProductCategory(category.id) && getCategoryProductCount(catalog, category.id) > 0)
      .map((category) => ({ locale, slug: category.slugPath.split('/').filter(Boolean) }))

    return [...productParams, ...categoryParams]
  })

  const seen = new Set<string>()
  return params.filter((param) => {
    const key = `${param.locale}:${param.slug.join('/')}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export const runtimeProductViewModelSource: ProductViewModelSource = {
  getCatalog: getRuntimeDomainProductCatalog,
  listProducts: listRuntimeDomainProducts,
  getStaticParams: getRuntimeProductStaticParams,
}

export function getRuntimeDomainProductSourceVersion() {
  return getCmsProductSourceVersion()
}

export function getRuntimeDomainProductSource(): DomainProductRuntimeSource {
  const records = getRuntimeDomainProductRecords()

  return {
    sourceKind: 'domain-normalized-products',
    upstreamMode: getCmsProductMode(),
    sourceVersion: getRuntimeDomainProductSourceVersion(),
    productCount: records.length,
  }
}
