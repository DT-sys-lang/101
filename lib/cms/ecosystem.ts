import 'server-only'

import { readCmsResourcesConfig, type CmsResourcesConfig } from '@/lib/cms/resources'
import type { EntryEcosystemContentInput, IndustryId, LocaleCode, ProductId } from '@/lib/domain'
import {
  readStrapiCollectionData,
  readStrapiRelationMany,
  readStrapiRelationOne,
  type StrapiEntityRecord,
} from '@/lib/cms/strapi-response'

type EntityRecord = StrapiEntityRecord

interface RecommendationOrderItem {
  readonly productFactId?: string
  readonly rank?: number
}

export async function listCmsIndustryEcosystemContent(
  locale: LocaleCode,
  config: CmsResourcesConfig = readCmsResourcesConfig(),
): Promise<readonly EntryEcosystemContentInput[]> {
  if (!config.apiBaseUrl) {
    return []
  }

  try {
    const records = await fetchIndustryEcosystemRecords(config)
    return records.map((record) => toEntryEcosystemContentInput(locale, record)).filter(isEntryEcosystemContentInput)
  } catch {
    return []
  }
}

async function fetchIndustryEcosystemRecords(config: CmsResourcesConfig): Promise<readonly EntityRecord[]> {
  const url = new URL(`${config.apiBaseUrl}/industry-ecosystem-recommendations`)
  if (config.apiVersion === '5') {
    url.searchParams.set('status', 'published')
  } else {
    url.searchParams.set('publicationState', 'live')
  }
  url.searchParams.set('pagination[pageSize]', '100')
  url.searchParams.set('populate', '*')

  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: buildRequestHeaders(config),
      signal: controller.signal,
      next: { revalidate: 3600, tags: ['cms-resources', 'industry-ecosystem'] },
    })

    if (!response.ok) {
      return []
    }

    const parsed = await response.json() as unknown
    return readStrapiCollectionData(parsed)
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}

function buildRequestHeaders(config: CmsResourcesConfig): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (config.authToken) {
    headers.Authorization = `Bearer ${config.authToken}`
  }

  return headers
}

function toEntryEcosystemContentInput(locale: LocaleCode, record: EntityRecord): EntryEcosystemContentInput | undefined {
  const id = readString(record.recommendationId)
  const title = readLocalizedText(record.title, locale)

  if (!id || !id.startsWith('eco_') || !title) {
    return undefined
  }

  const industry = readStrapiRelationOne(record.industry)
  const applications = readStrapiRelationMany(record.applications)
  const anchorProduct = readStrapiRelationOne(record.anchorProduct)
  const recommendedProducts = readStrapiRelationMany(record.recommendedProducts)
  const orderedProductIds = orderProductIds(readRecommendationOrder(record.recommendationOrder), recommendedProducts)
  const industryId = readString(industry?.factId)
  const industryLabel = industry ? readLocalizedText(industry.name, locale) ?? readString(industry.factId) : undefined
  const applicationLabels = applications.map((application) => readLocalizedText(application.name, locale) ?? readString(application.factId)).filter(isString)
  const scenario = applicationLabels.length ? applicationLabels.join(' / ') : industryLabel ?? (locale === 'zh' ? '行业组合' : 'Industry pairing')

  return {
    id,
    title,
    industryId: isIndustryId(industryId) ? industryId : undefined,
    industryLabel,
    scenario,
    anchorProductId: readProductId(anchorProduct?.factId),
    recommendedProductIds: orderedProductIds,
    rationale: readLocalizedText(record.rationale, locale) ?? readLocalizedText(record.curationNotes, locale) ?? title,
  }
}

function orderProductIds(orderItems: readonly RecommendationOrderItem[], products: readonly EntityRecord[]): readonly ProductId[] {
  const relationIds = products.map((product) => readProductId(product.factId)).filter(isProductId)
  const relationIdSet = new Set<ProductId>(relationIds)
  const orderedIds = orderItems
    .map((item) => ({ id: readProductId(item.productFactId), rank: item.rank ?? Number.MAX_SAFE_INTEGER }))
    .filter((item): item is { readonly id: ProductId; readonly rank: number } => Boolean(item.id && relationIdSet.has(item.id)))
    .sort((a, b) => a.rank - b.rank)
    .map((item) => item.id)
  const seen = new Set<ProductId>()
  const result: ProductId[] = []

  for (const id of [...orderedIds, ...relationIds]) {
    if (seen.has(id)) {
      continue
    }

    seen.add(id)
    result.push(id)
  }

  return result
}

function readRecommendationOrder(value: unknown): readonly RecommendationOrderItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => {
    if (!isRecord(item)) {
      return {}
    }

    return {
      productFactId: readString(item.productFactId),
      rank: typeof item.rank === 'number' ? item.rank : undefined,
    }
  })
}

function readLocalizedText(value: unknown, locale: LocaleCode): string | undefined {
  if (typeof value === 'string') {
    return normalizeText(value)
  }

  if (!isRecord(value)) {
    return undefined
  }

  const localized = readString(value[locale]) ?? readString(value.en) ?? readString(value.zh)
  return localized ? normalizeText(localized) : undefined
}

function readProductId(value: unknown): ProductId | undefined {
  const id = readString(value)
  return isProductId(id) ? id : undefined
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeText(value: string): string | undefined {
  const normalized = value.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim()
  return normalized || undefined
}

function isRecord(value: unknown): value is EntityRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isString(value: string | undefined): value is string {
  return typeof value === 'string' && value.length > 0
}

function isProductId(value: string | undefined): value is ProductId {
  return Boolean(value?.startsWith('prd_'))
}

function isIndustryId(value: string | undefined): value is IndustryId {
  return Boolean(value?.startsWith('ind_'))
}

function isEntryEcosystemContentInput(value: EntryEcosystemContentInput | undefined): value is EntryEcosystemContentInput {
  return Boolean(value)
}
