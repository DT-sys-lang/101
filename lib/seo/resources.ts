import type { Metadata } from 'next'
import { routing, type Locale } from '@/i18n/routing'
import {
  industrialSiteConfig,
  type ResourceCollectionKind,
  type ResourceCollectionViewModel,
  type ResourceDetailViewModel,
} from '@/lib/domain'
import { getAbsoluteUrl, getLocalizedPath, openGraphLocaleByLocale } from './canonical'
import { buildStaticPathHrefLangs } from './hreflang'

const resourceCollectionPathByKind = {
  blog: '/resources/blog',
  cases: '/resources/cases',
  manuals: '/resources/manuals',
} as const satisfies Record<ResourceCollectionKind, string>

export function buildResourceCollectionMetadata(
  locale: Locale,
  kind: ResourceCollectionKind,
  data: ResourceCollectionViewModel,
): Metadata {
  const canonicalPath = resourceCollectionPathByKind[kind]
  const canonicalUrl = getAbsoluteUrl(getLocalizedPath(locale, canonicalPath))

  return {
    metadataBase: new URL(industrialSiteConfig.origin),
    title: data.title,
    description: data.body,
    alternates: {
      canonical: canonicalUrl,
      languages: buildStaticPathHrefLangs(canonicalPath),
    },
    openGraph: {
      type: 'website',
      title: data.title,
      description: data.body,
      url: canonicalUrl,
      siteName: industrialSiteConfig.brandName,
      locale: openGraphLocaleByLocale[locale],
      alternateLocale: routing.locales
        .filter((item) => item !== locale)
        .map((item) => openGraphLocaleByLocale[item]),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  }
}

export function buildResourceDetailMetadata(
  locale: Locale,
  kind: ResourceCollectionKind,
  slug: readonly string[],
  data: ResourceDetailViewModel,
): Metadata {
  const canonicalPath = `${resourceCollectionPathByKind[kind]}/${slug.map(encodeURIComponent).join('/')}`
  const canonicalUrl = getAbsoluteUrl(getLocalizedPath(locale, canonicalPath))

  return {
    metadataBase: new URL(industrialSiteConfig.origin),
    title: data.title,
    description: data.body,
    alternates: {
      canonical: canonicalUrl,
      languages: buildStaticPathHrefLangs(canonicalPath),
    },
    openGraph: {
      type: kind === 'blog' ? 'article' : 'website',
      title: data.title,
      description: data.body,
      url: canonicalUrl,
      siteName: industrialSiteConfig.brandName,
      locale: openGraphLocaleByLocale[locale],
      alternateLocale: routing.locales
        .filter((item) => item !== locale)
        .map((item) => openGraphLocaleByLocale[item]),
      images: data.coverImage ? [{ url: getAbsoluteUrl(data.coverImage.href), alt: data.coverImage.alt }] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  }
}
