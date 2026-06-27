import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { getApplicationEntryPageViewModel, getIndustryEntryPageViewModel, selectProductSeo, type ProductRecord } from '@/lib/domain'
import { getRuntimeDomainProductRecords } from '@/lib/runtime/domain-products'
import { getAbsoluteUrl, getLocalizedProductUrl } from './canonical'
import { buildHomeHrefLangs, buildProductHrefLangs, buildStaticPathHrefLangs } from './hreflang'

export function buildSitemap(): MetadataRoute.Sitemap {
  return buildSitemapForProducts(getRuntimeDomainProductRecords())
}

export function buildSitemapForProducts(products: readonly ProductRecord[]): MetadataRoute.Sitemap {
  const homeEntries: MetadataRoute.Sitemap = routing.locales.map((locale) => ({
    url: getAbsoluteUrl(`/${locale}`),
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: locale === routing.defaultLocale ? 1 : 0.9,
    alternates: {
      languages: buildHomeHrefLangs(),
    },
  }))

  const staticEntryPaths = ['/', '/products', '/industries', '/applications', '/oem', '/resources', '/contact']
  const staticEntries: MetadataRoute.Sitemap = staticEntryPaths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: getAbsoluteUrl(path === '/' ? `/${locale}` : `/${locale}${path}`),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: path === '/' ? 1 : 0.7,
      alternates: {
        languages: path === '/' ? buildHomeHrefLangs() : buildStaticPathHrefLangs(path),
      },
    })),
  )

  const industryEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    getIndustryEntryPageViewModel(locale).entries.map((entry) => ({
      url: getAbsoluteUrl(`/${locale}${entry.href}`),
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.65,
      alternates: {
        languages: buildStaticPathHrefLangs(entry.href),
      },
    })),
  )

  const applicationEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    getApplicationEntryPageViewModel(locale).entries.map((entry) => ({
      url: getAbsoluteUrl(`/${locale}${entry.href}`),
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.65,
      alternates: {
        languages: buildStaticPathHrefLangs(entry.href),
      },
    })),
  )

  const productEntries: MetadataRoute.Sitemap = products.flatMap((product) => {
    const languages = buildProductHrefLangs(product)

    return routing.locales.map((locale) => {
      const seo = selectProductSeo(product, locale)

      return {
        url: getLocalizedProductUrl(locale, seo.slug.canonicalPath),
        lastModified: product.identity.revisedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
        alternates: {
          languages,
        },
        images: product.assets.map((asset) => getAbsoluteUrl(asset.href)),
      }
    })
  })

  return dedupeSitemapEntries([...homeEntries, ...staticEntries, ...industryEntries, ...applicationEntries, ...productEntries])
}

function dedupeSitemapEntries(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Set<string>()

  return entries.filter((entry) => {
    if (seen.has(entry.url)) {
      return false
    }

    seen.add(entry.url)
    return true
  })
}
