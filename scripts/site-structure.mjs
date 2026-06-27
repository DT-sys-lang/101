import { routing } from '../i18n/routing.ts'
import { getApplicationEntryPageViewModel, getIndustryEntryPageViewModel } from '../lib/domain/page-view-models.ts'

export const staticLocalizedEntryPaths = ['/products', '/industries', '/applications', '/oem', '/resources', '/contact']

export function getSiteStructureCounts(locale = routing.defaultLocale) {
  return {
    localeCount: routing.locales.length,
    industryEntryCount: getIndustryEntryPageViewModel(locale).entries.length,
    applicationEntryCount: getApplicationEntryPageViewModel(locale).entries.length,
    staticLocalizedEntryCount: staticLocalizedEntryPaths.length,
  }
}

export function getSitemapEntryBreakdown(productCount, locale = routing.defaultLocale) {
  const counts = getSiteStructureCounts(locale)
  const homeEntries = counts.localeCount
  const staticEntries = counts.localeCount * counts.staticLocalizedEntryCount
  const industryEntries = counts.localeCount * counts.industryEntryCount
  const applicationEntries = counts.localeCount * counts.applicationEntryCount
  const productEntries = counts.localeCount * productCount
  const totalEntries = homeEntries + staticEntries + industryEntries + applicationEntries + productEntries

  return {
    ...counts,
    homeEntries,
    staticEntries,
    industryEntries,
    applicationEntries,
    productEntries,
    totalEntries,
  }
}

export function getExpectedSitemapEntryCount(productCount, locale = routing.defaultLocale) {
  return getSitemapEntryBreakdown(productCount, locale).totalEntries
}

export function getGeoAnswerBlockBreakdown(products, locale = routing.defaultLocale) {
  const counts = getSiteStructureCounts(locale)
  const productCount = products.length
  const productAnswerBlocks = countProductAnswerBlocks(products, locale)
  const applicationAnswerBlocks = counts.applicationEntryCount * 2
  const totalAnswerBlocks = productAnswerBlocks + applicationAnswerBlocks

  return {
    ...counts,
    productCount,
    productAnswerBlocks,
    applicationAnswerBlocks,
    totalAnswerBlocks,
  }
}

export function getExpectedGeoAnswerBlockCount(products, locale = routing.defaultLocale) {
  return getGeoAnswerBlockBreakdown(products, locale).totalAnswerBlocks
}

export function getExpectedApplicationAnswerBlockCount(locale = routing.defaultLocale) {
  return getSiteStructureCounts(locale).applicationEntryCount * 2
}

function countProductAnswerBlocks(products, locale) {
  return products.reduce((total, product) => {
    const geoAi = product.localizedGeoAi?.[locale] ?? product.geoAi
    return total + (geoAi?.faq?.length ?? 0)
  }, 0)
}
