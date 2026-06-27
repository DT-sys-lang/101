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
    rootTitle: 'Industrial Sensor Product Center | HEIYU Industrial',
    rootDescription: 'Browse pressure, level, temperature, and industrial switch products by category, measurement range, output, and availability.',
    listingSuffix: 'products',
  },
  zh: {
    rootTitle: '工业传感器产品中心 | HEIYU Industrial',
    rootDescription: '按分类、量程、输出和供货状态浏览压力、液位、温度和工业开关产品。',
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
  const categorySlugPath = (slug.length ? slug.join('/') : industrialSensorCategoryTree.root.slugPath) as SeoSlugPath
  const category = index.categoryBySlugPath.get(categorySlugPath)

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
  const title = category.id === industrialSensorCategoryTree.root.id
    ? baseCopy.rootTitle
    : `${label} | HEIYU Industrial`
  const description = category.id === industrialSensorCategoryTree.root.id
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
      measurementKinds: [],
      availability: [],
      outputKinds: [],
      certifications: [],
    },
  }
}
