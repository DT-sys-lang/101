# Thread 3: SEO / GEO Runtime

You are responsible for Google SEO and AI-search readability.

## Mission

Make every product, industry, and application page produce stable SEO and GEO outputs from Domain data only.

## Current Context

Key files to read first:

- `lib/seo/product-detail.ts`
- `lib/seo/product-list.ts`
- `lib/domain/seo.ts`
- `lib/domain/geo-ai.ts`
- `adapter/seo.adapter.ts`
- `adapter/geo.adapter.ts`
- `app/sitemap.ts`
- `app/robots.ts`
- `app/[locale]/geo/products/[...slug]/route.ts`

## Tasks

1. Expand `lib/seo` into stable modules if needed:
   - metadata
   - canonical
   - hreflang
   - sitemap
   - robots
   - jsonld/product
   - jsonld/item-list
   - jsonld/faq
2. Expand or create `lib/geo` for:
   - AIReadableIndustrialProduct
   - product feed
   - GEO index
   - answer blocks
   - evidence refs
   - llms.txt source data
3. Add or verify API endpoints:
   - `/api/product-feed`
   - `/api/geo/index`
   - `/api/geo/products`
   - `/api/geo/answers`
   - `/llms.txt`
4. Ensure output is derived from Domain only.
5. Keep existing product detail JSON-LD and FAQ schema working.

## Acceptance Criteria

Each product has:

- canonical URL
- hreflang
- Product JSON-LD
- FAQPage JSON-LD
- sitemap entry
- AIReadableIndustrialProduct block or endpoint
- source-backed facts and evidence refs

## Forbidden

- Do not generate hidden fake AI content.
- Do not read CMS raw data directly from SEO/GEO modules unless through Domain-normalized records.
- Do not create SEO fields in UI components.
