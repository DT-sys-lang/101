import {
  getApplicationEntryPageViewModel,
  getIndustryEntryPageViewModel,
  type EntryCardViewModel,
  type EntryEcosystemContentInput,
  type EntryPageViewModel,
  type ProductViewModelSource,
} from './page-view-models'
import type { LocaleCode } from './primitives'

export interface EntryPageSeoBreadcrumbItem {
  readonly label: string
  readonly canonicalPath: string
}

export interface EntryPageSeoItem {
  readonly label: string
  readonly canonicalPath: string
}

export interface EntryPageSeoFaqItem {
  readonly question: string
  readonly answer: string
}

export interface EntryPageSeoData {
  readonly locale: LocaleCode
  readonly canonicalPath: string
  readonly title: string
  readonly description: string
  readonly breadcrumb: readonly EntryPageSeoBreadcrumbItem[]
  readonly items: readonly EntryPageSeoItem[]
  readonly faq: readonly EntryPageSeoFaqItem[]
}

export interface EntryPageResolution {
  readonly page: EntryPageViewModel
  readonly seo: EntryPageSeoData
}

const sectionLabels = {
  en: {
    home: 'Home',
    industries: 'Industries',
    applications: 'Applications',
  },
  zh: {
    home: '首页',
    industries: '行业',
    applications: '应用',
  },
} as const satisfies Record<LocaleCode, Record<'home' | 'industries' | 'applications', string>>

export function buildIndustryHubPageResolution(locale: LocaleCode): EntryPageResolution {
  const page = getIndustryEntryPageViewModel(locale)

  return {
    page,
    seo: {
      locale,
      canonicalPath: '/industries',
      title: page.title,
      description: page.body,
      breadcrumb: [
        { label: sectionLabels[locale].home, canonicalPath: '/' },
        { label: sectionLabels[locale].industries, canonicalPath: '/industries' },
      ],
      items: page.entries.map((entry) => ({
        label: entry.title,
        canonicalPath: entry.href,
      })),
      faq: buildHubFaq(page, sectionLabels[locale].industries),
    },
  }
}

export function buildApplicationHubPageResolution(
  locale: LocaleCode,
  source?: ProductViewModelSource,
): EntryPageResolution {
  const page = getApplicationEntryPageViewModel(locale, source)

  return {
    page,
    seo: {
      locale,
      canonicalPath: '/applications',
      title: page.title,
      description: page.body,
      breadcrumb: [
        { label: sectionLabels[locale].home, canonicalPath: '/' },
        { label: sectionLabels[locale].applications, canonicalPath: '/applications' },
      ],
      items: page.entries.map((entry) => ({
        label: entry.title,
        canonicalPath: entry.href,
      })),
      faq: buildHubFaq(page, sectionLabels[locale].applications),
    },
  }
}

export function resolveIndustryDetailPage(
  locale: LocaleCode,
  slug: readonly string[],
  source?: ProductViewModelSource,
  ecosystemContent: readonly EntryEcosystemContentInput[] = [],
): EntryPageResolution | null {
  const page = getIndustryEntryPageViewModel(locale, source, ecosystemContent)
  const entry = findEntry(page, '/industries', slug)

  if (!entry) {
    return null
  }

  return {
    page: focusEntryPageViewModel(page, entry),
    seo: buildDetailSeoData(locale, page, entry, sectionLabels[locale].industries, '/industries'),
  }
}

export function resolveApplicationDetailPage(
  locale: LocaleCode,
  slug: readonly string[],
  source?: ProductViewModelSource,
): EntryPageResolution | null {
  const page = getApplicationEntryPageViewModel(locale, source)
  const entry = findEntry(page, '/applications', slug)

  if (!entry) {
    return null
  }

  return {
    page: focusEntryPageViewModel(page, entry),
    seo: buildDetailSeoData(locale, page, entry, sectionLabels[locale].applications, '/applications'),
  }
}

export function getIndustryEntryStaticParams(locales: readonly LocaleCode[]) {
  return locales.flatMap((locale) =>
    getIndustryEntryPageViewModel(locale).entries.map((entry) => ({
      locale,
      slug: entry.href.replace(/^\/industries\//, '').split('/').filter(Boolean),
    })),
  )
}

export function getApplicationEntryStaticParams(
  locales: readonly LocaleCode[],
  source?: ProductViewModelSource,
) {
  return locales.flatMap((locale) =>
    getApplicationEntryPageViewModel(locale, source).entries.map((entry) => ({
      locale,
      slug: entry.href.replace(/^\/applications\//, '').split('/').filter(Boolean),
    })),
  )
}

function buildHubFaq(page: EntryPageViewModel, sectionLabel: string): readonly EntryPageSeoFaqItem[] {
  const entryTitles = page.entries.map((entry) => entry.title)
  const entryList = entryTitles.join(', ')

  return [
    {
      question: `What does the ${sectionLabel} page cover?`,
      answer: page.body,
    },
    {
      question: `Which ${sectionLabel.toLowerCase()} paths are available?`,
      answer: entryList,
    },
    {
      question: 'How do I move to RFQ?',
      answer: page.rfq.body,
    },
  ]
}

function buildDetailSeoData(
  locale: LocaleCode,
  page: EntryPageViewModel,
  entry: EntryCardViewModel,
  sectionLabel: string,
  sectionPath: '/industries' | '/applications',
): EntryPageSeoData {
  return {
    locale,
    canonicalPath: entry.href,
    title: `${entry.title} | ${sectionLabel}`,
    description: entry.description,
    breadcrumb: [
      { label: sectionLabels[locale].home, canonicalPath: '/' },
      { label: sectionLabel, canonicalPath: sectionPath },
      { label: entry.title, canonicalPath: entry.href },
    ],
    items: entry.products.map((product) => ({
      label: product.title,
      canonicalPath: product.href,
    })),
    faq: buildDetailFaq(page, entry),
  }
}

function buildDetailFaq(page: EntryPageViewModel, entry: EntryCardViewModel): readonly EntryPageSeoFaqItem[] {
  const productLabels = entry.products.map((product) => `${product.title}${product.categoryLabel ? ` (${product.categoryLabel})` : ''}`)
  const productList = productLabels.join(', ')

  return [
    {
      question: `What does ${entry.title} cover?`,
      answer: entry.description,
    },
    {
      question: `Which products are recommended for ${entry.title}?`,
      answer: productList,
    },
    {
      question: 'What should I include in an RFQ?',
      answer: page.rfq.body,
    },
  ]
}

function focusEntryPageViewModel(page: EntryPageViewModel, entry: EntryCardViewModel): EntryPageViewModel {
  return {
    ...page,
    title: entry.title,
    body: entry.description,
    entries: [entry],
  }
}

function findEntry(page: EntryPageViewModel, prefix: '/industries' | '/applications', slug: readonly string[]) {
  const requestedSlug = slug.join('/')

  return page.entries.find((entry) => entry.href.replace(new RegExp(`^${prefix}/`), '') === requestedSlug) ?? null
}
