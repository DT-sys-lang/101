# Staging Live CMS Go/No-Go

Date: 2026-06-25
Role: Principal Architect thread
Scope: Architecture Freeze v1 final review before staging live CMS traffic test

## Decision

**Go for staging live CMS traffic test.**

This decision follows the latest DevOps readiness conclusion in `docs/staging-live-cms-readiness-report.md`: **Go for staging live CMS traffic test**.

This is **not** production CMS traffic cutover approval. Production live CMS cutover remains a separate later Go/No-Go decision after staging evidence is collected.

## What Changed Since The Previous No-Go

The previous architecture Go/No-Go was blocked only because `docs/frontend-live-cms-boundary-report.md` was missing.

That blocker is now resolved:

- `docs/frontend-live-cms-boundary-report.md` exists.
- It states that frontend live CMS boundary readiness passes.
- It confirms visible UI routes and components consume Domain view models, Domain projections, or approved Domain-normalized runtime facade outputs only.
- It confirms UI does not import `lib/cms`, adapter modules, CMS fact types, raw facts, Strapi types, `CMS_FACTS_JSON`, or public CMS/Strapi environment variables.
- `docs/staging-live-cms-readiness-report.md` has been updated by DevOps to Go for staging live CMS traffic test.

The old No-Go condition is no longer active.

## Reviewed Inputs

- `docs/staging-live-cms-readiness-report.md`
- `docs/frontend-live-cms-boundary-report.md`
- `docs/architecture-gap-report.md`
- `docs/domain-runtime-facade-plan.md`
- `docs/cms-runtime-wiring-decision.md`
- `docs/live-cms-runtime-integration-report.md`
- `docs/real-cms-export-dry-run-report.md`
- `docs/seo-geo-live-cms-regression-report.md`
- Current boundary implementation in `lib/cms/source.ts`, `lib/cms/products.ts`, and `lib/runtime/domain-products.ts`

## Precondition Report Check

| Required report | Status | Decision impact |
| --- | --- | --- |
| `docs/staging-live-cms-readiness-report.md` | Found | DevOps readiness now gives Go for staging live CMS traffic test. |
| `docs/frontend-live-cms-boundary-report.md` | Found | Resolves the previous frontend live-CMS boundary blocker. |
| `docs/live-cms-runtime-integration-report.md` | Found | Runtime source path and async preload boundary evidence exists. |
| `docs/real-cms-export-dry-run-report.md` | Found | Real CMS export dry-run evidence exists. |
| `docs/seo-geo-live-cms-regression-report.md` | Found | SEO/GEO real-facts regression evidence exists. |

## Architecture Freeze v1 Review

### CMS Stores Facts Only

Status: Pass.

- CMS ingress remains facts-only through exact `CmsFactInput` shapes.
- The backend-only facts endpoint is required to return direct `categoryFacts[]` and `productFacts[]`, not Strapi envelopes or collection wrappers.
- `lib/cms/source.ts` rejects wrapper fields such as `cmsFacts`, `data`, `attributes`, and `meta` before normalization.
- `lib/cms/source.ts` also rejects generated or raw transport fields such as numeric Strapi IDs, `documentId`, timestamps, `slug`, `canonicalPath`, `seo`, `geoAi`, `identity`, `classification`, `categoryPath`, `depth`, and `children`.
- `docs/real-cms-export-dry-run-report.md` confirms the dry-run facts payload contained no generated SEO/GEO/canonical/breadcrumb/category-tree fields.

### Adapter Generates Domain / SEO / GEO

Status: Pass.

- `lib/cms/products.ts` calls `buildDomainFromCmsFacts(source.cmsFacts)` before records enter the runtime snapshot.
- Adapter output remains Domain-normalized `ProductRecord[]` and `CategoryTree`.
- SEO and GEO reports confirm sitemap, canonical, hreflang, JSON-LD, FAQPage, GEO feed, GEO index, GEO products, GEO answers, and `llms.txt` remain generated from Domain-normalized records and Domain projections.
- CMS-authored generated SEO/GEO artifacts are not accepted as source-of-truth payload.

### Domain Remains Source Of Truth

Status: Pass.

- `lib/domain` remains the contract layer for product, category, SEO, GEO, inquiry, industry, application, entry-page, and UI projection semantics.
- CMS facts are normalized through the adapter into Domain records before public runtime consumers see data.
- The real CMS dry-run validates the pipeline from Strapi-shaped export to `CmsFactInput` to Domain to SEO/GEO without mutating mock data.
- No reviewed evidence changes Domain ownership or introduces a competing CMS-authored product model.

