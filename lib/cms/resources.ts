import 'server-only'

import type { IndustryId, LocaleCode, ProductId } from '@/lib/domain/primitives'
import type {
  ResourceCollectionKind,
  ResourceContentBlockViewModel,
  ResourceContentInput,
} from '@/lib/domain/page-view-models'
import {
  readStrapiCollectionData,
  readStrapiRelationMany,
  readStrapiRelationOne,
  type StrapiEntityRecord,
} from '@/lib/cms/strapi-response'

export interface CmsResourcesConfig {
  readonly endpointConfigured: boolean
  readonly apiBaseUrl: string | undefined
  readonly assetBaseUrl: string | undefined
  readonly authTokenConfigured: boolean
  readonly authToken: string | undefined
  readonly apiVersion: CmsStrapiApiVersion
  readonly timeoutMs: number
}

export type CmsStrapiApiVersion = '4' | '5'

type CmsResourceCollectionPath = 'blog-posts' | 'case-studies' | 'product-manuals' | 'resource-uploads'

type EntityRecord = StrapiEntityRecord

const collectionPaths = {
  blog: 'blog-posts',
  cases: 'case-studies',
  manuals: 'product-manuals',
} as const satisfies Record<ResourceCollectionKind, CmsResourceCollectionPath>

const resourceIds = {
  blog: 'postId',
  cases: 'caseId',
  manuals: 'manualId',
} as const satisfies Record<ResourceCollectionKind, string>

const resourceIdPrefixes = {
  blog: 'blog_',
  cases: 'case_',
  manuals: 'manual_',
} as const satisfies Record<ResourceCollectionKind, string>

type ResourceUploadSection =
  | 'product-manuals'
  | 'iot-application-cases'
  | 'oem-cases'
  | 'technical-knowledge'
  | 'company-materials'
  | 'company-brochure'
  | 'quality-certification'
  | 'engineering-blog'

interface ResourceUploadSlot {
  readonly kind: ResourceCollectionKind
  readonly routeSegment: string
  readonly hiddenFromCollection?: boolean
}

const resourceUploadSlots: Record<ResourceUploadSection, ResourceUploadSlot> = {
  'product-manuals': { kind: 'manuals', routeSegment: 'product-manuals' },
  'iot-application-cases': { kind: 'cases', routeSegment: 'iot-application-cases' },
  'oem-cases': { kind: 'cases', routeSegment: 'oem-cases' },
  'technical-knowledge': { kind: 'blog', routeSegment: 'technical-knowledge' },
  'company-materials': { kind: 'manuals', routeSegment: 'company-materials' },
  'company-brochure': { kind: 'manuals', routeSegment: 'company-materials/company-brochure', hiddenFromCollection: true },
  'quality-certification': { kind: 'manuals', routeSegment: 'company-materials/quality-certification', hiddenFromCollection: true },
  'engineering-blog': { kind: 'blog', routeSegment: 'engineering-blog' },
}

export function readCmsResourcesConfig(): CmsResourcesConfig {
  const rawEndpoint = readTrimmedValue(process.env.CMS_RESOURCES_API_URL)
  const authToken = readTrimmedValue(process.env.CMS_RESOURCES_API_TOKEN)
  const endpoint = rawEndpoint ? normalizeEndpoint(rawEndpoint) : undefined

  return {
    endpointConfigured: Boolean(endpoint),
    apiBaseUrl: endpoint?.apiBaseUrl,
    assetBaseUrl: endpoint?.assetBaseUrl,
    authTokenConfigured: Boolean(authToken),
    authToken,
    apiVersion: readCmsStrapiApiVersion(process.env.CMS_STRAPI_API_VERSION),
    timeoutMs: readPositiveInteger(process.env.CMS_RESOURCES_API_TIMEOUT_MS, 5000),
  }
}

