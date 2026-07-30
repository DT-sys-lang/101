import type { CategoryNode, CategoryTree } from './category'
import type {
  ApplicationId,
  CategoryId,
  IndustryId,
  LocaleCode,
  ProductCanonicalPath,
  ProductId,
  QuantityRange,
  SeoSlugPath,
  SlugSegment,
  UnitCode,
} from './primitives'
import type {
  CertificationCode,
  MeasurementKind,
  ProductAsset,
  ProductAvailabilityStatus,
  ProductDetailProjection,
  ProductFamily,
  ProductRecord,
  ProductVariant,
  SignalOutputKind,
} from './product'
import type { ProductDetailLookupResult, ProductRouteKey } from './product-detail-flow'
import type { ProductSeoFields } from './seo'
import {
  buildControlledProductSearchTerms,
  matchIntentPhrasebook,
  searchRoutePriority,
  type IntentPhrasebookEntry,
} from './intent-mapping'
import { localizeTechnicalValue } from './localization'

export type ProductListSort = 'relevance' | 'model-asc' | 'name-asc' | 'updated-desc' | 'category-sort'

export type CategoryFilterMode = 'exact' | 'with-descendants'

export type ProductRouteResolutionMode = ProductDetailLookupResult['resolvedFrom']

export interface ProductListSpec {
  readonly label: string
  readonly value: string
}

export interface ProductListImage {
  readonly kind: ProductAsset['kind']
  readonly href: string
  readonly alt: string
}

export interface ProductListMedia {
  readonly primaryImage?: ProductListImage
  readonly galleryImages: readonly ProductListImage[]
}

export interface ProductListItem {
  readonly id: ProductId
  readonly locale: LocaleCode
  readonly model: string
  readonly sku: string
  readonly family: ProductFamily
  readonly familyLabel: string
  readonly title: string
  readonly summary: string
  readonly href: ProductCanonicalPath
  readonly slug: SlugSegment
  readonly primaryCategoryId: CategoryId
  readonly categoryPath: readonly CategoryId[]
  readonly categoryLabel: string
  readonly categoryPathLabels: readonly string[]
  readonly measurementKinds: readonly MeasurementKind[]
  readonly availability: ProductAvailabilityStatus
  readonly availabilityLabel: string
  readonly keySpecs: readonly ProductListSpec[]
  readonly media: ProductListMedia
  readonly seoTitle: string
  readonly seoDescription: string
  readonly sortText: string
}

export interface ProductListPageInfo {
  readonly offset: number
  readonly limit: number
  readonly total: number
  readonly hasNextPage: boolean
  readonly hasPreviousPage: boolean
}

export interface ProductFacetBucket<TKey extends string = string> {
  readonly key: TKey
  readonly label: string
  readonly count: number
}

export interface ProductFilterFacets {
  readonly categories: readonly ProductFacetBucket<CategoryId>[]
  readonly families: readonly ProductFacetBucket<ProductFamily>[]
  readonly measurementKinds: readonly ProductFacetBucket<MeasurementKind>[]
  readonly availability: readonly ProductFacetBucket<ProductAvailabilityStatus>[]
  readonly outputKinds: readonly ProductFacetBucket<SignalOutputKind>[]
  readonly accuracies: readonly ProductFacetBucket<string>[]
  readonly certifications: readonly ProductFacetBucket<CertificationCode>[]
}

export interface ProductFilterQuery {
  readonly categoryId?: CategoryId
  readonly categoryIds?: readonly CategoryId[]
  readonly categoryMode?: CategoryFilterMode
  readonly families?: readonly ProductFamily[]
  readonly measurementKinds?: readonly MeasurementKind[]
  readonly availability?: readonly ProductAvailabilityStatus[]
  readonly industryIds?: readonly IndustryId[]
  readonly applicationIds?: readonly ApplicationId[]
  readonly outputKinds?: readonly SignalOutputKind[]
  readonly accuracyValues?: readonly string[]
  readonly certifications?: readonly CertificationCode[]
  readonly rangeMinBar?: number
  readonly rangeMaxBar?: number
  readonly search?: string
  readonly includeNonPublic?: boolean
  readonly sort?: ProductListSort
  readonly offset?: number
  readonly limit?: number
}

export interface ProductListResult {
  readonly locale: LocaleCode
  readonly query: ProductFilterQuery
  readonly items: readonly ProductListItem[]
  readonly pageInfo: ProductListPageInfo
  readonly facets: ProductFilterFacets
  readonly matchedProductIds: readonly ProductId[]
}

export interface ProductRouteIndexEntry {
  readonly productId: ProductId
  readonly canonicalPath: ProductCanonicalPath
  readonly resolvedFrom: ProductRouteResolutionMode
}

export interface ProductCatalogIndex {
  readonly version: 'product-catalog-index-v1'
  readonly locale: LocaleCode
  readonly products: readonly ProductRecord[]
  readonly productIds: readonly ProductId[]
  readonly listItems: readonly ProductListItem[]
  readonly byId: ReadonlyMap<ProductId, ProductRecord>
  readonly listItemById: ReadonlyMap<ProductId, ProductListItem>
  readonly productRouteByPath: ReadonlyMap<ProductCanonicalPath, ProductRouteIndexEntry>
  readonly productIdByModelSlug: ReadonlyMap<SlugSegment, ProductId>
  readonly categoryTree: CategoryTree
  readonly categoryById: ReadonlyMap<CategoryId, CategoryNode>
  readonly categoryBySlugPath: ReadonlyMap<SeoSlugPath, CategoryNode>
  readonly categoryPathById: ReadonlyMap<CategoryId, readonly CategoryNode[]>
  readonly descendantCategoryIdsById: ReadonlyMap<CategoryId, ReadonlySet<CategoryId>>
  readonly productIdsByCategoryId: ReadonlyMap<CategoryId, ReadonlySet<ProductId>>
  readonly productIdsByFamily: ReadonlyMap<ProductFamily, ReadonlySet<ProductId>>
  readonly productIdsByMeasurementKind: ReadonlyMap<MeasurementKind, ReadonlySet<ProductId>>
  readonly productIdsByAvailability: ReadonlyMap<ProductAvailabilityStatus, ReadonlySet<ProductId>>
  readonly productIdsByIndustryId: ReadonlyMap<IndustryId, ReadonlySet<ProductId>>
  readonly productIdsByApplicationId: ReadonlyMap<ApplicationId, ReadonlySet<ProductId>>
  readonly productIdsByOutputKind: ReadonlyMap<SignalOutputKind, ReadonlySet<ProductId>>
  readonly productIdsByAccuracy: ReadonlyMap<string, ReadonlySet<ProductId>>
  readonly productIdsByCertification: ReadonlyMap<CertificationCode, ReadonlySet<ProductId>>
  readonly searchTokenIndex: ReadonlyMap<string, ReadonlySet<ProductId>>
}

