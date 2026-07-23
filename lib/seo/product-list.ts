import type { Metadata } from 'next'
import { routing, type Locale } from '@/i18n/routing'
import { getRuntimeDomainProductCatalog, listRuntimeDomainProducts } from '@/lib/runtime/domain-products'
import {
  industrialSensorCategoryTree,
  industrialSiteConfig,
  localizeText,
  type CategoryNode,
  type ProductListResult,
  type SeoSlugPath,
} from '@/lib/domain'
import { getAbsoluteUrl, hrefLangByLocale } from './canonical'
import { buildProductListJsonLd } from './jsonld/item-list'

const copy = {
  en: {
    rootTitle: 'Product Center | YUFAVOR',
    rootDescription: 'Browse valves, pressure sensors, temperature sensors, pressure switches, level sensors, pressure gauges, and wireless transmitters by category and basic parameters.',
    listingSuffix: 'products',
  },
  zh: {
    rootTitle: '产品中心 | YUFAVOR',
    rootDescription: '按分类和基础参数浏览阀、压力传感器、温度传感器、压力开关、液位传感器、压力表和无线传输变送器。',
    listingSuffix: '款产品',
  },
} as const

export interface ProductListPageData {
  readonly locale: Locale
  readonly category: CategoryNode
  readonly categoryPath: readonly CategoryNode[]
  readonly productList: ProductListResult
  readonly canonicalPath: string
  readonly title: string
  readonly description: string
}

export function resolveProductListPage(locale: Locale, slug: readonly string[] = []): ProductListPageData | null {
  const index = getRuntimeDomainProductCatalog(locale)
  const rootCategory = resolveCatalogRootCategory(index) ?? industrialSensorCategoryTree.root
  const categorySlugPath = (slug.length ? slug.join('/') : rootCategory.slugPath) as SeoSlugPath
  const category = resolveCategoryBySlugPath(index, categorySlugPath)

  if (!category) {
    return null
  }

  const productList = index.products.length > 0
    ? listRuntimeDomainProducts(locale, {
        categoryId: category.id,
        categoryMode: 'with-descendants',
        sort: 'category-sort',
        limit: 48,
      })
    : emptyProductList(locale)

  const label = localizeText(category.name, locale)
  const baseCopy = copy[locale]
  const isRootCategory = category.id === rootCategory.id
  const title = isRootCategory
    ? baseCopy.rootTitle
    : `${label} | ${industrialSiteConfig.brandName}`
  const description = isRootCategory
    ? baseCopy.rootDescription
    : localizeText(category.description, locale)

  return {
    locale,
    category,
    categoryPath: index.categoryPathById.get(category.id) ?? [category],
    productList,
    canonicalPath: category.canonicalPath,
    title,
    description,
  }
}

export function buildProductListMetadata(data: ProductListPageData): Metadata {
  const canonicalUrl = getAbsoluteUrl(`/${data.locale}${data.canonicalPath}`)
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [hrefLangByLocale[locale], getAbsoluteUrl(`/${locale}${data.canonicalPath}`)]),
  )

  return {
    metadataBase: new URL(industrialSiteConfig.origin),
    title: data.title,
    description: data.description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ...languages,
        'x-default': getAbsoluteUrl(`/${routing.defaultLocale}${data.canonicalPath}`),
      },
    },
    openGraph: {
      type: 'website',
      title: data.title,
      description: data.description,
      url: canonicalUrl,
      siteName: industrialSiteConfig.brandName,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  }
}

export { buildProductListJsonLd }

function resolveCatalogRootCategory(index: ReturnType<typeof getRuntimeDomainProductCatalog>) {
  for (const path of index.categoryPathById.values()) {
    if (path.length === 1) {
      return path[0]
    }
  }

  return undefined
}

function resolveCategoryBySlugPath(index: ReturnType<typeof getRuntimeDomainProductCatalog>, slugPath: SeoSlugPath) {
  const exact = index.categoryBySlugPath.get(slugPath)

  if (exact) {
    return exact
  }

  const legacyPath = findStaticCategoryPathBySlugPath(industrialSensorCategoryTree.root, slugPath)


  if (legacyPath) {
    for (const legacyCategory of [...legacyPath].reverse()) {
      const currentCategory = index.categoryById.get(legacyCategory.id)

      if (currentCategory) {
        return currentCategory
      }
    }
  }

  return [...index.categoryBySlugPath.entries()].find(([currentSlugPath]) => currentSlugPath.endsWith(`/${slugPath}`))?.[1]
}

function findStaticCategoryPathBySlugPath(
  category: CategoryNode,
  slugPath: SeoSlugPath,
  ancestors: readonly CategoryNode[] = [],
): readonly CategoryNode[] | undefined {
  const path = [...ancestors, category]

  if (category.slugPath === slugPath) {
    return path
  }

  for (const child of category.children ?? []) {
    const match = findStaticCategoryPathBySlugPath(child, slugPath, path)

    if (match) {
      return match
    }
  }

  return undefined
}

export function getProductListCountLabel(data: ProductListPageData) {
  const suffix = copy[data.locale].listingSuffix
  return data.locale === 'zh'
    ? `${data.productList.pageInfo.total} ${suffix}`
    : `${data.productList.pageInfo.total} ${suffix}`
}

function emptyProductList(locale: Locale): ProductListResult {
  return {
    locale,
    query: {},
    items: [],
    matchedProductIds: [],
    pageInfo: {
      offset: 0,
      limit: 48,
      total: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    facets: {
      categories: [],
      families: [],
      measurementKinds: [],
      availability: [],
      outputKinds: [],
      accuracies: [],
      certifications: [],
    },
  }
}
