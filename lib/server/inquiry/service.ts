import 'server-only'

import { normalizeInquiryPayload, type InquiryApiResult } from '@/lib/api/inquiry'
import type {
  InquiryOutboundChannel,
  InquiryOutboundResult,
} from '@/lib/domain'
import {
  createInquiryOutboundAdapters,
  createJsonlInquiryPersistenceAdapter,
  createStrapiInquiryPersistenceAdapter,
  planInquiryOutboundChannels,
} from './adapters'
import { getInquiryStoreConfig, getResendEmailConfig, getStrapiInquiryConfig } from './store'

const inquiryStoreConfig = getInquiryStoreConfig()
const strapiInquiryConfig = getStrapiInquiryConfig()
const productionPersistenceMissing = process.env.NODE_ENV === 'production' && !strapiInquiryConfig
const inquiryPersistenceAdapter = strapiInquiryConfig
  ? createStrapiInquiryPersistenceAdapter(strapiInquiryConfig)
  : createJsonlInquiryPersistenceAdapter(inquiryStoreConfig)
const inquiryOutboundAdapters = createInquiryOutboundAdapters(inquiryStoreConfig, getResendEmailConfig())

export async function submitInquiry(input: unknown): Promise<InquiryApiResult> {
  if (productionPersistenceMissing) {
    throw new Error('Production inquiry persistence is not configured. Set the Strapi inquiry endpoint and token.')
  }

  const normalized = normalizeInquiryPayload(input)
  const storedAt = new Date().toISOString()
  const outboundChannels = planInquiryOutboundChannels(normalized.submission.nextAction)
  const persistence = await inquiryPersistenceAdapter.persist({
    recordId: normalized.submission.id,
    storedAt,
    payload: normalized.payload,
    submission: normalized.submission,
    outboundChannels,
  })
  const outbound = await dispatchInquiryOutboundJobs(normalized, storedAt, outboundChannels)

  return {
    ...normalized,
    submission: {
      ...normalized.submission,
      persistence: {
        ...persistence,
        outbox: outbound,
      },
    },
  }
}

async function dispatchInquiryOutboundJobs(
  normalized: InquiryApiResult,
  queuedAt: string,
  outboundChannels: readonly InquiryOutboundChannel[],
): Promise<readonly InquiryOutboundResult[]> {
  const results = await Promise.allSettled(
    outboundChannels.map((channel) =>
      inquiryOutboundAdapters[channel].enqueue({
        recordId: normalized.submission.id,
        channel,
        queuedAt,
        payload: normalized.payload,
        submission: normalized.submission,
      }),
    ),
  )

  return results.map((result, index) => {
    const channel = outboundChannels[index]

    if (!channel) {
      throw new Error('Inquiry outbound channel is missing.')
    }

    if (result.status === 'fulfilled') {
      return result.value
    }

    return {
      channel,
      state: 'failed',
      adapter: channel === 'email-notification' ? 'resend-email' : 'jsonl-outbox',
      note: result.reason instanceof Error ? result.reason.message : 'Unknown outbound error.',
    }
  })
}
