# Staging Live CMS Smoke Test Report

Date: 2026-06-25
Role: System integration thread
Scope: staging-only live CMS runtime smoke test for `cms-facts-api`

## Decision

Fail: return to DevOps / staging environment configuration thread.

Reason: the Next.js runtime started and public SEO/GEO/API endpoints responded, but the server-only CMS facts API environment was not injected in this shell. `/api/cms/status` reported `requestedMode: mock-domain` and `activeMode: mock-domain`, so live CMS runtime was not active.

This is not a production CMS cutover attempt.

## Gate Inputs

Reviewed gate reports:

| Report | Required state | Observed state |
| --- | --- | --- |
| `docs/staging-live-cms-readiness-report.md` | Go for staging live CMS traffic test | Go found. |
| `docs/staging-live-cms-go-no-go.md` | Go for staging live CMS traffic test | Go found. |
| `docs/live-cms-runtime-integration-report.md` | Runtime path ready, staging env required | Found; requires real server-only env injection. |

## Server-Only Env Used

Environment variable names checked. Secret and URL values were not printed.

| Env name | Required for live smoke | Observed configured | Value recorded |
| --- | --- | --- | --- |
| `CMS_SOURCE_MODE` | Yes, must be `cms-facts-api` | No | Not recorded. |
| `CMS_FACTS_API_URL` | Yes, must target backend-only `/internal/cms/facts` | No | Not recorded. |
| `CMS_FACTS_API_ALLOW_FETCH` | Yes, must be `true` | No | Not recorded. |
| `CMS_FACTS_API_TOKEN` | Required if backend policy requires it | No | Not recorded. |
| `CMS_FACTS_API_TIMEOUT_MS` | Optional | No | Not recorded. |

## Runtime Execution

A local Next.js production runtime was started from the current workspace using the available process environment.

| Runtime item | Observed value |
| --- | --- |
| Runtime base URL | `http://127.0.0.1:3107` |
| Command shape | `npm run start -- -p <port>` |
| Production cutover | No |
| UI changes | No |
| Raw CMS transport changes | No |

## `/api/cms/status` Smoke Result

| Field | Expected for Pass | Observed |
| --- | --- | --- |
| HTTP status | `200` | `200` |
| `contract.name` | `cms-status` | `cms-status` |
| `contract.normalizedBy` | `adapter/domain` | `adapter/domain` |
| `source.sourceKind` | `domain-normalized-products` | `domain-normalized-products` |
| `source.upstreamMode` | `cms-facts-api` | `mock-domain` |
| `requestedMode` | `cms-facts-api` | `mock-domain` |
| `factsApiConfigured` | `true` | `false` |
| `factsApiFetchEnabled` | `true` | `false` |
| `factsApiAuthConfigured` | `true` if backend requires token | `false` |
| `activeMode` | `cms-facts-api` | `mock-domain` |
| `productCount` | `> 0` | `20` |
| Raw CMS leak patterns | None | None found. |

`productCount > 0` passed only for the fallback mock-domain source. It does not count as live CMS success.

## Public SEO / GEO / API Smoke Checks

All public outputs responded, kept the expected public shape, and did not expose raw CMS facts. They were generated from the fallback `mock-domain` runtime, not from live CMS.

| Endpoint | HTTP status | Shape evidence | Runtime source | Count evidence | Raw leak scan |
| --- | --- | --- | --- | --- | --- |
| `/sitemap.xml` | `200` | XML sitemap | N/A | `70` `<url>` entries | None found. |
| `/llms.txt` | `200` | Text output | N/A | `50` lines | None found. |
| `/api/product-feed` | `200` | `contract.name=product-feed`, `normalizedBy=adapter/domain`, data keys `version`, `locale`, `products` | `mock-domain` | `20` products | None found. |
| `/api/geo/index` | `200` | `contract.name=geo-index`, `normalizedBy=adapter/domain`, data keys `version`, `site`, `source`, `endpoints`, `products`, `industries`, `applications` | `mock-domain` | source product count `20` | None found. |
| `/api/geo/products` | `200` | `contract.name=geo-products`, `normalizedBy=adapter/domain` | `mock-domain` | `20` products | None found. |
| `/api/geo/answers` | `200` | `contract.name=geo-answers`, `normalizedBy=adapter/domain`, data keys `version`, `locale`, `answers` | `mock-domain` | source product count `20` | None found. |

Leak scan patterns checked against each response body:

```txt
"productFacts"
"categoryFacts"
"cmsFacts"
"attributes"
"documentId"
"Authorization"
Bearer 
strapi
Strapi
```

No pattern matches were found.

## Boundary Result

| Requirement | Result |
| --- | --- |
| Use `CMS_SOURCE_MODE=cms-facts-api` | Fail; env missing. |
| Verify `CMS_FACTS_API_URL` points to backend-only facts aggregator | Fail; env missing, no URL value inspected. |
| Verify `CMS_FACTS_API_ALLOW_FETCH=true` | Fail; env missing. |
| Confirm `readCmsProductSourceAsync()` reaches real direct `CmsFactInput` | Fail; no live facts API fetch occurred. |
| Confirm `lib/cms/products.ts` only exposes Domain-normalized runtime | Pass for observed fallback route shape. |
| Confirm `/api/cms/status` exposes metadata only | Pass. |
| Confirm public SEO/GEO/API outputs are Domain-derived | Pass for observed fallback runtime. |
| Confirm no raw CMS/token leak | Pass for observed responses. |

## Conclusion

Fail: return to DevOps / staging environment configuration thread.

The staging live CMS smoke test did not prove live CMS runtime activation. The runtime fell back to `mock-domain`, so this cannot be accepted as `cms-facts-api` smoke success.

Required fix before rerun:

```txt
CMS_SOURCE_MODE=cms-facts-api
CMS_FACTS_API_URL=<backend-only /internal/cms/facts>
CMS_FACTS_API_ALLOW_FETCH=true
CMS_FACTS_API_TOKEN=<server-only token, if required>
```

Rerun the same smoke checks only after those values are injected as server-only staging environment variables. The pass condition remains: `/api/cms/status` must report `requestedMode: cms-facts-api`, `factsApiConfigured: true`, `factsApiFetchEnabled: true`, `activeMode: cms-facts-api`, and `productCount > 0` without raw CMS or token leakage.
