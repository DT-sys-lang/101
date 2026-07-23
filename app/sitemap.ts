import type { MetadataRoute } from 'next'
import { buildSitemap } from '@/lib/seo/sitemap'
import { preloadRuntimeDomainProducts } from '@/lib/runtime/domain-products'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await preloadRuntimeDomainProducts()
  return buildSitemap()
}