export interface CreateProductCatalogIndexInput {
  readonly locale: LocaleCode
  readonly products: readonly ProductRecord[]
  readonly categoryTree: CategoryTree
}

export interface ProductDetailRouteInput {
  readonly locale: LocaleCode
  readonly pathname?: string
  readonly categorySlugPath?: string
  readonly productSlug?: string
  readonly selectedOptions?: Readonly<Record<string, string>>
  readonly includeNonPublic?: boolean
}

export interface ProductDetailRouteResolution {
  readonly requestPath: ProductCanonicalPath
  readonly routeKey: ProductRouteKey
  readonly productId: ProductId
  readonly primaryCategoryId: CategoryId
  readonly resolvedFrom: ProductRouteResolutionMode
}

export interface ProductDetailPageData {
  readonly locale: LocaleCode
  readonly route: ProductRouteKey
  readonly lookup: ProductDetailLookupResult
  readonly product: ProductDetailProjection
  readonly listItem: ProductListItem
  readonly primaryCategory: CategoryNode
  readonly categoryPath: readonly CategoryNode[]
  readonly selectedVariants: readonly ProductVariant[]
  readonly seo: ProductSeoFields
  readonly geoAi: ProductDetailProjection['geoAi']
  readonly cacheKey: string
}

export type ProductDetailPageResult =
  | {
      readonly status: 'found'
      readonly data: ProductDetailPageData
    }
  | {
      readonly status: 'not-found' | 'not-public'
      readonly reason: string
      readonly requestPath?: ProductCanonicalPath
    }

const supportedLocales = ['en', 'zh'] as const satisfies readonly LocaleCode[]
const defaultPageLimit = 24
const maxPageLimit = 200

export function createProductCatalogIndex({ locale, products, categoryTree }: CreateProductCatalogIndexInput): ProductCatalogIndex {
  const categoryNodes = flattenCategoryTree(categoryTree.root)
  const categoryById = new Map<CategoryId, CategoryNode>()
  const categoryBySlugPath = new Map<SeoSlugPath, CategoryNode>()

  for (const category of categoryNodes) {
    categoryById.set(category.id, category)
    categoryBySlugPath.set(category.slugPath, category)
  }

  const categoryPathById = buildCategoryPathIndex(categoryNodes, categoryById)
  const descendantCategoryIdsById = buildCategoryDescendantIndex(categoryNodes)
  const byId = new Map<ProductId, ProductRecord>()
  const listItemById = new Map<ProductId, ProductListItem>()
  const productRouteByPath = new Map<ProductCanonicalPath, ProductRouteIndexEntry>()
  const productIdByModelSlug = new Map<SlugSegment, ProductId>()
  const productIdsByCategoryId = new Map<CategoryId, Set<ProductId>>()
  const productIdsByFamily = new Map<ProductFamily, Set<ProductId>>()
  const productIdsByMeasurementKind = new Map<MeasurementKind, Set<ProductId>>()
  const productIdsByAvailability = new Map<ProductAvailabilityStatus, Set<ProductId>>()
  const productIdsByIndustryId = new Map<IndustryId, Set<ProductId>>()
  const productIdsByApplicationId = new Map<ApplicationId, Set<ProductId>>()
  const productIdsByOutputKind = new Map<SignalOutputKind, Set<ProductId>>()
  const productIdsByAccuracy = new Map<string, Set<ProductId>>()
  const productIdsByCertification = new Map<CertificationCode, Set<ProductId>>()
  const searchTokenIndex = new Map<string, Set<ProductId>>()
  const productIds: ProductId[] = []
  const listItems: ProductListItem[] = []

  for (const product of products) {
    const productId = product.identity.id
    const listItem = toProductListItem(product, locale, categoryById, categoryPathById)

    byId.set(productId, product)
    listItemById.set(productId, listItem)
    productIds.push(productId)
    listItems.push(listItem)
    productIdByModelSlug.set(normalizeSlug(product.identity.model), productId)

    for (const routeEntry of getProductRouteEntries(product)) {
      productRouteByPath.set(routeEntry.path, {
        productId,
        canonicalPath: routeEntry.canonicalPath,
        resolvedFrom: routeEntry.resolvedFrom,
      })
    }

    for (const categoryId of getProductCategoryIds(product)) {
      addToSetMap(productIdsByCategoryId, categoryId, productId)
    }

    addToSetMap(productIdsByFamily, product.identity.family, productId)

    for (const measurementKind of getProductMeasurementKinds(product)) {
      addToSetMap(productIdsByMeasurementKind, measurementKind, productId)
    }

    addToSetMap(productIdsByAvailability, product.identity.availability, productId)

    for (const industryId of product.classification.industryIds) {
      addToSetMap(productIdsByIndustryId, industryId, productId)
    }

    for (const applicationId of product.classification.applicationIds) {
      addToSetMap(productIdsByApplicationId, applicationId, productId)
    }

    for (const output of product.outputs) {
      addToSetMap(productIdsByOutputKind, output.kind, productId)
    }

    for (const accuracy of getProductAccuracyValues(product)) {
      addToSetMap(productIdsByAccuracy, accuracy, productId)
    }

    for (const certification of product.certifications ?? []) {
      addToSetMap(productIdsByCertification, certification, productId)
    }

    for (const token of tokenizeSearchText(getProductSearchText(product, listItem, locale))) {
      addToSetMap(searchTokenIndex, token, productId)
    }
  }

  return {
    version: 'product-catalog-index-v1',
    locale,
    products,
    productIds,
    listItems,
    byId,
    listItemById,
    productRouteByPath,
    productIdByModelSlug,
    categoryTree,
    categoryById,
    categoryBySlugPath,
    categoryPathById,
    descendantCategoryIdsById,
    productIdsByCategoryId,
    productIdsByFamily,
    productIdsByMeasurementKind,
    productIdsByAvailability,
    productIdsByIndustryId,
    productIdsByApplicationId,
    productIdsByOutputKind,
    productIdsByAccuracy,
    productIdsByCertification,
    searchTokenIndex,
  }
}

