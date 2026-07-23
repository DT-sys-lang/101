import 'server-only'

import type { InquiryOutboundChannel, InquiryOutboundResult } from '@/lib/domain'
import type {
  InquiryOutboundAdapter,
  InquiryPersistenceAdapter,
  InquiryPersistenceInput,
  InquiryPersistenceReceipt,
  ResendEmailConfig,
  StrapiInquiryConfig,
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

export function createStrapiInquiryPersistenceAdapter(config: StrapiInquiryConfig): InquiryPersistenceAdapter {
  return {
    async persist(input: InquiryPersistenceInput): Promise<InquiryPersistenceReceipt> {
      const response = await postJsonWithTimeout(config.endpoint, {
        recordId: input.recordId,
        storedAt: input.storedAt,
        payload: input.payload,
        submission: input.submission,
        source: input.payload.source,
        contact: input.payload.contact,
        outboundChannels: input.outboundChannels,
      }, {
        Authorization: `Bearer ${config.token}`,
      }, config.timeoutMs)

      if (!response.ok) {
        throw new Error(`Strapi inquiry persistence failed with HTTP ${response.status}: ${await response.text()}`)
      }

      return {
        adapter: 'strapi-inquiry',
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

export function createResendEmailInquiryOutboundAdapter(config: ResendEmailConfig): InquiryOutboundAdapter {
  return {
    channel: 'email-notification',
    async enqueue(job) {
      const response = await postJsonWithTimeout(config.endpoint, {
        from: config.from,
        to: config.to,
        reply_to: config.replyTo || job.payload.contact.email,
        subject: buildInquiryEmailSubject(job.payload.intent, job.payload.contact.email),
        text: buildInquiryEmailText(job),
      }, {
        Authorization: `Bearer ${config.apiKey}`,
      }, config.timeoutMs)

      if (!response.ok) {
        return {
          channel: 'email-notification',
          state: 'failed',
          adapter: 'resend-email',
          note: `Resend email failed with HTTP ${response.status}: ${await response.text()}`,
        }
      }

      return {
        channel: 'email-notification',
        state: 'queued',
        adapter: 'resend-email',
        note: 'accepted by Resend email API',
      }
    },
  }
}

export function createInquiryOutboundAdapters(config = getInquiryStoreConfig(), emailConfig?: ResendEmailConfig) {
  return {
    'email-notification': emailConfig
      ? createResendEmailInquiryOutboundAdapter(emailConfig)
      : createJsonlInquiryOutboundAdapter('email-notification', config),
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

async function postJsonWithTimeout(
  endpoint: string,
  body: unknown,
  headers: Record<string, string>,
  timeoutMs: number,
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

function buildInquiryEmailSubject(intent: string, email: string) {
  return `[YUFAVOR] New ${intent} inquiry from ${email}`
}

function buildInquiryEmailText(job: Parameters<InquiryOutboundAdapter['enqueue']>[0]) {
  const contact = job.payload.contact
  const source = job.payload.source

  return [
    'New website inquiry',
    '',
    `Record ID: ${job.recordId}`,
    `Queued at: ${job.queuedAt}`,
    `Intent: ${job.payload.intent}`,
    `Next action: ${job.submission.nextAction}`,
    '',
    'Contact',
    `Name: ${contact.name || '-'}`,
    `Email: ${contact.email}`,
    `Company: ${contact.company || '-'}`,
    `Country: ${contact.country || '-'}`,
    `Phone: ${contact.phone || '-'}`,
    '',
    'Source',
    `Locale: ${source.locale}`,
    `Type: ${source.sourceType}`,
    `Path: ${source.sourcePath}`,
    `Product ID: ${source.productId || '-'}`,
    `Industry ID: ${source.industryId || '-'}`,
    `Application ID: ${source.applicationId || '-'}`,
    `Campaign: ${source.campaign || '-'}`,
    '',
    'Request',
    `Message: ${job.payload.message || '-'}`,
    `Requested products: ${(job.payload.requestedProductIds ?? []).join(', ') || '-'}`,
    `Expected quantity: ${job.payload.expectedQuantity ?? '-'}`,
    `OEM requirements: ${(job.payload.oemRequirements ?? []).join(', ') || '-'}`,
  ].join('\n')
}
