import type {
  ApplicationId,
  IndustryId,
  InquiryId,
  LocaleCode,
  ProductId,
} from './primitives'

export type InquiryIntent =
  | 'rfq'
  | 'email-capture'
  | 'oem-cooperation'
  | 'distributor-inquiry'

export type InquirySourceType =
  | 'homepage'
  | 'product-detail'
  | 'product-list'
  | 'industry-page'
  | 'application-page'
  | 'resource-page'
  | 'contact-page'

export interface InquirySourceContext {
  readonly locale: LocaleCode
  readonly sourceType: InquirySourceType
  readonly sourcePath: string
  readonly productId?: ProductId
  readonly industryId?: IndustryId
  readonly applicationId?: ApplicationId
  readonly campaign?: string
}

export interface InquiryContactProfile {
  readonly name?: string
  readonly email: string
  readonly company?: string
  readonly country?: string
  readonly phone?: string
}

export interface InquiryPayload {
  readonly id?: InquiryId
  readonly intent: InquiryIntent
  readonly source: InquirySourceContext
  readonly contact: InquiryContactProfile
  readonly message?: string
  readonly requestedProductIds?: readonly ProductId[]
  readonly expectedQuantity?: number
  readonly oemRequirements?: readonly string[]
}

export type InquiryOutboundChannel = 'email-notification' | 'crm-sync'

export type InquiryOutboundState = 'queued' | 'skipped' | 'not-configured' | 'failed'

export interface InquiryOutboundResult {
  readonly channel: InquiryOutboundChannel
  readonly state: InquiryOutboundState
  readonly adapter: 'jsonl-outbox' | 'noop'
  readonly note?: string
}

export interface InquiryPersistenceResult {
  readonly adapter: 'jsonl-inbox'
  readonly state: 'stored'
  readonly recordId: InquiryId
  readonly storedAt: string
  readonly outbox: readonly InquiryOutboundResult[]
}

export interface InquirySubmissionResult {
  readonly ok: true
  readonly id: InquiryId
  readonly acceptedIntent: InquiryIntent
  readonly nextAction:
    | 'send-email-notification'
    | 'sync-crm'
    | 'manual-review'
    | 'reject-invalid-payload'
  readonly persistence?: InquiryPersistenceResult
}

export const inquirySystemContract = {
  version: 'inquiry-system-v1',
  conversionGoals: [
    'rfq',
    'email-capture',
    'oem-cooperation',
    'distributor-inquiry',
  ],
  requiredSourceTracking: [
    'locale',
    'sourceType',
    'sourcePath',
    'productId',
    'industryId',
    'applicationId',
    'campaign',
  ],
  runtimePolicy: 'Route handlers validate inquiry payloads, persist JSONL inbox/outbox records on the server, and keep CRM/email integrations behind server-only boundaries.',
} as const
