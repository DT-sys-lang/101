import {
  buildDomainFromCmsFactsWithProductTolerance,
  CmsFactValidationError,
  normalizeCmsFactInputWithProductTolerance,
  type ProductFactValidationIssue,
} from '@/adapter/product.adapter'
import { readCmsProductSourceConfig } from './source'

export interface CmsFactsInputDiagnostics {
  readonly ok: boolean
  readonly source: string
  readonly stage: 'shape' | 'normalize' | 'domain-build' | 'passed'
  readonly counts: {
    readonly categoryFacts: number
    readonly productFacts: number
    readonly acceptedProductFacts?: number
    readonly rejectedProductFacts?: number
    readonly rootCategoryFacts: number
    readonly normalizedProducts?: number
  }
  readonly samples: {
    readonly categoryIds: readonly string[]
    readonly productIds: readonly string[]
  }
  readonly error?: CmsFactsDiagnosticError
  readonly rejectedProductFacts?: readonly ProductFactValidationIssue[]
  readonly hints: readonly string[]
}

export interface CmsFactsApiDiagnostics {
  readonly ok: boolean
  readonly source: 'cms-facts-api'
  readonly config: {
    readonly requestedMode: string
    readonly endpointConfigured: boolean
    readonly allowFetch: boolean
    readonly authTokenConfigured: boolean
    readonly timeoutMs: number
    readonly publicationState: 'live' | 'preview'
  }
  readonly request?: {
    readonly endpoint: string
    readonly url: string
  }
  readonly fetch?: {
    readonly ok: boolean
    readonly status?: number
    readonly statusText?: string
    readonly durationMs: number
    readonly contentType?: string | null
  }
  readonly input?: CmsFactsInputDiagnostics
  readonly error?: CmsFactsDiagnosticError
  readonly hints: readonly string[]
}

export interface CmsFactsApiDiagnosticOptions {
  readonly endpoint?: string
  readonly token?: string
  readonly allowFetch?: boolean
  readonly timeoutMs?: number
  readonly publicationState?: 'live' | 'preview'
}

export interface CmsFactsDiagnosticError {
  readonly name: string
  readonly message: string
  readonly path?: string
}

export function diagnoseCmsFactsInput(input: unknown, source = 'cms-facts-input'): CmsFactsInputDiagnostics {
  const counts = countFacts(input)
  const samples = sampleFactIds(input)

  if (!isRecord(input)) {
    return failInputDiagnostic(source, 'shape', counts, samples, toDiagnosticError(new Error('CMS facts response must be an object.')))
  }

  try {
    const normalized = normalizeCmsFactInputWithProductTolerance(input)
    const normalizedCounts = {
      ...counts,
      categoryFacts: normalized.categoryFacts.length,
      productFacts: normalized.productFacts.length + normalized.rejectedProductFacts.length,
      acceptedProductFacts: normalized.productFacts.length,
      rejectedProductFacts: normalized.rejectedProductFacts.length,
      rootCategoryFacts: normalized.categoryFacts.filter((category) => category.parentId === null).length,
    }
    const domain = buildDomainFromCmsFactsWithProductTolerance(input)

    return {
      ok: domain.products.length > 0,
      source,
      stage: 'passed',
      counts: {
        ...normalizedCounts,
        normalizedProducts: domain.products.length,
        rejectedProductFacts: domain.rejectedProductFacts.length,
      },
      samples,
      rejectedProductFacts: domain.rejectedProductFacts,
      hints: domain.products.length > 0
        ? hintsForRejectedProducts(domain.rejectedProductFacts)
        : ['All ProductFact entries were rejected; fix at least one product before publishing CMS data.'],
    }
  } catch (error) {
    const diagnosticError = toDiagnosticError(error)
    return failInputDiagnostic(source, error instanceof CmsFactValidationError ? 'normalize' : 'domain-build', counts, samples, diagnosticError)
  }
}

