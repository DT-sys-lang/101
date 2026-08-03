import {
  createProductCatalogIndex,
  filterProductCatalog,
  industrialSensorCategoryTree,
  type CategoryTree,
  type LocaleCode,
  type ProductCatalogIndex,
  type ProductFilterQuery,
  type ProductListResult,
  type ProductRecord,
} from '@/lib/domain'
import { mockProducts, mockProductSource } from '@/lib/domain/mock-products'
import { buildDomainFromCmsFactsWithProductTolerance, type ProductFactValidationIssue } from './adapter'
import {
  readCmsProductSource,
  readCmsProductSourceAsync,
  type CmsProductSourceMetadata,
  type CmsProductSourceMode,
  type CmsProductSourceResult,
} from './source'

export type { CmsProductSourceMode } from './source'

export interface CmsProductStatus {
  readonly ok: true
  readonly mode: CmsProductSourceMode
  readonly requestedMode: CmsProductSourceMode
  readonly activeMode: CmsProductSourceMode
  readonly productCount: number
  readonly inputProductCount: number
  readonly rejectedProductCount: number
  readonly rejectedProductFacts: readonly ProductFactValidationIssue[]
  readonly droppedSpecificationValueCount: number
  readonly droppedSpecificationValues: readonly ProductFactValidationIssue[]
  readonly sourceVersion: string
  readonly catalogVersion: ProductCatalogIndex['version']
  readonly locales: readonly LocaleCode[]
  readonly adapter: 'lib/cms/products'
  readonly acceptedInput: readonly string[]
  readonly sourceMetadata: CmsProductSourceMetadata
}

interface CmsProductSnapshot {
  readonly loadedAtMs: number
  readonly mode: CmsProductSourceMode
  readonly sourceVersion: string
  readonly sourceMetadata: CmsProductSourceMetadata
  readonly records: readonly ProductRecord[]
  readonly categoryTree: CategoryTree
  readonly inputProductCount: number
  readonly rejectedProductFacts: readonly ProductFactValidationIssue[]
  readonly droppedSpecificationValues: readonly ProductFactValidationIssue[]
}

let productSnapshotCache: CmsProductSnapshot | undefined
let productSnapshotHydrationPromise: Promise<CmsProductSnapshot> | undefined
const catalogCache = new Map<LocaleCode, ProductCatalogIndex>()
const cmsProductSnapshotTtlMs = readPositiveInteger(process.env.CMS_FACTS_CACHE_TTL_MS, 5 * 60 * 1000)

export function getCmsProductRecords(): readonly ProductRecord[] {
  return getCmsProductSnapshot().records
}

export function getCmsCategoryTree(): CategoryTree {
  return getCmsProductSnapshot().categoryTree
}

export function getCmsProductCatalog(locale: LocaleCode): ProductCatalogIndex {
  const cachedCatalog = catalogCache.get(locale)

  if (cachedCatalog) {
    return cachedCatalog
  }

  const catalog = createProductCatalogIndex({
    locale,
    products: getCmsProductRecords(),
    categoryTree: getCmsCategoryTree(),
  })

  catalogCache.set(locale, catalog)
  return catalog
}

export function listCmsProducts(locale: LocaleCode, query: ProductFilterQuery = {}): ProductListResult {
  return filterProductCatalog(getCmsProductCatalog(locale), query)
}

export function listCmsHomepageProducts(locale: LocaleCode): ProductListResult {
  return listCmsProducts(locale, {
    categoryId: getCmsCategoryTree().root.id,
    categoryMode: 'with-descendants',
    sort: 'category-sort',
    limit: 4,
  })
}

export function getCmsProductSourceVersion() {
  return getCmsProductSnapshot().sourceVersion
}

export function getCmsProductMode(): CmsProductSourceMode {
  return getCmsProductSnapshot().mode
}

export async function preloadCmsProductSnapshotAsync(): Promise<void> {
  if (productSnapshotCache && !shouldRefreshSnapshotWithAsyncSource(productSnapshotCache)) {
    return
  }

  if (!productSnapshotHydrationPromise) {
    productSnapshotHydrationPromise = hydrateCmsProductSnapshotAsync()
  }

  await productSnapshotHydrationPromise
}

export async function refreshCmsProductSnapshotAsync(): Promise<void> {
  if (!productSnapshotHydrationPromise) {
    productSnapshotHydrationPromise = hydrateCmsProductSnapshotAsync()
  }

  await productSnapshotHydrationPromise
}

