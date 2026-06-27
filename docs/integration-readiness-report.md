# Integration Readiness Report

Date: 2026-06-24
Role: System integration thread
Scope: Public runtime APIs before real CMS connection

## Verdict

The public runtime API surface is stable enough for real CMS integration planning, with one important boundary condition: real CMS access must remain behind `lib/cms/*` and the domain runtime facade. Public API route handlers must continue returning Domain-normalized records, projections, or operational status only.

Current readiness: ready for CMS source-adapter implementation and DevOps planning; signed CMS webhook revalidation and signed CMS preview route discovery are implemented without raw CMS transport, but live Strapi operation still depends on source adapter wiring, draft preview source selection, and CMS-side secret deployment.

## Audit Scope

Reviewed files:

- `docs/runtime-api-contracts.md`
- `docs/architecture-next-phase-plan.md`
- `lib/runtime/domain-products.ts`
- `lib/api/contracts.ts`
- `app/api/cms/status/route.ts`
- `app/api/product-feed/route.ts`
- `app/api/geo/index/route.ts`
- `app/api/geo/products/route.ts`
- `app/api/geo/answers/route.ts`
- `app/api/revalidate/cms/route.ts`
- `app/api/preview/cms/route.ts`

Additional boundary checks:

- Searched `app/api`, `app/llms.txt`, `lib/api`, `lib/runtime`, `lib/cms`, and `lib/geo` for `fetch`, `strapi`, `CMS_FACTS_JSON`, `lib/cms`, and raw runtime access patterns.
- Confirmed `lib/geo/*` consumers use `lib/runtime/domain-products.ts` or Domain view models, not raw CMS payloads.
- Confirmed `app/api/*` route handlers return through `jsonContract` except `llms.txt`, which intentionally returns text.

## Stable API Contracts

| Endpoint | Status | Stable contract | Domain-normalized source |
| --- | --- | --- | --- |
| `GET /api/cms/status` | Stable for operational readiness | `api-contract-v1` envelope, `cms-status` data | `getCmsProductStatus()` exposes mode, counts, catalog version, locales, accepted input; no raw facts |
| `GET /api/product-feed` | Stable for current product count | `api-contract-v1` envelope, `geo-product-feed-v1` data | `buildGeoProductFeed(locale)` from runtime Domain product records |
| `GET /api/geo/index` | Stable | `api-contract-v1` envelope, `geo-index-v2` data | Domain products, runtime source metadata, industry/application entry view models |
| `GET /api/geo/products` | Stable for current scale | `api-contract-v1` envelope, `geo-products-v1` data | `getRuntimeDomainProductRecords()` plus `buildAiReadableIndustrialProduct` |
| `GET /api/geo/answers` | Stable | `api-contract-v1` envelope, `geo-answer-blocks-v2` data | Product GEO FAQ and application answer blocks from Domain projections |
| `GET /api/revalidate` | Stable as dry-run impact calculator | `api-contract-v1` envelope, `revalidation-impact-v1` data | Domain catalogs, product SEO paths, industry/application entry paths |
| `POST /api/revalidate` | Stable shape, remains internal/manual | `api-contract-v1` envelope with `revalidated: true` | Same Domain-derived affected paths as dry-run |
| `GET /api/revalidate/cms` | Stable contract discovery | `api-contract-v1` envelope, `cms-revalidation-webhook-v1` metadata | Signed CMS webhook contract only; no raw facts |
| `POST /api/revalidate/cms` | Stable metadata-only ingress | `api-contract-v1` envelope with `revalidated: true` | HMAC-verified webhook metadata mapped to Domain-derived revalidation impact |
| `GET /api/preview/cms` | Stable route-discovery ingress | `api-contract-v1` envelope, `cms-preview-v1` data | Signed preview secret plus Domain/runtime route resolution; no raw draft facts |
| `GET /api/inquiry` | Stable contract discovery | `api-contract-v1` envelope, `inquiry-api-v2` data | Domain inquiry contract and accepted source tracking |
| `POST /api/inquiry` | Stable local persistence entry | `api-contract-v1` envelope, Domain inquiry payload/submission result | Validated inquiry payload and server-only JSONL inbox/outbox placeholders |
| `GET /llms.txt` | Stable text source map | `text/plain` | Domain products, industry/application entry pages, GEO endpoint links |

