# SEO/GEO Contract Lock

## Frozen Boundary

At the current stage, the SEO/GEO contract is frozen for real CMS integration. The contract does not move to page UI, and it does not connect Strapi details. All outputs listed below must continue to be produced from Domain-normalized records and runtime facade data only.

## Frozen Outputs

The following outputs are contract-stable and must remain consistent:

- `sitemap`
- `canonical`
- `hreflang`
- `JSON-LD`
- `llms.txt`
- `product-feed`
- `geo/index`
- `geo/products`
- `geo/answers`

## Required Source Boundary

These outputs must continue to depend on the following sources and nothing lower-level:

- Domain-normalized product records
- Domain product catalog / list projections
- Product detail SEO projections
- Entry-page view models for industries and applications
- Runtime facade metadata from `lib/runtime/domain-products.ts`
- Contract envelopes from `lib/api/contracts.ts` for public route handlers

They must not read CMS raw response objects, transport envelopes, draft state, relation payloads, or Strapi-specific fields directly.

## Contract Rules

- `sitemap` stays generated from Domain products, Domain entry pages, and localized static entries.
- `canonical` stays derived from localized canonical paths and the configured site origin.
- `hreflang` stays aligned with `next-intl` locales and default locale.
- `JSON-LD` stays generated in `lib/seo/*` from Domain SEO/view-model data only.
- `llms.txt` stays a machine-readable discovery map built from Domain products, industries, applications, and feed endpoints.
- `product-feed`, `geo/index`, `geo/products`, and `geo/answers` stay public runtime contracts with stable route envelopes and Domain-normalized payloads.

## Executable Assertions

The contract is locked by validation scripts:

- `npm run validate:seo` asserts `seo-runtime-contract-v1`, sitemap shape, hreflang keys, and schema.org JSON-LD graph types.
- `npm run validate:geo` asserts `geo-runtime-contract-v1`, GEO feed/index/answers versions, AI-readable product shape, `llms.txt` discovery links, and Domain-only source policy.
- Boundary checks fail if `lib/seo` or `lib/geo` imports CMS raw layers, adapter raw facts, Strapi-specific modules, or public CMS/Strapi/facts environment variables.

## Status

Frozen unchanged.

Any future change to this contract must come from a deliberate domain-model change, not from CMS transport details or page-layer UI work.
