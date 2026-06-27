import {
  getCmsCategoryTree,
  getCmsProductCatalog,
  getCmsProductMode,
  getCmsProductRecords,
  getCmsProductSourceVersion,
  listCmsHomepageProducts,
  listCmsProducts,
  type CmsProductSourceMode,
} from '@/lib/cms/products'
import type {
  CategoryTree,
  LocaleCode,
  ProductCatalogIndex,
  ProductFilterQuery,
  ProductListResult,
  ProductRecord,
} from '@/lib/domain'

export interface DomainProductRuntimeSource {
  readonly sourceKind: 'domain-normalized-products'
  readonly upstreamMode: CmsProductSourceMode
  readonly sourceVersion: string
  readonly productCount: number
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

export function listRuntimeDomainProducts(locale: LocaleCode, query: ProductFilterQuery = {}): ProductListResult {
  return listCmsProducts(locale, query)
}

export function listRuntimeDomainHomepageProducts(locale: LocaleCode): ProductListResult {
  return listCmsHomepageProducts(locale)
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
