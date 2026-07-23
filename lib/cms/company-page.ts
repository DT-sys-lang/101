import 'server-only'

import type { LocaleCode } from '@/lib/domain/primitives'
import { readCmsResourcesConfig, type CmsResourcesConfig } from '@/lib/cms/resources'
import { readStrapiCollectionData, readStrapiRelationOne, type StrapiEntityRecord } from '@/lib/cms/strapi-response'

export interface CompanyPageContent {
  readonly title?: string
  readonly summary?: string
  readonly body?: string
  readonly heroImage?: CompanyPageMedia
  readonly heroVideo?: CompanyPageMedia
}

export interface CompanyPageMedia {
  readonly href: string
  readonly alt: string
  readonly label: string
}

const companyAboutPageId = 'company_about'

export async function getCmsCompanyPageContent(
  locale: LocaleCode,
  config: CmsResourcesConfig = readCmsResourcesConfig(),
): Promise<CompanyPageContent | null> {
  if (!config.apiBaseUrl) {
    return null
  }

  const record = await fetchCmsCompanyPageRecord(config)
  return record ? toCompanyPageContent(locale, record, config) : null
}

async function fetchCmsCompanyPageRecord(config: CmsResourcesConfig): Promise<StrapiEntityRecord | undefined> {
  if (!config.apiBaseUrl) {
    return undefined
  }

  const url = new URL(`${config.apiBaseUrl}/company-pages`)
  if (config.apiVersion === '5') {
    url.searchParams.set('status', 'published')
  } else {
    url.searchParams.set('publicationState', 'live')
  }
  url.searchParams.set('pagination[pageSize]', '20')
  url.searchParams.set('populate', '*')
  url.searchParams.set('filters[pageId][$eq]', companyAboutPageId)
  url.searchParams.append('sort[0]', 'priority:asc')

  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: buildRequestHeaders(config),
      signal: controller.signal,
      next: { revalidate: 3600, tags: ['cms-company-page'] },
    })

    if (!response.ok) {
      return undefined
    }

    const parsed = await response.json() as unknown
    return readStrapiCollectionData(parsed).find((record) => readString(record.pageId) === companyAboutPageId)
  } catch {
    return undefined
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}

function toCompanyPageContent(
  locale: LocaleCode,
  record: StrapiEntityRecord,
  config: CmsResourcesConfig,
): CompanyPageContent | null {
  const title = readLocalizedText(record.title, locale)
  const summary = readLocalizedText(record.summary, locale)
  const body = readBodyText(record.body, locale)
  const heroImage = readMedia(record.heroImage, config, title ?? summary ?? 'Yufavor company')
  const heroVideo = readMedia(record.heroVideo, config, title ?? summary ?? 'Yufavor company video')

  if (!title && !summary && !body && !heroImage && !heroVideo) {
    return null
  }

  return {
    title,
    summary,
    body,
    heroImage,
    heroVideo,
  }
}

function buildRequestHeaders(config: CmsResourcesConfig): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (config.authToken) {
    headers.Authorization = `Bearer ${config.authToken}`
  }

  return headers
}

function readMedia(value: unknown, config: CmsResourcesConfig, fallbackAlt: string): CompanyPageMedia | undefined {
  const media = readStrapiRelationOne(value)
  if (!media) {
    return undefined
  }

  const href = normalizeAssetHref(readString(media.url), config)
  if (!href) {
    return undefined
  }

  const label = readString(media.name) ?? readString(media.caption) ?? fallbackAlt

  return {
    href,
    alt: readString(media.alternativeText) ?? readString(media.caption) ?? fallbackAlt,
    label,
  }
}

function readLocalizedText(value: unknown, locale: LocaleCode): string | undefined {
  if (typeof value === 'string') {
    return normalizeText(value)
  }

  if (!isRecord(value)) {
    return undefined
  }

  const localized = readString(value[locale]) ?? readString(value.en) ?? readString(value.zh)
  return localized ? normalizeText(localized) : undefined
}

function readBodyText(value: unknown, locale: LocaleCode): string | undefined {
  const text = extractText(value, locale)
  return text ? normalizeText(text) : undefined
}

function extractText(value: unknown, locale: LocaleCode): string {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (Array.isArray(value)) {
    return value.map((item) => extractText(item, locale)).filter(isString).join('\n\n')
  }

  if (!isRecord(value)) {
    return ''
  }

  const blocks = value.blocks
  if (Array.isArray(blocks)) {
    return blocks.map((block) => extractText(block, locale)).filter(isString).join('\n\n')
  }

  const directText = readString(value.text)
  if (directText) {
    return directText
  }

  const localizedText = readString(value[locale]) ?? readString(value.en) ?? readString(value.zh)
  if (localizedText) {
    return localizedText
  }

  const items = value.items
  if (Array.isArray(items)) {
    return items.map((item) => extractText(item, locale)).filter(isString).join('\n')
  }

  const children = value.children
  if (Array.isArray(children)) {
    return children.map((item) => extractText(item, locale)).filter(isString).join(' ')
  }

  return ''
}

function normalizeAssetHref(value: string | undefined, config: CmsResourcesConfig): string | undefined {
  if (!value) {
    return undefined
  }

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  if (value.startsWith('/') && config.assetBaseUrl) {
    return `${config.assetBaseUrl}${value}`
  }

  if (value.startsWith('/')) {
    return value
  }

  return undefined
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeText(value: string): string | undefined {
  const normalized = value.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim()
  return normalized || undefined
}

function isRecord(value: unknown): value is StrapiEntityRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isString(value: string): value is string {
  return value.length > 0
}
