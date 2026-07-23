# Verification Checklist

## Required release gates

- `npm run lint` - local code quality gate replacing the removed `next lint` behavior.
- `npm run typecheck` - TypeScript strict compiler check with `noEmit`.
- `npm run validate:cms-facts` - CMS fact-only input validation using generated 300-product facts by default, or `--file`, `CMS_FACTS_JSON`, or stdin for real CMS exports.
- `npm run validate:domain` - domain graph, product identity, category, SEO, and GEO consistency validation.
- `npm run validate:seo` - sitemap, canonical, JSON-LD, and hreflang validation using the real localized entry structure.
- `npm run validate:geo` - GEO feed, index, all-products, product answer blocks, and application answer blocks validation.
- `npm run validate:scale-300` - integrated 300-product scale gate for CMS facts, catalog indexes, sitemap, hreflang, GEO payload budgets, and duplicate-risk checks.
- `npm run validate:scale-1000` - integrated 1000-product scale gate for the same surfaces.
- `npm run build` - final Next.js production build gate before completion or deployment.

## CI gate order

- `npm ci` - install from lockfile in a clean runner.
- `npm run lint` - fail fast on local quality-gate regressions.
- `npm run typecheck` - verify TypeScript strict mode without emitting files.
- `npm run validate:cms-facts` - validate generated or supplied CMS facts before derived domain checks.
- `npm run validate:domain` - validate domain graph and generated product contracts.
- `npm run validate:seo` - validate sitemap and hreflang counts for the current entry structure.
- `npm run validate:geo` - validate GEO contracts and answer block counts derived from actual product FAQ data.
- `npm run validate:scale-300` - protect the normal 300-product operating budget.
- `npm run validate:scale-1000` - protect the 1000-product target scale budget.
- `npm run build` - run last as the production deployment gate.

## Scale budgets

- Sitemap must stay below 50,000 entries per file and below 10 MB serialized payload.
- Sitemap entry count must equal `localeCount * (1 + staticLocalizedEntryCount + industryEntryCount + applicationEntryCount + productCount)`.
- For the current site structure, that resolves to `2 locales * (1 home + 7 static localized entry pages + 5 industry entries + 3 application entries + products)`.
- Current 300-product baseline is 632 sitemap entries and 1,206 GEO answer blocks per locale.
- Current 1000-product baseline is 2,032 sitemap entries and 4,006 GEO answer blocks per locale.
- Current two-product real CMS export replay baseline is 36 sitemap entries and 14 GEO answer blocks per locale.
- GEO product answer block count must be derived from actual product `geoAi.faq` length, not a hard-coded per-product constant.
- Every sitemap entry must include absolute HTTPS URLs and `zh-CN`, `en`, and `x-default` hreflang values.
- GEO product feed budget is 1,600 bytes per product per locale.
- GEO index budget is 1,700 bytes per product per locale, with validator support for fixed discovery overhead on very small samples.
- GEO answer blocks budget is 1,700 bytes per answer block, with product blocks plus application blocks per locale.
- GEO all-products budget is 9,000 bytes per product per locale.
- Catalog index build budget is 2 seconds for 300 products and 5 seconds for 1000 products.

## Latest QA / Scale / DevOps gate closure

Date: 2026-07-02.

Fresh gate results from Thread 05:

- `npm run lint` - Pass, exit 0, local quality gate returned `{ "ok": true }`.
- `npm run typecheck` - Pass, exit 0.
- `npm run validate:boundaries` - Pass, exit 0, 62 files checked, 0 violations.
- `npm run validate:domain` - Pass, exit 0, `mock-domain`, 20 product records.
- `npm run validate:seo` - Pass, exit 0, 300 products, 632 sitemap entries, 632 expected entries, 17 SEO files checked.
- `npm run validate:geo` - Pass, exit 0, 300 products, 1,206 expected answer blocks per locale, 6 application answer blocks per locale, 7 GEO files checked.
- `npm run validate:cms-facts` - Pass, exit 0, 300 generated CMS product facts, 300 generated SEO records, 300 generated GEO records.
- `npm run validate:scale-300` - Pass, exit 0, 632 sitemap entries, 1,206 GEO answer blocks per locale, catalog indexes built in 57 ms under the 2,000 ms budget.
- `npm run validate:scale-1000` - Pass, exit 0, 2,032 sitemap entries, 4,006 GEO answer blocks per locale, catalog indexes built in 165 ms under the 5,000 ms budget.
- `npm run build` - Pass, exit 0, Next.js 16.2.9 production build generated 83 static pages.

Targeted real CMS export replay from `tmp/real-cms-export.facts.json`:

- `npm run validate:seo -- --scale false` with `CMS_SOURCE_MODE=env-facts-json` and `CMS_FACTS_JSON` set from the export - Pass, exit 0, 2 products, 36 sitemap entries, 36 expected entries.
- `npm run validate:geo -- --scale false` with `CMS_SOURCE_MODE=env-facts-json` and `CMS_FACTS_JSON` set from the export - Pass, exit 0, 2 products, 14 expected answer blocks per locale, 6 application answer blocks per locale.

Current failing gates: none observed in this Thread 05 rerun.

Remaining risks:

- Synthetic scale fixtures intentionally reuse 20 overload-limit signatures; this remains fixture noise unless real CMS imports show the same duplication pattern.
- Node prints `--experimental-loader` warnings for the TypeScript import loader; warnings did not change exit codes.
- Future changes to localized static pages, especially `/company`, must update `scripts/site-structure.mjs`, `scripts/validate-seo.mjs`, `scripts/validate-scale.mjs`, and this checklist together.

## Regression triggers

- Update `scripts/site-structure.mjs` when localized entry pages, industries, applications, locales, or GEO answer block sources change.
- Update `scripts/validate-seo.mjs` when sitemap surfaces or hreflang requirements change.
- Update `scripts/validate-geo.mjs` when GEO document versions, endpoint contracts, or answer block kinds change.
- Update `scripts/validate-scale.mjs` when budgets, generated CMS fact shape, duplicate-risk checks, or catalog performance targets change.
- Re-run `npm run validate:scale-300`, `npm run validate:scale-1000`, and `npm run build` after any sitemap, GEO, CMS adapter, or product data model change.

## CMS fact safety

- CMS input must contain facts only: no CMS-provided slugs, canonical paths, breadcrumbs, SEO, JSON-LD, or GEO fields.
- Category graph must have one root, no cycles, max depth 4, and unique generated sibling slugs.
- Products must have unique ids, SKUs, and generated model slugs.
- Products must include source-backed measurements, overload limits, environmental limits, documents, and commercial terms.

## Deployment notes

- Run all gates locally or in CI before Vercel production deployment.
- Use `CMS_FACTS_JSON` in CI to validate real CMS exports with the same scripts.
- Keep TypeScript `strict` enabled; do not relax compiler settings to pass gates.
- Avoid running `npm run typecheck` concurrently with `npm run build` in CI because `.next/types` generation can create race-prone false negatives.
- If product count grows beyond the sitemap single-file budget, split sitemap output before deployment.
