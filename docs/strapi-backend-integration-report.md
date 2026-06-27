# Strapi Backend Integration Report

Date: 2026-06-25
Owner: Thread 2 - CMS / Strapi / PostgreSQL

## Scope

This report records the first real backend integration step for the facts-only CMS layer.
The work stays behind the backend boundary and does not connect a live database, write UI, expose Strapi to public routes, or change the Domain contract.

## Architecture Boundary

- CMS remains a Fact Layer only.
- Strapi/PostgreSQL stores persistence facts and lookup facts, not generated Domain projections.
- The only runtime output shape is direct `CmsFactInput`:

```json
{
  "categoryFacts": [],
  "productFacts": []
}
```

- `IndustryFact`, `ApplicationFact`, `DocumentAsset`, `Certification`, and media assets are persistence rows only; the aggregator folds them into `productFacts[]` IDs, codes, documents, and assets.
- Frontend, SEO, GEO, and public API consumers continue to use Domain/runtime facades and adapter-derived projections.

## Added Backend Bundle

A standalone Strapi v4 backend skeleton was added under `strapi-cms/`.

Key files:

- `strapi-cms/package.json` defines the isolated Strapi app and PostgreSQL driver dependency.
- `strapi-cms/.env.example` documents server, PostgreSQL, REST prefix, and internal token variables.
- `strapi-cms/config/database.js` configures PostgreSQL with env-driven host, port, database, schema, user, password, SSL, pool, and timeout settings.
- `strapi-cms/config/api.js` sets the REST prefix to `/internal/cms`, making the aggregator route `GET /internal/cms/facts`.
- `strapi-cms/src/components/facts/*.json` copies the facts-only component schemas from `docs/strapi-schema/components/facts/`.
- `strapi-cms/src/api/*/content-types/*/schema.json` copies the six facts-only content types from `docs/strapi-schema/content-types/`.

Content types present:

- `application-fact`
- `category-fact`
- `certification`
- `document-asset`
- `industry-fact`
- `product-fact`

## PostgreSQL Configuration

`strapi-cms/config/database.js` is configured for PostgreSQL only:

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_NAME`
- `DATABASE_SCHEMA`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `DATABASE_SSL`
- `DATABASE_SSL_REJECT_UNAUTHORIZED`
- `DATABASE_POOL_MIN`
- `DATABASE_POOL_MAX`
- `DATABASE_CONNECTION_TIMEOUT_MS`

No live PostgreSQL connection was opened in this task. Strapi will own physical IDs, join tables, draft/publish metadata, and upload internals; stable adapter-facing keys remain `factId` for facts and `code` for certifications.

## Internal Facts Aggregator

Implemented route:

```txt
GET /internal/cms/facts
Authorization: Bearer <server-only-token>
```

Implementation files:

- `strapi-cms/src/api/cms-facts/routes/cms-facts.js`
- `strapi-cms/src/api/cms-facts/controllers/cms-facts.js`
- `strapi-cms/src/api/cms-facts/services/cms-facts.js`
- `strapi-cms/src/policies/internal-cms-facts.js`
- `strapi-cms/config/cms-facts.js`

Input query contract:

- `publicationState=live|preview`, default `live`.
- `localeSet=default|all`, default `default`; this does not change the output shape.
- `previewContentType` and `previewEntryId` must be provided together.
- Preview parameters require `publicationState=preview`.
- Preview content types are restricted to the six facts-only content type UIDs.

Aggregation rules:

- Reads all six facts-only persistence concepts with Strapi `entityService`.
- Builds `categoryFacts[]` from `category-fact.factId`, parent `factId`, and localized names.
- Builds `productFacts[]` from `product-fact` scalar facts, components, and relations.
- Maps category, industry, and application relations to stable `factId` arrays.
- Maps certification relations to stable `code` arrays.
- Splits `DocumentAsset` rows by `assetClass`: `document` to `documents[]`, `media` to `assets[]`.
- Normalizes media/document `href` from `hrefOverride ?? file.url` and strips upload internals.
- Maps `sourceRefs[].sourceId` to adapter-facing `sourceRefs[].id`.
- Maps variant `factId` to adapter-facing `variants[].id`.
- Sorts top-level facts and relation ID/code arrays deterministically.

## Rejection Rules

The aggregator rejects or strips anything outside direct `CmsFactInput`.

Forbidden response fields include:

- `slug`, `slugPath`, `canonical`, `canonicalPath`, `breadcrumb`
- `seo`, `localizedSeo`
- `jsonld`, `jsonLd`, `jsonLD`
- `geo`, `geoAi`, `localizedGeoAi`, `geoEntity`, `entity`
- `identity`, `classification`, `categoryPath`, `depth`, `children`
- Strapi envelopes and internals: `data`, `attributes`, `meta`, `documentId`, numeric `id`, `createdAt`, `updatedAt`, `publishedAt`, `createdBy`, `updatedBy`

`lib/cms/source.ts` was also hardened so the `cms-facts-api` path sends optional server-only bearer auth through `CMS_FACTS_API_TOKEN` and rejects nested raw Strapi/envelope fields before `normalizeCmsFactInput()` runs.

## Runtime Boundary

Runtime source mode remains unchanged at the Domain contract boundary:

- `CMS_SOURCE_MODE=mock-domain` remains the safe default.
- `CMS_SOURCE_MODE=env-facts-json` still validates `CMS_FACTS_JSON` as direct `CmsFactInput`.
- `CMS_SOURCE_MODE=cms-facts-api` can call the backend-only aggregator when `CMS_FACTS_API_URL`, `CMS_FACTS_API_ALLOW_FETCH`, and optional `CMS_FACTS_API_TOKEN` are configured.
- `lib/cms/products.ts` still exposes Domain-normalized records/status only and does not expose raw facts.

## Non-Goals Preserved

- No frontend page or component was added.
- No UI code calls Strapi.
- No public route directly reads Strapi collections.
- No real PostgreSQL database was connected.
- No Domain contract shape was changed.
- No production CMS traffic cutover was performed.

## Verification

Required commands for this integration step were run successfully:

```txt
npm run validate:cms-facts  # pass, 300 generated product facts
npm run validate:domain     # pass, 20 mock-domain product records
npm run typecheck           # pass, tsc --noEmit
```

Additional syntax check:

```txt
Get-ChildItem strapi-cms -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }  # pass
```
