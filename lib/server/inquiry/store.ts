import 'server-only'

import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import type { InquiryInboxJsonlRecord, InquiryOutboxJsonlRecord, InquiryStoreConfig } from './types'

const defaultInquiryStoreRoot = path.join(process.cwd(), '.runtime', 'inquiry')

export function getInquiryStoreConfig(rootDir = process.env.INQUIRY_STORE_DIR?.trim() || defaultInquiryStoreRoot): InquiryStoreConfig {
  return {
    rootDir,
    inboxPath: path.join(rootDir, 'inbox.jsonl'),
    outboxPath: path.join(rootDir, 'outbox.jsonl'),
  }
}

export async function appendInquiryInboxRecord(config: InquiryStoreConfig, record: InquiryInboxJsonlRecord) {
  await appendJsonl(config.inboxPath, record)
}

export async function appendInquiryOutboxRecord(config: InquiryStoreConfig, record: InquiryOutboxJsonlRecord) {
  await appendJsonl(config.outboxPath, record)
}

async function appendJsonl(filePath: string, record: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await appendFile(filePath, `${JSON.stringify(record)}\n`, 'utf8')
}