export function getCmsProductStatus(): CmsProductStatus {
  const snapshot = getCmsProductSnapshot()
  const enCatalog = getCmsProductCatalog('en')

  return {
    ok: true,
    mode: snapshot.mode,
    requestedMode: snapshot.sourceMetadata.requestedMode,
    activeMode: snapshot.sourceMetadata.activeMode,
    productCount: snapshot.records.length,
    inputProductCount: snapshot.inputProductCount,
    rejectedProductCount: snapshot.rejectedProductFacts.length,
    rejectedProductFacts: snapshot.rejectedProductFacts,
    droppedSpecificationValueCount: snapshot.droppedSpecificationValues.length,
    droppedSpecificationValues: snapshot.droppedSpecificationValues,
    sourceVersion: snapshot.sourceVersion,
    catalogVersion: enCatalog.version,
    locales: ['en', 'zh'],
    adapter: 'lib/cms/products',
    acceptedInput: [
      'CMS_FACTS_JSON',
      'CMS_FACTS_JSON_FILE',
      'CMS_SOURCE_MODE',
      'CMS_FACTS_API_URL',
      'CMS_FACTS_API_TIMEOUT_MS',
      'CMS_FACTS_API_PUBLICATION_STATE_PARAM',
      'CMS_FACTS_API_PREVIEW_ENTRY_ID_PARAM',
      'CMS_FACTS_API_PREVIEW_CONTENT_TYPE_PARAM',
      'CMS_FACTS_API_TOKEN',
      'CMS_FACTS_API_ALLOW_FETCH',
      'CMS_FACTS_CACHE_TTL_MS',
    ],
    sourceMetadata: snapshot.sourceMetadata,
  }
}

function getCmsProductSnapshot(): CmsProductSnapshot {
  if (productSnapshotCache) {
    return productSnapshotCache
  }

  const source = readCmsProductSource()
  return setCmsProductSnapshot(source)
}

async function hydrateCmsProductSnapshotAsync(): Promise<CmsProductSnapshot> {
  try {
    const source = await readCmsProductSourceAsync()
    return setCmsProductSnapshot(source)
  } finally {
    productSnapshotHydrationPromise = undefined
  }
}

function setCmsProductSnapshot(source: CmsProductSourceResult): CmsProductSnapshot {
  if (
    productSnapshotCache?.mode === 'cms-facts-api'
    && source.metadata.requestedMode === 'cms-facts-api'
    && source.mode !== 'cms-facts-api'
  ) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        `[cms-products] Keeping last live CMS snapshot because refresh fell back to ${source.mode}: ${source.metadata.fallbackReason ?? 'unknown reason'}`,
      )
    }

    return productSnapshotCache
  }

  let domain: ReturnType<typeof buildDomainFromCmsFactsWithProductTolerance>

  try {
    domain = buildDomainFromCmsFactsWithProductTolerance(source.cmsFacts)

    if (domain.inputProductCount > 0 && domain.products.length === 0) {
      throw new Error('All ProductFact entries were rejected by the tolerant CMS facts adapter.')
    }
  } catch (error) {
    if (productSnapshotCache && productSnapshotCache.records.length > 0) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(
          `[cms-products] Keeping last valid product snapshot because new CMS facts could not be normalized: ${error instanceof Error ? error.message : String(error)}`,
        )
      }

      return productSnapshotCache
    }

    const snapshot = createMockDomainFallbackSnapshot(source)

    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        `[cms-products] Falling back to mock-domain products because CMS facts could not be normalized: ${error instanceof Error ? error.message : String(error)}`,
      )
    }

    productSnapshotCache = snapshot
    catalogCache.clear()
    return snapshot
  }

  if (domain.droppedSpecificationValues.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn(
      `[cms-products] Dropped ${domain.droppedSpecificationValues.length} invalid specification value(s) while retaining their products. Inspect /api/cms/status for details.`,
    )
  }

  const snapshot: CmsProductSnapshot = {
    loadedAtMs: Date.now(),
    mode: source.mode,
    sourceVersion: source.sourceVersion,
    sourceMetadata: source.metadata,
    records: domain.products,
    categoryTree: domain.categoryTree,
    inputProductCount: domain.inputProductCount,
    rejectedProductFacts: domain.rejectedProductFacts,
    droppedSpecificationValues: domain.droppedSpecificationValues,
  }

  productSnapshotCache = snapshot
  catalogCache.clear()
  return snapshot
}

function createMockDomainFallbackSnapshot(source: CmsProductSourceResult): CmsProductSnapshot {
  return {
    loadedAtMs: Date.now(),
    mode: 'mock-domain',
    sourceVersion: `${mockProductSource.version}:fallback-from-${source.sourceVersion}`,
    sourceMetadata: {
      ...source.metadata,
      activeMode: 'mock-domain',
      fallbackReason: 'validation-error',
    },
    records: mockProducts,
    categoryTree: industrialSensorCategoryTree,
    inputProductCount: mockProducts.length,
    rejectedProductFacts: [],
    droppedSpecificationValues: [],
  }
}

function shouldRefreshSnapshotWithAsyncSource(snapshot: CmsProductSnapshot) {
  if (snapshot.sourceMetadata.requestedMode !== 'cms-facts-api' || !snapshot.sourceMetadata.factsApiFetchEnabled) {
    return false
  }

  return snapshot.mode !== 'cms-facts-api' || Date.now() - snapshot.loadedAtMs >= cmsProductSnapshotTtlMs
}

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value?.trim() ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
