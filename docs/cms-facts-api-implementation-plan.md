# CMS Facts API Implementation Plan

## Scope

This document aligns the backend-only facts API contract with the current `cms-facts-api` source code path.
It now has an implementation-ready Strapi backend bundle under `strapi-cms/`; it still does not connect a live PostgreSQL instance, add UI behavior, or change the Domain contract.

## Current Code State

`lib/cms/source.ts` already contains an async `cms-facts-api` source path:

- `readCmsProductSourceAsync()` resolves the async source snapshot.
- `createCmsFactsApiRequest()` builds the endpoint, timeout, query params, and optional server-only bearer auth header.
- `fetchCmsFactsApiResponse()` performs a backend-only `GET` with timeout cancellation.
- `normalizeCmsFactsApiResponse()` rejects `{ cmsFacts }`, Strapi `data` / `attributes` / `meta`, and validates the body through `normalizeCmsFactInput()`.
- `fallbackReason` now covers `not-configured`, `fetch-disabled`, `timeout`, `network-error`, `http-error`, `invalid-response`, `validation-error`, and legacy sync-path `not-implemented`.

`lib/cms/products.ts` already exposes the private `preloadCmsProductSnapshotAsync()` boundary. Production public traffic is still not cut over to live CMS until the backend endpoint is deployed, fetch is explicitly enabled, and the preload/revalidation path is operated as a separate release decision.

## Backend-Only Contract

The internal facts aggregator is the only backend boundary allowed to read Strapi/PostgreSQL facts for runtime product data.

Current backend implementation target:

- `strapi-cms/` contains the Strapi v4 PostgreSQL skeleton, facts-only schemas, and backend-only `GET /internal/cms/facts` route.
- The route reads Strapi content through `entityService`, normalizes relations and upload URLs into direct adapter facts, and returns only `categoryFacts[]` and `productFacts[]`.
- The route is guarded by `INTERNAL_CMS_FACTS_TOKEN`; the Next source helper sends `Authorization: Bearer ${CMS_FACTS_API_TOKEN}` when configured.
- This is implementation-ready code, not a live database connection or production traffic cutover.

Hard rules:

- The frontend must never query Strapi or `/internal/cms/facts` directly.
- The aggregator may read Strapi REST, Strapi GraphQL, or PostgreSQL through the Strapi backend, but those details never leave the backend boundary.
- The only successful HTTP response body is direct `CmsFactInput` with exactly `categoryFacts` and `productFacts`.
- No `{ cmsFacts }` wrapper is allowed in the HTTP success body.
- No Strapi `data`, `attributes`, `meta`, relation wrapper, upload envelope, or persistence metadata is allowed in the HTTP success body.
- `buildDomainFromCmsFacts(cmsFacts)` is the first place where domain records, slugs, SEO, GEO, JSON-LD, breadcrumbs, canonical paths, category paths, and projections may be generated.

Strict successful response:

```json
{
  "categoryFacts": [],
  "productFacts": []
}
```

Forbidden successful response examples:

```json
{ "cmsFacts": { "categoryFacts": [], "productFacts": [] } }
```

```json
{ "data": [], "meta": {} }
```

## Facts Aggregation

The aggregator reads six facts-only CMS persistence concepts and emits only the two adapter arrays.

| Persistence source | Aggregator role | `CmsFactInput` output |
|---|---|---|
| `CategoryFact` | Category tree facts | `categoryFacts[]` |
| `ProductFact` | Product source facts | `productFacts[]` |
| `IndustryFact` | Product lookup relation | `productFacts[].industryIds[]` |
| `ApplicationFact` | Product lookup relation | `productFacts[].applicationIds[]` |
| `DocumentAsset` with `assetClass=document` | Product document relation | `productFacts[].documents[]` |
| `DocumentAsset` with `assetClass=media` | Product media relation | `productFacts[].assets[]` |
| `Certification` | Product compliance relation | `productFacts[].certifications[]` |

`IndustryFact`, `ApplicationFact`, `DocumentAsset`, `Certification`, and media asset rows must never appear as top-level arrays in the API response.

## Facts-Only Structures

### `CategoryFact`

Persistence source: `category-fact`.

Aggregator output fields:

```ts
{
  id: CategoryId
  parentId: CategoryId | null
  name: LocalizedText
}
```

Rules:

- `id` is copied from Strapi `factId` and must start with `cat_`.
- `parentId` is copied from the parent category `factId`; root uses `null`.
- `name` is localized factual text only.
- No slug, depth, children, breadcrumb, canonical path, SEO, or facet projection.

### `ProductFact`

Persistence source: `product-fact` plus normalized lookup/document/media/certification relations.

Aggregator output fields:

