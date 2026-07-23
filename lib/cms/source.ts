import { readFileSync } from 'node:fs'
import path from 'node:path'
import { industrialSensorCategoryTree, type CategoryNode, type ProductRecord } from '@/lib/domain'
import { mockProducts, mockProductSource } from '@/lib/domain/mock-products'
import { flattenCategoryNodes, normalizeCmsFactInput, type CmsFactInput } from './adapter'
import { normalizeCmsFactsBusinessLocale } from './business-locale'

export type CmsProductSourceMode = 'mock-domain' | 'env-facts-json' | 'cms-facts-api'
export type CmsProductSourceFallbackReason = 'not-requested' | 'not-configured' | 'fetch-disabled' | 'not-implemented' | 'invalid-env-json' | 'timeout' | 'network-error' | 'http-error' | 'invalid-response' | 'validation-error'

export interface CmsProductFactsApiConfig {
  readonly endpointConfigured: boolean
  readonly endpoint: string | undefined
  readonly timeoutMs: number
  readonly publicationStateParam: string
  readonly previewEntryIdParam: string
  readonly previewContentTypeParam: string
  readonly authTokenConfigured: boolean
  readonly authToken: string | undefined
  readonly allowFetch: boolean
}

export interface CmsProductSourceConfig {
  readonly requestedMode: CmsProductSourceMode
  readonly factsApi: CmsProductFactsApiConfig
}

export interface CmsProductSourceMetadata {
  readonly requestedMode: CmsProductSourceMode
  readonly activeMode: CmsProductSourceMode
  readonly supportedModes: readonly CmsProductSourceMode[]
  readonly factsJsonConfigured: boolean
  readonly factsJsonValid: boolean
  readonly factsApiConfigured: boolean
  readonly factsApiFetchEnabled: boolean
  readonly factsApiAuthConfigured: boolean
  readonly factsApiTimeoutMs: number
  readonly factsApiParamNames: {
    readonly publicationState: string
    readonly previewEntryId: string
    readonly previewContentType: string
  }
  readonly fallbackReason?: CmsProductSourceFallbackReason
}

const supportedModes = ['mock-domain', 'env-facts-json', 'cms-facts-api'] as const satisfies readonly CmsProductSourceMode[]

export interface CmsProductFactsApiRequest {
  readonly endpoint: string
  readonly timeoutMs: number
  readonly queryParams: Readonly<Record<string, string>>
  readonly headers: Readonly<Record<string, string>>
}

export interface CmsProductFactsApiResponse {
  readonly categoryFacts: CmsFactInput['categoryFacts']
  readonly productFacts: CmsFactInput['productFacts']
}

export interface CmsProductFactsApiRequestOptions {
  readonly publicationState?: 'live' | 'preview'
  readonly previewEntryId?: string
  readonly previewContentType?: string
}

export interface CmsProductSourceResult {
  readonly mode: CmsProductSourceMode
  readonly sourceVersion: string
  readonly cmsFacts: CmsFactInput
  readonly metadata: CmsProductSourceMetadata
}

interface ResolvedCmsProductSource {
  readonly mode: CmsProductSourceMode
  readonly sourceVersion: string
  readonly cmsFacts: CmsFactInput
  readonly factsJsonConfigured: boolean
  readonly factsJsonValid: boolean
  readonly fallbackReason?: CmsProductSourceFallbackReason
}

interface CmsFactsJsonResolution {
  readonly configured: boolean
  readonly valid: boolean
  readonly source?: {
    readonly sourceVersion: string
    readonly cmsFacts: CmsFactInput
  }
}

interface CmsFactsApiResolution {
  readonly source?: {
    readonly sourceVersion: string
    readonly cmsFacts: CmsFactInput
  }
  readonly fallbackReason?: CmsProductSourceFallbackReason
}

class CmsFactsApiFetchError extends Error {
  readonly fallbackReason: CmsProductSourceFallbackReason

  constructor(fallbackReason: CmsProductSourceFallbackReason, message: string) {
    super(message)
    this.name = 'CmsFactsApiFetchError'
    this.fallbackReason = fallbackReason
  }
}

