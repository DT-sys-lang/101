import type { CategoryId, ProductId } from './primitives'
import type { CategoryNode } from './category'
import type { ProductCatalogIndex } from './product-catalog'

const structuralProductCategoryIds = new Set<CategoryId>([
  'cat_industrial_products',
  'cat_industrial_sensors',
  'cat_industrial_valves',
] as CategoryId[])

export function isStructuralProductCategory(categoryId: CategoryId) {
  return structuralProductCategoryIds.has(categoryId)
}

export function getCategoryProductCount(index: ProductCatalogIndex, categoryId: CategoryId) {
  const productIds = new Set<ProductId>()
  const categoryIds = index.descendantCategoryIdsById.get(categoryId) ?? new Set<CategoryId>([categoryId])

  for (const descendantCategoryId of categoryIds) {
    for (const productId of index.productIdsByCategoryId.get(descendantCategoryId) ?? []) {
      productIds.add(productId)
    }
  }

  return productIds.size
}

export function getVisibleProductCategoryChildren(category: CategoryNode, index: ProductCatalogIndex): readonly CategoryNode[] {
  return getSortedChildren(category).flatMap((child) => {
    const visibleChildren = getVisibleProductCategoryChildren(child, index)
    const productCount = getCategoryProductCount(index, child.id)

    if (isStructuralProductCategory(child.id) || productCount === 0) {
      return visibleChildren
    }

    return [child]
  })
}

export function getVisibleProductCategories(index: ProductCatalogIndex): readonly CategoryNode[] {
  return getVisibleProductCategoryChildren(index.categoryTree.root, index)
}

function getSortedChildren(category: CategoryNode) {
  return [...(category.children ?? [])].sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id))
}
