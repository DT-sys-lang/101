import 'server-only'

import type {
  InquiryContactProfile,
  InquiryId,
  InquiryOutboundChannel,
  InquiryOutboundResult,
  InquiryPayload,
  InquirySourceContext,
  InquirySubmissionResult,
} from '@/lib/domain'

export interface InquiryStoreConfig {
  readonly rootDir: string
  readonly inboxPath: string
  readonly outboxPath: string
}

export interface InquiryPersistenceInput {
  readonly recordId: InquiryId
  readonly storedAt: string
  readonly payload: InquiryPayload
  readonly submission: InquirySubmissionResult
  readonly outboundChannels: readonly InquiryOutboundChannel[]
}

export interface InquiryPersistenceReceipt {
  readonly adapter: 'jsonl-inbox'
  readonly state: 'stored'
  readonly recordId: InquiryId
  readonly storedAt: string
}

export interface InquiryOutboundJob {
  readonly recordId: InquiryId
  readonly channel: InquiryOutboundChannel
  readonly queuedAt: string
  readonly payload: InquiryPayload
  readonly submission: InquirySubmissionResult
}

export interface InquiryOutboundAdapter {
  readonly channel: InquiryOutboundChannel
  enqueue(job: InquiryOutboundJob): Promise<InquiryOutboundResult>
}

export interface InquiryPersistenceAdapter {
  persist(input: InquiryPersistenceInput): Promise<InquiryPersistenceReceipt>
}

export interface InquiryInboxJsonlRecord {
  readonly recordId: InquiryId
  readonly storedAt: string
  readonly payload: InquiryPayload
  readonly submission: InquirySubmissionResult
  readonly source: InquirySourceContext
  readonly contact: InquiryContactProfile
  readonly outboundChannels: readonly InquiryOutboundChannel[]
}

export interface InquiryOutboxJsonlRecord {
  readonly recordId: InquiryId
  readonly queuedAt: string
  readonly channel: InquiryOutboundChannel
  readonly state: InquiryOutboundResult['state']
  readonly adapter: InquiryOutboundResult['adapter']
  readonly payload: InquiryPayload
  readonly submission: InquirySubmissionResult
}
