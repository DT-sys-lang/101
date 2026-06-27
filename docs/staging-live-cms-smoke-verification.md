# Staging Live CMS Smoke Verification

Date: 2026-06-25
Owner: Thread 5 - QA / Scale / DevOps
Scope: verification of staging live CMS smoke evidence before allowing a staging observation window

## Final Conclusion

No-Go, return to specific thread: System integration thread / staging environment configuration.

The required release gates passed, and the public boundary checks remain clean. However, the smoke test evidence does not prove live CMS runtime activation because `/api/cms/status` reported `requestedMode: mock-domain` and `activeMode: mock-domain` instead of `cms-facts-api`.

This No-Go is not caused by UI, SEO/GEO, Domain, adapter, or build regressions. It is caused by missing server-only staging CMS facts API environment injection during the smoke run.

## Reviewed Inputs

| Input | Status | Notes |
| --- | --- | --- |
| `docs/staging-live-cms-smoke-test-report.md` | Reviewed | Smoke report exists and records fallback to `mock-domain`. |
| `docs/staging-live-cms-readiness-report.md` | Reviewed | Prior readiness decision allowed staging live CMS traffic test. |
| `docs/staging-live-cms-go-no-go.md` | Reviewed | Prior architecture decision allowed staging live CMS traffic test only. |
| `docs/live-cms-runtime-integration-report.md` | Reviewed | Runtime path is wired for `cms-facts-api` when server-only env is injected. |
| `docs/frontend-live-cms-boundary-report.md` | Reviewed | Frontend live CMS boundary report remains pass. |
| `lib/cms/source.ts` | Reviewed | Owns server-only CMS source selection and rejects raw/envelope fields. |
| `lib/cms/products.ts` | Reviewed | Keeps async preload and Domain normalization behind CMS/runtime boundary. |
| `lib/runtime/domain-products.ts` | Reviewed | Exposes only Domain-normalized runtime records and safe source metadata. |

## Smoke Evidence Verification

| Requirement | Expected | Observed | Result | Failure owner |
| --- | --- | --- | --- | --- |
| Active source mode | `activeMode: cms-facts-api` | `activeMode: mock-domain` | Fail | System integration thread / staging environment configuration |
| Requested source mode | `requestedMode: cms-facts-api` | `requestedMode: mock-domain` | Fail | System integration thread / staging environment configuration |
| Product count | `productCount > 0` | `productCount: 20` | Pass for fallback only | Not accepted as live CMS proof |
| Facts API configured | `factsApiConfigured: true` | `false` | Fail | System integration thread / staging environment configuration |
| Facts API fetch enabled | `factsApiFetchEnabled: true` | `false` | Fail | System integration thread / staging environment configuration |
| `/api/cms/status` leak scan | No raw facts, Strapi envelope, or token | No leak patterns found | Pass | None |
| Public SEO smoke | Public shape responds and no raw leak | Passed on fallback runtime | Pass for fallback only | Not accepted as live CMS proof |
| Public GEO/API smoke | Public shape responds and no raw leak | Passed on fallback runtime | Pass for fallback only | Not accepted as live CMS proof |

## `/api/cms/status` Exposure Review

Status: Pass for exposure safety, Fail for live activation.

The smoke report records that `/api/cms/status` returned HTTP `200`, `contract.name: cms-status`, `contract.normalizedBy: adapter/domain`, and `source.sourceKind: domain-normalized-products`. It also records no matches for raw leak markers such as `productFacts`, `categoryFacts`, `cmsFacts`, `attributes`, `documentId`, `Authorization`, `Bearer`, `strapi`, or `Strapi`.

The route is still not acceptable as live CMS smoke success because the active source was `mock-domain`.

## Boundary Verification

Status: Pass.

Current static review confirms the Architecture Freeze v1 boundary still holds:

