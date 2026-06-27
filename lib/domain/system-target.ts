import { applicationSystemContract } from './application'
import { industrySystemContract } from './industry'
import { inquirySystemContract } from './inquiry'

export const finalGrowthSystemTarget = {
  version: 'final-growth-system-target-v1',
  definition: 'CMS-driven, domain-unified, SEO-growth, AI-readable industrial B2B global lead-generation system.',
  frontend: {
    requiredSystems: [
      'homepage',
      'product-system',
      'industry-seo-system',
      'application-geo-system',
      'multilingual-system',
      'inquiry-system',
    ],
    locales: ['en', 'zh'],
  },
  dataArchitecture: {
    cmsFactLayer: 'CMS records raw facts only.',
    adapterEngine: 'Adapter generates ProductRecord, CategoryTree, SEO schema, and GEO AI structures.',
    domainTruthLayer: 'Domain contracts are the only data standard consumed by UI, SEO, GEO, and search.',
    backendRuntime: 'Strapi/Postgres or compatible API runtime persists facts and exposes controlled REST/GraphQL access.',
  },
  growthArchitecture: {
    seo: [
      'Product schema',
      'ItemList schema',
      'FAQPage schema',
      'sitemap.xml',
      'robots.txt',
      'canonical URLs',
      'hreflang',
      'internal linking',
      'breadcrumb',
    ],
    geo: [
      'AIReadableIndustrialProduct',
      'AI summary',
      'fact table',
      'application explanation',
      'selection guidance',
      'evidence refs',
    ],
    conversion: inquirySystemContract.conversionGoals,
  },
  contentScale: {
    products: '300-to-1000-plus',
    productPages: 'one SEO page plus one GEO output per product',
    industryPages: industrySystemContract.requiredIndustries,
    applicationSeeds: applicationSystemContract.requiredSeedIntents,
  },
} as const
