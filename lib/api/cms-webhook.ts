import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { routing, type Locale } from '@/i18n/routing'
import { type CategoryId, type ProductId } from '@/lib/domain'
import { type RevalidationInput, type RevalidationScope } from './revalidation'

export const CMS_REVALIDATE_WEBHOOK_VERSION = 'cms-revalidation-webhook-v1'
const signatureHeaderName = 'x-cms-signature'
const timestampHeaderName = 'x-cms-timestamp'
const maxTimestampSkewMs = 5 * 60 * 1000

const allowedEvents = ['entry.publish', 'entry.update', 'entry.unpublish'] as const
const allowedEntities = ['product', 'category', 'industry', 'application', 'asset', 'catalog'] as const
const allowedScopes = ['all', 'product', 'category', 'geo', 'feed', 'static'] as const satisfies readonly RevalidationScope[]
const allowedMetadataKeys = [
  'event',
  'contentType',
  'entity',
  'entryId',
  'locale',
  'productId',
  'categoryId',
  'campaign',
  'scope',
  'publishedAt',
  'updatedAt',
  'occurredAt',
  'sourcePath',
  'industryId',
  'applicationId',
] as const
const rawPayloadKeys = [
  'data',
  'attributes',
  'entry',
  'entries',
  'fact',
  'facts',
  'productFact',
  'productFacts',
  'categoryFact',
  'categoryFacts',
  'products',
  'categoryTree',
  'cmsFacts',
  'raw',
] as const

const allowedMetadataKeySet = new Set<string>(allowedMetadataKeys)

export interface CmsWebhookRevalidationContract {
  readonly version: typeof CMS_REVALIDATE_WEBHOOK_VERSION
  readonly signatureHeader: typeof signatureHeaderName
  readonly timestampHeader: typeof timestampHeaderName
  readonly maxTimestampSkewMs: number
  readonly acceptedEvents: readonly CmsWebhookEvent[]
  readonly acceptedEntities: readonly CmsWebhookEntity[]
  readonly acceptedScopes: readonly RevalidationScope[]
  readonly metadataFields: readonly CmsWebhookMetadataField[]
  readonly rejectedRawPayloadKeys: readonly string[]
  readonly contract: {
    readonly source: 'signed-cms-webhook'
    readonly input: 'metadata-only'
    readonly output: 'domain-normalized-revalidation-impact'
  }
}

export interface CmsWebhookMetadata {
  readonly event: CmsWebhookEvent
  readonly contentType?: string
  readonly entity?: CmsWebhookEntity
  readonly entryId?: string
  readonly locale?: Locale
  readonly productId?: ProductId
  readonly categoryId?: CategoryId
  readonly campaign?: string
  readonly scope?: RevalidationScope
  readonly publishedAt?: string
  readonly updatedAt?: string
  readonly occurredAt?: string
  readonly sourcePath?: string
  readonly industryId?: string
  readonly applicationId?: string
}

export interface CmsWebhookParsedRequest {
  readonly version: typeof CMS_REVALIDATE_WEBHOOK_VERSION
  readonly signature: string
  readonly timestamp: string
  readonly receivedAt: string
  readonly metadata: CmsWebhookMetadata
  readonly revalidationInput: RevalidationInput
}

export type CmsWebhookEvent = typeof allowedEvents[number]
export type CmsWebhookEntity = typeof allowedEntities[number]
export type CmsWebhookMetadataField = keyof CmsWebhookMetadata

export class CmsWebhookError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.name = 'CmsWebhookError'
    this.code = code
    this.status = status
  }
}

export function getCmsWebhookRevalidationContract(): CmsWebhookRevalidationContract {
  return {
    version: CMS_REVALIDATE_WEBHOOK_VERSION,
    signatureHeader: signatureHeaderName,
    timestampHeader: timestampHeaderName,
    maxTimestampSkewMs,
    acceptedEvents: allowedEvents,
    acceptedEntities: allowedEntities,
    acceptedScopes: allowedScopes,
    metadataFields: [...allowedMetadataKeys],
    rejectedRawPayloadKeys: [...rawPayloadKeys],
    contract: {
      source: 'signed-cms-webhook',
      input: 'metadata-only',
      output: 'domain-normalized-revalidation-impact',
    },
  }
}

