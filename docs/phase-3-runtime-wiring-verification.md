# Phase 3 Runtime Wiring Verification

Date: 2026-06-25
Owner: Thread 5 - QA / Scale / DevOps

## Verdict

Runtime wiring verification passed for the current Phase 3 integration build.

The project is allowed to enter the real Strapi/PostgreSQL backend integration phase, with the constraint that the backend must emit facts-only `CmsFactInput` through the existing CMS source boundary. This is not approval for production CMS traffic cutover.

Production cutover remains blocked until a real Strapi/PostgreSQL export or backend facts endpoint passes the same gates through `CMS_FACTS_JSON`, `--file`, or the backend-only `cms-facts-api` path in staging.

## Inputs Reviewed

- `docs/phase-3-release-gate-report.md`
- `docs/cms-source-fallback-dry-run-report.md`
- `docs/cms-runtime-wiring-decision.md`
- `lib/cms/source.ts`
- `lib/cms/products.ts`
- `lib/runtime/domain-products.ts`

## Runtime Wiring Boundary

Passed checks:

- `lib/cms/source.ts` owns source selection, `CMS_SOURCE_MODE`, `CMS_FACTS_JSON`, `CMS_FACTS_API_*`, fetch, timeout, fallback metadata, and direct response normalization.
- `lib/cms/source.ts` rejects wrapped responses and Strapi-style envelopes such as `cmsFacts`, `data`, `attributes`, or `meta` before normalization.
- `lib/cms/products.ts` contains the approved private async preload boundary through `preloadCmsProductSnapshotAsync()` and `hydrateCmsProductSnapshotAsync()`.
- `lib/cms/products.ts` converts every selected source through `buildDomainFromCmsFacts(source.cmsFacts)` before caching records and category tree.
- `lib/cms/products.ts` exposes only Domain-normalized records, category tree, catalog indexes, list results, source version, and operational status metadata.
- `lib/runtime/domain-products.ts` remains the synchronous public runtime facade consumed by SEO/GEO/API/UI-facing code.
- `app/api/cms/status/route.ts` is the only detected public route importing `lib/cms/products.ts`; it calls preload and returns `getCmsProductStatus()` as a metadata-only operational exception.

## Architecture Freeze v1 Confirmation

Architecture Freeze v1 still holds after runtime wiring:

- `lib/domain` remains the truth layer.
- `adapter/*` remains the derivation layer from facts to Domain records, SEO fields, JSON-LD, and GEO structures.
- Raw CMS payloads and Strapi transport objects remain below `lib/cms/*`.
- SEO and GEO continue deriving outputs from Domain-normalized data and runtime facade functions.
- UI-facing layers do not import `lib/cms`, `adapter`, raw facts, Strapi, or `CMS_FACTS_JSON`.
- Public API routes do not return raw CMS facts; the CMS status route returns operational metadata only.

## Public Boundary Scan

Manual scan targets:

- `components/**`
- `app/[locale]/**`
- `lib/seo/**`
- `lib/geo/**`
- `app/api/**`
- `lib/api/**`

Findings:

- No direct adapter imports found in public/UI/SEO/GEO/API-facing layers.
- No Strapi references found in public/UI/SEO/GEO/API-facing layers.
- No `process.env.CMS_FACTS_JSON` or public `NEXT_PUBLIC_*CMS/STRAPI/WEBHOOK/FACTS*` access found in public/UI/SEO/GEO/API-facing layers.
- One allowed `lib/cms/products` import exists in `app/api/cms/status/route.ts`, matching the metadata-only exception in the wiring decision.

## CMS Source Fallback Dry Run

The existing dry-run report confirms:

- Valid `CMS_FACTS_JSON` replay hydrates Domain records.
- `cms-facts-api` falls back to valid `CMS_FACTS_JSON` when fetch is disabled.
- Missing `CMS_FACTS_JSON` falls back to `mock-domain`.
- Invalid `CMS_FACTS_JSON` falls back to `mock-domain` without hydrating unsafe raw facts.
- No real Strapi endpoint was called in dry-run, so real backend integration still requires a fresh facts-only export/API validation pass.