```ts
{
  id: ProductId
  sku: string
  model: string
  seriesId: SeriesId
  brand: string
  manufacturer?: string
  lifecycle: ProductLifecycleStatus
  availability: ProductAvailabilityStatus
  releasedAt?: IsoDateString
  revisedAt: IsoDateString
  primaryCategoryId: CategoryId
  additionalCategoryIds?: readonly CategoryId[]
  industryIds: readonly IndustryId[]
  applicationIds: readonly ApplicationId[]
  measurementKinds: readonly MeasurementKind[]
  name: LocalizedText
  shortName: LocalizedText
  summary: LocalizedText
  highlights: readonly LocalizedText[]
  applications: readonly LocalizedText[]
  measurements: readonly ProductMeasurement[]
  outputs: readonly ProductSignalOutput[]
  connections: ProductConnectionSet
  environmentalLimits: ProductEnvironmentalLimits
  specificationGroups: readonly ProductSpecificationGroup[]
  variants?: readonly ProductVariant[]
  certifications?: readonly CertificationCode[]
  documents: readonly ProductDocument[]
  assets?: readonly ProductAsset[]
  commercialTerms: ProductCommercialTerms
}
```

Rules:

- `id` is copied from Strapi `factId` and must start with `prd_`.
- Relation fields emit stable IDs or codes only, never Strapi relation nodes.
- `industryIds` and `applicationIds` are arrays of lookup `factId` values.
- `certifications` is an array of certification `code` values.
- `documents` and `assets` are normalized from `DocumentAsset` by `assetClass`.
- No `identity`, `classification`, `categoryPath`, slug, canonical path, SEO, GEO, JSON-LD, breadcrumb, or UI projection.

### `IndustryFact`

Persistence source: `industry-fact`.

Facts-only persistence fields:

```ts
{
  factId: IndustryId
  name: LocalizedText
  description?: LocalizedText
}
```

Aggregator output:

- No top-level `industryFacts` array.
- Product relations emit `productFacts[].industryIds` only.

Rules:

- `factId` must start with `ind_`.
- `name` and `description` are CMS/editor facts only.
- No slug, canonical, SEO, GEO, reverse product ownership, or standalone domain route.

### `ApplicationFact`

Persistence source: `application-fact`.

Facts-only persistence fields:

```ts
{
  factId: ApplicationId
  name: LocalizedText
  description?: LocalizedText
}
```

Aggregator output:

- No top-level `applicationFacts` array.
- Product relations emit `productFacts[].applicationIds` only.

Rules:

- `factId` must start with `app_`.
- `name` and `description` are CMS/editor facts only.
- No slug, canonical, SEO, GEO, reverse product ownership, or standalone domain route.

### `DocumentAsset` And Media Asset

Persistence source: `document-asset`.

Shared facts-only persistence fields:

```ts
{
  factId: DocumentId | AssetId
  assetClass: 'document' | 'media'
  file: StrapiUploadFile
  hrefOverride?: string
}
```

For `assetClass=document`, aggregator emits `ProductDocument` into `productFacts[].documents`:

```ts
{
  id: DocumentId
  title: string
  kind: 'datasheet' | 'manual' | 'certificate' | 'drawing' | 'catalog' | 'software'
  href: string
  locale?: string
  revision?: string
}
```

For `assetClass=media`, aggregator emits `ProductAsset` into `productFacts[].assets`:

```ts
{
  id: AssetId
  kind: 'primary-image' | 'gallery-image' | 'diagram' | 'dimension-drawing' | 'installation-photo'
  href: string
  alt: string
}
```

Rules:

- `doc_` IDs become documents; `asset_` IDs become media assets.
- `href` is normalized from `hrefOverride ?? file.url`.
- Upload provider internals, file envelopes, dimensions, hashes, and Strapi media metadata do not leave the aggregator.
- One row must not be emitted as both document and media for the same product.
- No canonical path, SEO, GEO, JSON-LD, or UI projection.

### `Certification`

Persistence source: `certification`.

Facts-only persistence fields:

```ts
{
  code: CertificationCode
  label: LocalizedText
  issuer?: string
}
```

Aggregator output:

- No top-level `certifications` array.
- Product relations emit `productFacts[].certifications` as code strings only.

Rules:

- `code` is the stable business key.
- `label` and `issuer` are editor/lookup facts only.
- No SEO, GEO, routing, or standalone domain route.

## Request Contract

The request is a backend-only HTTP `GET` to `CMS_FACTS_API_URL`.

Required behavior:

1. Read `CMS_FACTS_API_URL` from the server environment.
2. Build a `URL` from the configured endpoint.
3. Add query params using the configured param names.
4. Send `Accept: application/json`.
5. Add `Authorization: Bearer ${CMS_FACTS_API_TOKEN}` from server-side secrets when the internal endpoint requires it.
6. Never call Strapi directly from UI or browser code.

Normal runtime request:

```txt
GET /internal/cms/facts?publicationState=live
Accept: application/json
Authorization: Bearer <server-only-token>
```

Preview request:

```txt
GET /internal/cms/facts?publicationState=preview&previewContentType=api::product-fact.product-fact&previewEntryId=prd_example_001
Accept: application/json
```

The endpoint behind `CMS_FACTS_API_URL` is expected to be the internal facts aggregator, not a raw Strapi collection API.

## Query Parameter Contract

