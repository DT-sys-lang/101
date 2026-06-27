# CI Workflow Readiness Report

## Verdict

Current CI is ready as a pre-CMS release gate. The existing workflow should not be rebuilt: it matches the documented gate order, uses `npm ci`, keeps `typecheck` and `build` sequential, and does not define CMS, Strapi, or webhook secrets in the workflow environment.

This report is an audit snapshot before real CMS/Strapi connection. It does not approve live CMS data, live webhook signing, Vercel deployment, or production environment configuration by itself.

## Reviewed Files

- `.github/workflows/ci.yml`
- `docs/ci-release-gates.md`
- `package.json`
- `scripts/validate-boundaries.mjs`
- Runtime environment references in `lib/api`, `lib/cms`, `lib/server`, and `scripts`

## Workflow Alignment

| Expected gate | Workflow step | Package script | Status |
| --- | --- | --- | --- |
| Install locked dependencies | `npm ci` | n/a | Covered |
| Code quality | `npm run lint` | `lint` | Covered |
| TypeScript strict check | `npm run typecheck` | `typecheck` | Covered |
| Architecture boundary check | `npm run validate:boundaries` | `validate:boundaries` | Covered |
| CMS facts contract | `npm run validate:cms-facts` | `validate:cms-facts` | Covered |
| Domain contract | `npm run validate:domain` | `validate:domain` | Covered |
| SEO contract | `npm run validate:seo` | `validate:seo` | Covered |
| GEO contract | `npm run validate:geo` | `validate:geo` | Covered |
| 300-product scale budget | `npm run validate:scale-300` | `validate:scale-300` | Covered |
| 1000-product scale budget | `npm run validate:scale-1000` | `validate:scale-1000` | Covered |
| Frontend build environment guard | `Guard frontend build env` | n/a | Covered in workflow |
| Production build | `npm run build` | `build` | Covered |

The workflow order is consistent with `docs/ci-release-gates.md`: install, lint, typecheck, boundaries, validation gates, scale gates, build environment guard, then build.

## Node And NPM Assessment

- `actions/setup-node@v4` pins `node-version: 24`, which is reasonable for the current dependency set only if Vercel production builds use the same or a compatible Node runtime.
- `npm ci` is used, so CI installs from the lockfile instead of resolving new dependency versions.
- `cache: npm` is safe here because the workflow caches the npm package cache, not `node_modules` or `.next` build output.
- `typecheck` and `build` run in separate sequential steps, avoiding `.next/types` race conditions documented in `docs/ci-release-gates.md`.
- The workflow timeout is `30` minutes. Keep this budget under watch when real CMS facts, larger generated fixtures, or deployment steps are added.

## Covered Gates

- Lint quality gate blocks the current custom lint rules before validation work starts.
- TypeScript gate keeps `tsc --noEmit` active without weakening strictness.
- Boundary gate scans `components`, `app/[locale]`, `lib/seo`, and `lib/geo` for forbidden imports and forbidden public CMS/Strapi/facts env access.
- CMS facts, domain, SEO, and GEO validators are all represented in CI.
- 300-product and 1000-product scale validations are represented in CI before build.
- Build env guard runs immediately before `npm run build`, reducing accidental frontend build exposure of CMS facts, webhook secrets, Strapi URL/token, and public CMS/Strapi variables.
- Production build runs last, after all validation gates pass on the same commit.

## Uncovered Gates

- Real CMS export validation is not automatic in CI yet; current `validate:cms-facts`, `validate:seo`, and `validate:geo` defaults use generated fixtures unless a real export is explicitly supplied.
- No live Strapi or internal CMS facts API fetch is validated, which is intentional before database connection.
- No live CMS webhook signing integration test runs with `CMS_REVALIDATE_SECRET`.
- No CMS preview integration test runs with `CMS_PREVIEW_SECRET`.
- No Vercel preview or production deployment job exists after release gates.
- No branch protection or required-status-check policy is enforceable from the repository files alone.
- No Lighthouse/Core Web Vitals or deployed image optimizer smoke test runs in this CI workflow.
- No sitemap split test beyond current 300/1000 scale budgets is needed yet, but it must be added before approaching the 50,000 URL sitemap limit.

## CMS And Strapi Secret Exposure Risk

Current risk is low because `.github/workflows/ci.yml` does not define job-level `env`, does not reference GitHub secrets, and does not inject CMS or Strapi values into `npm run build`.

The build guard currently blocks these names before the frontend build:

- `NEXT_PUBLIC_.*(CMS|STRAPI|WEBHOOK|FACTS)`
- `CMS_FACTS_JSON`
- `CMS_WEBHOOK_SECRET`
- `CMS_REVALIDATE_SECRET`
- `STRAPI_API_TOKEN`
- `STRAPI_URL`

