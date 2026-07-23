import { routing, type Locale } from '@/i18n/routing'
import {
  getApplicationEntryPageViewModel,
  getIndustryEntryPageViewModel,
  selectProductSeo,
  type CategoryId,
  type ProductId,
  type ProductRecord,
} from '@/lib/domain'
import { getRuntimeDomainProductCatalog, getRuntimeDomainProductRecords, runtimeProductViewModelSource } from '@/lib/runtime/domain-products'

export type RevalidationScope = 'all' | 'product' | 'category' | 'geo' | 'feed' | 'static'

export interface RevalidationInput {
  readonly scope?: RevalidationScope
  readonly locale?: Locale
  readonly productId?: ProductId
  readonly categoryId?: CategoryId
}

export interface RevalidationImpact {
  readonly version: 'revalidation-impact-v1'
  readonly input: RevalidationInput
  readonly paths: readonly string[]
  readonly tags: readonly string[]
  readonly productIds: readonly ProductId[]
  readonly categoryIds: readonly CategoryId[]
}

const staticPaths = ['/sitemap.xml', '/robots.txt', '/llms.txt'] as const
const localizedStaticPaths = [
  '',
  '/products',
  '/industries',
  '/applications',
  '/oem',
  '/resources',
  '/resources/blog',
  '/resources/cases',
  '/resources/manuals',
  '/contact',
] as const
const apiPaths = ['/api/cms/status', '/api/product-feed', '/api/geo/index', '/api/geo/products', '/api/geo/answers'] as const

export function calculateRevalidationImpact(input: RevalidationInput = {}): RevalidationImpact {
  const scope = input.scope ?? 'all'
  const locales = input.locale ? [input.locale] : routing.locales
  const products = getImpactedProducts(input)
  const categoryIds = getImpactedCategoryIds(input, products)
  const paths = new Set<string>()
  const tags = new Set<string>(['domain-products', 'cms-products'])

  if (scope === 'all' || scope === 'static') {
    addStaticPaths(paths, locales)
    tags.add('static-pages')
    tags.add('entry-pages')
    tags.add('cms-resources')
    tags.add('industry-ecosystem')
    tags.add('resource-pages')
  }

  if (scope === 'all' || scope === 'feed' || scope === 'geo') {
    addAll(paths, apiPaths)
    tags.add('api-feed')
    tags.add('geo')
  }

  if (scope === 'all' || scope === 'category' || scope === 'product') {
    addProductCatalogPaths(paths, locales, categoryIds)
    addEntryPagePaths(paths, locales)
    tags.add('product-list')
    tags.add('entry-pages')
  }

  if (scope === 'all' || scope === 'product' || scope === 'geo') {
    addProductDetailPaths(paths, locales, products)
    tags.add('product-detail')
  }

  return {
    version: 'revalidation-impact-v1',
    input: { ...input, scope },
    paths: [...paths].sort(),
    tags: [...tags].sort(),
    productIds: products.map((product) => product.identity.id),
    categoryIds: [...categoryIds].sort(),
  }
}

function addStaticPaths(paths: Set<string>, locales: readonly Locale[]) {
  addAll(paths, staticPaths)

  for (const locale of locales) {
    for (const path of localizedStaticPaths) {
      paths.add(`/${locale}${path}`)
    }
  }

  addEntryPagePaths(paths, locales)
}

function addProductCatalogPaths(paths: Set<string>, locales: readonly Locale[], categoryIds: ReadonlySet<CategoryId>) {
  for (const locale of locales) {
    paths.add(`/${locale}/products`)

    for (const categoryId of categoryIds) {
      const category = getRuntimeDomainProductCatalog(locale).categoryById.get(categoryId)

      if (category) {
        paths.add(`/${locale}${category.canonicalPath}`)
      }
    }
  }
}

function addProductDetailPaths(paths: Set<string>, locales: readonly Locale[], products: readonly ProductRecord[]) {
  for (const product of products) {
    for (const locale of locales) {
      const seo = selectProductSeo(product, locale)
      paths.add(`/${locale}${seo.slug.canonicalPath}`)
      paths.add(`/${locale}/geo${seo.slug.canonicalPath}`)
    }
  }
}

function addEntryPagePaths(paths: Set<string>, locales: readonly Locale[]) {
  for (const locale of locales) {
    paths.add(`/${locale}/industries`)
    paths.add(`/${locale}/applications`)

    for (const entry of getIndustryEntryPageViewModel(locale).entries) {
      paths.add(`/${locale}${entry.href}`)
    }

    for (const entry of getApplicationEntryPageViewModel(locale, runtimeProductViewModelSource).entries) {
      paths.add(`/${locale}${entry.href}`)
    }
  }
}

function getImpactedProducts(input: RevalidationInput) {
  const products = getRuntimeDomainProductRecords()

  if (input.productId) {
    return products.filter((product) => product.identity.id === input.productId)
  }

  if (input.categoryId) {
    return products.filter((product) => getProductCategoryIds(product).includes(input.categoryId as CategoryId))
  }

  return products
}

function getImpactedCategoryIds(input: RevalidationInput, products: readonly ProductRecord[]) {
  const categoryIds = new Set<CategoryId>()

  if (input.categoryId) {
    categoryIds.add(input.categoryId)
  }

  for (const product of products) {
    for (const categoryId of getProductCategoryIds(product)) {
      categoryIds.add(categoryId)
    }
  }

  return categoryIds
}

function getProductCategoryIds(product: ProductRecord) {
  return [
    ...product.classification.categoryPath,
    product.classification.primaryCategoryId,
    ...(product.classification.additionalCategoryIds ?? []),
  ]
}

function addAll(target: Set<string>, values: readonly string[]) {
  for (const value of values) {
    target.add(value)
  }
}