| Parameter | Allowed values | Required | Default | Notes |
|---|---|---:|---|---|
| `publicationState` | `live`, `preview` | no | `live` | `live` includes published rows only; `preview` overlays draft rows for a verified preview request. |
| `localeSet` | `default`, `all` | no | `default` | Current adapter expects localized fact components with `en` and `zh`; this does not change output shape. |
| `previewContentType` | Strapi content type UID | only for draft overlay | none | Required when previewing one draft entry or draft lookup/asset relation. |
| `previewEntryId` | stable `factId`, certification `code`, or Strapi document id | only for draft overlay | none | Identifies the draft row to overlay into the complete graph. |

Preview rules:

- Preview is backend-only and must be called after the Next preview route verifies its secret.
- `publicationState=preview` does not introduce a new payload shape or wrapper.
- The aggregator overlays the requested draft entry onto a complete graph, then returns normal direct `CmsFactInput`.
- Preview routes, canonical paths, SEO, GEO, JSON-LD, and breadcrumbs are generated only after adapter validation.
- Lookup and asset previews resolve through related products or catalog surfaces; they do not create standalone domain records.

## Timeout Strategy

`CMS_FACTS_API_TIMEOUT_MS` remains the operator-configured timeout budget.

Implementation rules:

- Default timeout is `5000` ms.
- Invalid, empty, zero, or negative timeout values fall back to `5000` ms.
- Runtime fetch uses request cancellation through `AbortController` and maps aborts to `timeout` fallback metadata.
- Treat timeout like other fetch failures: do not throw raw upstream details into runtime consumers; select the next fallback source.
- Record only operational status metadata such as `fallbackReason`, not raw response bodies.

## Response Validation

The source helper must parse fetched JSON as `unknown`, reject wrappers/envelopes, then validate it as direct `CmsFactInput`:

```ts
const parsed = await response.json() as unknown
const cmsFacts = normalizeCmsFactInput(parsed)
buildDomainFromCmsFacts(cmsFacts)
```

Reject the response if any of these appear anywhere in the success payload:

- Raw Strapi `data` / `attributes` / `meta` envelopes.
- `{ cmsFacts }` wrapper objects.
- Strapi numeric `id`, `documentId`, `createdAt`, `updatedAt`, `publishedAt`, relation wrappers, or Upload provider internals.
- Generated fields such as `slug`, `slugPath`, `canonical`, `canonicalPath`, `breadcrumb`, `seo`, `localizedSeo`, `jsonld`, `jsonLd`, `jsonLD`, `geo`, `geoAi`, `localizedGeoAi`, `geoEntity`, `entity`, `identity`, `classification`, `categoryPath`, `depth`, or `children`.
- Partial domain records, product catalog indexes, UI view models, sitemap entries, or revalidation metadata.

If the response includes raw Strapi envelope fields, wrapper fields, or generated fields, treat it as an invalid CMS facts response and fall back.

## Fallback Rules

When `CMS_SOURCE_MODE=cms-facts-api`, the async source selection order is:

1. Try `cms-facts-api` only when all readiness checks pass:
   - `CMS_FACTS_API_URL` is configured.
   - `CMS_FACTS_API_ALLOW_FETCH` is enabled.
   - The direct response body validates as `CmsFactInput`.
2. If the API is not configured, disabled, times out, returns non-2xx, returns invalid JSON, returns a wrapper/envelope, or fails `normalizeCmsFactInput()`, try `env-facts-json`.
3. Use `env-facts-json` only when `CMS_FACTS_JSON` is present and valid.
4. If `CMS_FACTS_JSON` is absent or invalid, use `mock-domain`.
5. Expose only source status metadata; never expose the failed upstream body or raw facts.

`env-facts-json` and `mock-domain` must continue to pass through `buildDomainFromCmsFacts()` so the Domain contract remains unchanged.

## Live Runtime Gap

Current state:

- The async `cms-facts-api` fetch path exists in `lib/cms/source.ts`.
- `lib/cms/products.ts` still calls synchronous `readCmsProductSource()`.
- Live CMS runtime is therefore not wired until the product runtime chooses an async boundary.

Minimum code steps to activate live CMS runtime later:

1. Add an explicit async preload step that hydrates the process snapshot before synchronous getters are used, or migrate CMS product getters and callers to async functions.
2. Route live runtime through `readCmsProductSourceAsync()`.
3. Keep `CMS_FACTS_JSON` and `mock-domain` fallback behavior intact.
4. Keep `getCmsProductStatus()` status-only and free of raw facts.
5. Do not let UI code call Strapi or `/internal/cms/facts` directly.

Do not bolt a network request into the existing synchronous getter path.

## Acceptance Gate

Before marking live CMS runtime active, all of the following must be true:

- `CMS_SOURCE_MODE=cms-facts-api` with valid endpoint and fetch enabled can produce validated direct `CmsFactInput`.
- The same configuration falls back to valid `CMS_FACTS_JSON` when the endpoint fails.
- The same configuration falls back to `mock-domain` when both API and env JSON fail.
- `getCmsProductStatus()` reports source state and failure metadata only.
- No UI code calls Strapi or the internal CMS facts endpoint directly.
- No Domain contract types change.
- The validation stack passes:
  - `npm run validate:cms-facts`
  - `npm run typecheck`
