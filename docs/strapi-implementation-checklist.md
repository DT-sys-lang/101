# Strapi CMS Fact Layer Implementation Checklist

## Scope

This checklist turns the existing schema documentation into an implementation order for Strapi + PostgreSQL.
It does not change the Domain contract, it does not add UI work, and it does not require a live database connection.

## Audit Result

- [x] The schema set is facts-only: `CategoryFact`, `ProductFact`, `IndustryFact`, `ApplicationFact`, `DocumentAsset`, and `Certification`.
- [x] The shared components are limited to factual primitives and nested facts.
- [x] No schema file defines `slug`, `canonical`, `seo`, `jsonLd` / `jsonld` / `jsonLD`, `geo`, `identity`, `classification`, `categoryPath`, `depth`, or `children`.
- [x] `adapter/validation.ts` already rejects derived fields and enforces the `CmsFactInput` boundary.

## 1. Strapi Creation Order

Create the Strapi schema in dependency order so referenced components exist before the content types that use them.

1. Create `facts.localized-text`.
2. Create the leaf components:
   - `facts.quantity-range`
   - `facts.quantity-value`
   - `facts.source-ref`
   - `facts.option-value-fact`
3. Create the composed fact components:
   - `facts.measurement-fact`
   - `facts.signal-output-fact`
   - `facts.connection-set-fact`
   - `facts.environmental-limit-fact`
   - `facts.specification-value-fact`
   - `facts.specification-group-fact`
   - `facts.variant-fact`
   - `facts.commercial-term-fact`
4. Create the lookup collection types:
   - `category-fact`
   - `industry-fact`
   - `application-fact`
   - `certification`
5. Create `document-asset`.
6. Create `product-fact` last, because it depends on the category, lookup, document, and certification content types.

Implementation notes:

- Keep `product-fact` and `category-fact` facts-only; do not add route, SEO, GEO, or canonical fields.
- Keep `document-asset` as one collection with `assetClass` deciding whether the row normalizes to a document or media asset.
- Keep `certification` as a controlled lookup, not a domain record.

## 2. PostgreSQL Persistence Notes

- Treat Strapi numeric IDs as physical persistence details; the stable business keys are `factId` for facts and `code` for certifications.
- Keep the logical table model normalized: one fact table per content type, plus join tables for product-to-category, product-to-industry, product-to-application, product-to-certification, and product-to-document/media relations.
- Use `published_at` to separate live and preview data; preview mode is a read path, not a second domain model.
- Do not add physical columns for `slug`, `canonical`, `seo`, `jsonLd`, `geo`, `identity`, or `classification`.
- Do not connect the app to a real database in this phase; document the persistence model only.
- If you write SQL in docs, keep it clearly labeled as logical documentation rather than a migration script.

## 3. `GET /internal/cms/facts`

This endpoint is the only runtime ingress from Strapi facts into the adapter.

### Inputs

- `publicationState=live|preview`
- `localeSet=default|all`
- `previewContentType` when a draft overlay is requested
- `previewEntryId` when a draft overlay is requested
- Internal bearer auth, or an equivalent internal service secret

### Output

- Exact direct `CmsFactInput` only:
  - `categoryFacts`
  - `productFacts`
- No Strapi envelopes or wrapper objects.
- No generated fields.
- No domain projections.
- No UI-facing response shape.

### Normalization Rules

- Fetch the complete fact graph for all six CMS content types.
- Resolve relations through stable keys only:
  - `factId` for facts
  - `code` for certifications
- Split `DocumentAsset` records by `assetClass`.
- Emit documents into `documents[]` and media into `assets[]`.
- Sort output deterministically.
- Preserve authored order only inside repeatable editorial arrays where order matters.
- Reject any unknown or generated field before returning.
- Run `assertCmsFactInput(cmsFacts)` and then `buildDomainFromCmsFacts(cmsFacts)`.

## 4. Preview Mode Requirements

- Preview is a backend-only flow.
- The Next preview route verifies its preview secret before calling the CMS facts endpoint.
- The preview route calls `/internal/cms/facts` with `publicationState=preview`, `previewContentType`, and `previewEntryId` when a draft overlay is required.
- Preview data must still pass through the adapter before the app renders anything.
- Preview output must use generated canonical paths from the adapter, never Strapi slugs or canonical fields.
- Preview must never expose raw Strapi objects to the browser.
- Lookup facts and assets preview through related products or catalog surfaces; they do not become standalone domain routes in this phase.

## 5. Publish Webhook Requirements

- Handle `entry.publish`.
- Handle `entry.unpublish`.
- Handle `entry.update` when the entry is published.
- Handle media replacement for `DocumentAsset`.
- Sign requests with HMAC and a timestamp.
- Validate the webhook before doing any CMS fetch or revalidation work.
- Fetch aggregated direct facts from `/internal/cms/facts`.
- Validate the adapter input before calculating affected pages.
- Revalidate by adapter output only; do not derive paths from Strapi slug or canonical fields.
- Revalidate broad tags first, then route-level paths.

Recommended revalidation tags:

- `cms-facts`
- `product-catalog`
- `sitemap`
- `home`

## 6. CMS Field Disable List

### Schema-Level Forbidden Fields

These field names must not be added to any Strapi content type or component:

`slug`, `slugPath`, `canonical`, `canonicalPath`, `breadcrumb`, `seo`, `localizedSeo`, `jsonld`, `jsonLd`, `jsonLD`, `geo`, `geoAi`, `localizedGeoAi`, `geoEntity`, `entity`, `identity`, `classification`, `categoryPath`, `depth`, `children`

### Response-Level Forbidden Fields

These fields must not leave the internal aggregation boundary:

`data`, `attributes`, `documentId`, `createdAt`, `updatedAt`, `publishedAt`, Strapi internal numeric `id`, relation wrapper nodes, Upload provider internals

### Practical Rule

If a field is generated by the adapter, or if it is a Strapi envelope/internal transport detail, it stays out of the CMS fact payload.

## 7. Verification Commands

Run these before calling the implementation complete:

- `npm run validate:cms-facts`
- `npm run lint`
- `npm run typecheck`

## 8. Acceptance Criteria

- The Strapi schema remains facts-only.
- The aggregator returns deterministic direct `CmsFactInput`.
- Preview mode still uses the adapter.
- Publish webhooks revalidate generated routes, not Strapi fields.
- The Domain contract remains unchanged.

## 9. Source Mode Prep

- `lib/cms/products.ts` should keep a single internal snapshot cache and expose source metadata separately from normalized domain records.
- `CMS_SOURCE_MODE` may request `mock-domain`, `env-facts-json`, or `cms-facts-api`.
- `CMS_FACTS_API_URL` and related `CMS_FACTS_API_*` variables configure the async `cms-facts-api` fetch path.
- `cms-facts-api` is implemented as an async source path, but live product runtime still requires an async preload or async getter boundary before it serves CMS data.
- The implementation must keep the `CMS_FACTS_JSON` path and mock fallback functional when the backend-only endpoint is unavailable or invalid.