## Release Gate Results

| Gate | Command | Result | Evidence | Failure owner if regressed |
| --- | --- | --- | --- | --- |
| Lint | `npm run lint` | Pass | exit 0, `{ "ok": true }` | Thread 5 QA / Scale / DevOps |
| Typecheck | `npm run typecheck` | Pass | exit 0, `tsc --noEmit` completed | Thread 5 triage, then failing module owner |
| Boundaries | `npm run validate:boundaries` | Pass | exit 0, 61 files checked, 0 violations | Architecture, SEO/GEO, or UI owner by violating layer |
| CMS facts | `npm run validate:cms-facts` | Pass | exit 0, 300 generated product facts, 300 generated SEO/GEO records | Data Pipeline / Strapi-PostgreSQL for facts or aggregator; Architecture for adapter/domain |
| Domain | `npm run validate:domain` | Pass | exit 0, 20 mock-domain product records, `category-tree-v1` | Architecture / Domain / Adapter |
| SEO | `npm run validate:seo` | Pass | exit 0, sitemap 630/630, hreflang and JSON-LD contract checked | SEO/GEO Runtime |
| GEO | `npm run validate:geo` | Pass | exit 0, 300 products, 1206 expected answers per locale | SEO/GEO Runtime |
| Scale 300 | `npm run validate:scale-300` | Pass | exit 0, sitemap 630, GEO answer blocks 1206, catalog build 31 ms under 2000 ms | Thread 5 scale triage, then failing surface owner |
| Scale 1000 | `npm run validate:scale-1000` | Pass | exit 0, sitemap 2030, GEO answer blocks 4006, catalog build 131 ms under 5000 ms | Thread 5 scale triage, then failing surface owner |
| Build | `npm run build` | Pass | exit 0, Next.js 16.2.9 build completed, 81 static pages generated | Thread 5 build pipeline triage, then owning route/module |

## Failed Items

No release gate failed in this run.

No failed item needs reassignment to:

- Architecture / Domain / Adapter.
- Data Pipeline / Strapi-PostgreSQL.
- SEO/GEO Runtime.
- UI.
- Thread 5 QA / Scale / DevOps.

## Non-Blocking Observations

- Validators using `node --loader ./scripts/ts-import-loader.mjs` still emit Node experimental-loader warnings. These warnings did not affect exit codes.
- This run used generated validation fixtures for scale/SEO/GEO/CMS-facts gates, not a real Strapi export.
- Real backend integration must provide a direct facts-only payload and re-run targeted validation with `CMS_FACTS_JSON` or `--file` before enabling live fetch in staging.

## Backend Integration Entry Conditions

The next Strapi/PostgreSQL backend integration phase may start if it follows these constraints:

- Strapi/PostgreSQL remains a facts source, not a second Domain model.
- The aggregator returns direct `CmsFactInput` with `categoryFacts[]` and `productFacts[]` only.
- The aggregator must not return Strapi envelopes, relation wrappers, draft metadata, upload internals, generated slugs, breadcrumbs, canonical paths, SEO, JSON-LD, or GEO fields.
- Live fetch stays behind `lib/cms/source.ts` and private preload/snapshot hydration in `lib/cms/products.ts`.
- Public consumers continue using `lib/runtime/domain-products.ts`, SEO/GEO builders, or domain projections only.
- Backend secrets and source variables remain server-only and must not enter frontend build env.
- Full release gates must run again after backend integration.
- Real export/API validation must pass before staging cutover, and production CMS traffic cutover remains a separate No-Go/Go decision.

## Final Decision

Allowed to enter real Strapi/PostgreSQL backend integration: yes.

Allowed to switch production public traffic to live CMS: no.

The next phase is backend integration behind the existing facts-only CMS source boundary, followed by real-export/API validation and another full Thread 5 release gate run.