export function readCmsProductSourceConfig(): CmsProductSourceConfig {
  const requestedMode = readRequestedMode(process.env.CMS_SOURCE_MODE)
  const endpoint = readTrimmedValue(process.env.CMS_FACTS_API_URL)
  const authToken = readTrimmedValue(process.env.CMS_FACTS_API_TOKEN)

  return {
    requestedMode,
    factsApi: {
      endpointConfigured: Boolean(endpoint),
      endpoint,
      timeoutMs: readPositiveInteger(process.env.CMS_FACTS_API_TIMEOUT_MS, 5000),
      publicationStateParam: readTrimmedValue(process.env.CMS_FACTS_API_PUBLICATION_STATE_PARAM) ?? 'publicationState',
      previewEntryIdParam: readTrimmedValue(process.env.CMS_FACTS_API_PREVIEW_ENTRY_ID_PARAM) ?? 'previewEntryId',
      previewContentTypeParam: readTrimmedValue(process.env.CMS_FACTS_API_PREVIEW_CONTENT_TYPE_PARAM) ?? 'previewContentType',
      authTokenConfigured: Boolean(authToken),
      authToken,
      allowFetch: readBoolean(process.env.CMS_FACTS_API_ALLOW_FETCH),
    },
  }
}

export function readCmsProductSource(): CmsProductSourceResult {
  const config = readCmsProductSourceConfig()
  const factsJsonResolution = readCmsFactsJsonResolution(process.env.CMS_FACTS_JSON?.trim(), process.env.CMS_FACTS_JSON_FILE?.trim())
  const source = resolveCmsProductSource(config, factsJsonResolution)

  return {
    mode: source.mode,
    sourceVersion: source.sourceVersion,
    cmsFacts: source.cmsFacts,
    metadata: buildCmsProductSourceMetadata(config, source),
  }
}

export async function readCmsProductSourceAsync(): Promise<CmsProductSourceResult> {
  const config = readCmsProductSourceConfig()
  const factsJsonResolution = readCmsFactsJsonResolution(process.env.CMS_FACTS_JSON?.trim(), process.env.CMS_FACTS_JSON_FILE?.trim())
  const source = await resolveCmsProductSourceAsync(config, factsJsonResolution)

  return {
    mode: source.mode,
    sourceVersion: source.sourceVersion,
    cmsFacts: source.cmsFacts,
    metadata: buildCmsProductSourceMetadata(config, source),
  }
}

export function createCmsFactsApiRequest(
  config: CmsProductSourceConfig = readCmsProductSourceConfig(),
  options: CmsProductFactsApiRequestOptions = {},
): CmsProductFactsApiRequest | undefined {
  if (!config.factsApi.endpoint) {
    return undefined
  }

  const queryParams: Record<string, string> = {
    [config.factsApi.publicationStateParam]: options.publicationState ?? 'live',
  }
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (config.factsApi.authToken) {
    headers.Authorization = `Bearer ${config.factsApi.authToken}`
  }

  if (options.previewEntryId) {
    queryParams[config.factsApi.previewEntryIdParam] = options.previewEntryId
  }

  if (options.previewContentType) {
    queryParams[config.factsApi.previewContentTypeParam] = options.previewContentType
  }

  return {
    endpoint: config.factsApi.endpoint,
    timeoutMs: config.factsApi.timeoutMs,
    queryParams,
    headers,
  }
}

export function readCmsProductSourceMetadata(hasEnvFactsJson: boolean, hasValidEnvFactsJson = hasEnvFactsJson): CmsProductSourceMetadata {
  const config = readCmsProductSourceConfig()
  const activeMode = resolveCmsProductActiveMode(config, hasEnvFactsJson, hasValidEnvFactsJson)

  return buildCmsProductSourceMetadata(config, {
    mode: activeMode,
    factsJsonConfigured: hasEnvFactsJson,
    factsJsonValid: hasValidEnvFactsJson,
  })
}

export function resolveCmsProductActiveMode(
  configOrHasEnvFactsJson: CmsProductSourceConfig | boolean,
  hasEnvFactsJson = false,
  hasValidEnvFactsJson = hasEnvFactsJson,
): CmsProductSourceMode {
  const config = typeof configOrHasEnvFactsJson === 'boolean' ? readCmsProductSourceConfig() : configOrHasEnvFactsJson
  const envFactsAvailable = typeof configOrHasEnvFactsJson === 'boolean' ? configOrHasEnvFactsJson : hasValidEnvFactsJson

  if (config.requestedMode === 'mock-domain') {
    return 'mock-domain'
  }

  if (config.requestedMode === 'env-facts-json') {
    return envFactsAvailable ? 'env-facts-json' : 'mock-domain'
  }

  if (config.requestedMode === 'cms-facts-api') {
    return envFactsAvailable ? 'env-facts-json' : 'mock-domain'
  }

  return envFactsAvailable ? 'env-facts-json' : 'mock-domain'
}

