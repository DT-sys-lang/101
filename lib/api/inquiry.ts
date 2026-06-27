import { routing, type Locale } from '@/i18n/routing'
import {
  inquirySystemContract,
  type InquiryContactProfile,
  type InquiryId,
  type InquiryIntent,
  type InquiryOutboundChannel,
  type InquiryPayload,
  type InquirySourceContext,
  type InquirySourceType,
  type InquirySubmissionResult,
  type ProductId,
} from '@/lib/domain'

export interface InquiryApiResult {
  readonly submission: InquirySubmissionResult
  readonly payload: InquiryPayload
  readonly contract: typeof inquirySystemContract
}

export interface InquiryApiContract {
  readonly version: 'inquiry-api-v2'
  readonly methods: readonly ['GET', 'POST']
  readonly persistence: {
    readonly inbox: 'jsonl'
    readonly outbox: 'jsonl'
    readonly serverOnly: true
  }
  readonly outbound: readonly InquiryOutboundChannel[]
  readonly requiredSourceTracking: typeof inquirySystemContract.requiredSourceTracking
  readonly acceptedPayload: {
    readonly intent: readonly InquiryIntent[]
    readonly source: {
      readonly locale: readonly Locale[]
      readonly sourceType: readonly InquirySourceType[]
      readonly sourcePath: 'path-or-absolute-url'
      readonly productId: 'prd_*'
      readonly industryId: 'ind_*'
      readonly applicationId: 'app_*'
      readonly campaign: 'string'
    }
    readonly contact: readonly ['email', 'name', 'company', 'country', 'phone']
    readonly requestedProductIds: readonly ['prd_*']
    readonly expectedQuantity: readonly ['positive-number']
    readonly oemRequirements: readonly ['string']
  }
  readonly runtimePolicy: string
}

export const inquiryApiContract: InquiryApiContract = {
  version: 'inquiry-api-v2',
  methods: ['GET', 'POST'],
  persistence: {
    inbox: 'jsonl',
    outbox: 'jsonl',
    serverOnly: true,
  },
  outbound: ['email-notification', 'crm-sync'],
  requiredSourceTracking: inquirySystemContract.requiredSourceTracking,
  acceptedPayload: {
    intent: inquirySystemContract.conversionGoals,
    source: {
      locale: routing.locales,
      sourceType: [
        'homepage',
        'product-detail',
        'product-list',
        'industry-page',
        'application-page',
        'resource-page',
        'contact-page',
      ],
      sourcePath: 'path-or-absolute-url',
      productId: 'prd_*',
      industryId: 'ind_*',
      applicationId: 'app_*',
      campaign: 'string',
    },
    contact: ['email', 'name', 'company', 'country', 'phone'],
    requestedProductIds: ['prd_*'],
    expectedQuantity: ['positive-number'],
    oemRequirements: ['string'],
  },
  runtimePolicy: 'POST validates and stores domain-normalized inquiry payloads in server-side JSONL inbox/outbox records.',
}

const inquiryIntents: readonly InquiryIntent[] = inquirySystemContract.conversionGoals
const inquirySourceTypes: readonly InquirySourceType[] = inquiryApiContract.acceptedPayload.source.sourceType

export function getInquiryApiContract(): InquiryApiContract {
  return inquiryApiContract
}

export function normalizeInquiryPayload(input: unknown): InquiryApiResult {
  if (!input || typeof input !== 'object') {
    throw new Error('Inquiry payload must be a JSON object.')
  }

  const raw = input as Record<string, unknown>
  const intent = normalizeIntent(raw.intent)
  const source = normalizeSource(raw.source)
  const contact = normalizeContact(raw.contact)
  const inquiryId = normalizeInquiryId(raw.id) ?? createInquiryId(source.locale)
  const payload: InquiryPayload = {
    id: inquiryId,
    intent,
    source,
    contact,
    message: normalizeOptionalString(raw.message),
    requestedProductIds: normalizeRequestedProductIds(raw.requestedProductIds),
    expectedQuantity: normalizeOptionalNumber(raw.expectedQuantity),
    oemRequirements: normalizeStringArray(raw.oemRequirements),
  }

  const submission: InquirySubmissionResult = {
    ok: true,
    id: inquiryId,
    acceptedIntent: payload.intent,
    nextAction: getNextAction(payload.intent),
  }

  return {
    submission,
    payload,
    contract: inquirySystemContract,
  }
}

function normalizeIntent(value: unknown): InquiryIntent {
  if (typeof value === 'string' && inquiryIntents.includes(value as InquiryIntent)) {
    return value as InquiryIntent
  }

  throw new Error('Inquiry intent is invalid.')
}

