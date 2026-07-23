import type { Metadata } from 'next'
import { routing, type Locale } from '@/i18n/routing'
import { industrialSiteConfig, type StaticInfoPageKind, type StaticInfoPageViewModel } from '@/lib/domain'
import { getAbsoluteUrl, getLocalizedPath, hrefLangByLocale, openGraphLocaleByLocale } from './canonical'
import { buildStaticPathHrefLangs } from './hreflang'

const pagePathByKind = {
  oem: '/oem',
  company: '/company',
  resources: '/resources',
  contact: '/contact',
  quality: '/resources/manuals/company-materials/quality-certification',
  manufacturing: '/manufacturing',
} as const satisfies Record<StaticInfoPageKind, string>

export function buildStaticInfoPageMetadata(locale: Locale, kind: StaticInfoPageKind, data: StaticInfoPageViewModel): Metadata {
  const canonicalPath = pagePathByKind[kind]
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

export function buildStaticInfoPageJsonLd(locale: Locale, kind: StaticInfoPageKind, data: StaticInfoPageViewModel) {
  const canonicalPath = pagePathByKind[kind]
  const canonicalUrl = getAbsoluteUrl(getLocalizedPath(locale, canonicalPath))

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': kind === 'contact' ? 'ContactPage' : 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: data.title,
        description: data.body,
        inLanguage: hrefLangByLocale[locale],
        isPartOf: {
          '@id': industrialSiteConfig.websiteId,
        },
        breadcrumb: {
          '@id': `${canonicalUrl}#breadcrumb`,
        },
        mainEntity: data.quickLinks.length ? { '@id': `${canonicalUrl}#quick-links` } : undefined,
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: getAbsoluteUrl(`/${locale}`),
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: data.title,
            item: canonicalUrl,
          },
        ],
      },
      ...(data.quickLinks.length
        ? [{
            '@type': 'ItemList' as const,
            '@id': `${canonicalUrl}#quick-links`,
            numberOfItems: data.quickLinks.length,
            itemListElement: data.quickLinks.map((item, index) => ({
              '@type': 'ListItem' as const,
              position: index + 1,
              name: item.label,
              url: getAbsoluteUrl(getLocalizedPath(locale, item.href)),
            })),
          }]
        : []),
    ],
  }
}
