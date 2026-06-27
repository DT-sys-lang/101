import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import { industrialSiteConfig } from '@/lib/domain'
import type { EntryPageSeoData } from '@/lib/domain/entry-pages'
import { getAbsoluteUrl, hrefLangByLocale } from './canonical'
import { buildStaticPathHrefLangs } from './hreflang'

export function buildEntryPageMetadata(data: EntryPageSeoData): Metadata {
  const canonicalUrl = getAbsoluteUrl(`/${data.locale}${data.canonicalPath}`)

  return {
    metadataBase: new URL(industrialSiteConfig.origin),
    title: data.title,
    description: data.description,
    alternates: {
      canonical: canonicalUrl,
      languages: buildStaticPathHrefLangs(data.canonicalPath),
    },
    openGraph: {
      type: 'website',
      title: data.title,
      description: data.description,
      url: canonicalUrl,
      siteName: industrialSiteConfig.brandName,
      locale: hrefLangByLocale[data.locale],
      alternateLocale: routing.locales
        .filter((locale) => locale !== data.locale)
        .map((locale) => hrefLangByLocale[locale]),
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

export function buildEntryPageJsonLd(data: EntryPageSeoData) {
  const canonicalUrl = getAbsoluteUrl(`/${data.locale}${data.canonicalPath}`)

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#collection`,
        url: canonicalUrl,
        name: data.title,
        description: data.description,
        inLanguage: hrefLangByLocale[data.locale],
        isPartOf: {
          '@id': industrialSiteConfig.websiteId,
        },
        mainEntity: {
          '@id': `${canonicalUrl}#item-list`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: data.breadcrumb.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.label,
          item: getAbsoluteUrl(`/${data.locale}${item.canonicalPath}`),
        })),
      },
      {
        '@type': 'ItemList',
        '@id': `${canonicalUrl}#item-list`,
        numberOfItems: data.items.length,
        itemListElement: data.items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.label,
          url: getAbsoluteUrl(`/${data.locale}${item.canonicalPath}`),
        })),
      },
      ...(data.faq.length
        ? [{
            '@type': 'FAQPage' as const,
            '@id': `${canonicalUrl}#faq`,
            mainEntity: data.faq.map((faq) => ({
              '@type': 'Question' as const,
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer' as const,
                text: faq.answer,
              },
            })),
          }]
        : []),
    ],
  }
}
