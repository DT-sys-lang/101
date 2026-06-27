export const architectureFreezeV1 = {
  version: 'architecture-freeze-v1',
  layer: 'lib/domain',
  rules: [
    'Domain records are the source of truth for product, category, SEO, and GEO structures.',
    'UI layers consume projections only and do not define product semantics.',
    'Product detail routes resolve from locale plus SEO slug path before product lookup.',
    'Category hierarchy supports root, family, principle, function, and series/accessory levels.',
    'GEO AI summaries are generated only from source-backed product facts and evidence references.',
  ],
  outputs: [
    'ProductRecord',
    'CategoryTree',
    'ProductDetailDataFlow',
    'ProductSeoFields',
    'ProductGeoAiProfile',
  ],
} as const