export async function diagnoseCmsFactsApi(options: CmsFactsApiDiagnosticOptions = {}): Promise<CmsFactsApiDiagnostics> {
  const config = readCmsProductSourceConfig()
  const endpoint = readTrimmedValue(options.endpoint) ?? config.factsApi.endpoint
  const token = readTrimmedValue(options.token) ?? config.factsApi.authToken
  const allowFetch = options.allowFetch ?? config.factsApi.allowFetch
  const timeoutMs = options.timeoutMs ?? config.factsApi.timeoutMs
  const publicationState = options.publicationState ?? 'live'
  const baseHints: string[] = []

  const base = {
    source: 'cms-facts-api' as const,
    config: {
      requestedMode: config.requestedMode,
      endpointConfigured: Boolean(endpoint),
      allowFetch,
      authTokenConfigured: Boolean(token),
      timeoutMs,
      publicationState,
    },
  }

  if (config.requestedMode !== 'cms-facts-api') {
    baseHints.push('Set CMS_SOURCE_MODE=cms-facts-api in the active Vercel environment.')
  }

  if (!allowFetch) {
    return {
      ok: false,
      ...base,
      error: toDiagnosticError(new Error('CMS facts API fetch is disabled.')),
      hints: [...baseHints, 'Set CMS_FACTS_API_ALLOW_FETCH=true, then redeploy Vercel.'],
    }
  }

  if (!endpoint) {
    return {
      ok: false,
      ...base,
      error: toDiagnosticError(new Error('CMS_FACTS_API_URL is not configured.')),
      hints: [...baseHints, 'Set CMS_FACTS_API_URL=https://cms.yufavor.com/internal/cms/facts.'],
    }
  }

  if (!token) {
    baseHints.push('CMS_FACTS_API_TOKEN is empty; the private CMS endpoint will normally return 401.')
  }

  const requestUrl = buildFactsApiUrl(endpoint, publicationState)
  const startedAt = Date.now()

  try {
    const response = await fetchWithTimeout(requestUrl, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }, timeoutMs)
    const durationMs = Date.now() - startedAt
    const fetchSummary = {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      durationMs,
      contentType: response.headers.get('content-type'),
    }

    if (!response.ok) {
      return {
        ok: false,
        ...base,
        request: { endpoint, url: requestUrl.toString() },
        fetch: fetchSummary,
        error: toDiagnosticError(new Error(`CMS facts API returned HTTP ${response.status}.`)),
        hints: [...baseHints, ...hintsForHttpStatus(response.status)],
      }
    }

    const raw = await readJsonResponse(response)
    const input = unwrapCmsFactsPayload(raw)
    const inputDiagnostic = diagnoseCmsFactsInput(input, requestUrl.toString())

    return {
      ok: inputDiagnostic.ok,
      ...base,
      request: { endpoint, url: requestUrl.toString() },
      fetch: fetchSummary,
      input: inputDiagnostic,
      error: inputDiagnostic.error,
      hints: [...baseHints, ...inputDiagnostic.hints],
    }
  } catch (error) {
    return {
      ok: false,
      ...base,
      request: { endpoint, url: requestUrl.toString() },
      fetch: {
        ok: false,
        durationMs: Date.now() - startedAt,
      },
      error: toDiagnosticError(error),
      hints: [...baseHints, 'Confirm cms.yufavor.com is reachable from Vercel and the BaoTa reverse proxy points to http://127.0.0.1:1337.'],
    }
  }
}

function failInputDiagnostic(
  source: string,
  stage: CmsFactsInputDiagnostics['stage'],
  counts: CmsFactsInputDiagnostics['counts'],
  samples: CmsFactsInputDiagnostics['samples'],
  error: CmsFactsDiagnosticError,
): CmsFactsInputDiagnostics {
  return {
    ok: false,
    source,
    stage,
    counts,
    samples,
    error,
    hints: hintsForValidationError(error, counts),
  }
}

function countFacts(value: unknown): CmsFactsInputDiagnostics['counts'] {
  const categoryFacts = isRecord(value) && Array.isArray(value.categoryFacts) ? value.categoryFacts : []
  const productFacts = isRecord(value) && Array.isArray(value.productFacts) ? value.productFacts : []

  return {
    categoryFacts: categoryFacts.length,
    productFacts: productFacts.length,
    rootCategoryFacts: categoryFacts.filter((fact) => isRecord(fact) && fact.parentId === null).length,
  }
}