export function filterProductCatalog(index: ProductCatalogIndex, query: ProductFilterQuery = {}): ProductListResult {
  let candidateIds = new Set(index.productIds)

  if (query.categoryId) {
    candidateIds = intersectSets(candidateIds, getCategoryFilterProductIds(index, query.categoryId, query.categoryMode ?? 'with-descendants'))
  }

  if (query.categoryIds?.length) {
    candidateIds = intersectSets(candidateIds, getCategoryIdsFilterProductIds(index, query.categoryIds, query.categoryMode ?? 'with-descendants'))
  }

  candidateIds = intersectByOptionalValues(candidateIds, index.productIdsByFamily, query.families)
  candidateIds = intersectByOptionalValues(candidateIds, index.productIdsByMeasurementKind, query.measurementKinds)
  candidateIds = intersectByOptionalValues(candidateIds, index.productIdsByAvailability, query.availability)
  candidateIds = intersectByOptionalValues(candidateIds, index.productIdsByIndustryId, query.industryIds)
  candidateIds = intersectByOptionalValues(candidateIds, index.productIdsByApplicationId, query.applicationIds)
  candidateIds = intersectByOptionalValues(candidateIds, index.productIdsByOutputKind, query.outputKinds)
  candidateIds = intersectByOptionalValues(candidateIds, index.productIdsByAccuracy, query.accuracyValues)
  candidateIds = intersectByOptionalValues(candidateIds, index.productIdsByCertification, query.certifications)

  if (hasBarRangeFilter(query.rangeMinBar, query.rangeMaxBar)) {
    candidateIds = intersectSets(candidateIds, getBarRangeProductIds(index, query.rangeMinBar, query.rangeMaxBar))
  }

  if (query.search?.trim()) {
    candidateIds = intersectSets(candidateIds, getSearchProductIds(index, query.search))
  }

  const matchedProductIds = sortProductIds(index, [...candidateIds], query.sort ?? 'relevance')
  const total = matchedProductIds.length
  const offset = Math.max(0, query.offset ?? 0)
  const limit = clampLimit(query.limit)
  const items = matchedProductIds
    .slice(offset, offset + limit)
    .map((productId) => index.listItemById.get(productId))
    .filter((item): item is ProductListItem => Boolean(item))

  return {
    locale: index.locale,
    query,
    items,
    pageInfo: {
      offset,
      limit,
      total,
      hasNextPage: offset + limit < total,
      hasPreviousPage: offset > 0,
    },
    facets: buildProductFilterFacets(index, candidateIds),
    matchedProductIds,
  }
}

export function resolveProductDetailPage(index: ProductCatalogIndex, input: ProductDetailRouteInput): ProductDetailPageResult {
  const routeResolution = resolveProductDetailRoute(index, input)

  if (!routeResolution) {
    return {
      status: 'not-found',
      reason: 'Product route did not match any canonical slug, legacy alias, or model redirect.',
    }
  }

  const product = index.byId.get(routeResolution.productId)

  if (!product) {
    return {
      status: 'not-found',
      reason: 'Route matched an index entry but the product record is missing.',
      requestPath: routeResolution.requestPath,
    }
  }

  const listItem = index.listItemById.get(product.identity.id)
  const primaryCategory = index.categoryById.get(product.classification.primaryCategoryId)

  if (!listItem || !primaryCategory) {
    return {
      status: 'not-found',
      reason: 'Product resolved but required list item or primary category projection is missing.',
      requestPath: routeResolution.requestPath,
    }
  }

  const lookup: ProductDetailLookupResult = {
    routeKey: routeResolution.routeKey,
    productId: routeResolution.productId,
    primaryCategoryId: routeResolution.primaryCategoryId,
    resolvedFrom: routeResolution.resolvedFrom,
  }

  return {
    status: 'found',
    data: {
      locale: input.locale,
      route: routeResolution.routeKey,
      lookup,
      product,
      listItem,
      primaryCategory,
      categoryPath: index.categoryPathById.get(primaryCategory.id) ?? [primaryCategory],
      selectedVariants: resolveProductVariants(product, input.selectedOptions),
      seo: selectProductSeo(product, input.locale),
      geoAi: selectProductGeoAi(product, input.locale),
      cacheKey: `product-detail-payload:${input.locale}:${product.identity.id}:v1`,
    },
  }
}