export async function listCmsResourceContent(
  locale: LocaleCode,
  kind: ResourceCollectionKind,
  config: CmsResourcesConfig = readCmsResourcesConfig(),
): Promise<readonly ResourceContentInput[]> {
  if (!config.apiBaseUrl) {
    return []
  }

  try {
    const [records, uploadRecords] = await Promise.all([
      fetchCmsResourceRecords(config, kind),
      fetchCmsResourceUploadRecords(config, kind),
    ])
    const entries = records
      .filter((record) => kind !== 'cases' || record.isPublic !== false)
      .map((record) => toResourceContentInput(locale, kind, record, config))
      .filter(isResourceContentInput)
    const uploadEntries = uploadRecords.map((record) => toResourceUploadContentInput(locale, record, config)).filter(isResourceContentInput)

    return [...uploadEntries, ...entries]
  } catch {
    return []
  }
}

export async function getCmsResourceContent(
  locale: LocaleCode,
  kind: ResourceCollectionKind,
  stableId: string,
  config: CmsResourcesConfig = readCmsResourcesConfig(),
): Promise<ResourceContentInput | null> {
  const entries = await listCmsResourceContent(locale, kind, config)
  return entries.find((entry) => entry.key === stableId || entry.routeSegment === stableId) ?? null
}

async function fetchCmsResourceRecords(config: CmsResourcesConfig, kind: ResourceCollectionKind): Promise<readonly EntityRecord[]> {
  if (!config.apiBaseUrl) {
    return []
  }

  const url = new URL(`${config.apiBaseUrl}/${collectionPaths[kind]}`)
  addDefaultQuery(url, kind, config.apiVersion)

  return fetchAllCmsResourcePages(url, config)
}

async function fetchCmsResourceUploadRecords(config: CmsResourcesConfig, kind: ResourceCollectionKind): Promise<readonly EntityRecord[]> {
  if (!config.apiBaseUrl) {
    return []
  }

  const url = new URL(`${config.apiBaseUrl}/resource-uploads`)
  if (config.apiVersion === '5') {
    url.searchParams.set('status', 'published')
  } else {
    url.searchParams.set('publicationState', 'live')
  }
  url.searchParams.set('pagination[pageSize]', '100')
  url.searchParams.set('populate', '*')
  url.searchParams.append('sort[0]', 'priority:asc')
  url.searchParams.append('sort[1]', 'publishedOn:desc')

  try {
    return (await fetchAllCmsResourcePages(url, config)).filter((record) => {
      const section = readResourceUploadSection(record.section)
      return section ? resourceUploadSlots[section].kind === kind : false
    })
  } catch {
    return []
  }
}

async function fetchAllCmsResourcePages(url: URL, config: CmsResourcesConfig): Promise<readonly EntityRecord[]> {
  const allRecords: EntityRecord[] = []

  for (let page = 1; page <= 1000; page += 1) {
    const pageUrl = new URL(url)
    pageUrl.searchParams.set('pagination[page]', String(page))
    const controller = new AbortController()
    const timeoutId = globalThis.setTimeout(() => controller.abort(), config.timeoutMs)

    try {
      const response = await fetch(pageUrl, {
        method: 'GET',
        headers: buildRequestHeaders(config),
        signal: controller.signal,
        next: { revalidate: 3600, tags: ['cms-resources'] },
      })

      if (!response.ok) {
        return allRecords
      }

      const parsed = await response.json() as unknown
      const records = readStrapiCollectionData(parsed)
      allRecords.push(...records)
      const pageCount = readStrapiPageCount(parsed)

      if ((pageCount !== undefined && page >= pageCount) || (pageCount === undefined && records.length < 100)) {
        return allRecords
      }
    } finally {
      globalThis.clearTimeout(timeoutId)
    }
  }

  return allRecords
}

function readStrapiPageCount(value: unknown): number | undefined {
  if (!isRecord(value) || !isRecord(value.meta) || !isRecord(value.meta.pagination)) {
    return undefined
  }

  const pageCount = value.meta.pagination.pageCount
  return typeof pageCount === 'number' && Number.isFinite(pageCount) && pageCount >= 0 ? pageCount : undefined
}

