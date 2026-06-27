import 'server-only'

import { normalizeInquiryPayload, type InquiryApiResult } from '@/lib/api/inquiry'
import type {
  InquiryOutboundChannel,
  InquiryOutboundResult,
} from '@/lib/domain'
import {
  createInquiryOutboundAdapters,
  createJsonlInquiryPersistenceAdapter,
  planInquiryOutboundChannels,
} from './adapters'
import { getInquiryStoreConfig } from './store'

const inquiryStoreConfig = getInquiryStoreConfig()
const inquiryPersistenceAdapter = createJsonlInquiryPersistenceAdapter(inquiryStoreConfig)
const inquiryOutboundAdapters = createInquiryOutboundAdapters(inquiryStoreConfig)

export async function submitInquiry(input: unknown): Promise<InquiryApiResult> {
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
      adapter: 'jsonl-outbox',
      note: result.reason instanceof Error ? result.reason.message : 'Unknown outbound error.',
    }
  })
}