function readRequestedMode(value: string | undefined): CmsProductSourceMode {
  if (value === 'env-facts-json' || value === 'cms-facts-api') {
    return value
  }

  return 'mock-domain'
}

function resolveCmsProductSource(
  config: CmsProductSourceConfig,
  factsJsonResolution: CmsFactsJsonResolution,
): ResolvedCmsProductSource {
  if (config.requestedMode === 'mock-domain') {
    return readMockDomainSource(factsJsonResolution.configured, factsJsonResolution.valid)
  }

  if (config.requestedMode === 'env-facts-json') {
    if (factsJsonResolution.source) {
      return {
        mode: 'env-facts-json',
        sourceVersion: factsJsonResolution.source.sourceVersion,
        cmsFacts: factsJsonResolution.source.cmsFacts,
        factsJsonConfigured: factsJsonResolution.configured,
        factsJsonValid: factsJsonResolution.valid,
      }
    }

    return readMockDomainSource(
      factsJsonResolution.configured,
      factsJsonResolution.valid,
      factsJsonResolution.configured ? 'invalid-env-json' : 'not-configured',
    )
  }

  const cmsFallbackReason = resolveCmsFactsApiFallbackReason(config)

  if (factsJsonResolution.source) {
    return {
      mode: 'env-facts-json',
      sourceVersion: factsJsonResolution.source.sourceVersion,
      cmsFacts: factsJsonResolution.source.cmsFacts,
      factsJsonConfigured: factsJsonResolution.configured,
      factsJsonValid: factsJsonResolution.valid,
      fallbackReason: cmsFallbackReason,
    }
  }

  return readMockDomainSource(
    factsJsonResolution.configured,
    factsJsonResolution.valid,
    factsJsonResolution.configured ? 'invalid-env-json' : cmsFallbackReason,
  )
}

async function resolveCmsProductSourceAsync(
  config: CmsProductSourceConfig,
  factsJsonResolution: CmsFactsJsonResolution,
): Promise<ResolvedCmsProductSource> {
  if (config.requestedMode === 'mock-domain') {
    return readMockDomainSource(factsJsonResolution.configured, factsJsonResolution.valid)
  }

  if (config.requestedMode === 'env-facts-json') {
    if (factsJsonResolution.source) {
      return {
        mode: 'env-facts-json',
        sourceVersion: factsJsonResolution.source.sourceVersion,
        cmsFacts: factsJsonResolution.source.cmsFacts,
        factsJsonConfigured: factsJsonResolution.configured,
        factsJsonValid: factsJsonResolution.valid,
      }
    }

    return readMockDomainSource(
      factsJsonResolution.configured,
      factsJsonResolution.valid,
      factsJsonResolution.configured ? 'invalid-env-json' : 'not-configured',
    )
  }

  const cmsFactsApiResolution = await readCmsFactsApiResolution(config)

  if (cmsFactsApiResolution.source) {
    return {
      mode: 'cms-facts-api',
      sourceVersion: cmsFactsApiResolution.source.sourceVersion,
      cmsFacts: cmsFactsApiResolution.source.cmsFacts,
      factsJsonConfigured: factsJsonResolution.configured,
      factsJsonValid: factsJsonResolution.valid,
      fallbackReason: cmsFactsApiResolution.fallbackReason,
    }
  }

  if (factsJsonResolution.source) {
    return {
      mode: 'env-facts-json',
      sourceVersion: factsJsonResolution.source.sourceVersion,
      cmsFacts: factsJsonResolution.source.cmsFacts,
      factsJsonConfigured: factsJsonResolution.configured,
      factsJsonValid: factsJsonResolution.valid,
      fallbackReason: cmsFactsApiResolution.fallbackReason,
    }
  }

  return readMockDomainSource(
    factsJsonResolution.configured,
    factsJsonResolution.valid,
    factsJsonResolution.configured ? 'invalid-env-json' : cmsFactsApiResolution.fallbackReason,
  )
}

async function readCmsFactsApiResolution(config: CmsProductSourceConfig): Promise<CmsFactsApiResolution> {
  if (!config.factsApi.endpointConfigured) {
    return {
      fallbackReason: 'not-configured',
    }
  }

  if (!config.factsApi.allowFetch) {
    return {
      fallbackReason: 'fetch-disabled',
    }
  }

  const request = createCmsFactsApiRequest(config)

  if (!request) {
    return {
      fallbackReason: 'not-configured',
    }
  }

  try {
    const response = await fetchCmsFactsApiResponse(request)

    return {
      source: {
        sourceVersion: 'cms-facts-api-v1',
        cmsFacts: response,
      },
    }
  } catch (error) {
    return {
      fallbackReason: mapCmsFactsApiFallbackReason(error),
    }
  }
}