function addDefaultQuery(url: URL, kind: ResourceCollectionKind, apiVersion: CmsStrapiApiVersion): void {
  if (apiVersion === '5') {
    url.searchParams.set('status', 'published')
  } else {
    url.searchParams.set('publicationState', 'live')
  }
  url.searchParams.set('pagination[pageSize]', '100')
  url.searchParams.set('populate', '*')

  if (kind === 'blog') {
    url.searchParams.append('sort[0]', 'publishedOn:desc')
    return
  }

  if (kind === 'cases') {
    url.searchParams.append('sort[0]', 'projectYear:desc')
    return
  }

  url.searchParams.append('sort[0]', 'effectiveDate:desc')
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


function toResourceContentInput(
  locale: LocaleCode,
  kind: ResourceCollectionKind,
  record: EntityRecord,
  config: CmsResourcesConfig,
): ResourceContentInput | undefined {
  const key = readStableResourceId(kind, record)
  const title = readLocalizedText(record.title, locale)
  const summary = readResourceSummary(kind, record, locale)

  if (!key || !title) {
    return undefined
  }

  const body = readBodyText(record.body, locale)
  const sections = readResourceSections(kind, record, locale)
  const publishedAt = readPublishedAt(kind, record)
  const relations = readResourceRelations(kind, record, locale)
  const document = kind === 'manuals' ? readManualDocument(record, config) : undefined
  const supportingDocuments = kind === 'cases' ? readSupportingDocuments(record, config) : []
  const coverImage = kind === 'manuals' ? undefined : readMedia(record.heroImage, config, title)

  return {
    key,
    routeSegment: getCmsResourceRouteSegment(kind, key),
    title,
    summary: summary || body || title,
    meta: formatResourceMeta(kind, publishedAt, record),
    kindLabel: formatResourceKindLabel(kind, record, locale),
    contextLabels: [...relations.productLabels, ...relations.industryLabels, ...relations.applicationLabels].slice(0, 6),
    ctaLabel: formatResourceCtaLabel(kind, locale),
    downloadHref: document?.href ?? supportingDocuments[0]?.href,
    coverImage,
    body,
    contentBlocks: buildContentBlocks(locale, kind, body, sections, document, supportingDocuments),
    relatedProductIds: relations.productIds,
    relatedIndustryIds: relations.industryIds,
  }
}

function toResourceUploadContentInput(
  locale: LocaleCode,
  record: EntityRecord,
  config: CmsResourcesConfig,
): ResourceContentInput | undefined {
  const section = readResourceUploadSection(record.section)
  const uploadId = readString(record.uploadId)
  const title = readLocalizedText(record.title, locale)

  if (!section || !uploadId?.startsWith('upload_') || !title) {
    return undefined
  }

  const slot = resourceUploadSlots[section]
  const body = readBodyText(record.body, locale)
  const summary = readLocalizedText(record.summary, locale) ?? body ?? title
  const attachment = readUploadAsset(record.attachment, config)
  const video = readUploadAsset(record.video, config)
  const externalUrl = readString(record.externalUrl)
  const publishedAt = readString(record.publishedOn)
  const relations = readResourceUploadRelations(record, locale)

  return {
    key: uploadId,
    routeSegment: getResourceUploadRouteSegment(section, slot, uploadId),
    title,
    summary,
    meta: formatResourceUploadMeta(locale, section, publishedAt),
    kindLabel: formatResourceUploadKindLabel(locale, section),
    contextLabels: [...relations.productLabels, ...relations.industryLabels, ...relations.applicationLabels].slice(0, 6),
    ctaLabel: readLocalizedText(record.ctaLabel, locale) ?? formatResourceUploadCtaLabel(locale, section),
    downloadHref: attachment?.href ?? video?.href ?? externalUrl,
    coverImage: readMedia(record.coverImage, config, title),
    body,
    contentBlocks: buildResourceUploadContentBlocks(locale, body, attachment, video, externalUrl),
    hiddenFromCollection: slot.hiddenFromCollection,
    relatedProductIds: relations.productIds,
    relatedIndustryIds: relations.industryIds,
  }
}

function getCmsResourceRouteSegment(kind: ResourceCollectionKind, key: string): string {
  if (kind === 'manuals') {
    const companyMaterialRoutes: Record<string, string> = {
      manual_company_brochure: 'company-materials/company-brochure',
      manual_quality_certification: 'company-materials/quality-certification',
    }

    return companyMaterialRoutes[key] ?? key
  }

  return key
}

function getResourceUploadRouteSegment(section: ResourceUploadSection, slot: ResourceUploadSlot, uploadId: string): string {
  if (section === 'company-brochure' || section === 'quality-certification') {
    return slot.routeSegment
  }

  return `${slot.routeSegment}/${uploadId}`
}

function readStableResourceId(kind: ResourceCollectionKind, record: EntityRecord): string | undefined {
  const value = record[resourceIds[kind]]
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  if (!trimmed.startsWith(resourceIdPrefixes[kind])) {
    return undefined
  }

  return trimmed
}

function readResourceSummary(kind: ResourceCollectionKind, record: EntityRecord, locale: LocaleCode): string | undefined {
  if (kind === 'blog') {
    return readLocalizedText(record.excerpt, locale)
  }

  if (kind === 'cases') {
    return readLocalizedText(record.summary, locale)
  }

  return readLocalizedText(record.notes, locale)
}

function readResourceSections(
  kind: ResourceCollectionKind,
  record: EntityRecord,
  locale: LocaleCode,
): readonly ResourceContentBlockViewModel[] {
  if (kind !== 'cases') {
    return []
  }

  return [
    { title: locale === 'zh' ? '挑战' : 'Challenge', body: readLocalizedText(record.challenge, locale) },
    { title: locale === 'zh' ? '方案' : 'Solution', body: readLocalizedText(record.solution, locale) },
    { title: locale === 'zh' ? '结果' : 'Outcome', body: readLocalizedText(record.outcome, locale) },
  ].filter((block): block is ResourceContentBlockViewModel => Boolean(block.body))
}

function buildContentBlocks(
  locale: LocaleCode,
  kind: ResourceCollectionKind,
  body: string | undefined,
  sections: readonly ResourceContentBlockViewModel[],
  document: ManualDocument | undefined,
  supportingDocuments: readonly ManualDocument[],
): readonly ResourceContentBlockViewModel[] | undefined {
  const blocks: ResourceContentBlockViewModel[] = []

  if (body) {
    blocks.push({ title: locale === 'zh' ? '正文' : 'Content', body })
  }

  blocks.push(...sections)

  if (kind === 'manuals' && document) {
    blocks.push({
      title: locale === 'zh' ? '下载' : 'Download',
      body: document.label,
      items: document.revision ? [document.revision] : undefined,
      links: [{ label: document.label, href: document.href }],
    })
  }

  if (kind === 'cases' && supportingDocuments.length) {
    blocks.push({
      title: locale === 'zh' ? '支持文档' : 'Supporting documents',
      body: locale === 'zh' ? '项目相关的公开支持资料。' : 'Public supporting material for this project.',
      links: supportingDocuments.map((item) => ({ label: item.revision ? `${item.label} (${item.revision})` : item.label, href: item.href })),
    })
  }

  return blocks.length ? blocks : undefined
}

function readPublishedAt(kind: ResourceCollectionKind, record: EntityRecord): string | undefined {
  const candidates = kind === 'blog'
    ? [record.publishedOn, record.publishedAt]
    : kind === 'manuals'
      ? [record.effectiveDate, record.publishedAt]
      : [record.publishedAt]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  return undefined
}

function formatResourceMeta(kind: ResourceCollectionKind, publishedAt: string | undefined, record: EntityRecord): string {
  if (kind === 'cases' && typeof record.projectYear === 'number') {
    return publishedAt ? `${formatDate(publishedAt)} / ${record.projectYear}` : String(record.projectYear)
  }

  if (kind === 'manuals') {
    const revision = typeof record.revision === 'string' ? record.revision.trim() : ''
    const date = publishedAt ? formatDate(publishedAt) : ''
    return [revision, date].filter(isString).join(' / ') || 'manual'
  }

  return publishedAt ? formatDate(publishedAt) : 'published'
}

function formatResourceKindLabel(kind: ResourceCollectionKind, record: EntityRecord, locale: LocaleCode): string {
  if (kind === 'blog') {
    return typeof record.topic === 'string' ? formatEnumLabel(record.topic, locale) : (locale === 'zh' ? '博客' : 'Blog')
  }

  if (kind === 'cases') {
    return locale === 'zh' ? '案例' : 'Case'
  }

  return typeof record.manualKind === 'string' ? formatEnumLabel(record.manualKind, locale) : (locale === 'zh' ? '手册' : 'Manual')
}

function formatResourceCtaLabel(kind: ResourceCollectionKind, locale: LocaleCode): string {
  if (kind === 'manuals') {
    return locale === 'zh' ? '打开手册' : 'Open manual'
  }

  if (kind === 'cases') {
    return locale === 'zh' ? '查看案例' : 'View case'
  }

  return locale === 'zh' ? '阅读文章' : 'Read article'
}

function readResourceRelations(kind: ResourceCollectionKind, record: EntityRecord, locale: LocaleCode) {
  const products = kind === 'blog' ? readStrapiRelationMany(record.relatedProducts) : readStrapiRelationMany(record.products)
  const industries = kind === 'blog' ? readStrapiRelationMany(record.relatedIndustries) : readStrapiRelationMany(record.industries)
  const applications = kind === 'blog' ? readStrapiRelationMany(record.relatedApplications) : readStrapiRelationMany(record.applications)

  return {
    productIds: products.map((product) => readString(product.factId)).filter(isProductId),
    productLabels: products.map((product) => readString(product.model) ?? readString(product.factId)).filter(isString),
    industryIds: industries.map((industry) => readString(industry.factId)).filter(isIndustryId),
    industryLabels: industries.map((industry) => readLocalizedText(industry.name, locale) ?? readString(industry.factId)).filter(isString),
    applicationLabels: applications.map((application) => readLocalizedText(application.name, locale) ?? readString(application.factId)).filter(isString),
  }
}

function readResourceUploadRelations(record: EntityRecord, locale: LocaleCode) {
  const products = readStrapiRelationMany(record.relatedProducts)
  const industries = readStrapiRelationMany(record.relatedIndustries)
  const applications = readStrapiRelationMany(record.relatedApplications)

  return {
    productIds: products.map((product) => readString(product.factId)).filter(isProductId),
    productLabels: products.map((product) => readString(product.model) ?? readString(product.factId)).filter(isString),
    industryIds: industries.map((industry) => readString(industry.factId)).filter(isIndustryId),
    industryLabels: industries.map((industry) => readLocalizedText(industry.name, locale) ?? readString(industry.factId)).filter(isString),
    applicationLabels: applications.map((application) => readLocalizedText(application.name, locale) ?? readString(application.factId)).filter(isString),
  }
}

function readResourceUploadSection(value: unknown): ResourceUploadSection | undefined {
  return typeof value === 'string' && value in resourceUploadSlots ? value as ResourceUploadSection : undefined
}

function buildResourceUploadContentBlocks(
  locale: LocaleCode,
  body: string | undefined,
  attachment: UploadAsset | undefined,
  video: UploadAsset | undefined,
  externalUrl: string | undefined,
): readonly ResourceContentBlockViewModel[] | undefined {
  const blocks: ResourceContentBlockViewModel[] = []

  if (body) {
    blocks.push({ title: locale === 'zh' ? '说明' : 'Overview', body })
  }

  if (attachment || externalUrl) {
    blocks.push({
      title: locale === 'zh' ? '附件' : 'Attachment',
      body: attachment?.label ?? externalUrl ?? '',
      links: [
        ...(attachment ? [{ label: attachment.label, href: attachment.href }] : []),
        ...(externalUrl ? [{ label: externalUrl, href: externalUrl }] : []),
      ],
    })
  }

  if (video) {
    blocks.push({
      title: locale === 'zh' ? '视频' : 'Video',
      body: video.label,
      video,
    })
  }

  return blocks.length ? blocks : undefined
}

function formatResourceUploadMeta(locale: LocaleCode, section: ResourceUploadSection, publishedAt: string | undefined): string {
  const label = formatResourceUploadKindLabel(locale, section)
  return publishedAt ? `${label} / ${formatDate(publishedAt)}` : label
}

function formatResourceUploadKindLabel(locale: LocaleCode, section: ResourceUploadSection): string {
  const labels: Record<ResourceUploadSection, Record<LocaleCode, string>> = {
    'product-manuals': { zh: '产品手册', en: 'Product Manuals' },
    'iot-application-cases': { zh: '物联网应用案例', en: 'IoT Application Cases' },
    'oem-cases': { zh: 'OEM 案例', en: 'OEM Cases' },
    'technical-knowledge': { zh: '技术知识', en: 'Technical Knowledge' },
    'company-materials': { zh: '公司资料', en: 'Company Materials' },
    'company-brochure': { zh: '公司宣传册', en: 'Company Brochure' },
    'quality-certification': { zh: '质量认证', en: 'Quality Certification' },
    'engineering-blog': { zh: '博客', en: 'Blog' },
  }

  return labels[section][locale]
}

function formatResourceUploadCtaLabel(locale: LocaleCode, section: ResourceUploadSection): string {
  if (section === 'company-brochure') {
    return locale === 'zh' ? '打开公司宣传册' : 'Open Brochure'
  }

  if (section === 'quality-certification') {
    return locale === 'zh' ? '打开质量认证' : 'Open Certification'
  }

  return locale === 'zh' ? '查看详情' : 'View Details'
}

interface ManualDocument {
  readonly href: string
  readonly label: string
  readonly revision?: string
}

interface UploadAsset {
  readonly href: string
  readonly label: string
}

function readManualDocument(record: EntityRecord, config: CmsResourcesConfig): ManualDocument | undefined {
  const document = readStrapiRelationOne(record.document)
  if (!document) {
    return undefined
  }

  return toDocumentAsset(document, config)
}

function readSupportingDocuments(record: EntityRecord, config: CmsResourcesConfig): readonly ManualDocument[] {
  return readStrapiRelationMany(record.supportingDocuments)
    .map((document) => toDocumentAsset(document, config))
    .filter((document): document is ManualDocument => Boolean(document))
}

function toDocumentAsset(document: EntityRecord, config: CmsResourcesConfig): ManualDocument | undefined {
  const hrefOverride = readString(document.hrefOverride)
  const file = readStrapiRelationOne(document.file)
  const fileUrl = file ? readString(file.url) : undefined
  const href = normalizeAssetHref(hrefOverride ?? fileUrl, config)

  if (!href) {
    return undefined
  }

  return {
    href,
    label: readString(document.title) ?? readString(file?.name) ?? href,
    revision: readString(document.revision),
  }
}

function readMedia(value: unknown, config: CmsResourcesConfig, fallbackAlt: string) {

  const media = readStrapiRelationOne(value)
  if (!media) {
    return undefined
  }

  const href = normalizeAssetHref(readString(media.url), config)
  if (!href) {
    return undefined
  }

  return {
    href,
    alt: readString(media.alternativeText) ?? readString(media.caption) ?? fallbackAlt,
  }
}

function readUploadAsset(value: unknown, config: CmsResourcesConfig): UploadAsset | undefined {
  const media = readStrapiRelationOne(value)
  if (!media) {
    return undefined
  }

  const href = normalizeAssetHref(readString(media.url), config)
  if (!href) {
    return undefined
  }

  return {
    href,
    label: readString(media.name) ?? readString(media.caption) ?? href,
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

function readBodyText(value: unknown, locale?: LocaleCode): string | undefined {
  const text = extractText(value, locale)
  return text ? normalizeText(text) : undefined
}

function extractText(value: unknown, locale?: LocaleCode): string {
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

  if (locale) {
    const localizedText = readString(value[locale])
    if (localizedText) {
      return localizedText
    }
  }

  const localizedFallback = readString(value.en) ?? readString(value.zh)
  if (localizedFallback) {
    return localizedFallback
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

function normalizeEndpoint(rawEndpoint: string): Pick<CmsResourcesConfig, 'apiBaseUrl' | 'assetBaseUrl'> | undefined {
  try {
    const url = new URL(rawEndpoint)
    const pathname = url.pathname.replace(/\/+$/, '')
    const apiPath = getStrapiRestPath(pathname)
    const assetPath = getStrapiAssetBasePath(apiPath)
    const apiBaseUrl = new URL(`${apiPath}/`, url.origin).toString().replace(/\/+$/, '')
    const assetBaseUrl = new URL(`${assetPath || ''}/`, url.origin).toString().replace(/\/+$/, '')

    return { apiBaseUrl, assetBaseUrl }
  } catch {
    return undefined
  }
}

function getStrapiRestPath(pathname: string) {
  if (!pathname) {
    return '/internal/cms'
  }

  if (pathname.endsWith('/internal/cms') || pathname.endsWith('/api')) {
    return pathname
  }

  return `${pathname}/internal/cms`
}

function getStrapiAssetBasePath(apiPath: string) {
  if (apiPath.endsWith('/internal/cms')) {
    return apiPath.slice(0, -'/internal/cms'.length)
  }

  if (apiPath.endsWith('/api')) {
    return apiPath.slice(0, -'/api'.length)
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

function formatDate(value: string): string {
  return value.slice(0, 10)
}

function formatEnumLabel(value: string, locale: LocaleCode = 'en'): string {
  if (locale === 'zh') {
    const zhLabels: Record<string, string> = {
      application: '应用',
      technology: '技术',
      'selection-guide': '选型指南',
      maintenance: '维护',
      company: '公司',
      industry: '行业',
      custom: '自定义',
      installation: '安装手册',
      operation: '操作手册',
      calibration: '校准资料',
      wiring: '接线资料',
      software: '软件资料',
      safety: '安全资料',
    }

    return zhLabels[value] ?? value
  }

  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeText(value: string): string | undefined {
  const normalized = value.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim()
  return normalized || undefined
}

function readTrimmedValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function readCmsStrapiApiVersion(value: string | undefined): CmsStrapiApiVersion {
  return value?.trim() === '5' ? '5' : '4'
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  const trimmed = readTrimmedValue(value)
  if (!trimmed) {
    return fallback
  }

  const parsed = Number.parseInt(trimmed, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function isRecord(value: unknown): value is EntityRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isString(value: string | undefined): value is string {
  return typeof value === 'string' && value.length > 0
}

function isProductId(value: string | undefined): value is ProductId {
  return Boolean(value?.startsWith('prd_'))
}

function isIndustryId(value: string | undefined): value is IndustryId {
  return Boolean(value?.startsWith('ind_'))
}

function isResourceContentInput(value: ResourceContentInput | undefined): value is ResourceContentInput {
  return Boolean(value)
}