- `lib/cms/source.ts` owns `CMS_SOURCE_MODE`, `CMS_FACTS_API_URL`, `CMS_FACTS_API_ALLOW_FETCH`, optional `CMS_FACTS_API_TOKEN`, response normalization, and fallback metadata.
- `lib/cms/source.ts` rejects Strapi wrappers, raw transport fields, and generated SEO/GEO/domain fields before `normalizeCmsFactInput()`.
- `lib/cms/products.ts` remains the only CMS bridge into `buildDomainFromCmsFacts(source.cmsFacts)`.
- `lib/runtime/domain-products.ts` exposes Domain-normalized records, category tree, catalog/list helpers, and safe source metadata only.
- `components`, `app/[locale]`, `lib/seo`, and `lib/geo` passed the boundary validator with zero violations.
- A broader targeted scan of `components`, `app/[locale]`, `lib/seo`, `lib/geo`, `app/api`, and `lib/api` found no public raw CMS or token leaks; the only notable allowed cases were `/api/cms/status` importing `lib/cms/products` for operational metadata and `lib/api/cms-webhook.ts` listing forbidden raw payload keys.

## Required Gate Results

| Command | Result | Evidence |
| --- | --- | --- |
| `npm run validate:boundaries` | Pass | exit `0`, 61 files checked, 0 violations. |
| `npm run typecheck` | Pass | exit `0`, `tsc --noEmit` completed. |
| `npm run validate:seo` | Pass | exit `0`, 300 product records, 630 expected sitemap entries, SEO boundary clean. |
| `npm run validate:geo` | Pass | exit `0`, 300 product records, 1206 expected answers per locale, GEO boundary clean. |
| `npm run build` | Pass | exit `0`, Next.js 16.2.9 build completed, 81 static pages generated. |

## Failure Ownership

| Finding | Owner | Action |
| --- | --- | --- |
| Smoke `activeMode` is not `cms-facts-api` | System integration thread / staging environment configuration | Inject server-only live CMS env and rerun smoke test. |
| `CMS_SOURCE_MODE` missing during smoke run | System integration thread / staging environment configuration | Set `CMS_SOURCE_MODE=cms-facts-api` in staging runtime only. |
| `CMS_FACTS_API_URL` missing during smoke run | System integration thread / staging environment configuration | Set backend-only `/internal/cms/facts` URL; do not point to raw Strapi collections. |
| `CMS_FACTS_API_ALLOW_FETCH` missing or false during smoke run | System integration thread / staging environment configuration | Set `CMS_FACTS_API_ALLOW_FETCH=true` for the staging smoke window. |
| Optional token not configured | System integration thread / staging environment configuration | Set `CMS_FACTS_API_TOKEN` server-only if backend policy requires auth. |

## Required Rerun Conditions

Before requesting another Thread 5 verification, rerun the smoke test with server-only staging environment variables injected:

```txt
CMS_SOURCE_MODE=cms-facts-api
CMS_FACTS_API_URL=<backend-only /internal/cms/facts>
CMS_FACTS_API_ALLOW_FETCH=true
CMS_FACTS_API_TOKEN=<server-only token, if required>
```

The next smoke test must prove:

- `/api/cms/status` reports `requestedMode: cms-facts-api`.
- `/api/cms/status` reports `factsApiConfigured: true`.
- `/api/cms/status` reports `factsApiFetchEnabled: true`.
- `/api/cms/status` reports `activeMode: cms-facts-api`.
- `productCount > 0` is observed while `activeMode` is `cms-facts-api`.
- `/api/cms/status` and public SEO/GEO/API endpoints do not expose raw facts, Strapi envelopes, CMS tokens, or transport payloads.
- SEO/GEO/API smoke checks pass against the live `cms-facts-api` runtime, not fallback `mock-domain`.

## Final Decision

No-Go, return to specific thread: System integration thread / staging environment configuration.

Do not continue to the staging observation window until a new smoke report proves `activeMode: cms-facts-api` with `productCount > 0` and no raw CMS or token leakage.
