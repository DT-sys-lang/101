# CMS Fact Pipeline Validation

## Input Contract

`CMS_FACTS_JSON` must resolve to a JSON object with exactly two arrays:

- `categoryFacts`
- `productFacts`

The adapter rejects any CMS payload that contains generated fields such as `slug`, `canonicalPath`, `slugPath`, `depth`, `children`, `breadcrumb`, `seo`, `jsonLd`, `geo`, or `geoAi`.

Example facts-only fixture: `docs/data-pipeline/cms-facts.example.json`.

## Runtime Path

1. CMS export or fixture payload is loaded as raw JSON.
2. `adapter/validation.ts` normalizes the payload and rejects derived fields.
3. `adapter/category.adapter.ts` builds `CategoryTree` from `categoryFacts`.
4. `adapter/product.adapter.ts` converts `ProductFact` into `ProductRecord`.
5. `adapter/seo.adapter.ts` and `adapter/geo.adapter.ts` generate all derived SEO and GEO projections.
6. `lib/cms/products.ts` reads `CMS_FACTS_JSON`, runs the adapter, and exposes domain records to the rest of the app.

## Validation Commands

- `npm run validate:cms-export -- --file docs/data-pipeline/cms-facts.example.json` checks that a local export payload is a `CmsFactInput`.
- `npm run validate:cms-facts -- --file docs/data-pipeline/cms-facts.example.json` runs the full adapter/domain conversion on the example fixture.
- `npm run validate:cms-facts` validates the generated scale fixture or the `CMS_FACTS_JSON` environment payload.
- `CMS_FACTS_JSON="..." npm run validate:domain` validates the same runtime path used by `lib/cms/products.ts`.
- `npm run validate:scale-300` and `npm run validate:scale-1000` exercise the facts-only synthetic pipeline at 300 and 1000 products.

## Scale Test Plan

1. Generate raw fact payloads with `scripts/generate-scale-cms-facts.mjs` at 300 and 1000 products.
2. Feed the payload through `validate:cms-export` or `validate:cms-facts` to confirm the CMS export contains only facts.
3. Feed the same payload through `CMS_FACTS_JSON` into `validate:domain` to confirm `ProductRecord` and `CategoryTree` generation.
4. Run `validate:scale-300` and `validate:scale-1000` to check duplicate sku / model / category / document risks and overloadLimit signature collisions.
5. Keep the checks outside UI and outside Strapi admin pages.

## Responsibility Boundary

- CMS/content operations own fact completeness and export correctness.
- Adapter maintainers own fact-to-domain conversion and derived field generation.
- Domain maintainers own the immutable contract in `lib/domain`.
- CI owns the validation gates and build confirmation.
