import type { MetadataRoute } from 'next'
import { industrialSiteConfig } from '@/lib/domain'
import { getAbsoluteUrl } from './canonical'

export function buildRobots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/cart/', '/checkout/', '/search?', '/*?sort=', '/*?filter='],
    },
    sitemap: getAbsoluteUrl('/sitemap.xml'),
    host: industrialSiteConfig.origin,
  }
}
