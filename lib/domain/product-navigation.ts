import { industrialSensorCategoryTree, type CategoryNode, type CategoryTree } from './category'
import type { ProductCatalogIndex } from './product-catalog'
import type { CategoryId, LocaleCode, LocalizedText, ProductId } from './primitives'

export interface ProductNavigationItemViewModel {
  readonly id: string
  readonly label: string
  readonly href: string
  readonly productCount: number
  readonly productCountLabel: string
  readonly children: readonly ProductNavigationItemViewModel[]
}

export interface ProductNavigationGroupViewModel extends ProductNavigationItemViewModel {
  readonly description: string
  readonly viewAllLabel: string
}

export interface ProductNavigationViewModel {
  readonly categoryLabel: string
  readonly overviewHref: string
  readonly overviewLabel: string
  readonly groups: readonly ProductNavigationGroupViewModel[]
}

export function buildProductNavigationViewModel(
  locale: LocaleCode,
  categoryTree: CategoryTree,
  catalog: ProductCatalogIndex,
): ProductNavigationViewModel {
  const copy = locale === 'zh'
    ? {
        categoryLabel: '\u4ea7\u54c1\u5206\u7c7b',
        overviewLabel: '\u67e5\u770b\u5168\u90e8\u4ea7\u54c1',
        countLabel: (count: number) => `\u4ea7\u54c1\u6570\u91cf: ${count}`,
        viewAllLabel: (label: string) => `\u67e5\u770b\u5168\u90e8${label}`,
      }
    : {
        categoryLabel: 'Product categories',
        overviewLabel: 'View all products',
        countLabel: (count: number) => `Product count: ${count}`,
        viewAllLabel: (label: string) => `View all ${label}`,
      }

  const toItem = (category: CategoryNode, remainingLevels: number): ProductNavigationItemViewModel => {
    const productCount = getCategoryProductCount(category.id, catalog)

    return {
      id: category.id,
      label: localize(category.name, locale),
      href: getPublicCategoryHref(category),
      productCount,
      productCountLabel: copy.countLabel(productCount),
      children: remainingLevels > 0
        ? getSortedChildren(category).map((child) => toItem(child, remainingLevels - 1))
        : [],
    }
  }

  return {
    categoryLabel: copy.categoryLabel,
    overviewHref: '/products',
    overviewLabel: copy.overviewLabel,
    groups: getSortedChildren(categoryTree.root).map((category) => {
      const item = toItem(category, 2)

      return {
        ...item,
        description: localize(category.description, locale),
        viewAllLabel: copy.viewAllLabel(item.label),
      }
    }),
  }
}

function getCategoryProductCount(categoryId: CategoryId, catalog: ProductCatalogIndex) {
  const productIds = new Set<ProductId>()
  const categoryIds = catalog.descendantCategoryIdsById.get(categoryId) ?? new Set<CategoryId>([categoryId])

  for (const descendantCategoryId of categoryIds) {
    for (const productId of catalog.productIdsByCategoryId.get(descendantCategoryId) ?? []) {
      productIds.add(productId)
    }
  }

  return productIds.size
}

function getPublicCategoryHref(category: CategoryNode) {
  // The list route accepts historical category slugs without the catalog-root segment.
  const stableCategory = findCategoryById(industrialSensorCategoryTree.root, category.id) ?? category
  if (stableCategory !== category) {
    return stableCategory.canonicalPath
  }

  const categorySegments = category.slugPath.split('/').filter(Boolean).slice(1)
  return categorySegments.length ? `/products/${categorySegments.join('/')}` : '/products'
}

function findCategoryById(category: CategoryNode, categoryId: CategoryId): CategoryNode | undefined {
  if (category.id === categoryId) {
    return category
  }

  for (const child of category.children ?? []) {
    const match = findCategoryById(child, categoryId)

    if (match) {
      return match
    }
  }

  return undefined
}

function getSortedChildren(category: CategoryNode) {
  return [...(category.children ?? [])].sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id))
}

function localize(text: LocalizedText, locale: LocaleCode) {
  return text[locale] ?? text.en
}
