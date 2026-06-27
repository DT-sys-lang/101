# Staging Live CMS Readiness Report

Date: 2026-06-25
Owner: Thread 5 - QA / Scale / DevOps

## Final Go/No-Go Conclusion

Go for staging live CMS traffic test

All required precondition reports now exist, the public/UI/SEO/GEO/API boundary scan is clean, and the full release gate sequence passed in order.

This is approval for a staging live CMS traffic test only. It is not a production CMS traffic cutover approval.

## Required Precondition Reports

| Required report | Status | Owner / evidence |
| --- | --- | --- |
| `docs/strapi-backend-integration-report.md` | Found | Thread 2 / Strapi-PostgreSQL facts-only backend evidence |
| `docs/live-cms-runtime-integration-report.md` | Found | Runtime source path and async preload boundary evidence |
| `docs/real-cms-export-dry-run-report.md` | Found | Real CMS facts dry-run evidence |
| `docs/first-real-product-import-governance.md` | Found | Real product import governance and mock-isolation rules |
| `docs/seo-geo-live-cms-regression-report.md` | Found | SEO/GEO real-facts regression evidence |
| `docs/frontend-live-cms-boundary-report.md` | Found | Frontend/UI live CMS boundary evidence |
| `docs/staging-live-cms-go-no-go.md` | Found | Previous No-Go documented missing frontend report as the only blocker |

## Prior No-Go Resolution

Previous blocker:

- `docs/frontend-live-cms-boundary-report.md` was missing.

Current status:

- `docs/frontend-live-cms-boundary-report.md` now exists and states: frontend live CMS boundary readiness passes.
- It confirms visible UI routes and components consume Domain view models, Domain projections, or approved Domain-normalized runtime facade outputs only.
- It confirms no UI imports of `lib/cms`, adapter modules, CMS fact types, raw facts, Strapi types, `CMS_FACTS_JSON`, or public CMS/Strapi environment variables.

Result: previous release governance blocker is resolved.

## Release Gate Results

| Gate | Command | Result | Evidence | Failure owner if regressed |
| --- | --- | --- | --- | --- |
| Lint | `npm run lint` | Pass | exit 0, `{ "ok": true }` | Thread 5 QA / Scale / DevOps |
| Typecheck | `npm run typecheck` | Pass | exit 0, `tsc --noEmit` completed | Thread 5 triage, then failing module owner |
| Boundaries | `npm run validate:boundaries` | Pass | exit 0, 61 files checked, 0 violations | Architecture / SEO-GEO / UI by violating layer |
| CMS facts | `npm run validate:cms-facts` | Pass | exit 0, 300 generated product facts, 300 generated SEO/GEO records | Data Pipeline / Strapi-PostgreSQL; Architecture if adapter/domain |
| Domain | `npm run validate:domain` | Pass | exit 0, `source: mock-domain`, 20 product records | Architecture / Domain / Adapter |
| SEO | `npm run validate:seo` | Pass | exit 0, sitemap 630/630, hreflang and JSON-LD checked | SEO/GEO Runtime |
| GEO | `npm run validate:geo` | Pass | exit 0, 300 products, 1206 expected answers per locale | SEO/GEO Runtime |
| Scale 300 | `npm run validate:scale-300` | Pass | exit 0, sitemap 630, GEO answer blocks 1206, catalog build 41 ms under 2000 ms | Thread 5 scale triage, then failing surface owner |
| Scale 1000 | `npm run validate:scale-1000` | Pass | exit 0, sitemap 2030, GEO answer blocks 4006, catalog build 140 ms under 5000 ms | Thread 5 scale triage, then failing surface owner |
| Build | `npm run build` | Pass | exit 0, Next.js 16.2.9 build completed, 81 static pages generated | Thread 5 build pipeline triage, then owning route/module |

## Architecture Freeze v1 Verification

Status: Pass.

Evidence:

- `lib/domain` remains the truth layer for product, category, SEO, GEO, inquiry, and entry-page contracts.
- `adapter/*` remains the only derivation layer from CMS facts to Domain records, SEO fields, JSON-LD, and GEO structures.
- `lib/cms/source.ts` owns source selection, `CMS_SOURCE_MODE`, `CMS_FACTS_JSON`, `CMS_FACTS_API_*`, backend-only API fetch, fallback metadata, and response normalization.
- `lib/cms/source.ts` rejects Strapi-style wrappers and forbidden raw/generated fields before `normalizeCmsFactInput()`.
- `lib/cms/products.ts` remains the CMS bridge and hydrates snapshots through `buildDomainFromCmsFacts(source.cmsFacts)`.
- `lib/runtime/domain-products.ts` remains the public Domain-normalized runtime facade.
- `lib/seo`, `lib/geo`, public API routes, and UI-facing areas continue to consume Domain records, runtime facade functions, or Domain projections.