export function parseCmsWebhookRevalidationRequest(headers: Headers, rawBody: string): CmsWebhookParsedRequest {
  const secret = process.env.CMS_REVALIDATE_SECRET

  if (!secret) {
    throw new CmsWebhookError('cms-webhook-secret-missing', 'CMS_REVALIDATE_SECRET is not configured.', 500)
  }

  const signature = readRequiredHeader(headers, signatureHeaderName)
  const timestamp = readRequiredHeader(headers, timestampHeaderName)
  const timestampMs = Date.parse(timestamp)

  if (!Number.isFinite(timestampMs)) {
    throw new CmsWebhookError('cms-webhook-invalid-timestamp', 'x-cms-timestamp must be an ISO-8601 timestamp.', 401)
  }

  const now = Date.now()
  if (Math.abs(now - timestampMs) > maxTimestampSkewMs) {
    throw new CmsWebhookError('cms-webhook-stale-request', 'Webhook timestamp is outside the allowed skew window.', 401)
  }

  const expectedSignature = createHmac('sha256', secret).update(`${timestamp}${rawBody}`, 'utf8').digest('hex')
  const receivedSignature = normalizeSignature(signature)

  if (!isValidSignature(expectedSignature, receivedSignature)) {
    throw new CmsWebhookError('cms-webhook-invalid-signature', 'Webhook signature verification failed.', 401)
  }

  const parsed = parseMetadata(rawBody)
  ensureAllowedKeys(parsed)
  ensureNoRawPayload(parsed)
  assertMetadata(parsed)

  const metadata = normalizeMetadata(parsed)
  const revalidationInput = deriveRevalidationInput(metadata)

  return {
    version: CMS_REVALIDATE_WEBHOOK_VERSION,
    signature: receivedSignature,
    timestamp,
    receivedAt: new Date(now).toISOString(),
    metadata,
    revalidationInput,
  }
}
function parseMetadata(rawBody: string) {
  let parsed: unknown

  try {
    parsed = JSON.parse(rawBody) as unknown
  } catch {
    throw new CmsWebhookError('cms-webhook-invalid-body', 'Webhook body must be valid JSON metadata.', 400)
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new CmsWebhookError('cms-webhook-invalid-body', 'Webhook body must be a JSON object.', 400)
  }

  return parsed as Record<string, unknown>
}

function ensureAllowedKeys(value: Record<string, unknown>) {
  for (const key of Object.keys(value)) {
    if (!allowedMetadataKeySet.has(key)) {
      throw new CmsWebhookError('cms-webhook-unexpected-field', `Unexpected metadata field "${key}" is not allowed.`, 400)
    }
  }
}

function ensureNoRawPayload(value: Record<string, unknown>) {
  for (const key of rawPayloadKeys) {
    if (key in value) {
      throw new CmsWebhookError('cms-webhook-raw-payload-rejected', `Raw CMS payload field "${key}" is not allowed.`, 400)
    }
  }
}

function assertMetadata(value: Record<string, unknown>) {
  const event = value.event

  if (typeof event !== 'string' || !allowedEvents.includes(event as CmsWebhookEvent)) {
    throw new CmsWebhookError('cms-webhook-invalid-event', 'event must be a supported CMS publish metadata event.', 400)
  }

  validateOptionalString(value.contentType, 'contentType')
  validateOptionalString(value.entryId, 'entryId')
  validateOptionalString(value.campaign, 'campaign')
  validateOptionalString(value.publishedAt, 'publishedAt')
  validateOptionalString(value.updatedAt, 'updatedAt')
  validateOptionalString(value.occurredAt, 'occurredAt')
  validateOptionalString(value.sourcePath, 'sourcePath')
  validateOptionalString(value.industryId, 'industryId')
  validateOptionalString(value.applicationId, 'applicationId')

  if (value.entity !== undefined && (typeof value.entity !== 'string' || !allowedEntities.includes(value.entity as CmsWebhookEntity))) {
    throw new CmsWebhookError('cms-webhook-invalid-entity', 'entity must be a supported CMS entity.', 400)
  }

  if (value.locale !== undefined && !isRuntimeLocale(value.locale)) {
    throw new CmsWebhookError('cms-webhook-invalid-locale', 'locale must be a configured runtime locale.', 400)
  }

  if (value.productId !== undefined && (typeof value.productId !== 'string' || !value.productId.startsWith('prd_'))) {
    throw new CmsWebhookError('cms-webhook-invalid-product', 'productId must start with prd_.', 400)
  }

  if (value.categoryId !== undefined && (typeof value.categoryId !== 'string' || !value.categoryId.startsWith('cat_'))) {
    throw new CmsWebhookError('cms-webhook-invalid-category', 'categoryId must start with cat_.', 400)
  }

  if (value.scope !== undefined && (typeof value.scope !== 'string' || !allowedScopes.includes(value.scope as RevalidationScope))) {
    throw new CmsWebhookError('cms-webhook-invalid-scope', 'scope must be a supported revalidation scope.', 400)
  }
}

