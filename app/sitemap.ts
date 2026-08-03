import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { getResourceCollectionPageViewModel, type ResourceCollectionKind } from '@/lib/domain'
import { buildResourceSitemapEntries, buildSitemap, mergeSitemapEntries } from '@/lib/seo/sitemap'
import { preloadRuntimeDomainProducts, runtimeProductViewModelSource } from '@/lib/runtime/domain-products'
import { listRuntimeResourceContent } from '@/lib/runtime/domain-resources'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await preloadRuntimeDomainProducts()
  const kinds: readonly ResourceCollectionKind[] = ['blog', 'cases', 'manuals']
  const resourceGroups = await Promise.all(routing.locales.flatMap((locale) =>
    kinds.map(async (kind) => {
      const content = await listRuntimeResourceContent(locale, kind)
      const collection = getResourceCollectionPageViewModel(locale, kind, runtimeProductViewModelSource, content)
      return buildResourceSitemapEntries(locale, kind, collection.entries)
    }),
  ))

  return mergeSitemapEntries(buildSitemap(), ...resourceGroups)
}
