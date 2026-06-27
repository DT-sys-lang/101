# CI Release Gates

## Scope

This document defines the executable release gates before connecting a real CMS source. It does not connect Strapi, PostgreSQL, or any raw CMS transport. The release boundary remains:

- CMS provides facts only.
- `adapter/*` derives Domain records, SEO, JSON-LD, and GEO.
- `lib/runtime/domain-products.ts` is the runtime product source facade.
- `lib/seo/*`, `lib/geo/*`, `app/sitemap.ts`, and `app/api/*` consume Domain-normalized data only.
- UI pages are outside this gate unless a Domain/view-model contract change breaks them.

## Current Gate Assessment

The current scripts are sufficient as pre-CMS release gates when used in the sequence below.

| Gate | Script | Release coverage | Owner on failure |
| --- | --- | --- | --- |
| Code quality | `npm run lint` | Blocks removed `next lint` references, tab indentation, TODO console output, and raw `<img>` in TSX. | Thread 5 QA / DevOps, or changed-file owner |
| TypeScript | `npm run typecheck` | Enforces `tsc --noEmit` with `strict: true`. | Thread owning failing module |
| Boundary imports | `npm run validate:boundaries` | Blocks `components`, `app/[locale]`, `lib/seo`, and `lib/geo` from importing `lib/cms`, `adapter`, raw-facts sources, `CMS_FACTS_JSON`, or Strapi. | Thread 1 / 3 / 4 depending on the violating layer; Thread 5 coordinates the release block |
| CMS facts | `npm run validate:cms-facts` | Validates fact-only input, adapter conversion, generated SEO/GEO presence, and duplicate-risk summary. | Thread 2 CMS / Strapi for input shape; Thread 1 for adapter/domain errors |
| Domain | `npm run validate:domain` | Validates category graph, product identity, specs, measurements, evidence documents, SEO, GEO, and catalog indexes. | Thread 1 Architecture / Domain / Adapter |
| SEO | `npm run validate:seo` | Validates generated 300-product sitemap count, HTTPS URLs, canonical fields, JSON-LD, and hreflang maps. | Thread 3 SEO / GEO Runtime |
| GEO | `npm run validate:geo` | Validates generated 300-product GEO feed, index v2, all-products, answer blocks, application blocks, and payload budgets. | Thread 3 SEO / GEO Runtime |
| 300 scale | `npm run validate:scale-300` | Validates generated CMS facts, adapter/domain count parity, sitemap, GEO documents, duplicate risks, and budgets at 300 products. | Thread 5 QA / Scale / DevOps first; route to Thread 1/2/3 by failing surface |
| 1000 scale | `npm run validate:scale-1000` | Same as 300 scale at target 1000-product volume. | Thread 5 QA / Scale / DevOps first; route to Thread 1/2/3 by failing surface |
| Production build | `npm run build` | Runs Next.js production compilation, TypeScript integration, route collection, and static generation. | Thread owning failing route/module; Thread 5 coordinates release block |

## Local Verification Order

Run these commands locally before requesting production deployment:

```bash
npm run lint
npm run typecheck
npm run validate:boundaries
npm run validate:cms-facts
npm run validate:domain
npm run validate:seo
npm run validate:geo
npm run validate:scale-300
npm run validate:scale-1000
npm run build
```

Rules:

- Run commands sequentially; do not parallelize `typecheck` and `build`.
- Treat any non-zero exit as a release blocker.
- Do not lower TypeScript strictness or delete domain constraints to pass a gate.
- Re-run the full sequence after changes to CMS fact shape, adapter derivation, Domain contracts, SEO/GEO output, sitemap surfaces, locales, entry pages, or product FAQ generation.

## CI Command Order

Recommended CI pipeline:

```bash
npm ci
npm run lint
npm run typecheck
npm run validate:boundaries
npm run validate:cms-facts
npm run validate:domain
npm run validate:seo
npm run validate:geo
npm run validate:scale-300
npm run validate:scale-1000
npm run build
```

CI notes:

- `npm ci` must run from `package-lock.json` to keep dependency resolution stable.
- Keep the gates sequential unless CI isolates workspaces per job.
- If splitting into jobs, run `build` in a separate clean workspace or after `typecheck`, not concurrently in the same workspace.
- Cache `node_modules` only if lockfile cache keys are strict; never cache `.next` across release gate jobs unless the cache is proven deterministic.
- Vercel production deployment should be allowed only after all gates pass on the same commit.
- GitHub Actions entrypoint is `.github/workflows/ci.yml`; it runs these gates in one sequential job to avoid workspace races.
- CMS webhook, CMS facts, and Strapi secrets are backend/validation-only values; do not define them as `NEXT_PUBLIC_*` and do not inject them into the `build` step.
- The workflow includes a frontend build environment guard that fails if CMS facts, CMS webhook secrets, Strapi tokens, or public CMS/Strapi variables are present before `npm run build`.

## CMS_FACTS_JSON Validation

Before Strapi is connected directly, real CMS data must be exported as a fact-only JSON payload matching the adapter contract.

Accepted input paths for `validate:cms-facts`:

```bash
npm run validate:cms-facts -- --file ./path/to/cms-facts.json
```

```bash
cat ./path/to/cms-facts.json | npm run validate:cms-facts
```

```bash
CMS_FACTS_JSON="$(cat ./path/to/cms-facts.json)" npm run validate:cms-facts
```

PowerShell equivalent:

