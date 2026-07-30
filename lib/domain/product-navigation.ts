import { industrialSensorCategoryTree, type CategoryNode, type CategoryTree } from './category'
import { getCategoryProductCount, getVisibleProductCategoryChildren } from './category-visibility'
import type { ProductCatalogIndex } from './product-catalog'
import type { CategoryId, LocaleCode, LocalizedText } from './primitives'

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

export interface BusinessProductCategoryGroup {
  readonly id: 'sensors' | 'industrial-valves'
  readonly label: string
  readonly href: string
  readonly description: string
  readonly productCount: number
  readonly productCountLabel: string
  readonly viewAllLabel: string
  readonly active: boolean
  readonly categories: readonly CategoryNode[]
}

const valveRootCategoryId = 'cat_industrial_valves' as CategoryId

const sensorNavigationLabelOverrides = {
  cat_pressure_sensors: {
    en: 'Pressure',
    zh: '\u538b\u529b',
  },
  cat_temperature_sensors: {
    en: 'Temperature',
    zh: '\u6e29\u5ea6',
  },
  cat_level_sensors: {
    en: 'Level',
    zh: '\u6db2\u4f4d',
  },
  cat_pressure_gauges: {
    en: 'Pressure gauges & digital displays',
    zh: '\u538b\u529b\u8868\u4e0e\u6570\u663e\u8868',
  },
  cat_pressure_switches: {
    en: 'Pressure switches & controllers',
    zh: '\u538b\u529b\u5f00\u5173\u4e0e\u63a7\u5236\u5668',
  },
} as const satisfies Partial<Record<CategoryId, LocalizedText>>

const preferredSensorCategoryOrder = [
  'cat_pressure_sensors',
  'cat_temperature_sensors',
  'cat_level_sensors',
  'cat_pressure_gauges',
  'cat_pressure_switches',
] as const satisfies readonly CategoryId[]

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
    const productCount = getCategoryProductCount(catalog, category.id)

    return {
      id: category.id,
      label: getBusinessProductCategoryLabel(category, locale),
      href: getPublicCategoryHref(category),
      productCount,
      productCountLabel: copy.countLabel(productCount),
      children: remainingLevels > 0
        ? getVisibleProductCategoryChildren(category, catalog).map((child) => toItem(child, remainingLevels - 1))
        : [],
    }
  }

  return {
    categoryLabel: copy.categoryLabel,
    overviewHref: '/products',
    overviewLabel: copy.overviewLabel,
    groups: buildBusinessProductCategoryGroups(locale, categoryTree, catalog).map((group) => ({
      id: group.id,
      label: group.label,
      href: group.href,
      productCount: group.productCount,
      productCountLabel: group.productCountLabel,
      children: group.categories.map((category) => toItem(category, 1)),
      description: group.description,
      viewAllLabel: group.viewAllLabel,
    })),
  }
}