async function fetchCmsFactsApiResponse(request: CmsProductFactsApiRequest): Promise<CmsProductFactsApiResponse> {
  const url = new URL(request.endpoint)

  for (const [key, value] of Object.entries(request.queryParams)) {
    url.searchParams.set(key, value)
  }

  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => controller.abort(), request.timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: request.headers,
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new CmsFactsApiFetchError('http-error', `CMS facts API responded with HTTP ${response.status}.`)
    }

    let parsed: unknown

    try {
      parsed = await response.json()
    } catch {
      throw new CmsFactsApiFetchError('invalid-response', 'CMS facts API response must be valid JSON.')
    }

    return normalizeCmsFactsApiResponse(parsed)
  } catch (error) {
    if (error instanceof CmsFactsApiFetchError) {
      throw error
    }

    if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
      throw new CmsFactsApiFetchError('timeout', `CMS facts API request timed out after ${request.timeoutMs}ms.`)
    }

    throw new CmsFactsApiFetchError('network-error', error instanceof Error ? error.message : 'CMS facts API request failed.')
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}

function normalizeCmsFactsApiResponse(value: unknown): CmsProductFactsApiResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new CmsFactsApiFetchError('invalid-response', 'CMS facts API response must be an object.')
  }

  const raw = value as Record<string, unknown>
  if ('cmsFacts' in raw || 'data' in raw || 'attributes' in raw || 'meta' in raw) {
    throw new CmsFactsApiFetchError('invalid-response', 'CMS facts API response must be direct CmsFactInput without wrappers or Strapi envelopes.')
  }

  const businessLocaleNormalization = normalizeCmsFactsBusinessLocale(raw)
  rejectForbiddenCmsFactsApiFields(businessLocaleNormalization.cmsFacts, 'cmsFacts')

  const cmsFacts = normalizeCmsFactInput(businessLocaleNormalization.cmsFacts)

  return cmsFacts
}

function rejectForbiddenCmsFactsApiFields(value: unknown, path: string): void {
  if (!value || typeof value !== 'object') {
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectForbiddenCmsFactsApiFields(item, `${path}[${index}]`))
    return
  }

  for (const [key, child] of Object.entries(value)) {
    if (forbiddenCmsFactsApiFieldNames.has(key)) {
      throw new CmsFactsApiFetchError('invalid-response', `${path}.${key} must not be returned by the CMS facts API.`)
    }

    if (key === 'id' && typeof child === 'number') {
      throw new CmsFactsApiFetchError('invalid-response', `${path}.id must not expose a Strapi numeric id.`)
    }

    rejectForbiddenCmsFactsApiFields(child, `${path}.${key}`)
  }
}

const forbiddenCmsFactsApiFieldNames = new Set([
  'data',
  'attributes',
  'meta',
  'cmsFacts',
  'documentId',
  'createdAt',
  'updatedAt',
  'publishedAt',
  'createdBy',
  'updatedBy',
  'slug',
  'slugPath',
  'canonical',
  'canonicalPath',
  'breadcrumb',
  'seo',
  'localizedSeo',
  'jsonld',
  'jsonLd',
  'jsonLD',
  'geo',
  'geoAi',
  'localizedGeoAi',
  'geoEntity',
  'entity',
  'identity',
  'classification',
  'categoryPath',
  'depth',
  'children',
])

function mapCmsFactsApiFallbackReason(error: unknown): CmsProductSourceFallbackReason {
  if (error instanceof CmsFactsApiFetchError) {
    return error.fallbackReason
  }

  return 'network-error'
}

function resolveCmsFactsApiFallbackReason(config: CmsProductSourceConfig): CmsProductSourceFallbackReason {
  if (!config.factsApi.endpointConfigured) {
    return 'not-configured'
  }

  if (!config.factsApi.allowFetch) {
    return 'fetch-disabled'
  }

  return 'not-implemented'
}