function normalizeMetadata(value: Record<string, unknown>): CmsWebhookMetadata {
  const contentType = typeof value.contentType === 'string' ? value.contentType : undefined
  const entryId = typeof value.entryId === 'string' ? value.entryId : undefined
  const entity = inferEntity(value.entity, contentType, entryId)
  const productId = inferProductId(value.productId, entryId)
  const categoryId = inferCategoryId(value.categoryId, entryId)

  const metadata: {
    event: CmsWebhookEvent
    contentType?: string
    entity?: CmsWebhookEntity
    entryId?: string
    locale?: Locale
    productId?: ProductId
    categoryId?: CategoryId
    campaign?: string
    scope?: RevalidationScope
    publishedAt?: string
    updatedAt?: string
    occurredAt?: string
    sourcePath?: string
    industryId?: string
    applicationId?: string
  } = {
    event: value.event as CmsWebhookEvent,
  }

  if (contentType) {
    metadata.contentType = contentType
  }

  if (entity) {
    metadata.entity = entity
  }

  if (entryId) {
    metadata.entryId = entryId
  }

  if (typeof value.locale === 'string' && isRuntimeLocale(value.locale)) {
    metadata.locale = value.locale
  }

  if (productId) {
    metadata.productId = productId
  }

  if (categoryId) {
    metadata.categoryId = categoryId
  }

  if (typeof value.campaign === 'string') {
    metadata.campaign = value.campaign
  }

  if (typeof value.scope === 'string' && allowedScopes.includes(value.scope as RevalidationScope)) {
    metadata.scope = value.scope as RevalidationScope
  }

  if (typeof value.publishedAt === 'string') {
    metadata.publishedAt = value.publishedAt
  }

  if (typeof value.updatedAt === 'string') {
    metadata.updatedAt = value.updatedAt
  }

  if (typeof value.occurredAt === 'string') {
    metadata.occurredAt = value.occurredAt
  }

  if (typeof value.sourcePath === 'string') {
    metadata.sourcePath = value.sourcePath
  }

  if (typeof value.industryId === 'string') {
    metadata.industryId = value.industryId
  }

  if (typeof value.applicationId === 'string') {
    metadata.applicationId = value.applicationId
  }

  return metadata
}

function deriveRevalidationInput(metadata: CmsWebhookMetadata): RevalidationInput {
  if (metadata.scope) {
    return pickInputByScope(metadata.scope, metadata)
  }

  if (metadata.productId) {
    return { scope: 'product', locale: metadata.locale, productId: metadata.productId }
  }

  if (metadata.categoryId) {
    return { scope: 'category', locale: metadata.locale, categoryId: metadata.categoryId }
  }

  switch (metadata.entity) {
    case 'product':
      return { scope: 'product', locale: metadata.locale, productId: metadata.productId }
    case 'category':
      return { scope: 'category', locale: metadata.locale, categoryId: metadata.categoryId }
    case 'catalog':
      return { scope: 'feed', locale: metadata.locale }
    case 'industry':
    case 'application':
    case 'asset':
      return { scope: 'static', locale: metadata.locale }
    default:
      return { scope: 'all', locale: metadata.locale }
  }
}

