import 'server-only'

import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import type {
  InquiryInboxJsonlRecord,
  InquiryOutboxJsonlRecord,
  InquiryStoreConfig,
  ResendEmailConfig,
  StrapiInquiryConfig,
} from './types'

const defaultInquiryStoreRoot = path.join(process.cwd(), '.runtime', 'inquiry')

export function getInquiryStoreConfig(rootDir = process.env.INQUIRY_STORE_DIR?.trim() || defaultInquiryStoreRoot): InquiryStoreConfig {
  return {
    rootDir,
    inboxPath: path.join(rootDir, 'inbox.jsonl'),
    outboxPath: path.join(rootDir, 'outbox.jsonl'),
  }
}

export function getStrapiInquiryConfig(): StrapiInquiryConfig | undefined {
  const endpoint = process.env.STRAPI_INQUIRY_API_URL?.trim()
  const token = process.env.STRAPI_INQUIRY_API_TOKEN?.trim()

  if (!endpoint || !token) {
    return undefined
  }

  return {
    endpoint,
    token,
    timeoutMs: readPositiveInt(process.env.STRAPI_INQUIRY_API_TIMEOUT_MS, 5000),
  }
}

export function getResendEmailConfig(): ResendEmailConfig | undefined {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.INQUIRY_EMAIL_FROM?.trim()
  const to = readCsv(process.env.INQUIRY_EMAIL_TO)

  if (!apiKey || !from || !to.length) {
    return undefined
  }

  return {
    apiKey,
    from,
    to,
    replyTo: process.env.INQUIRY_EMAIL_REPLY_TO?.trim() || undefined,
    endpoint: process.env.RESEND_EMAIL_API_URL?.trim() || 'https://api.resend.com/emails',
    timeoutMs: readPositiveInt(process.env.RESEND_EMAIL_TIMEOUT_MS, 5000),
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

function readCsv(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function readPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
