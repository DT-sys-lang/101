import { routing, type Locale } from '@/i18n/routing'
import { industrialSiteConfig, selectProductSeo, type ProductCanonicalPath, type ProductRecord } from '@/lib/domain'

export const hrefLangByLocale: Record<Locale, 'zh-CN' | 'en'> = {
  zh: 'zh-CN',
  en: 'en',
}

export const openGraphLocaleByLocale: Record<Locale, string> = {
  zh: 'zh_CN',
  en: 'en_US',
}

export function getAbsoluteUrl(pathOrUrl: string) {
  return new URL(pathOrUrl, industrialSiteConfig.origin).toString()
}

export function getLocalizedPath(locale: Locale, canonicalPath: string) {
  return `/${locale}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`
}

export function getLocalizedProductUrl(locale: Locale, canonicalPath: ProductCanonicalPath) {
  return getAbsoluteUrl(getLocalizedPath(locale, canonicalPath))
}

export function buildProductCanonicalUrl(product: ProductRecord, locale: Locale) {
  const seo = selectProductSeo(product, locale)
  return getLocalizedProductUrl(locale, seo.slug.canonicalPath)
}

export function buildLocalizedHomeUrl(locale: Locale) {
  return getAbsoluteUrl(`/${locale}`)
}

export function buildDefaultLocaleUrl(canonicalPath: string) {
  return getAbsoluteUrl(getLocalizedPath(routing.defaultLocale, canonicalPath))
}