## Boundary Findings

### Domain-normalized output

- `lib/runtime/domain-products.ts` is the product runtime facade. It returns `ProductRecord[]`, `CategoryTree`, `ProductCatalogIndex`, `ProductListResult`, and source metadata only.
- `lib/api/contracts.ts` wraps JSON outputs with `normalizedBy: 'adapter/domain'` and `boundary: 'api-route'`.
- Product feed and GEO endpoints derive from runtime Domain product records and Domain entry page view models.
- `llms.txt` is not JSON, but it still derives from the same Domain and GEO builders.
- The new CMS revalidation route accepts metadata only, verifies HMAC before processing, and reuses the existing Domain revalidation calculator.
- The CMS preview route verifies `CMS_PREVIEW_SECRET`, resolves generated canonical paths from Domain/runtime records, and returns route metadata only.

### Raw CMS / Strapi access risk

No public `app/api/*` route currently fetches Strapi or passes through raw CMS facts.

Observed exception:

- `app/api/cms/status/route.ts` imports `getCmsProductStatus()` from `lib/cms/products.ts` directly. This is acceptable as an operational status exception because it returns only normalized readiness metadata: mode, product count, source version, catalog version, locales, adapter name, and accepted input.

Risk guardrail:

- Do not expand `/api/cms/status` into a facts preview endpoint.
- Do not expose `CmsFactInput`, `ProductFact`, `CategoryFact`, raw Strapi relation payloads, publication state, upload metadata, or Strapi response envelopes from this route.
- Any future CMS diagnostics endpoint must be private/admin-authenticated and documented separately.

## Interfaces Required Before Real CMS

These interfaces are required before connecting live Strapi/PostgreSQL to public runtime traffic:

1. Internal CMS facts source adapter
   - Owner: CMS thread
   - Location: behind `lib/cms/products.ts` or a private helper imported only by it
   - Contract: fetch or receive a complete `CmsFactInput`
   - Must run `buildDomainFromCmsFacts(cmsFacts)` before exposing records to runtime consumers

2. Source mode and status expansion
   - Owner: System integration + CMS threads
   - Add a source mode such as `strapi-facts-api` or `cms-facts-api`
   - Keep `/api/cms/status` status-only; report adapter mode, product count, source version, validation state, and last successful sync time
   - Do not include raw facts or raw CMS errors containing payload fragments

3. Signed CMS publish webhook
   - Owner: DevOps + CMS threads
   - Implemented as `/api/revalidate/cms` for metadata-only publish/update/unpublish events
   - Secret provisioning and CMS publisher wiring still need to land in the CMS deployment work

4. Preview source selection
   - Owner: CMS + System integration threads
   - Route discovery is implemented as `/api/preview/cms`
   - Draft facts transport is still required for full live CMS preview
   - Must still pass draft facts through adapter validation and Domain normalization
   - Must not let pages or public APIs read Strapi draft APIs directly

5. Runtime error handling policy
   - Owner: DevOps + System integration threads
   - Define fallback behavior when CMS fetch fails or adapter validation rejects facts
   - Suggested policy: keep last known good Domain cache for public runtime, fail status route with operational details, and block publish webhook success until validation passes

6. Product-feed scale policy
   - Owner: SEO/GEO + DevOps threads
   - Required before 1000+ products
   - Decide whether `/api/product-feed` and `/api/geo/products` remain full-feed endpoints, add pagination/chunking, or split by locale/category
   - Preserve existing versions until downstream consumers migrate

## Revalidation Risks

| Risk | Severity | Current state | Required before live CMS |
| --- | --- | --- | --- |
| Unauthenticated publish calls | High | Signed `/api/revalidate/cms` is implemented; it still needs `CMS_REVALIDATE_SECRET` and CMS-side signing in deployment | Provision the secret, configure webhook signing, and keep the old generic revalidate path internal/manual |
| Over-broad `all` scope | Medium | Safe for small catalog; will revalidate many product, GEO, industry, and application paths | CMS webhook should prefer product/category scoped inputs |
| Preview/draft invalidation ambiguity | Medium | Signed `/api/preview/cms` route discovery is implemented; draft facts are not connected | Add preview-specific source mode and do not mix draft paths with public ISR without explicit policy |
| Entry page coupling | Low | Revalidation now includes industry/application hubs and detail paths from Domain view models | Keep industry/application path generation in Domain, not CMS |