export function buildBusinessProductCategoryGroups(
  locale: LocaleCode,
  categoryTree: CategoryTree,
  catalog: ProductCatalogIndex,
  categoryPath: readonly CategoryNode[] = [],
): readonly BusinessProductCategoryGroup[] {
  const copy = locale === 'zh'
    ? {
        sensorLabel: '\u4f20\u611f\u5668',
        sensorDescription: '\u538b\u529b\u3001\u6e29\u5ea6\u3001\u6db2\u4f4d\u3001\u538b\u529b\u8868\u4e0e\u6570\u663e\u8868\u7b49\u6d4b\u91cf\u4ea7\u54c1\u3002',
        valveLabel: '\u5de5\u4e1a\u9600\u95e8',
        valveDescription: '\u7535\u78c1\u9600\u3001\u6bd4\u4f8b\u9600\u3001\u8c03\u538b\u9600\u3001\u5b89\u5168\u9600\u548c\u9600\u7ec4\u4ea7\u54c1\u3002',
        countLabel: (count: number) => `\u4ea7\u54c1\u6570\u91cf: ${count}`,
        viewAllLabel: (label: string) => `\u67e5\u770b\u5168\u90e8${label}`,
      }
    : {
        sensorLabel: 'Sensors',
        sensorDescription: 'Pressure, temperature, level, pressure gauge, and digital display measurement products.',
        valveLabel: 'Industrial valves',
        valveDescription: 'Solenoid, proportional, regulating, safety, and manifold valve products.',
        countLabel: (count: number) => `Product count: ${count}`,
        viewAllLabel: (label: string) => `View all ${label}`,
      }
  const rootCategory = categoryPath[0] ?? categoryTree.root
  const visibleRootCategories = getVisibleProductCategoryChildren(rootCategory, catalog)
  const valveRootCategory = findCategoryById(rootCategory, valveRootCategoryId) ?? catalog.categoryById.get(valveRootCategoryId)
  const valveCategoryIds = valveRootCategory ? getCategoryAndDescendantIds(catalog, valveRootCategory.id) : new Set<CategoryId>()
  const sensorCategories = sortBusinessCategories(
    uniqueCategories(visibleRootCategories.flatMap((category) => {
      if (valveCategoryIds.has(category.id)) {
        return []
      }

      if (category.id === 'cat_industrial_sensors') {
        return getVisibleProductCategoryChildren(category, catalog)
      }

      return [category]
    })),
    preferredSensorCategoryOrder,
  )
  const visibleValveCategories = valveRootCategory
    ? getVisibleProductCategoryChildren(valveRootCategory, catalog)
    : visibleRootCategories.filter((category) => valveCategoryIds.has(category.id))
  const valveCategories = uniqueCategories(visibleValveCategories.length ? visibleValveCategories : valveRootCategory ? [valveRootCategory] : [])
  const currentCategoryIds = new Set(categoryPath.map((category) => category.id))
  const valveActive = [...currentCategoryIds].some((categoryId) => valveCategoryIds.has(categoryId))
  const sensorCount = getFamilyProductCount(catalog, 'sensor')
  const valveCount = getFamilyProductCount(catalog, 'valve') || getGroupedCategoryProductCount(catalog, valveCategories)
  const groups: BusinessProductCategoryGroup[] = []

  if (sensorCategories.length > 0 || sensorCount > 0) {
    groups.push({
      id: 'sensors',
      label: copy.sensorLabel,
      href: '/products?family=sensor',
      description: copy.sensorDescription,
      productCount: sensorCount || getGroupedCategoryProductCount(catalog, sensorCategories),
      productCountLabel: copy.countLabel(sensorCount || getGroupedCategoryProductCount(catalog, sensorCategories)),
      viewAllLabel: copy.viewAllLabel(copy.sensorLabel),
      active: !valveActive,
      categories: sensorCategories,
    })
  }

  if (valveCount > 0) {
    groups.push({
      id: 'industrial-valves',
      label: copy.valveLabel,
      href: valveRootCategory ? getPublicCategoryHref(valveRootCategory) : '/products?family=valve',
      description: copy.valveDescription,
      productCount: valveCount,
      productCountLabel: copy.countLabel(valveCount),
      viewAllLabel: copy.viewAllLabel(copy.valveLabel),
      active: valveActive,
      categories: valveCategories,
    })
  }

  return groups
}

export function getBusinessProductCategoryLabel(category: CategoryNode, locale: LocaleCode) {
  const override = (sensorNavigationLabelOverrides as Partial<Record<CategoryId, LocalizedText>>)[category.id]

  return localize(override ?? category.name, locale)
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

function getCategoryAndDescendantIds(catalog: ProductCatalogIndex, categoryId: CategoryId) {
  return catalog.descendantCategoryIdsById.get(categoryId) ?? new Set<CategoryId>([categoryId])
}

function uniqueCategories(categories: readonly CategoryNode[]) {
  const seen = new Set<CategoryId>()
  const result: CategoryNode[] = []

  for (const category of categories) {
    if (seen.has(category.id)) {
      continue
    }

    seen.add(category.id)
    result.push(category)
  }

  return result
}

function sortBusinessCategories(categories: readonly CategoryNode[], preferredOrder: readonly CategoryId[]) {
  const order = new Map(preferredOrder.map((categoryId, index) => [categoryId, index]))

  return [...categories].sort((left, right) => {
    const leftOrder = order.get(left.id) ?? Number.MAX_SAFE_INTEGER
    const rightOrder = order.get(right.id) ?? Number.MAX_SAFE_INTEGER

    return leftOrder - rightOrder || left.sortOrder - right.sortOrder || left.id.localeCompare(right.id)
  })
}

function getGroupedCategoryProductCount(catalog: ProductCatalogIndex, categories: readonly CategoryNode[]) {
  const productIds = new Set<string>()

  for (const category of categories) {
    for (const categoryId of getCategoryAndDescendantIds(catalog, category.id)) {
      for (const productId of catalog.productIdsByCategoryId.get(categoryId) ?? []) {
        productIds.add(productId)
      }
    }
  }

  return productIds.size
}

function getFamilyProductCount(catalog: ProductCatalogIndex, family: 'sensor' | 'valve') {
  return catalog.productIdsByFamily.get(family)?.size ?? 0
}

function localize(text: LocalizedText, locale: LocaleCode) {
  return text[locale] ?? text.en
}