Additional backend-only values discovered in the codebase are not currently injected by CI, but should stay server-scoped when real CMS work begins:

- `CMS_PREVIEW_SECRET`
- `CMS_SOURCE_MODE`
- `CMS_FACTS_API_URL`
- `CMS_FACTS_API_TIMEOUT_MS`
- `CMS_FACTS_API_PUBLICATION_STATE_PARAM`
- `CMS_FACTS_API_PREVIEW_ENTRY_ID_PARAM`
- `CMS_FACTS_API_PREVIEW_CONTENT_TYPE_PARAM`
- `CMS_FACTS_API_ALLOW_FETCH`
- `CMS_EXPORT_JSON`
- `INQUIRY_STORE_DIR`

Recommendation: if future CI changes add CMS or Strapi environment variables, scope them only to the validation or backend runtime step that needs them. Do not place them at workflow or job level, and extend the build guard before adding real CMS secrets.

## Pre-Launch Environment Variable Checklist

Backend/runtime only:

- `CMS_SOURCE_MODE`: selects `mock-domain`, `env-facts-json`, or future `cms-facts-api` mode.
- `CMS_FACTS_JSON`: deterministic facts replay and rollback payload; use only for validation/runtime replay, never global frontend build env.
- `CMS_FACTS_API_URL`: backend-only internal facts aggregator URL when the future API path is enabled.
- `CMS_FACTS_API_ALLOW_FETCH`: explicit operator flag for future facts API fetching.
- `CMS_FACTS_API_TIMEOUT_MS`: timeout budget for future facts API fetching.
- `CMS_FACTS_API_PUBLICATION_STATE_PARAM`: publication-state query parameter name.
- `CMS_FACTS_API_PREVIEW_ENTRY_ID_PARAM`: preview entry query parameter name.
- `CMS_FACTS_API_PREVIEW_CONTENT_TYPE_PARAM`: preview content-type query parameter name.
- `CMS_REVALIDATE_SECRET`: HMAC secret for `/api/revalidate/cms`.
- `CMS_PREVIEW_SECRET`: preview route secret for `/api/preview/cms`.
- `STRAPI_URL`: backend-only Strapi or facts aggregator source URL if introduced.
- `STRAPI_API_TOKEN`: backend-only Strapi access token if introduced.
- `INQUIRY_STORE_DIR`: server-side inquiry persistence directory if the deployment target needs a custom path.

CI/deployment config:

- `NODE_VERSION` or Vercel Node setting should match the CI `node-version: 24`, or both should be changed together.
- No `NEXT_PUBLIC_*CMS*`, `NEXT_PUBLIC_*STRAPI*`, `NEXT_PUBLIC_*WEBHOOK*`, or `NEXT_PUBLIC_*FACTS*` variables should exist.
- Do not set `CMS_FACTS_JSON`, CMS webhook secrets, preview secrets, or Strapi tokens globally for the GitHub Actions job that runs `npm run build`.

## Failure Ownership

| Failure surface | Primary owner |
| --- | --- |
| `lint`, CI orchestration, command order, scale budget coordination | Thread 5 DevOps / QA / Scale |
| `typecheck` module errors | Owning feature/domain thread, triaged by Thread 5 |
| `validate:boundaries` | Thread 1 / Thread 3 / Thread 4 depending on violating layer |
| `validate:cms-facts` real export shape | Thread 2 CMS / Strapi |
| `validate:domain` adapter/domain records | Thread 1 Architecture / Domain |
| `validate:seo` and sitemap/hreflang counts | Thread 3 SEO / GEO Runtime |
| `validate:geo` answer/feed/index contracts | Thread 3 SEO / GEO Runtime |
| `validate:scale-300` and `validate:scale-1000` | Thread 5 first, then route by failing surface |
| `build` route or module failure | Owning route/module thread, coordinated by Thread 5 |

## Recommendations

- Keep the existing workflow unchanged for the current pre-CMS release gate.
- Add branch protection requiring the `Release gates` status before merging to `main`.
- Before real CMS launch, add a separate real-export validation path that supplies `CMS_FACTS_JSON` only to `validate:cms-facts`, `validate:domain`, `validate:seo -- --scale false`, and `validate:geo -- --scale false`.
- Before adding real CMS secrets to CI, widen the build env guard to include `CMS_PREVIEW_SECRET`, `CMS_SOURCE_MODE`, and `CMS_FACTS_API_*` if those variables might otherwise be defined at job level.
- Add Vercel preview/prod deployment only after the release gates pass on the same commit.
- Add deployed performance/image smoke checks separately from this pre-CMS workflow once a stable preview URL exists.