function sampleFactIds(value: unknown): CmsFactsInputDiagnostics['samples'] {
  const categoryFacts = isRecord(value) && Array.isArray(value.categoryFacts) ? value.categoryFacts : []
  const productFacts = isRecord(value) && Array.isArray(value.productFacts) ? value.productFacts : []

  return {
    categoryIds: categoryFacts.map(readStableFactId).filter(Boolean).slice(0, 5),
    productIds: productFacts.map(readStableFactId).filter(Boolean).slice(0, 5),
  }
}

function readStableFactId(value: unknown): string {
  if (!isRecord(value)) {
    return ''
  }

  const id = value.id ?? value.factId
  return typeof id === 'string' ? id : ''
}

function buildFactsApiUrl(endpoint: string, publicationState: 'live' | 'preview') {
  const url = new URL(endpoint)
  url.searchParams.set('publicationState', publicationState)
  return url
}

async function fetchWithTimeout(url: URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

async function readJsonResponse(response: Response) {
  try {
    return await response.json()
  } catch (error) {
    throw new Error(`CMS facts API did not return valid JSON: ${getErrorMessage(error)}`)
  }
}

function unwrapCmsFactsPayload(value: unknown): unknown {
  if (isRecord(value) && isRecord(value.data) && Array.isArray(value.data.categoryFacts) && Array.isArray(value.data.productFacts)) {
    return value.data
  }

  return value
}

function hintsForHttpStatus(status: number) {
  if (status === 401 || status === 403) {
    return ['Check CMS_FACTS_API_TOKEN in Vercel; it must match INTERNAL_CMS_FACTS_TOKEN on the Strapi server.']
  }

  if (status === 404) {
    return ['Check CMS_FACTS_API_URL; the expected value is https://cms.yufavor.com/internal/cms/facts.']
  }

  if (status >= 500) {
    return ['Check Strapi logs for the cms-facts request and confirm ProductFact/CategoryFact entries are valid and published.']
  }

  return []
}

function hintsForValidationError(error: CmsFactsDiagnosticError, counts: CmsFactsInputDiagnostics['counts']) {
  const hints: string[] = []
  const message = error.message

  if (counts.categoryFacts === 0) {
    hints.push('Create and publish at least one CategoryFact entry.')
  }

  if (counts.rootCategoryFacts !== 1) {
    hints.push('Exactly one CategoryFact must have no parent; all other categories should point to a parent.')
  }

  if (counts.productFacts === 0) {
    hints.push('Create and publish at least one ProductFact entry after the root category exists.')
  }

  if (message.includes('sensorProfile') || message.includes('measurements') || message.includes('outputs')) {
    hints.push('Sensor ProductFact entries must include both measurements and outputs.')
  }

  if (message.includes('specificationGroups')) {
    hints.push('ProductFact specificationGroups must contain at least one group with at least one value.')
  }

  if (message.includes('unknown category') || message.includes('primaryCategory')) {
    hints.push('ProductFact primaryCategory must point to an existing published CategoryFact.')
  }

  if (message.includes('measurement kind') || message.includes('measurementKinds')) {
    hints.push('Every measurementKinds item must match a measurement.kind entry.')
  }

  return hints
}

function hintsForRejectedProducts(rejectedProductFacts: readonly ProductFactValidationIssue[]) {
  if (rejectedProductFacts.length === 0) {
    return []
  }

  return [
    `${rejectedProductFacts.length} ProductFact entries were skipped; valid products are still published.`,
    'Open rejectedProductFacts in this diagnostics response to fix the affected products.',
  ]
}

function toDiagnosticError(error: unknown): CmsFactsDiagnosticError {
  if (error instanceof CmsFactValidationError) {
    return {
      name: error.name,
      message: error.message,
      path: error.path,
    }
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    }
  }

  return {
    name: 'UnknownError',
    message: String(error),
  }
}

function readTrimmedValue(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