export function resolveProductDetailRoute(
  index: ProductCatalogIndex,
  input: ProductDetailRouteInput,
): ProductDetailRouteResolution | null {
  const parsedRoute = parseProductRouteInput(input)

  if (!parsedRoute) {
    return null
  }

  const routeEntry = index.productRouteByPath.get(parsedRoute.requestPath)

  if (routeEntry) {
    const product = index.byId.get(routeEntry.productId)

    if (!product) {
      return null
    }

    return {
      requestPath: parsedRoute.requestPath,
      routeKey: {
        locale: input.locale,
        categorySlugPath: getCategorySlugPath(routeEntry.canonicalPath),
        productSlug: getProductSlug(routeEntry.canonicalPath),
        canonicalPath: routeEntry.canonicalPath,
      },
      productId: routeEntry.productId,
      primaryCategoryId: product.classification.primaryCategoryId,
      resolvedFrom: routeEntry.resolvedFrom,
    }
  }

  const modelProductId = index.productIdByModelSlug.get(parsedRoute.productSlug)

  if (!modelProductId) {
    return null
  }

  const product = index.byId.get(modelProductId)

  if (!product || !productMatchesCategorySlug(index, product, parsedRoute.categorySlugPath)) {
    return null
  }

  const seo = selectProductSeo(product, input.locale)

  return {
    requestPath: parsedRoute.requestPath,
    routeKey: {
      locale: input.locale,
      categorySlugPath: getCategorySlugPath(seo.slug.canonicalPath),
      productSlug: getProductSlug(seo.slug.canonicalPath),
      canonicalPath: seo.slug.canonicalPath,
    },
    productId: product.identity.id,
    primaryCategoryId: product.classification.primaryCategoryId,
    resolvedFrom: 'model-redirect',
  }
}

export function toProductListItem(
  product: ProductRecord,
  locale: LocaleCode,
  categoryById: ReadonlyMap<CategoryId, CategoryNode>,
  categoryPathById: ReadonlyMap<CategoryId, readonly CategoryNode[]>,
): ProductListItem {
  const seo = selectProductSeo(product, locale)
  const primaryCategory = categoryById.get(product.classification.primaryCategoryId)
  const categoryPath = categoryPathById.get(product.classification.primaryCategoryId) ?? []
  const title = localizeText(product.content.shortName, locale) || localizeText(product.content.name, locale)
  const summary = localizeText(product.content.summary, locale)
  const keySpecs = getProductListSpecs(product, locale)

  return {
    id: product.identity.id,
    locale,
    model: product.identity.model,
    sku: product.identity.sku,
    family: product.identity.family,
    familyLabel: getFamilyLabel(product.identity.family, locale),
    title,
    summary,
    href: seo.slug.canonicalPath,
    slug: seo.slug.segment,
    primaryCategoryId: product.classification.primaryCategoryId,
    categoryPath: product.classification.categoryPath,
    categoryLabel: primaryCategory ? localizeText(primaryCategory.name, locale) : product.classification.primaryCategoryId,
    categoryPathLabels: categoryPath.map((category) => localizeText(category.name, locale)),
    measurementKinds: product.classification.measurementKinds,
    availability: product.identity.availability,
    availabilityLabel: getAvailabilityLabel(product.identity.availability, locale),
    keySpecs,
    media: getProductListMedia(product, title),
    seoTitle: seo.title,
    seoDescription: seo.metaDescription,
    sortText: normalizeSearchText(`${title} ${summary} ${product.identity.model} ${product.identity.sku}`),
  }
}

export function selectProductSeo(product: ProductRecord, locale: LocaleCode): ProductSeoFields {
  return product.localizedSeo?.[locale] ?? product.seo
}

export function selectProductGeoAi(product: ProductRecord, locale: LocaleCode): ProductDetailProjection['geoAi'] {
  return product.localizedGeoAi?.[locale] ?? product.geoAi
}

export function localizeText(text: Readonly<Record<LocaleCode, string> & Partial<Record<string, string>>>, locale: LocaleCode) {
  return text[locale] ?? text.en
}

function getFamilyLabel(family: ProductFamily, locale: LocaleCode) {
  const labels: Record<LocaleCode, Record<ProductFamily, string>> = {
    zh: {
      sensor: '传感器',
      valve: '阀门',
    },
    en: {
      sensor: 'Sensor',
      valve: 'Valve',
    },
  }

  return labels[locale][family]
}

function getProductListMedia(product: ProductRecord, fallbackAlt: string): ProductListMedia {
  const visualAssets = (product.assets ?? []).filter(isProductVisualAsset)
  const primaryImage = visualAssets.find((asset) => asset.kind === 'primary-image') ?? visualAssets[0]
  const galleryImages = visualAssets
    .filter((asset) => asset.id !== primaryImage?.id)
    .map((asset) => toProductListImage(asset, fallbackAlt))

  return {
    primaryImage: primaryImage ? toProductListImage(primaryImage, fallbackAlt) : undefined,
    galleryImages,
  }
}

function toProductListImage(asset: ProductAsset, fallbackAlt: string): ProductListImage {
  return {
    kind: asset.kind,
    href: asset.href,
    alt: asset.alt || fallbackAlt,
  }
}

function isProductVisualAsset(asset: ProductAsset) {
  return (asset.kind === 'primary-image' || asset.kind === 'gallery-image' || asset.kind === 'installation-photo' || asset.kind === 'diagram' || asset.kind === 'dimension-drawing')
    && isRenderableImageHref(asset.href)
}

function isRenderableImageHref(href: string) {
  return /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(href)
}

function getAvailabilityLabel(availability: ProductAvailabilityStatus, locale: LocaleCode) {
  const labels: Record<LocaleCode, Record<ProductAvailabilityStatus, string>> = {
    zh: {
      'stock-model': '现货型号',
      'standard-lead-time': '常规交付',
      configurable: '可配置',
      'made-to-order': '按单生产',
      'quote-required': '需报价确认',
      'not-available': '暂不可供',
    },
    en: {
      'stock-model': 'Stock model',
      'standard-lead-time': 'Standard lead time',
      configurable: 'Configurable',
      'made-to-order': 'Made to order',
      'quote-required': 'Quote required',
      'not-available': 'Not available',
    },
  }

  return labels[locale][availability]
}