## Real CMS Dry-Run Mock Isolation

Status: Pass for available evidence.

Evidence:

- `docs/real-cms-export-dry-run-report.md` exists and records real CMS export dry-run validation through facts-only payload replay.
- `docs/first-real-product-import-governance.md` requires real imports to be active-source replacements and forbids merging real payloads with `mockProducts`.
- Current shell has no `CMS_*`, `STRAPI_*`, or `NEXT_PUBLIC_*` environment variables set for this release gate run.
- `npm run validate:domain` ran after the dry-run and reported `source: mock-domain` with 20 product records, confirming the current local runtime was not left pinned to `CMS_FACTS_JSON` or a live CMS source.

## Public Runtime Leak Check

Status: Pass with documented exception.

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
- No direct `process.env.CMS_FACTS_JSON` or public `NEXT_PUBLIC_*CMS/STRAPI/WEBHOOK/FACTS*` access found in public/UI/SEO/GEO/API-facing layers.
- One allowed `lib/cms/products` import exists in `app/api/cms/status/route.ts`; it calls `getCmsProductStatus()` and `preloadCmsProductSnapshotAsync()` as an operational metadata route.
- `lib/api/cms-webhook.ts` contains raw fact field names only as forbidden webhook payload keys, not as raw CMS data consumption.

## SEO / GEO / API / UI Data Source Verification

Status: Pass.

Evidence:

- `validate:seo` confirms sitemap, hreflang, JSON-LD, and SEO boundary checks at 300 products.
- `validate:geo` confirms GEO feed/index/answers contract, answer counts, payload budgets, and GEO boundary checks at 300 products.
- SEO imports use Domain records, entry-page view models, canonical/hreflang helpers, and `lib/runtime/domain-products.ts` where product runtime data is needed.
- GEO imports use Domain records, entry-page view models, SEO canonical helpers, and `lib/runtime/domain-products.ts` where product runtime data is needed.
- Public GEO/API route imports use `lib/geo`, `lib/api/contracts`, and `lib/runtime/domain-products.ts`; they do not import Strapi, adapter modules, raw facts, or `CMS_FACTS_JSON`.
- `docs/frontend-live-cms-boundary-report.md` confirms visible UI routes and components consume Domain view models/projections or approved runtime facade outputs only.

## Staging Live CMS Traffic Test Conditions

Staging may proceed only under these constraints:

- Inject CMS source variables as server-only staging environment variables.
- Keep `CMS_SOURCE_MODE=cms-facts-api` scoped to staging validation, not production.
- Point `CMS_FACTS_API_URL` to the backend-only facts aggregator, not raw Strapi collection endpoints.
- Set `CMS_FACTS_API_ALLOW_FETCH=true` only in staging where live fetch is intended.
- Keep `CMS_FACTS_API_TOKEN` server-only if backend policy requires it.
- Confirm `/api/cms/status` reports expected source metadata before user-facing traffic is exercised.
- Run real-facts SEO/GEO spot checks with staging live CMS source active.
- Keep production CMS traffic switch as a separate Go/No-Go decision after staging evidence is collected.

## Blocking Items

None for staging live CMS traffic test readiness.

## Non-Blocking Observations

- Validators using `node --loader ./scripts/ts-import-loader.mjs` still emit Node experimental-loader warnings. These warnings did not affect exit codes.
- Default release gates use generated scale fixtures for CMS/SEO/GEO scale validation. Real CMS dry-run evidence is documented separately in `docs/real-cms-export-dry-run-report.md` and SEO/GEO real replay is documented in `docs/seo-geo-live-cms-regression-report.md`.
- Staging live CMS traffic testing must still prove live endpoint behavior in the staging environment before any production cutover request.

## Final Decision

Go for staging live CMS traffic test

Production live CMS traffic cutover remains out of scope for this report and requires a later production Go/No-Go after staging live CMS evidence is collected.