```powershell
$env:CMS_FACTS_JSON = Get-Content -Raw .\path\to\cms-facts.json
npm run validate:cms-facts
```

When validating SEO/GEO against a real CMS export rather than generated scale fixtures, keep `CMS_FACTS_JSON` set and force runtime mode:

```bash
CMS_FACTS_JSON="$(cat ./path/to/cms-facts.json)" npm run validate:domain
CMS_FACTS_JSON="$(cat ./path/to/cms-facts.json)" npm run validate:seo -- --scale false
CMS_FACTS_JSON="$(cat ./path/to/cms-facts.json)" npm run validate:geo -- --scale false
```

PowerShell equivalent:

```powershell
$env:CMS_FACTS_JSON = Get-Content -Raw .\path\to\cms-facts.json
npm run validate:domain
npm run validate:seo -- --scale false
npm run validate:geo -- --scale false
```

Important distinctions:

- `npm run validate:seo` and `npm run validate:geo` default to generated 300-product scale fixtures.
- Add `-- --scale false` when the gate must validate the current runtime source from `CMS_FACTS_JSON`.
- `npm run validate:scale-300` and `npm run validate:scale-1000` intentionally validate generated scale fixtures and budgets, not a real CMS export.
- Real CMS exports must not include generated slugs, canonical paths, breadcrumbs, SEO fields, JSON-LD, or GEO fields.
- In CI, pass real CMS exports only to validation steps that explicitly need them; never set `CMS_FACTS_JSON`, CMS webhook secrets, Strapi tokens, or `NEXT_PUBLIC_*CMS*` variables globally for the job.

## Build And Typecheck Concurrency

Do not run these two commands concurrently in the same workspace:

```bash
npm run typecheck
npm run build
```

Reason:

- `typecheck` includes `.next/types/**/*.ts` and `.next/dev/types/**/*.ts` from `tsconfig.json`.
- `next build` generates and mutates `.next/types` during production compilation.
- Running both at the same time can create race-prone false negatives where TypeScript sees missing generated files.

Safe options:

- Run `npm run typecheck` before `npm run build` in the same job.
- Run them in separate clean workspaces if CI needs parallel jobs.
- If a false negative appears around `.next/types`, rerun sequentially before assigning ownership.

## Scale Budgets

Current budget baselines:

| Scale | Sitemap entries | GEO answer blocks per locale | Catalog index budget |
| --- | ---: | ---: | ---: |
| 300 products | 630 | 1,206 | 2,000 ms |
| 1000 products | 2,030 | 4,006 | 5,000 ms |

Budget formulas:

- Sitemap entries: `localeCount * (1 + staticLocalizedEntryCount + industryEntryCount + applicationEntryCount + productCount)`.
- Current structure: `2 locales x (1 home + 6 static localized entry pages + 5 industry entries + 3 application entries + products)`.
- GEO answer blocks: sum of actual product `geoAi.faq.length` plus application answer blocks.
- Application answer blocks: `applicationEntryCount * 2` per locale.

Hard limits:

- Sitemap entries must stay below 50,000 per file.
- Sitemap serialized payload must stay below 10 MB.
- GEO product feed budget is 1,600 bytes per product per locale.
- GEO index budget is 1,700 bytes per product per locale.
- GEO answer budget is 1,700 bytes per answer block.
- GEO all-products budget is 9,000 bytes per product per locale.

## Failure Ownership

Use this routing when a gate fails:

| Failure pattern | Primary owner | Escalation |
| --- | --- | --- |
| Invalid CMS JSON, forbidden generated fields, missing fact fields, duplicate CMS IDs | Thread 2 CMS / Strapi | Thread 1 if adapter contract is ambiguous |
| Adapter conversion, category graph, specification registry, ProductRecord shape, generated SEO/GEO presence | Thread 1 Architecture / Domain / Adapter | Thread 5 validates fix |
| Boundary import violations in `components`, `app/[locale]`, `lib/seo`, or `lib/geo` | Thread 1 / 3 / 4 depending on the violating layer | Thread 5 coordinates the release block |
| Sitemap count, canonical, hreflang, JSON-LD, robots, llms.txt, GEO endpoint contract, answer block version/kind | Thread 3 SEO / GEO Runtime | Thread 1 for boundary disputes |
| Lint, typecheck orchestration, scale budgets, duplicate-risk gate, CI order, build deployment gate | Thread 5 QA / Scale / DevOps | Route to changed-file owner after triage |
| UI page rendering failure or view-model consumption break | Thread 4 Frontend / UI | Thread 1 if Domain/view-model contract changed |
| Runtime API envelope, revalidation scope, inquiry endpoint contract | Thread 5 triage | Thread 1 for architecture, Thread 3 for GEO/feed surfaces |

Release rule:

- A failed gate blocks deployment until the owning thread fixes it and Thread 5 reruns the relevant gate plus `npm run build`.
- If a gate fails after real CMS data is supplied, preserve the failing export payload as the regression fixture before changing adapters or validators.

## When To Update Gates

Update release gate documentation or scripts when any of these change:

- Locales or routing policy.
- Static localized entry pages.
- Industry or application entry counts.
- Product FAQ generation or GEO answer block kinds.
- GEO document versions or endpoint contracts.
- Sitemap surfaces, canonical path strategy, or hreflang strategy.
- CMS fact schema, adapter validation rules, or generated-field exclusions.
- Scale budgets, target product count, or sitemap split strategy.
- Next.js build/type generation behavior or CI workspace topology.