function pickInputByScope(scope: RevalidationScope, metadata: CmsWebhookMetadata): RevalidationInput {
  switch (scope) {
    case 'product':
      return { scope, locale: metadata.locale, productId: metadata.productId }
    case 'category':
      return { scope, locale: metadata.locale, categoryId: metadata.categoryId }
    case 'geo':
    case 'feed':
    case 'static':
    case 'all':
    default:
      return { scope, locale: metadata.locale, productId: metadata.productId, categoryId: metadata.categoryId }
  }
}

function inferEntity(
  value: unknown,
  contentType?: string,
  entryId?: string,
): CmsWebhookEntity | undefined {
  if (typeof value === 'string' && allowedEntities.includes(value as CmsWebhookEntity)) {
    return value as CmsWebhookEntity
  }

  const lowerContentType = contentType?.toLowerCase()

  if (lowerContentType?.includes('product-fact') || lowerContentType?.includes('.product')) {
    return 'product'
  }

  if (lowerContentType?.includes('category-fact') || lowerContentType?.includes('.category')) {
    return 'category'
  }

  if (lowerContentType?.includes('industry-fact') || lowerContentType?.includes('.industry')) {
    return 'industry'
  }

  if (lowerContentType?.includes('application-fact') || lowerContentType?.includes('.application')) {
    return 'application'
  }

  if (lowerContentType?.includes('document-asset') || lowerContentType?.includes('media') || lowerContentType?.includes('.asset')) {
    return 'asset'
  }

  if (lowerContentType?.includes('catalog')) {
    return 'catalog'
  }

  if (entryId?.startsWith('prd_')) {
    return 'product'
  }

  if (entryId?.startsWith('cat_')) {
    return 'category'
  }

  if (entryId?.startsWith('ind_')) {
    return 'industry'
  }

  if (entryId?.startsWith('app_')) {
    return 'application'
  }

  if (entryId?.startsWith('doc_') || entryId?.startsWith('asset_')) {
    return 'asset'
  }

  return undefined
}

function inferProductId(value: unknown, entryId?: string) {
  if (typeof value === 'string' && value.startsWith('prd_')) {
    return value as ProductId
  }

  if (entryId?.startsWith('prd_')) {
    return entryId as ProductId
  }

  return undefined
}

function inferCategoryId(value: unknown, entryId?: string) {
  if (typeof value === 'string' && value.startsWith('cat_')) {
    return value as CategoryId
  }

  if (entryId?.startsWith('cat_')) {
    return entryId as CategoryId
  }

  return undefined
}

function readRequiredHeader(headers: Headers, headerName: string) {
  const value = headers.get(headerName)

  if (!value) {
    throw new CmsWebhookError('cms-webhook-missing-header', `${headerName} header is required.`, 401)
  }

  return value.trim()
}

function validateOptionalString(value: unknown, fieldName: string) {
  if (value !== undefined && typeof value !== 'string') {
    throw new CmsWebhookError('cms-webhook-invalid-metadata', `${fieldName} must be a string when present.`, 400)
  }
}

function normalizeSignature(signature: string) {
  const trimmed = signature.trim().toLowerCase()

  if (trimmed.startsWith('hmac-sha256=')) {
    return trimmed.slice('hmac-sha256='.length)
  }

  if (trimmed.startsWith('hmac-sha256:')) {
    return trimmed.slice('hmac-sha256:'.length)
  }

  if (trimmed.startsWith('sha256=')) {
    return trimmed.slice('sha256='.length)
  }

  if (trimmed.startsWith('sha256:')) {
    return trimmed.slice('sha256:'.length)
  }

  return trimmed
}

function isValidSignature(expectedHex: string, receivedHex: string) {
  if (!isHexString(expectedHex) || !isHexString(receivedHex) || expectedHex.length !== receivedHex.length) {
    return false
  }

  return timingSafeEqual(Buffer.from(expectedHex, 'hex'), Buffer.from(receivedHex, 'hex'))
}

function isHexString(value: string) {
  return value.length > 0 && value.length % 2 === 0 && /^[0-9a-f]+$/i.test(value)
}

function isRuntimeLocale(value: unknown): value is Locale {
  return typeof value === 'string' && routing.locales.includes(value as Locale)
}
