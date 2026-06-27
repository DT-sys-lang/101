import 'server-only'

import { timingSafeEqual } from 'node:crypto'
import { type Locale } from '@/i18n/routing'
import { getLocaleFromRequest } from '@/lib/api/contracts'
import {
  type ApplicationCanonicalPath,
  type ApplicationId,
  type CategoryCanonicalPath,
  type CategoryId,
  type IndustryCanonicalPath,
  type IndustryId,
  type ProductCanonicalPath,
  type ProductId,
  selectProductSeo,
} from '@/lib/domain'
import { resolveApplicationCanonicalPathById, resolveIndustryCanonicalPathById } from '@/lib/domain/preview-routing'
import { getRuntimeDomainProductCatalog } from '@/lib/runtime/domain-products'

export const CMS_PREVIEW_VERSION = 'cms-preview-v1'
export const CMS_PREVIEW_SECRET_HEADER = 'x-cms-preview-secret'
export const CMS_PREVIEW_SECRET_QUERY_PARAM = 'secret'
export const CMS_PREVIEW_CONTENT_TYPE_QUERY_PARAM = 'contentType'
export const CMS_PREVIEW_ENTRY_ID_QUERY_PARAM = 'entryId'
export const CMS_PREVIEW_ACCEPTED_CONTENT_TYPES = ['product', 'category', 'industry', 'application'] as const

const previewSecretEnv = 'CMS_PREVIEW_SECRET'
const tokenDelimiter = /[^a-z0-9]+/g
const domainIdPrefixMap = {
  prd: 'product',
  cat: 'category',
  ind: 'industry',
  app: 'application',
} as const

export type CmsPreviewContentType = typeof CMS_PREVIEW_ACCEPTED_CONTENT_TYPES[number]
export type CmsPreviewResolvedFrom = 'product-record' | 'category-tree' | 'industry-entry' | 'application-entry'

export interface CmsPreviewRequest {
  readonly locale: Locale
  readonly entryId: string
  readonly contentType?: CmsPreviewContentType
  readonly secret: string
}

export interface CmsPreviewRouteInfo {
  readonly version: typeof CMS_PREVIEW_VERSION
  readonly locale: Locale
  readonly contentType: CmsPreviewContentType
  readonly entryId: string
  readonly resolvedFrom: CmsPreviewResolvedFrom
  readonly canonicalPath: ProductCanonicalPath | CategoryCanonicalPath | IndustryCanonicalPath | ApplicationCanonicalPath
  readonly redirectTo: string
}

export class CmsPreviewError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.name = 'CmsPreviewError'
    this.code = code
    this.status = status
  }
}

export function readCmsPreviewSecretFromRequest(request: Request) {
  const url = new URL(request.url)
  return readProvidedSecret(request.headers, url.searchParams)
}

export function parseCmsPreviewRequest(request: Request): CmsPreviewRequest {
  const url = new URL(request.url)
  const locale = getLocaleFromRequest(request)
  const secret = readProvidedSecret(request.headers, url.searchParams)
  const entryId = readRequiredQueryParam(url.searchParams, CMS_PREVIEW_ENTRY_ID_QUERY_PARAM)
  const contentType = normalizeCmsPreviewContentType(url.searchParams.get(CMS_PREVIEW_CONTENT_TYPE_QUERY_PARAM))
  const contentTypeHint = url.searchParams.get(CMS_PREVIEW_CONTENT_TYPE_QUERY_PARAM)

  if (contentTypeHint && !contentType) {
    throw new CmsPreviewError('cms-preview-invalid-content-type', 'contentType must resolve to product, category, industry, or application.', 400)
  }

  return {
    locale,
    entryId,
    contentType,
    secret,
  }
}

export function verifyCmsPreviewSecret(providedSecret: string) {
  const secret = readTrimmedValue(process.env[previewSecretEnv])

  if (!secret) {
    throw new CmsPreviewError('cms-preview-secret-missing', 'CMS_PREVIEW_SECRET is not configured.', 500)
  }

  const received = readTrimmedValue(providedSecret)

  if (!received) {
    throw new CmsPreviewError('cms-preview-secret-missing', 'Preview secret is required.', 401)
  }

  if (!isValidSecret(secret, received)) {
    throw new CmsPreviewError('cms-preview-invalid-secret', 'Preview secret verification failed.', 401)
  }
}

export function resolveCmsPreviewRoute(request: CmsPreviewRequest): CmsPreviewRouteInfo {
  const kindFromEntryId = inferContentTypeFromEntryId(request.entryId)

  if (!kindFromEntryId) {
    throw new CmsPreviewError(
      'cms-preview-entry-id-unresolved',
      'entryId must use a domain-normalized prd_, cat_, ind_, or app_ identifier.',
      400,
    )
  }

  const contentType = request.contentType ?? kindFromEntryId

  if (request.contentType && request.contentType !== kindFromEntryId) {
    throw new CmsPreviewError('cms-preview-content-type-mismatch', 'contentType does not match entryId.', 400)
  }

  switch (contentType) {
    case 'product':
      return resolveProductPreviewRoute(request.locale, request.entryId as ProductId)
    case 'category':
      return resolveCategoryPreviewRoute(request.locale, request.entryId as CategoryId)
    case 'industry':
      return resolveIndustryPreviewRoute(request.locale, request.entryId as IndustryId)
    case 'application':
      return resolveApplicationPreviewRoute(request.locale, request.entryId as ApplicationId)
  }
}

