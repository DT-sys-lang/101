# Live CMS Runtime Integration Report

Date: 2026-06-25
Role: System integration thread
Scope: Next.js runtime source wiring for backend-only CMS facts

## Verdict

The Next.js runtime source path is ready for `CMS_SOURCE_MODE=cms-facts-api` and remains inside the approved CMS boundary.

The live facts ingress path is:

```txt
backend-only /internal/cms/facts
  -> lib/cms/source.ts readCmsProductSourceAsync()
  -> direct CmsFactInput validation
  -> lib/cms/products.ts async preload / snapshot hydration
  -> buildDomainFromCmsFacts(cmsFacts)
  -> Domain-normalized ProductRecord[] + CategoryTree
  -> lib/runtime/domain-products.ts public sync facade
```

No page UI, SEO/GEO route shape, public runtime facade shape, or Architecture Freeze v1 contract was changed for this integration report.

Current local process note: this shell does not have `CMS_SOURCE_MODE`, `CMS_FACTS_API_URL`, or `CMS_FACTS_API_ALLOW_FETCH` injected, so local validation commands continue to exercise the fixture/mock fallback paths. The code path for the live backend-only facts endpoint is present and metadata-gated, but this report is not a production CMS traffic cutover approval.

## Preconditions Checked

- `docs/strapi-backend-integration-report.md` exists.
- The backend report states that `GET /internal/cms/facts` returns direct `CmsFactInput` with exactly `categoryFacts[]` and `productFacts[]`.
- The backend report states that Strapi raw envelopes, relation wrappers, upload internals, generated SEO/GEO/canonical fields, and raw transport fields are rejected or stripped before response.
- The backend report states that `lib/cms/source.ts` sends optional `CMS_FACTS_API_TOKEN` as server-only bearer auth and rejects nested raw Strapi/envelope fields before `normalizeCmsFactInput()`.

## Source Configuration Path

`CMS_SOURCE_MODE=cms-facts-api` is the intended operator switch for the live backend-only facts endpoint.

Required server-only environment:

| Variable | Required for live path | Runtime role |
| --- | --- | --- |
| `CMS_SOURCE_MODE=cms-facts-api` | Yes | Selects the async facts API source path. |
| `CMS_FACTS_API_URL` | Yes | Must point to the backend-only facts aggregator, normally `{STRAPI_ORIGIN}/internal/cms/facts`. |
| `CMS_FACTS_API_ALLOW_FETCH=true` | Yes | Explicitly enables network fetch from the CMS facts API. |
| `CMS_FACTS_API_TOKEN` | Required when backend policy is enabled | Sent only from `lib/cms/source.ts` as `Authorization: Bearer <token>`. |
| `CMS_FACTS_API_TIMEOUT_MS` | Optional | Defaults to `5000` ms when absent or invalid. |
| `CMS_FACTS_API_PUBLICATION_STATE_PARAM` | Optional | Defaults to `publicationState`. |
| `CMS_FACTS_API_PREVIEW_ENTRY_ID_PARAM` | Optional | Defaults to `previewEntryId`. |
| `CMS_FACTS_API_PREVIEW_CONTENT_TYPE_PARAM` | Optional | Defaults to `previewContentType`. |

The backend Strapi bundle sets REST prefix `/internal/cms` and route path `/facts`, so `CMS_FACTS_API_URL` must target the aggregator URL, not a raw Strapi collection endpoint.

## Runtime Boundary Confirmation

### `lib/cms/source.ts`

Stable integration points:

- Reads `CMS_SOURCE_MODE`, `CMS_FACTS_API_URL`, `CMS_FACTS_API_ALLOW_FETCH`, timeout, query parameter names, and optional `CMS_FACTS_API_TOKEN`.
- Builds a backend-only GET request with `publicationState=live` by default.
- Sends `Accept: application/json` and optional bearer auth.
- Parses response as `unknown`.
- Rejects wrapper/envelope fields such as `cmsFacts`, `data`, `attributes`, and `meta`.
- Recursively rejects raw Strapi/generated fields including numeric `id`, `documentId`, timestamps, `slug`, `canonicalPath`, `seo`, `geoAi`, `identity`, `classification`, `categoryPath`, `depth`, and `children`.
- Runs `normalizeCmsFactInput(raw)` before returning a source result.
- Falls back to `CMS_FACTS_JSON` and then `mock-domain` when the API is not configured, disabled, times out, returns HTTP errors, invalid JSON, invalid response shape, or invalid facts.

### `lib/cms/products.ts`

Stable integration points:

- `preloadCmsProductSnapshotAsync()` is the approved async preload boundary.
- The live async path enters only through `readCmsProductSourceAsync()`.
- Snapshot hydration calls `buildDomainFromCmsFacts(source.cmsFacts)` before records are cached.
- The cache stores only `ProductRecord[]`, `CategoryTree`, source mode/version, and source metadata.
- Catalog caches are built from Domain-normalized records and are cleared whenever the snapshot is replaced.
- Raw `CmsFactInput` and raw transport bodies are not exported.

### `lib/runtime/domain-products.ts`

Stable public contract:

- `getRuntimeDomainProductRecords()` remains synchronous.
- `getRuntimeDomainCategoryTree()` remains synchronous.
- `getRuntimeDomainProductCatalog(locale)` remains synchronous.
- `listRuntimeDomainProducts(locale, query)` remains synchronous.
- `listRuntimeDomainHomepageProducts(locale)` remains synchronous.
- Source metadata remains limited to `sourceKind`, `upstreamMode`, `sourceVersion`, and `productCount`.

