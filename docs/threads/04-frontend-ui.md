# Thread 4: Frontend / UI

You are responsible for the public website experience, but only through Domain View Models.

## Mission

Build the user-facing industrial B2B website experience while preserving the frozen data boundaries.

## Current Context

Key files to read first:

- `app/[locale]/page.tsx`
- `app/[locale]/products/page.tsx`
- `app/[locale]/products/[...slug]/page.tsx`
- `components/sections/homepage.tsx`
- `components/products/product-list-page.tsx`
- `components/products/product-detail-page.tsx`
- `components/layout/site-header.tsx`
- `components/layout/site-footer.tsx`
- `lib/domain/site.ts`

## Tasks

1. Improve homepage with:
   - industrial brand trust
   - product entry points
   - industry SEO entry points
   - application/use-case entry points
   - company capabilities
   - RFQ conversion path
2. Improve product pages with:
   - structured technical parameters
   - applications
   - datasheet downloads
   - FAQ
   - SEO content section
   - visible GEO AI summary block if required by design
3. Prepare industry pages for:
   - Oil & Gas
   - Water Treatment
   - Industrial Automation
   - Energy
   - Manufacturing
4. Prepare application pages for:
   - High pressure measurement
   - Industrial pipeline monitoring
   - OEM sensor integration
5. Add client components only for real interaction.

## Acceptance Criteria

- UI consumes Domain projections or View Models only.
- No component imports Strapi client or CMS raw responses.
- No UI component generates canonical, hreflang, JSON-LD, or GEO structures.
- `npm run build` passes.

## Forbidden

- Do not create a marketing-only landing page instead of the usable B2B site.
- Do not duplicate product data in components.
- Do not define product/category semantics in UI.