function resolveProductPreviewRoute(locale: Locale, productId: ProductId): CmsPreviewRouteInfo {
  const catalog = getRuntimeDomainProductCatalog(locale)
  const product = catalog.byId.get(productId)

  if (!product) {
    throw new CmsPreviewError('cms-preview-product-not-found', `No product record was found for ${productId}.`, 404)
  }

  const canonicalPath = selectProductSeo(product, locale).slug.canonicalPath

  return buildPreviewRouteInfo(locale, 'product', productId, canonicalPath, 'product-record')
}

function resolveCategoryPreviewRoute(locale: Locale, categoryId: CategoryId): CmsPreviewRouteInfo {
  const catalog = getRuntimeDomainProductCatalog(locale)
  const category = catalog.categoryById.get(categoryId)

  if (!category) {
    throw new CmsPreviewError('cms-preview-category-not-found', `No category record was found for ${categoryId}.`, 404)
  }

  return buildPreviewRouteInfo(locale, 'category', categoryId, category.canonicalPath, 'category-tree')
}

function resolveIndustryPreviewRoute(locale: Locale, industryId: IndustryId): CmsPreviewRouteInfo {
  const canonicalPath = resolveIndustryCanonicalPathById(industryId)

  if (!canonicalPath) {
    throw new CmsPreviewError('cms-preview-industry-not-found', `No industry route was found for ${industryId}.`, 404)
  }

  return buildPreviewRouteInfo(locale, 'industry', industryId, canonicalPath, 'industry-entry')
}

function resolveApplicationPreviewRoute(locale: Locale, applicationId: ApplicationId): CmsPreviewRouteInfo {
  const canonicalPath = resolveApplicationCanonicalPathById(applicationId)

  if (!canonicalPath) {
    throw new CmsPreviewError('cms-preview-application-not-found', `No application route was found for ${applicationId}.`, 404)
  }

  return buildPreviewRouteInfo(locale, 'application', applicationId, canonicalPath, 'application-entry')
}

function buildPreviewRouteInfo(
  locale: Locale,
  contentType: CmsPreviewContentType,
  entryId: string,
  canonicalPath: CmsPreviewRouteInfo['canonicalPath'],
  resolvedFrom: CmsPreviewResolvedFrom,
): CmsPreviewRouteInfo {
  return {
    version: CMS_PREVIEW_VERSION,
    locale,
    contentType,
    entryId,
    resolvedFrom,
    canonicalPath,
    redirectTo: `/${locale}${canonicalPath}`,
  }
}

function readProvidedSecret(headers: Headers, searchParams: URLSearchParams) {
  const headerSecret = readTrimmedValue(headers.get(CMS_PREVIEW_SECRET_HEADER))
  const querySecret = readTrimmedValue(searchParams.get(CMS_PREVIEW_SECRET_QUERY_PARAM))

  if (headerSecret && querySecret && headerSecret !== querySecret) {
    throw new CmsPreviewError('cms-preview-secret-mismatch', 'Preview secret header and query parameter must match.', 401)
  }

  return headerSecret ?? querySecret ?? ''
}

function readRequiredQueryParam(searchParams: URLSearchParams, key: string) {
  const value = readTrimmedValue(searchParams.get(key))

  if (!value) {
    throw new CmsPreviewError('cms-preview-missing-entry-id', `${key} is required.`, 400)
  }

  return value
}

function normalizeCmsPreviewContentType(value: string | null): CmsPreviewContentType | undefined {
  const tokens = tokenizePreviewValue(value)

  if (tokens.size === 0) {
    return undefined
  }

  const matches: CmsPreviewContentType[] = []

  for (const contentType of CMS_PREVIEW_ACCEPTED_CONTENT_TYPES) {
    if (tokens.has(contentType)) {
      matches.push(contentType)
    }
  }

  return matches.length === 1 ? matches[0] : undefined
}

function inferContentTypeFromEntryId(entryId: string): CmsPreviewContentType | undefined {
  const prefix = entryId.slice(0, 3).toLowerCase() as keyof typeof domainIdPrefixMap
  const contentType = domainIdPrefixMap[prefix]

  return contentType as CmsPreviewContentType | undefined
}

function tokenizePreviewValue(value: string | null) {
  const tokens = new Set<string>()
  const normalized = readTrimmedValue(value)?.toLowerCase()

  if (!normalized) {
    return tokens
  }

  for (const token of normalized.replace(/[:.]+/g, '-').split(tokenDelimiter)) {
    if (token) {
      tokens.add(token)
    }
  }

  return tokens
}

function readTrimmedValue(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function isValidSecret(expected: string, received: string) {
  if (expected.length === 0 || received.length === 0 || expected.length !== received.length) {
    return false
  }

  return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(received, 'utf8'))
}