function readCmsFactsJsonResolution(envFactsJson: string | undefined, envFactsJsonFile: string | undefined): CmsFactsJsonResolution {
  const factsJson = envFactsJson || readCmsFactsJsonFile(envFactsJsonFile)

  if (!factsJson) {
    return {
      configured: false,
      valid: false,
    }
  }

  try {
    return {
      configured: true,
      valid: true,
      source: {
        sourceVersion: 'cms-facts-json-env-v1',
        cmsFacts: normalizeCmsFactInput(normalizeCmsFactsBusinessLocale(JSON.parse(factsJson) as unknown).cmsFacts),
      },
    }
  } catch {
    return {
      configured: true,
      valid: false,
    }
  }
}

function readCmsFactsJsonFile(filePath: string | undefined): string | undefined {
  const trimmedPath = readTrimmedValue(filePath)

  if (!trimmedPath) {
    return undefined
  }

  try {
    const resolvedPath = path.isAbsolute(trimmedPath)
      ? trimmedPath
      : path.join(process.cwd(), 'outputs', path.basename(trimmedPath))
    return readFileSync(resolvedPath, 'utf8')
  } catch {
    return ''
  }
}

function readMockDomainSource(
  factsJsonConfigured: boolean,
  factsJsonValid: boolean,
  fallbackReason?: CmsProductSourceFallbackReason,
): ResolvedCmsProductSource {
  return {
    mode: 'mock-domain',
    sourceVersion: mockProductSource.version,
    cmsFacts: buildMockDomainFacts(),
    factsJsonConfigured,
    factsJsonValid,
    fallbackReason,
  }
}

function buildMockDomainFacts(): CmsFactInput {
  return {
    categoryFacts: flattenCategoryNodes(industrialSensorCategoryTree.root).map((category) => toCategoryFact(category)),
    productFacts: mockProducts.map((product) => toProductFact(product)),
  }
}

function toCategoryFact(category: CategoryNode): CmsFactInput['categoryFacts'][number] {
  return {
    id: category.id,
    parentId: category.parentId,
    name: category.name,
  }
}

function toProductFact(product: ProductRecord): CmsFactInput['productFacts'][number] {
  return {
    id: product.identity.id,
    family: product.core.family,
    core: product.core,
    sensorProfile: product.sensorProfile,
    valveProfile: product.valveProfile,
    sku: product.identity.sku,
    model: product.identity.model,
    seriesId: product.identity.seriesId,
    brand: product.identity.brand,
    manufacturer: product.identity.manufacturer,
    availability: product.identity.availability,
    releasedAt: product.identity.releasedAt,
    revisedAt: product.identity.revisedAt,
    primaryCategoryId: product.classification.primaryCategoryId,
    additionalCategoryIds: product.classification.additionalCategoryIds ?? [],
    industryIds: product.classification.industryIds,
    applicationIds: product.classification.applicationIds,
    measurementKinds: product.classification.measurementKinds,
    name: product.content.name,
    shortName: product.content.shortName,
    summary: product.content.summary,
    highlights: product.content.highlights,
    applications: product.content.applications,
    measurements: product.measurements,
    outputs: product.outputs,
    connections: product.connections,
    environmentalLimits: product.environmentalLimits,
    specificationGroups: product.specificationGroups,
    variants: product.variants,
    certifications: product.certifications,
    documents: product.documents,
    assets: product.assets,
    commercialTerms: product.commercialTerms,
  }
}

function buildCmsProductSourceMetadata(
  config: CmsProductSourceConfig,
  source: Pick<ResolvedCmsProductSource, 'mode' | 'factsJsonConfigured' | 'factsJsonValid' | 'fallbackReason'>,
): CmsProductSourceMetadata {
  return {
    requestedMode: config.requestedMode,
    activeMode: source.mode,
    supportedModes,
    factsJsonConfigured: source.factsJsonConfigured,
    factsJsonValid: source.factsJsonValid,
    factsApiConfigured: config.factsApi.endpointConfigured,
    factsApiFetchEnabled: config.requestedMode === 'cms-facts-api' && config.factsApi.endpointConfigured && config.factsApi.allowFetch,
    factsApiAuthConfigured: config.factsApi.authTokenConfigured,
    factsApiTimeoutMs: config.factsApi.timeoutMs,
    factsApiParamNames: {
      publicationState: config.factsApi.publicationStateParam,
      previewEntryId: config.factsApi.previewEntryIdParam,
      previewContentType: config.factsApi.previewContentTypeParam,
    },
    fallbackReason: source.fallbackReason,
  }
}

function readTrimmedValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  const trimmed = readTrimmedValue(value)

  if (!trimmed) {
    return fallback
  }

  const parsed = Number.parseInt(trimmed, 10)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

function readBoolean(value: string | undefined): boolean {
  const normalized = readTrimmedValue(value)?.toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}