Downstream UI, SEO, GEO, and public routes do not receive CMS facts, Strapi payloads, or fetch details.

## Public Runtime Route Checks

### `/api/cms/status`

Status route behavior:

- Awaits `preloadCmsProductSnapshotAsync()` before reading status metadata.
- Returns `jsonContract('cms-status', getCmsProductStatus())`.
- Exposes source mode, requested/active mode, product count, source version, catalog version, accepted env names, and safe source metadata.
- Does not expose raw facts, raw response bodies, Strapi IDs, relation wrappers, auth tokens, or CMS transport errors.

### `/api/revalidate/cms`

Signed revalidation route behavior remains stable:

- Requires HMAC headers.
- Accepts CMS publish/update/unpublish metadata only.
- Rejects raw payload fields such as `data`, `attributes`, `entry`, `entries`, `fact`, `facts`, `productFact`, `productFacts`, `categoryFact`, `categoryFacts`, `products`, `categoryTree`, `cmsFacts`, and `raw`.
- Calls `calculateRevalidationImpact()` after metadata verification.
- Does not fetch CMS facts or expose raw CMS payloads.

### `/api/preview/cms`

Preview route behavior remains stable:

- Verifies `CMS_PREVIEW_SECRET` before parsing preview target fields.
- Accepts Domain-normalized `entryId` prefixes only: `prd_`, `cat_`, `ind_`, `app_`.
- Resolves preview output through Domain/runtime records and generated canonical path helpers.
- Returns `cms-preview-v1` route metadata: `canonicalPath` and localized `redirectTo`.
- Does not call Strapi, does not fetch raw draft facts, and does not expose raw facts.

## Fallback Behavior

When `CMS_SOURCE_MODE=cms-facts-api` is requested:

1. If `CMS_FACTS_API_URL` is missing, metadata reports `fallbackReason: not-configured` and runtime falls back.
2. If `CMS_FACTS_API_ALLOW_FETCH` is not true, metadata reports `fallbackReason: fetch-disabled` and runtime falls back.
3. If the backend endpoint times out, errors, returns non-2xx, returns invalid JSON, returns raw wrappers, or fails `CmsFactInput` normalization, metadata reports the mapped fallback reason.
4. Valid `CMS_FACTS_JSON` becomes the first fallback source.
5. If env JSON is absent or invalid, `mock-domain` remains the final safe fallback.

Every selected fallback still enters `buildDomainFromCmsFacts(cmsFacts)` before public runtime consumers see product data.

## Current Local Environment

Observed in this shell:

- `CMS_SOURCE_MODE`: not set.
- `CMS_FACTS_API_URL`: not set.
- `CMS_FACTS_API_ALLOW_FETCH`: not set.
- `CMS_FACTS_API_TIMEOUT_MS`: not set.

Result:

- Local validation uses existing fixture/mock paths.
- Live endpoint fetch was not executed from this shell because the live endpoint env is not configured here.
- Staging or production must inject the server-only env set before claiming real CMS traffic is active.

## Go / No-Go Status

Go for controlled runtime integration code path:

- The backend-only facts aggregator contract exists.
- The Next.js source layer supports `cms-facts-api` with server-only URL/token/timeout config.
- Async snapshot hydration is behind `lib/cms/products.ts`.
- The public runtime facade remains stable and Domain-normalized.
- Public status, revalidation, and preview routes do not expose raw CMS payloads.

No-Go for production traffic switch from this local run alone:

- This shell did not have a real `CMS_FACTS_API_URL` configured.
- A live endpoint fetch was not performed locally.
- Staging still needs server env injection, live endpoint reachability, signed webhook validation, preview draft facts validation, and release gates with the real facts source.

## Required Staging Smoke Test

Run with server-only env injected:

```txt
CMS_SOURCE_MODE=cms-facts-api
CMS_FACTS_API_URL=https://<backend-host>/internal/cms/facts
CMS_FACTS_API_ALLOW_FETCH=true
CMS_FACTS_API_TOKEN=<server-only-token>
```

Then verify:

1. `GET /api/cms/status` reports `requestedMode: cms-facts-api`.
2. `source.sourceMetadata.factsApiConfigured` is `true`.
3. `source.sourceMetadata.factsApiFetchEnabled` is `true`.
4. `source.sourceMetadata.factsApiAuthConfigured` is `true` when backend token policy is enabled.
5. `data.activeMode` becomes `cms-facts-api` when the endpoint returns valid direct `CmsFactInput`.
6. No raw facts or Strapi envelopes appear in the response.
7. Product pages, sitemap, product feed, GEO index/products/answers, signed revalidation, and preview route continue using Domain-generated output shapes.

## Validation Results

Commands run in this workspace:

| Command | Result | Notes |
| --- | --- | --- |
| `npm run validate:boundaries` | Pass | 61 files checked, 0 violations. |
| `npm run validate:cms-facts` | Pass | Scale fixture: 300 product facts, 300 generated SEO/GEO records. |
| `npm run validate:domain` | Pass | Mock-domain: 20 product records, `category-tree-v1`. |
| `npm run typecheck` | Pass | `tsc --noEmit` completed with exit 0. |
| `npm run build` | Pass | Next.js 16.2.9 production build completed; 81 static pages generated. |

## Final Statement

The live CMS runtime integration code path is connected at the allowed boundary and remains Domain-first. The next required action is a staging smoke test with real `CMS_FACTS_API_URL`, `CMS_FACTS_API_ALLOW_FETCH=true`, and `CMS_FACTS_API_TOKEN` injected server-side.
