import 'server-only'

import type { InquiryOutboundChannel, InquiryOutboundResult } from '@/lib/domain'
import type {
  InquiryOutboundAdapter,
  InquiryPersistenceAdapter,
  InquiryPersistenceInput,
  InquiryPersistenceReceipt,
} from './types'
import {
  appendInquiryInboxRecord,
  appendInquiryOutboxRecord,
  getInquiryStoreConfig,
} from './store'

export function planInquiryOutboundChannels(nextAction: InquiryPersistenceInput['submission']['nextAction']): readonly InquiryOutboundChannel[] {
  if (nextAction === 'send-email-notification') {
    return ['email-notification']
  }

  if (nextAction === 'sync-crm') {
    return ['crm-sync']
  }

  if (nextAction === 'manual-review') {
    return ['email-notification', 'crm-sync']
  }

  return []
}

export function createJsonlInquiryPersistenceAdapter(config = getInquiryStoreConfig()): InquiryPersistenceAdapter {
  return {
    async persist(input: InquiryPersistenceInput): Promise<InquiryPersistenceReceipt> {
      await appendInquiryInboxRecord(config, {
        recordId: input.recordId,
        storedAt: input.storedAt,
        payload: input.payload,
        submission: input.submission,
        source: input.payload.source,
        contact: input.payload.contact,
        outboundChannels: input.outboundChannels,
      })

      return {
        adapter: 'jsonl-inbox',
        state: 'stored',
        recordId: input.recordId,
        storedAt: input.storedAt,
      }
    },
  }
}

export function createJsonlInquiryOutboundAdapter(channel: InquiryOutboundChannel, config = getInquiryStoreConfig()): InquiryOutboundAdapter {
  return {
    channel,
    async enqueue(job) {
      const result = buildQueuedOutboundResult(channel)

      await appendInquiryOutboxRecord(config, {
        recordId: job.recordId,
        queuedAt: job.queuedAt,
        channel,
        state: result.state,
        adapter: result.adapter,
        payload: job.payload,
        submission: job.submission,
      })

      return result
    },
  }
}

export function createInquiryOutboundAdapters(config = getInquiryStoreConfig()) {
  return {
    'email-notification': createJsonlInquiryOutboundAdapter('email-notification', config),
    'crm-sync': createJsonlInquiryOutboundAdapter('crm-sync', config),
  } as const
}

function buildQueuedOutboundResult(channel: InquiryOutboundChannel): InquiryOutboundResult {
  return {
    channel,
    state: 'queued',
    adapter: 'jsonl-outbox',
    note: channel === 'email-notification'
      ? 'queued for email notification placeholder'
      : 'queued for CRM sync placeholder',
  }
}