function resolveProductVariants(product: ProductRecord, selectedOptions?: Readonly<Record<string, string>>) {
  if (!selectedOptions || Object.keys(selectedOptions).length === 0) {
    return product.variants
  }

  return product.variants.filter((variant) =>
    Object.entries(selectedOptions).every(([optionKey, value]) =>
      variant.optionValues.some((option) => option.optionKey === optionKey && option.value === value),
    ),
  )
}

function flattenCategoryTree(root: CategoryNode) {
  const nodes: CategoryNode[] = []
  const stack: CategoryNode[] = [root]

  while (stack.length > 0) {
    const node = stack.pop()

    if (!node) {
      continue
    }

    nodes.push(node)

    for (const child of [...(node.children ?? [])].reverse()) {
      stack.push(child)
    }
  }

  return nodes
}

function buildCategoryPathIndex(nodes: readonly CategoryNode[], categoryById: ReadonlyMap<CategoryId, CategoryNode>) {
  const pathById = new Map<CategoryId, readonly CategoryNode[]>()

  for (const node of nodes) {
    const path: CategoryNode[] = []
    let current: CategoryNode | undefined = node

    while (current) {
      path.unshift(current)
      current = current.parentId ? categoryById.get(current.parentId) : undefined
    }

    pathById.set(node.id, path)
  }

  return pathById
}

function buildCategoryDescendantIndex(nodes: readonly CategoryNode[]) {
  const descendantsById = new Map<CategoryId, Set<CategoryId>>()
  const parentById = new Map<CategoryId, CategoryId | null>()

  for (const node of nodes) {
    descendantsById.set(node.id, new Set([node.id]))
    parentById.set(node.id, node.parentId)
  }

  for (const node of nodes) {
    let parentId = parentById.get(node.id)

    while (parentId) {
      descendantsById.get(parentId)?.add(node.id)
      parentId = parentById.get(parentId) ?? null
    }
  }

  return descendantsById
}

function getProductCategoryIds(product: ProductRecord) {
  return uniqueValues([
    product.classification.primaryCategoryId,
    ...(product.classification.additionalCategoryIds ?? []),
  ])
}

function getProductMeasurementKinds(product: ProductRecord) {
  return uniqueValues([
    ...product.classification.measurementKinds,
    ...product.measurements.map((measurement) => measurement.kind),
  ])
}

function getProductAccuracyValues(product: ProductRecord) {
  return uniqueValues(product.measurements
    .map((measurement) => measurement.accuracy?.trim())
    .filter((accuracy): accuracy is string => Boolean(accuracy)))
}

function getProductListSpecs(product: ProductRecord, locale: LocaleCode) {
  if (product.identity.family === 'valve' && product.valveProfile) {
    return [
      { label: localizeSpecLabel('pressureRating', locale), value: product.valveProfile.pressureRating },
      { label: localizeSpecLabel('connection', locale), value: localizeTechnicalValue(product.valveProfile.connection, locale) },
      { label: localizeSpecLabel('material', locale), value: localizeTechnicalValue(product.valveProfile.material, locale) },
      { label: localizeSpecLabel('media', locale), value: localizeTechnicalValue(product.valveProfile.compatibleMedia.join(' / '), locale) },
      { label: localizeSpecLabel('size', locale), value: localizeTechnicalValue(product.valveProfile.size, locale) },
    ]
  }

  if (product.sensorProfile) {
    return [
      {
        label: localizeSpecLabel('measurement', locale),
        value: product.sensorProfile.measurements.map((measurement) => toCardRangeDisplay(measurement.range)).filter(Boolean).join(' / '),
      },
      {
        label: localizeSpecLabel('output', locale),
        value: compactCardSpecValue(product.sensorProfile.outputs.map((output) => output.value).join(';'), { maxTokens: 4, separator: ';' }),
      },
      {
        label: localizeSpecLabel('media', locale),
        value: compactCardSpecValue(localizeTechnicalValue(product.sensorProfile.environmentalLimits?.compatibleMedia?.join(' / ') ?? product.environmentalLimits.compatibleMedia?.join(' / ') ?? '', locale), { maxTokens: 3, separator: ' / ' }),
      },
    ].filter((spec) => spec.value)
  }

  return product.specificationGroups
    .flatMap((group) => group.values.map((value) => ({ label: localizeSpecLabel(value.label, locale), value: compactCardSpecValue(localizeTechnicalValue(value.display, locale), { maxTokens: 3 }) })))
    .filter((spec) => spec.value)
    .slice(0, 4)
}

function toCardRangeDisplay(range: QuantityRange) {
  const display = compactCardSpecValue(range.display, { maxTokens: 1, maxChars: 24 })

  if (display && display.length <= 24 && !/[;；,，]/.test(display)) {
    return display
  }

  return `${formatCardNumber(range.min)}...${formatCardNumber(range.max)} ${formatUnitCode(range.unit)}`
}

function compactCardSpecValue(
  value: string,
  {
    maxTokens = 3,
    maxChars = 34,
    separator = ';',
  }: {
    readonly maxTokens?: number
    readonly maxChars?: number
    readonly separator?: string
  } = {},
) {
  const normalized = value.replace(/\s+/g, ' ').trim()

  if (!normalized || isPlaceholderSpecValue(normalized)) {
    return ''
  }

  const tokens = normalized
    .split(/\s*[;；,，]\s*/g)
    .map((token) => token.trim())
    .filter((token) => token && !isPlaceholderSpecValue(token))

  const compact = (tokens.length ? uniqueValues(tokens).slice(0, maxTokens).join(separator) : normalized)
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*\/\s*/g, ' / ')
    .trim()

  if (compact.length <= maxChars) {
    return compact
  }

  return `${compact.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`
}

function isPlaceholderSpecValue(value: string) {
  return /contact\s+yufavor|configured\s+range|custom\s+(?:process|electrical)\s+connection|see\s+datasheet/i.test(value)
    || value === '-'
}

function formatCardNumber(value: number) {
  if (Number.isInteger(value)) {
    return String(value)
  }

  return String(Number(value.toPrecision(4))).replace(/\.0+$/, '')
}