## Preview Risks

| Risk | Severity | Required control |
| --- | --- | --- |
| Pages fetching draft Strapi payloads directly | High | Preview must call a server-only CMS facts source, then adapter, then Domain facade |
| CMS-authored slugs/SEO leaking into preview | High | Adapter validation must reject generated fields in draft facts too |
| Preview cache contaminating public cache | Medium | Separate preview source mode/cache key from public runtime source |
| Missing preview validation feedback | Medium | Surface adapter validation errors to CMS operators without exposing raw payloads publicly |

## Product-feed Risks

| Risk | Severity | Current state | Required control |
| --- | --- | --- | --- |
| Full feed size at 1000+ products | Medium | `/api/product-feed` and `/api/geo/products` emit all runtime products | Define size budget, compression/cache policy, and possible chunking before launch |
| Downstream data-version churn | Medium | Feed versions are documented but not schema-tested in CI | Add contract snapshots or schema validation for product feed, GEO index, GEO products, and GEO answers |
| Stale feed after CMS publish | Medium | ISR revalidation paths include feed/GEO endpoints | CMS webhook must call revalidation after adapter validation succeeds |
| Evidence URL quality | Low | Datasheet/evidence URLs are derived from Domain documents | CMS import must validate document hrefs and evidence refs before publish |

## Handoff Points

### CMS Thread

- Implement fact-only Strapi schema and internal facts aggregator.
- Provide `CmsFactInput` only: category facts and product facts.
- Keep generated fields out of CMS: slug, canonical path, breadcrumbs, SEO, JSON-LD, GEO, category depth, children.
- Add source metadata needed by `/api/cms/status`: source mode, version, last sync, validation result.
- Wire preview buttons to `/api/preview/cms` with `CMS_PREVIEW_SECRET`, `entryId`, `contentType`, and `locale`.

### SEO/GEO Thread

- Keep `lib/seo/*`, `lib/geo/*`, `/api/product-feed`, `/api/geo/index`, `/api/geo/products`, `/api/geo/answers`, and `/llms.txt` consuming Domain records/view models only.
- Add schema or snapshot validation for GEO/feed outputs when real CMS exports arrive.
- Define product-feed and GEO-products scale policy before 1000+ products.

### DevOps Thread

- Add signed CMS webhook secret and request verification for publish-triggered revalidation.
- Add CI gates for `validate:cms-facts`, `validate:domain`, `validate:seo`, `validate:geo`, `typecheck`, `lint`, and `build`.
- Add observability for CMS fetch failures, adapter validation failures, last good Domain cache, and revalidation impact size.
- Provision `CMS_REVALIDATE_SECRET` and configure CMS publish/update/unpublish webhook signing for `/api/revalidate/cms`.
- Provision `CMS_PREVIEW_SECRET` and keep it server-only for `/api/preview/cms`.
- Define deployment environment variables for CMS source mode without exposing CMS credentials to frontend code.

### System Integration Thread

- Preserve `api-contract-v1` envelope stability.
- Keep `lib/runtime/domain-products.ts` as the public product runtime facade.
- Review any new `app/api/*` route for raw CMS passthrough before merge.
- Maintain `docs/runtime-api-contracts.md` and this readiness report as public contract references.

## Go / No-Go Checklist For Real CMS Connection

Before routing production runtime traffic to real CMS facts, all items must be true:

- `lib/cms/products.ts` or its private source helper converts live CMS facts into Domain records through adapter validation.
- No public route returns raw CMS facts, Strapi envelopes, draft state, upload metadata, or relation payloads.
- `/api/cms/status` reports source health without raw payload leakage.
- `POST /api/revalidate/cms` is protected by a signed CMS webhook/auth layer and the secret is deployed.
- `/api/preview/cms` is protected by `CMS_PREVIEW_SECRET`; full draft preview uses adapter-normalized Domain records and isolated cache/source selection.
- Product feed and GEO-products scale behavior is defined for 1000+ products.
- CI runs the required validation gates against real or exported CMS facts.

## Current Recommendation

Proceed with CMS source-adapter work behind `lib/cms/products.ts`. Do not change UI, public API envelope shape, or SEO/GEO consumers. Treat live CMS launch as blocked until CMS source adapter, draft preview source selection, and feed scale controls are completed.