function normalizeSource(value: unknown): InquirySourceContext {
  if (!value || typeof value !== 'object') {
    throw new Error('Inquiry source is required.')
  }

  const source = value as Record<string, unknown>
  const locale = normalizeLocale(source.locale)
  const sourceType = normalizeSourceType(source.sourceType)
  const sourcePath = normalizeSourcePath(source.sourcePath)

  return {
    locale,
    sourceType,
    sourcePath,
    productId: normalizeOptionalPrefixedId(source.productId, 'prd_', 'source.productId'),
    industryId: normalizeOptionalPrefixedId(source.industryId, 'ind_', 'source.industryId'),
    applicationId: normalizeOptionalPrefixedId(source.applicationId, 'app_', 'source.applicationId'),
    campaign: normalizeOptionalString(source.campaign),
  }
}

function normalizeContact(value: unknown): InquiryContactProfile {
  if (!value || typeof value !== 'object') {
    throw new Error('Inquiry contact is required.')
  }

  const contact = value as Record<string, unknown>
  const email = normalizeRequiredString(contact.email, 'contact.email')

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Inquiry contact.email must be an email address.')
  }

  return {
    name: normalizeOptionalString(contact.name),
    email,
    company: normalizeOptionalString(contact.company),
    country: normalizeOptionalString(contact.country),
    phone: normalizeOptionalString(contact.phone),
  }
}

function normalizeLocale(value: unknown): Locale {
  if (value === undefined || value === null || value === '') {
    return routing.defaultLocale
  }

  if (typeof value === 'string' && routing.locales.includes(value as Locale)) {
    return value as Locale
  }

  throw new Error('source.locale is invalid.')
}

function normalizeSourceType(value: unknown): InquirySourceType {
  if (typeof value === 'string' && inquirySourceTypes.includes(value as InquirySourceType)) {
    return value as InquirySourceType
  }

  throw new Error('Inquiry source.sourceType is invalid.')
}

function normalizeSourcePath(value: unknown): string {
  const sourcePath = normalizeRequiredString(value, 'source.sourcePath')

  if (sourcePath.startsWith('/')) {
    return sourcePath
  }

  try {
    const url = new URL(sourcePath)
    return `${url.pathname}${url.search}${url.hash}` || '/'
  } catch {
    throw new Error('source.sourcePath must start with "/" or be an absolute URL.')
  }
}

function normalizeInquiryId(value: unknown): InquiryId | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  const id = normalizeRequiredString(value, 'id')

  if (!id.startsWith('inq_')) {
    throw new Error('id must start with "inq_".')
  }

  return id as InquiryId
}

function normalizeRequiredString(value: unknown, field: string) {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }

  throw new Error(`${field} is required.`)
}

function normalizeOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function normalizeRequestedProductIds(value: unknown): readonly ProductId[] | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  if (!Array.isArray(value)) {
    throw new Error('requestedProductIds must be an array.')
  }

  const requestedProductIds = value.map((item, index) => normalizePrefixedId(item, 'prd_', `requestedProductIds[${index}]`))
  return [...new Set(requestedProductIds)] as readonly ProductId[]
}

function normalizeStringArray(value: unknown): readonly string[] | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  if (!Array.isArray(value)) {
    throw new Error('oemRequirements must be an array.')
  }

  const normalized = value.map((item, index) => normalizeRequiredString(item, `oemRequirements[${index}]`))
  return [...new Set(normalized)]
}

function normalizePrefixedId<TPrefix extends 'prd_' | 'ind_' | 'app_'>(
  value: unknown,
  prefix: TPrefix,
  field: string,
): `${TPrefix}${string}` {
  const id = normalizeRequiredString(value, field)

  if (!id.startsWith(prefix)) {
    throw new Error(`${field} must start with '${prefix}'.`)
  }

  return id as `${TPrefix}${string}`
}

function normalizeOptionalPrefixedId<TPrefix extends 'prd_' | 'ind_' | 'app_'>(
  value: unknown,
  prefix: TPrefix,
  field: string,
): `${TPrefix}${string}` | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  return normalizePrefixedId(value, prefix, field)
}

function normalizeOptionalNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function getNextAction(intent: InquiryIntent): InquirySubmissionResult['nextAction'] {
  if (intent === 'email-capture') {
    return 'send-email-notification'
  }

  if (intent === 'rfq' || intent === 'oem-cooperation') {
    return 'manual-review'
  }

  return 'sync-crm'
}

function createInquiryId(locale: Locale): InquiryId {
  const randomSuffix = globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 12) ?? Math.random().toString(36).slice(2, 10)
  return `inq_${locale}_${randomSuffix}` as InquiryId
}
