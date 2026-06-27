# Phase 3 Go/No-Go Review

Date: 2026-06-25
Role: Principal Architect thread
Scope: Real Strapi/PostgreSQL CMS integration readiness

## Decision

**Go for Phase 3 integration build. No-Go for production CMS traffic switch.**

The project is ready to continue real Strapi/PostgreSQL integration work behind the existing CMS source adapter and runtime facade. It is not yet ready to serve production public traffic directly from a live Strapi/PostgreSQL source because the `cms-facts-api` source path now exists in `lib/cms/source.ts`, but the public runtime facade still resolves through the synchronous `lib/cms/products.ts` snapshot and is not wired to live CMS facts.

This decision preserves Architecture Freeze v1. The next work may connect the backend-only CMS facts aggregator, but public pages, SEO, GEO, API routes, and UI components must continue to consume Domain-normalized records through the runtime facade.

## Satisfied Conditions

- Architecture Freeze v1 remains intact.
- `lib/domain` remains the single truth layer for Product, Category, SEO, GEO, Industry, Application, Inquiry, and system target contracts.
- `adapter/*` remains the derivation layer for CMS facts to `ProductRecord`, `CategoryTree`, SEO, JSON-LD, and GEO structures.
- `lib/runtime/domain-products.ts` remains the public runtime facade for product records, catalogs, category tree, list results, and source metadata.
- `lib/cms/products.ts` delegates source selection to `lib/cms/source.ts`, builds Domain records through the adapter, and still emits Domain-normalized records only.
- `lib/cms/source.ts` defines the long-term modes: `mock-domain`, `env-facts-json`, and `cms-facts-api`; it now includes the async `cms-facts-api` request, fetch, timeout, response-normalization, and fallback path.
- The public runtime product path remains synchronous today, so live `cms-facts-api` data is not yet active through `lib/runtime/domain-products.ts`.
- `CMS_FACTS_JSON` remains a deterministic replay path for real CMS export validation and rollback.
- `/api/revalidate/cms` exists as a signed, metadata-only CMS webhook route and rejects raw CMS payloads.
- `/api/preview/cms` exists as a secret-protected preview route that resolves generated Domain canonical paths from IDs.
- Public product feed and GEO endpoints remain Domain-normalized and do not read raw CMS payloads.
- `scripts/validate-boundaries.mjs` exists and enforces the no-CMS/no-adapter UI, SEO, and GEO import boundary.
- `.github/workflows/ci.yml` exists and runs release gates sequentially.
- `docs/cms-facts.example.json` exists as a fact-only example payload.
- `scripts/transform-cms-export.mjs` exists for Strapi-like export to `CmsFactInput` transformation and rejects derived fields.

## Blocking Items Before Production CMS Switch

These do not block continuing Phase 3 implementation, but they block switching public runtime traffic to live CMS data.

1. `cms-facts-api` source path exists, but it is not wired into the public runtime facade.
   - `lib/cms/source.ts` can build a backend facts request, fetch JSON with timeout handling, normalize the response as `CmsFactInput`, and fall back without exposing transport details.
   - `lib/cms/products.ts` still calls the synchronous source reader, so public runtime consumers do not yet activate live `cms-facts-api` facts.
   - Production switch requires an approved async preload or async runtime boundary behind `lib/cms/products.ts`, plus validation that `lib/runtime/domain-products.ts` still exposes only Domain-normalized records.

2. The real Strapi aggregator endpoint is not implemented.
   - Required endpoint shape: backend-only `GET /internal/cms/facts` or equivalent.
   - It must return exact `CmsFactInput`: `categoryFacts[]` and `productFacts[]` only.
   - It must not return Strapi envelopes, Upload internals, draft metadata, relation wrappers, generated slugs, SEO, JSON-LD, or GEO fields.

3. Live preview must be connected to draft facts.
   - Current preview resolves generated routes from the active runtime Domain source.
   - Live CMS preview requires draft facts to pass through the same adapter/domain path before resolving canonical URLs.

4. Live CMS webhook deployment is not configured.
   - `CMS_REVALIDATE_SECRET` must be configured outside public frontend env.
   - Strapi must send metadata-only signed webhook payloads.
   - Webhook payloads must not include raw facts.

5. Live CMS export dry-run must be completed.
   - A real export must pass `transform-cms-export`, `validate:cms-facts`, `validate:domain`, SEO/GEO validation in runtime mode, and build.
   - The current example fixture is useful, but it is not a substitute for a real Strapi export.

6. Last-known-good cache behavior is still an operational decision.
   - The current source layer can fall back to deterministic sources, but production policy for failed live CMS fetches should be documented and tested before cutover.

## Required Environment Variables

### CMS Source Selection

