import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import { industrialSiteConfig, type ProductDetailPageData } from '@/lib/domain'
import { getLocalizedProductUrl, openGraphLocaleByLocale } from './canonical'
import { buildProductHrefLangs } from './hreflang'

export function buildProductMetadata(data: ProductDetailPageData): Metadata {
  const canonicalUrl = getLocalizedProductUrl(data.locale, data.seo.slug.canonicalPath)
  const primaryImage = data.product.assets[0]
  const index = data.seo.indexingPolicy === 'index-follow'
  const follow = data.seo.indexingPolicy !== 'noindex-nofollow'

  return {
    metadataBase: new URL(industrialSiteConfig.origin),
    title: data.seo.title,
    description: data.seo.metaDescription,
    alternates: {
      canonical: canonicalUrl,
      languages: buildProductHrefLangs(data.product),
    },
    robots: {
      index,
      follow,
      googleBot: {
        index,
        follow,
      },
    },
    openGraph: {
      type: 'website',
      title: data.seo.openGraph.title,
      description: data.seo.openGraph.description,
      url: canonicalUrl,
      siteName: industrialSiteConfig.brandName,
      locale: openGraphLocaleByLocale[data.locale],
      alternateLocale: routing.locales
        .filter((locale) => locale !== data.locale)
        .map((locale) => openGraphLocaleByLocale[locale]),
      images: primaryImage
        ? [
            {
              url: new URL(primaryImage.href, industrialSiteConfig.origin).toString(),
              alt: primaryImage.alt,
            },
          ]
        : undefined,
    },
  }
}
