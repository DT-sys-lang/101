import { routing, type Locale } from '@/i18n/routing'
import { selectProductSeo, type ProductRecord } from '@/lib/domain'
import { getAbsoluteUrl, getLocalizedPath, getLocalizedProductUrl, hrefLangByLocale } from './canonical'

export type HreflangMap = Record<string, string>

export function buildProductHrefLangs(product: ProductRecord): HreflangMap {
  const languages: HreflangMap = {}

  for (const locale of routing.locales) {
    const seo = selectProductSeo(product, locale)
    languages[hrefLangByLocale[locale]] = getLocalizedProductUrl(locale, seo.slug.canonicalPath)
  }

  const defaultSeo = selectProductSeo(product, routing.defaultLocale)
  languages['x-default'] = getLocalizedProductUrl(routing.defaultLocale, defaultSeo.slug.canonicalPath)

  return languages
}

export function buildStaticPathHrefLangs(canonicalPath: string): HreflangMap {
  return Object.fromEntries([
    ...routing.locales.map((locale) => [hrefLangByLocale[locale], getAbsoluteUrl(getLocalizedPath(locale, canonicalPath))]),
    ['x-default', getAbsoluteUrl(getLocalizedPath(routing.defaultLocale, canonicalPath))],
  ])
}

export function buildHomeHrefLangs(): HreflangMap {
  return Object.fromEntries([
    ...routing.locales.map((locale) => [hrefLangByLocale[locale], getAbsoluteUrl(`/${locale}`)]),
    ['x-default', getAbsoluteUrl(`/${routing.defaultLocale}`)],
  ])
}

export function toHrefLang(locale: Locale) {
  return hrefLangByLocale[locale]
}