- `CMS_SOURCE_MODE`
  - Allowed values: `mock-domain`, `env-facts-json`, `cms-facts-api`.
  - Phase 3 integration target: `cms-facts-api`.
  - Rollback options: `env-facts-json`, then `mock-domain`.

- `CMS_FACTS_JSON`
  - Fact-only JSON payload for deterministic replay, CI validation, and rollback.
  - Must match `CmsFactInput` exactly.
  - Must not be exposed as `NEXT_PUBLIC_*`.

### CMS Facts API

- `CMS_FACTS_API_URL`
  - Backend-only URL for aggregated facts.
  - Must return `CmsFactInput` only.

- `CMS_FACTS_API_TIMEOUT_MS`
  - Positive integer timeout for backend facts fetch.
  - Current default in source config: `5000`.

- `CMS_FACTS_API_ALLOW_FETCH`
  - Explicit enable switch for facts API fetch behavior.
  - May be used only for isolated adapter/runtime integration validation until `lib/cms/products.ts` is deliberately wired to the async source path.
  - Must remain off for production public traffic until the real aggregator, runtime wiring, preview, revalidation, and rollback gates pass.

- `CMS_FACTS_API_PUBLICATION_STATE_PARAM`
  - Query parameter name for live/preview publication state.
  - Current default: `publicationState`.

- `CMS_FACTS_API_PREVIEW_ENTRY_ID_PARAM`
  - Query parameter name for preview entry ID.
  - Current default: `previewEntryId`.

- `CMS_FACTS_API_PREVIEW_CONTENT_TYPE_PARAM`
  - Query parameter name for preview content type.
  - Current default: `previewContentType`.

### CMS Revalidation

- `CMS_REVALIDATE_SECRET`
  - Secret used to verify `/api/revalidate/cms` HMAC signatures.
  - Must be server-only.

### CMS Preview

- `CMS_PREVIEW_SECRET`
  - Secret used by `/api/preview/cms`.
  - Must be server-only.

## Phase 3 Integration Order

1. Keep production source on `mock-domain` or `env-facts-json` while implementing live CMS pieces.
2. Implement Strapi/PostgreSQL facts-only content model from existing schema documentation.
3. Implement backend-only facts aggregator returning exact `CmsFactInput`.
4. Export real CMS facts and run local validation:
   - transform export to `CmsFactInput`
   - validate facts
   - validate domain
   - validate SEO/GEO in runtime mode
   - run production build
5. Keep `cms-facts-api` fetch implementation isolated inside `lib/cms/source.ts` and validate its fallback behavior.
6. Add the approved async preload or async runtime boundary inside `lib/cms/products.ts` without exposing raw facts.
7. Keep `lib/cms/products.ts` as the only bridge from CMS source to Domain records.
8. Verify `/api/cms/status` reports requested mode, active mode, fallback reason, and source metadata without raw facts.
9. Connect signed Strapi publish webhook to `/api/revalidate/cms` with metadata-only payloads.
10. Connect preview flow to adapter-normalized draft facts.
11. Run full release gates locally and in CI.
12. Switch staging to `CMS_SOURCE_MODE=cms-facts-api` with fetch enabled.
13. Observe staging, verify generated routes, sitemap, GEO feed, product detail pages, preview, and revalidation.
14. Only after staging gates pass, consider production CMS traffic switch.

## Rollback Strategy

### Immediate Runtime Rollback

1. Set `CMS_SOURCE_MODE=env-facts-json` with a known-good `CMS_FACTS_JSON` export.
2. Re-run validation gates against the known-good payload.
3. Rebuild/redeploy if needed.

### Safe Fallback

1. Set `CMS_SOURCE_MODE=mock-domain`.
2. Public runtime returns scaffold data while the CMS source is repaired.
3. `/api/cms/status` must report fallback metadata and reason.

### Content Rollback

1. Revert CMS content changes in Strapi.
2. Re-export facts.
3. Re-run transform and validation commands.
4. Re-trigger signed revalidation after adapter validation succeeds.

### Boundary Rules During Rollback

- Do not add direct Strapi fetches to public route handlers.
- Do not bypass adapter validation.
- Do not store or serve CMS-generated slugs, SEO, JSON-LD, or GEO.
- Do not modify UI components to match CMS transport shape.

## Final Go/No-Go Statement

Phase 3 implementation may continue now.

Production CMS traffic switch remains blocked until:

- The `cms-facts-api` source path is wired through `lib/cms/products.ts` by an approved async preload or async runtime boundary.
- A real Strapi facts aggregator returns valid `CmsFactInput`.
- Real CMS export dry-run passes validation.
- Preview and signed revalidation are validated against real CMS metadata.
- Full release gates pass in CI and locally.

This is a controlled Go, not a production cutover approval.