function formatUnitCode(unit: UnitCode) {
  const labels: Partial<Record<UnitCode, string>> = {
    c: '℃',
    f: '℉',
    kpa: 'kPa',
    mpa: 'MPa',
    mv: 'mV',
    percent: '%',
    us_cm: 'uS/cm',
    v: 'V',
  }

  return labels[unit] ?? unit
}

function localizeSpecLabel(label: string, locale: LocaleCode) {
  if (locale !== 'zh') {
    return label
  }

  const labels: Record<string, string> = {
    Range: '量程',
    Output: '输出',
    Feature: '特性',
    measurement: '测量',
    output: '输出',
    media: '介质',
    pressureRating: '压力等级',
    connection: '连接',
    material: '材质',
    size: '尺寸',
    pressure: '压力',
    'differential-pressure': '差压',
    level: '液位',
    temperature: '温度',
    'switch-state': '开关量',
    ingressProtection: '防护等级',
  }

  return labels[label] ?? label
}

function getProductRouteEntries(product: ProductRecord) {
  const routeEntries: {
    readonly path: ProductCanonicalPath
    readonly canonicalPath: ProductCanonicalPath
    readonly resolvedFrom: ProductRouteResolutionMode
  }[] = []

  for (const seo of getProductSeoVariants(product)) {
    routeEntries.push({
      path: seo.slug.canonicalPath,
      canonicalPath: seo.slug.canonicalPath,
      resolvedFrom: 'canonical-slug',
    })

    for (const alias of seo.slug.aliases ?? []) {
      routeEntries.push({
        path: alias,
        canonicalPath: seo.slug.canonicalPath,
        resolvedFrom: 'legacy-alias',
      })
    }

    for (const redirect of seo.slug.redirectFrom ?? []) {
      routeEntries.push({
        path: redirect,
        canonicalPath: seo.slug.canonicalPath,
        resolvedFrom: 'legacy-alias',
      })
    }
  }

  return routeEntries
}

function getProductSeoVariants(product: ProductRecord) {
  const seoByPath = new Map<ProductCanonicalPath, ProductSeoFields>()
  seoByPath.set(product.seo.slug.canonicalPath, product.seo)

  for (const locale of supportedLocales) {
    const localizedSeo = product.localizedSeo?.[locale]

    if (localizedSeo) {
      seoByPath.set(localizedSeo.slug.canonicalPath, localizedSeo)
    }
  }

  return [...seoByPath.values()]
}

function parseProductRouteInput(input: ProductDetailRouteInput) {
  if (input.pathname) {
    const segments = input.pathname.split('/').map((segment) => normalizeSlug(segment)).filter(Boolean)
    const productIndex = segments.indexOf('products')

    if (productIndex < 0 || segments.length - productIndex < 3) {
      return null
    }

    const productSlug = segments[segments.length - 1]
    const categorySlugPath = segments.slice(productIndex + 1, -1).join('/') as SeoSlugPath

    return {
      categorySlugPath,
      productSlug,
      requestPath: toProductPath(categorySlugPath, productSlug),
    }
  }

  if (!input.categorySlugPath || !input.productSlug) {
    return null
  }

  const categorySlugPath = normalizeSlugPath(input.categorySlugPath)
  const productSlug = normalizeSlug(input.productSlug)

  if (!categorySlugPath || !productSlug) {
    return null
  }

  return {
    categorySlugPath,
    productSlug,
    requestPath: toProductPath(categorySlugPath, productSlug),
  }
}

function getCategoryFilterProductIds(index: ProductCatalogIndex, categoryId: CategoryId, mode: CategoryFilterMode) {
  const categoryIds = mode === 'exact'
    ? new Set([categoryId])
    : index.descendantCategoryIdsById.get(categoryId) ?? new Set([categoryId])

  return unionIndexedSets(index.productIdsByCategoryId, [...categoryIds])
}

function getCategoryIdsFilterProductIds(index: ProductCatalogIndex, categoryIds: readonly CategoryId[], mode: CategoryFilterMode) {
  const result = new Set<ProductId>()

  for (const categoryId of categoryIds) {
    for (const productId of getCategoryFilterProductIds(index, categoryId, mode)) {
      result.add(productId)
    }
  }

  return result
}

function getSearchProductIds(index: ProductCatalogIndex, search: string) {
  const tokenMatches = getTokenSearchProductIds(index, search)
  const intentMatches = getIntentSearchProductIds(index, search)

  if (intentMatches.size === 0) {
    return tokenMatches
  }

  if (tokenMatches.size === 0) {
    return intentMatches
  }

  const combinedMatches = intersectSets(tokenMatches, intentMatches)
  return combinedMatches.size ? combinedMatches : tokenMatches
}

function getTokenSearchProductIds(index: ProductCatalogIndex, search: string) {
  const tokens = tokenizeSearchText(search)

  if (tokens.length === 0) {
    return new Set(index.productIds)
  }

  let result = new Set(index.productIds)

  for (const token of tokens) {
    const tokenMatches = index.searchTokenIndex.get(token)

    if (!tokenMatches) {
      return new Set<ProductId>()
    }

    result = intersectSets(result, tokenMatches)
  }

  return result
}

function getIntentSearchProductIds(index: ProductCatalogIndex, search: string) {
  const matches = matchIntentPhrasebook(index.locale, search)
  const groupedSets = new Map<(typeof searchRoutePriority)[number], Set<ProductId>[]>()

  for (const match of matches) {
    const productIds = getIntentTargetProductIds(index, match)

    if (productIds.size === 0) {
      continue
    }

    const existingSets = groupedSets.get(match.targetType) ?? []
    existingSets.push(productIds)
    groupedSets.set(match.targetType, existingSets)
  }

  if (matches.some((match) => match.targetId === 'ecosystem:sensor-valve-pairing')) {
    const ecosystemIds = unionProductSets(groupedSets.get('ecosystem') ?? [])

    if (ecosystemIds.size > 0) {
      return ecosystemIds
    }
  }

  let candidateIds: Set<ProductId> | null = null

  for (const targetType of searchRoutePriority) {
    const sets = groupedSets.get(targetType)

    if (!sets?.length) {
      continue
    }

    const routeIds = unionProductSets(sets)

    if (!candidateIds) {
      candidateIds = routeIds
      continue
    }

    const narrowedIds = intersectSets(candidateIds, routeIds)

    if (narrowedIds.size > 0) {
      candidateIds = narrowedIds
    }
  }

  return candidateIds ?? new Set<ProductId>()
}

