import type { Metadata } from 'next'
import { routing, type Locale } from '@/i18n/routing'
import { industrialSiteConfig, type HomepageProjection } from '@/lib/domain'
import { getAbsoluteUrl, getLocalizedPath, hrefLangByLocale, openGraphLocaleByLocale } from './canonical'
import { buildHomeHrefLangs } from './hreflang'

export function buildHomePageMetadata(locale: Locale, data: HomepageProjection): Metadata {
  const canonicalUrl = getAbsoluteUrl(`/${locale}`)

  return {
    metadataBase: new URL(industrialSiteConfig.origin),
    title: data.hero.title,
    description: data.hero.body,
    alternates: {
      canonical: canonicalUrl,
      languages: buildHomeHrefLangs(),
    },
    openGraph: {
      type: 'website',
      title: data.hero.title,
      description: data.hero.body,
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

export function buildHomePageJsonLd(locale: Locale, data: HomepageProjection) {
  const canonicalUrl = getAbsoluteUrl(`/${locale}`)
  const entryItems = [
    ...data.hero.entries,
    ...data.categories.items.map((item) => ({ label: item.title, description: item.description, href: item.href })),
    ...data.industries.items.map((item) => ({ label: item.title, description: item.description, href: item.href })),
    ...data.applications.items.map((item) => ({ label: item.title, description: item.description, href: item.href })),
  ]

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': industrialSiteConfig.organizationId,
        name: industrialSiteConfig.brandName,
        url: industrialSiteConfig.origin,
      },
      {
        '@type': 'WebSite',
        '@id': industrialSiteConfig.websiteId,
        name: industrialSiteConfig.brandName,
        url: industrialSiteConfig.origin,
        inLanguage: hrefLangByLocale[locale],
        publisher: {
          '@id': industrialSiteConfig.organizationId,
        },
      },
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: data.hero.title,
        description: data.hero.body,
        inLanguage: hrefLangByLocale[locale],
        isPartOf: {
          '@id': industrialSiteConfig.websiteId,
        },
        breadcrumb: {
          '@id': `${canonicalUrl}#breadcrumb`,
        },
        mainEntity: {
          '@id': `${canonicalUrl}#site-entry-points`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: canonicalUrl,
          },
        ],
      },
      {
        '@type': 'ItemList',
        '@id': `${canonicalUrl}#site-entry-points`,
        name: data.categories.title,
        numberOfItems: entryItems.length,
        itemListElement: entryItems.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.label,
          description: item.description,
          url: getAbsoluteUrl(getLocalizedPath(locale, item.href)),
        })),
      },
    ],
  }
}