### Runtime Facade Remains Public Product Data Boundary

Status: Pass.

- `lib/runtime/domain-products.ts` remains the public product runtime facade.
- Its public outputs remain Domain-normalized product records, category tree, catalog/list projections, homepage product lists, and safe source metadata.
- `lib/cms/products.ts` remains an internal bridge behind the facade and exposes raw facts to no public runtime consumer.
- The approved async preload boundary stays inside `lib/cms/products.ts`; public runtime consumers remain synchronous and Domain-normalized.
- `/api/cms/status` remains the documented metadata-only operational exception.

### UI / SEO / GEO Do Not Directly Read CMS

Status: Pass.

- `docs/frontend-live-cms-boundary-report.md` confirms visible UI routes and components do not read CMS, Strapi, adapter modules, raw facts, CMS fact types, `CMS_FACTS_JSON`, or public CMS/Strapi environment variables.
- `docs/seo-geo-live-cms-regression-report.md` confirms SEO/GEO route handlers and builders use Domain records, Domain projections, or the runtime facade rather than raw CMS data.
- `npm run validate:boundaries` passed with 61 files checked and 0 violations.
- A targeted scan found no forbidden CMS/adapter/raw fact/Strapi/public env references in `app/[locale]` or `components`.
- The only reviewed CMS import in public route space remains `app/api/cms/status/route.ts`, which calls status/preload helpers for operational metadata only.
- `lib/api/cms-webhook.ts` contains raw fact field names only as forbidden webhook payload keys, not as raw CMS consumption.

## Required Staging Server-Only Environment

Staging live CMS traffic testing may proceed only with CMS source configuration injected as server-only environment variables:

```txt
CMS_SOURCE_MODE=cms-facts-api
CMS_FACTS_API_URL=<backend-only /internal/cms/facts>
CMS_FACTS_API_ALLOW_FETCH=true
CMS_FACTS_API_TOKEN=<server-only token, if required>
```

Additional constraints:

- `CMS_FACTS_API_URL` must point to the backend-only facts aggregator, not raw Strapi collection endpoints.
- No `NEXT_PUBLIC_*CMS`, `NEXT_PUBLIC_*STRAPI`, `NEXT_PUBLIC_*FACTS`, or public token variables may be introduced for this test.
- `CMS_FACTS_API_ALLOW_FETCH=true` is approved for staging validation only.
- The optional token must remain server-only and must be sent only by the CMS source layer.
- `/api/cms/status` must be checked before user-facing staging traffic is exercised.
- The expected active source during the test is `cms-facts-api` when the endpoint returns valid direct `CmsFactInput`.
- Any fallback to `env-facts-json` or `mock-domain` must be treated as staging test evidence to investigate, not as proof that live CMS traffic is active.

## Scope Limits

This decision does not authorize:

- Production CMS traffic cutover.
- UI or page changes.
- Strapi implementation work.
- Architecture Freeze v1 changes.
- Raw Strapi exposure to UI, SEO, GEO, or public API consumers.
- CMS-authored SEO/GEO/canonical/breadcrumb/domain fields as source-of-truth data.

## Verification Commands

Commands required by this review were run in sequence:

| Command | Result | Evidence |
| --- | --- | --- |
| `npm run validate:boundaries` | Pass | 61 files checked, 0 violations. |
| `npm run typecheck` | Pass | `tsc --noEmit` completed with exit 0. |
| `npm run build` | Pass | Next.js 16.2.9 production build completed; 81 static pages generated. |

## Risk Assessment

### Blocking Risks For Staging

None currently identified for the staging live CMS traffic test gate.

### Remaining Production Risks

- Staging must still prove real endpoint reachability with server-only environment injection.
- Staging must confirm `/api/cms/status` reports `requestedMode: cms-facts-api`, fetch enabled metadata, and `activeMode: cms-facts-api` when valid facts are returned.
- Real-facts SEO/GEO spot checks must pass with the staging live source active.
- Production rollback, publish webhook behavior, preview behavior, and live source observability remain production cutover concerns.

## Final Statement

Architecture Freeze v1 still holds:

- CMS stores facts only.
- Adapter generates Domain / SEO / GEO.
- Domain remains the source of truth.
- Runtime facade remains the public product boundary.
- UI / SEO / GEO do not directly read CMS.

Final decision: **Go for staging live CMS traffic test**.

This decision is staging-only and is **not production CMS cutover approval**.