function getIntentTargetProductIds(index: ProductCatalogIndex, entry: IntentPhrasebookEntry) {
  const targetId = entry.targetId

  if (entry.targetType === 'industry' && targetId.startsWith('ind_')) {
    return new Set(index.productIdsByIndustryId.get(targetId as IndustryId) ?? [])
  }

  if (entry.targetType === 'ecosystem') {
    if (targetId.startsWith('app_')) {
      return new Set(index.productIdsByApplicationId.get(targetId as ApplicationId) ?? [])
    }

    if (targetId === 'ecosystem:sensor-valve-pairing') {
      return unionProductSets([
        new Set(index.productIdsByFamily.get('sensor') ?? []),
        new Set(index.productIdsByFamily.get('valve') ?? []),
      ])
    }
  }

  if (entry.targetType === 'product') {
    if (targetId === 'family:sensor') {
      return new Set(index.productIdsByFamily.get('sensor') ?? [])
    }

    if (targetId === 'family:valve') {
      return new Set(index.productIdsByFamily.get('valve') ?? [])
    }

    if (targetId.startsWith('prd_') && index.byId.has(targetId as ProductId)) {
      return new Set<ProductId>([targetId as ProductId])
    }
  }

  return new Set<ProductId>()
}

function buildProductFilterFacets(index: ProductCatalogIndex, candidateIds: ReadonlySet<ProductId>): ProductFilterFacets {
  return {
    categories: countFacetBuckets(index.productIdsByCategoryId, candidateIds, (categoryId) => {
      const category = index.categoryById.get(categoryId)
      return category ? localizeText(category.name, index.locale) : categoryId
    }),
    families: countFacetBuckets(index.productIdsByFamily, candidateIds, (family) => getFamilyLabel(family, index.locale)),
    measurementKinds: countFacetBuckets(index.productIdsByMeasurementKind, candidateIds),
    availability: countFacetBuckets(index.productIdsByAvailability, candidateIds),
    outputKinds: countFacetBuckets(index.productIdsByOutputKind, candidateIds),
    accuracies: countFacetBuckets(index.productIdsByAccuracy, candidateIds),
    certifications: countFacetBuckets(index.productIdsByCertification, candidateIds),
  }
}

function countFacetBuckets<TKey extends string>(
  index: ReadonlyMap<TKey, ReadonlySet<ProductId>>,
  candidateIds: ReadonlySet<ProductId>,
  getLabel: (key: TKey) => string = (key) => key,
) {
  return [...index.entries()]
    .map(([key, productIds]) => ({
      key,
      label: getLabel(key),
      count: countIntersection(productIds, candidateIds),
    }))
    .filter((bucket) => bucket.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

function productMatchesCategorySlug(index: ProductCatalogIndex, product: ProductRecord, categorySlugPath: SeoSlugPath) {
  const category = index.categoryBySlugPath.get(categorySlugPath)

  if (!category) {
    return false
  }

  const matchingCategoryIds = index.descendantCategoryIdsById.get(category.id) ?? new Set([category.id])

  return getProductCategoryIds(product).some((categoryId) => matchingCategoryIds.has(categoryId))
}

function sortProductIds(index: ProductCatalogIndex, productIds: readonly ProductId[], sort: ProductListSort) {
  const ids = [...productIds]

  if (sort === 'relevance') {
    return ids
  }

  return ids.sort((leftId, rightId) => {
    const leftProduct = index.byId.get(leftId)
    const rightProduct = index.byId.get(rightId)
    const leftItem = index.listItemById.get(leftId)
    const rightItem = index.listItemById.get(rightId)

    if (!leftProduct || !rightProduct || !leftItem || !rightItem) {
      return 0
    }

    if (sort === 'model-asc') {
      return leftProduct.identity.model.localeCompare(rightProduct.identity.model)
    }

    if (sort === 'name-asc') {
      return leftItem.title.localeCompare(rightItem.title)
    }

    if (sort === 'updated-desc') {
      return rightProduct.identity.revisedAt.localeCompare(leftProduct.identity.revisedAt)
    }

    const leftCategoryOrder = index.categoryById.get(leftProduct.classification.primaryCategoryId)?.sortOrder ?? 0
    const rightCategoryOrder = index.categoryById.get(rightProduct.classification.primaryCategoryId)?.sortOrder ?? 0

    return leftCategoryOrder - rightCategoryOrder || leftProduct.identity.model.localeCompare(rightProduct.identity.model)
  })
}

function getProductSearchText(product: ProductRecord, listItem: ProductListItem, locale: LocaleCode) {
  return buildControlledProductSearchTerms(product, {
    locale,
    title: listItem.title,
    summary: listItem.summary,
    categoryLabel: listItem.categoryLabel,
    categoryPathLabels: listItem.categoryPathLabels,
    keySpecs: listItem.keySpecs,
  }).join(' ')
}

function unionProductSets(sets: readonly ReadonlySet<ProductId>[]) {
  const result = new Set<ProductId>()

  for (const set of sets) {
    for (const productId of set) {
      result.add(productId)
    }
  }

  return result
}

function tokenizeSearchText(value: string) {
  return uniqueValues(normalizeSearchText(value).split(' ').filter((token) => token.length >= 2))
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ')
    .trim()
}

function normalizeSlugPath(value: string) {
  return value
    .split('/')
    .map((segment) => normalizeSlug(segment))
    .filter(Boolean)
    .join('/') as SeoSlugPath
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') as SlugSegment
}

function toProductPath(categorySlugPath: SeoSlugPath, productSlug: SlugSegment) {
  return `/products/${categorySlugPath}/${productSlug}` as ProductCanonicalPath
}

function getCategorySlugPath(productPath: ProductCanonicalPath) {
  return productPath.replace(/^\/products\//, '').split('/').slice(0, -1).join('/') as SeoSlugPath
}

function getProductSlug(productPath: ProductCanonicalPath) {
  return productPath.split('/').at(-1) as SlugSegment
}

function addToSetMap<TKey extends string>(map: Map<TKey, Set<ProductId>>, key: TKey, productId: ProductId) {
  const existingSet = map.get(key)

  if (existingSet) {
    existingSet.add(productId)
    return
  }

  map.set(key, new Set([productId]))
}

function intersectByOptionalValues<TKey extends string>(
  candidateIds: Set<ProductId>,
  index: ReadonlyMap<TKey, ReadonlySet<ProductId>>,
  values?: readonly TKey[],
) {
  if (!values?.length) {
    return candidateIds
  }

  return intersectSets(candidateIds, unionIndexedSets(index, values))
}

const unitToBarFactor: Partial<Record<UnitCode, number>> = {
  pa: 0.00001,
  kpa: 0.01,
  mpa: 10,
  bar: 1,
  mbar: 0.001,
  psi: 0.0689476,
  mh2o: 0.0980665,
}

function hasBarRangeFilter(rangeMinBar?: number, rangeMaxBar?: number) {
  return (typeof rangeMinBar === 'number' && Number.isFinite(rangeMinBar))
    || (typeof rangeMaxBar === 'number' && Number.isFinite(rangeMaxBar))
}

function getBarRangeProductIds(index: ProductCatalogIndex, rangeMinBar?: number, rangeMaxBar?: number) {
  const min = typeof rangeMinBar === 'number' && Number.isFinite(rangeMinBar) ? rangeMinBar : undefined
  const max = typeof rangeMaxBar === 'number' && Number.isFinite(rangeMaxBar) ? rangeMaxBar : undefined
  const result = new Set<ProductId>()

  for (const product of index.products) {
    if (productMatchesBarRangeFilter(product, min, max)) {
      result.add(product.id)
    }
  }

  return result
}

export function productMatchesBarRangeFilter(
  product: ProductRecord,
  rangeMinBar?: number,
  rangeMaxBar?: number,
) {
  return product.measurements.some((measurement) => measurementRangeMatchesBarFilter(measurement.range, rangeMinBar, rangeMaxBar))
    || pressureRatingMatchesBarFilter(product.valveProfile?.pressureRating, rangeMinBar, rangeMaxBar)
}

function measurementRangeMatchesBarFilter(
  range: { readonly min: number; readonly max: number; readonly unit: UnitCode },
  rangeMinBar?: number,
  rangeMaxBar?: number,
) {
  const factor = unitToBarFactor[range.unit]

  if (!factor) {
    return false
  }

  const productMaxBar = Math.max(range.min, range.max) * factor

  return barMaxMatchesFilter(productMaxBar, rangeMinBar, rangeMaxBar)
}

function pressureRatingMatchesBarFilter(
  pressureRating: string | undefined,
  rangeMinBar?: number,
  rangeMaxBar?: number,
) {
  const productMaxBar = parsePressureRatingMaxBar(pressureRating)

  return productMaxBar === undefined ? false : barMaxMatchesFilter(productMaxBar, rangeMinBar, rangeMaxBar)
}

function parsePressureRatingMaxBar(pressureRating: string | undefined) {
  const normalized = pressureRating?.toLowerCase().replace(/,/g, '')

  if (!normalized) {
    return undefined
  }

  const unit = normalized.match(/\b(mpa|kpa|mbar|bar|psi|pa)\b/)?.[1] as UnitCode | undefined
  const factor = unit ? unitToBarFactor[unit] : undefined
  const values = [...normalized.matchAll(/-?\d+(?:\.\d+)?/g)]
    .map((match) => Number(match[0]))
    .filter((value) => Number.isFinite(value))

  if (!factor || values.length === 0) {
    return undefined
  }

  return Math.max(...values) * factor
}

function barMaxMatchesFilter(productMaxBar: number, rangeMinBar?: number, rangeMaxBar?: number) {
  return (rangeMinBar === undefined || productMaxBar > rangeMinBar)
    && (rangeMaxBar === undefined || productMaxBar <= rangeMaxBar)
}

function unionIndexedSets<TKey extends string>(index: ReadonlyMap<TKey, ReadonlySet<ProductId>>, keys: readonly TKey[]) {
  const result = new Set<ProductId>()

  for (const key of keys) {
    const productIds = index.get(key)

    if (!productIds) {
      continue
    }

    for (const productId of productIds) {
      result.add(productId)
    }
  }

  return result
}

function intersectSets(left: ReadonlySet<ProductId>, right: ReadonlySet<ProductId>) {
  const result = new Set<ProductId>()
  const [smallerSet, largerSet] = left.size <= right.size ? [left, right] : [right, left]

  for (const productId of smallerSet) {
    if (largerSet.has(productId)) {
      result.add(productId)
    }
  }

  return result
}

function countIntersection(left: ReadonlySet<ProductId>, right: ReadonlySet<ProductId>) {
  let count = 0
  const [smallerSet, largerSet] = left.size <= right.size ? [left, right] : [right, left]

  for (const productId of smallerSet) {
    if (largerSet.has(productId)) {
      count += 1
    }
  }

  return count
}

function clampLimit(limit?: number) {
  return Math.min(Math.max(1, limit ?? defaultPageLimit), maxPageLimit)
}

function uniqueValues<T extends string>(values: readonly T[]) {
  return [...new Set(values)]
}
