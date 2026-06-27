# Real CMS Export Dry Run Report

Date: 2026-06-25

## Scope

This dry run validates the pipeline from a Strapi-shaped export into direct `CmsFactInput`, then into Domain, SEO, and GEO projections.

A temporary export envelope was created under `tmp/` from the checked-in facts example so the run stayed local and did not alter mock data or repository examples.

## Sample Artifacts

- Raw export sample: `tmp/real-cms-export.raw.json`
- Transformed facts: `tmp/real-cms-export.facts.json`
- Checked-in reference facts: `docs/cms-facts.example.json`
- Checked-in reference transformed facts: `docs/cms-facts.transformed.example.json`

The transformed temp output is JSON-equivalent to both checked-in example files.

## Pipeline Results

- `node --loader ./scripts/ts-import-loader.mjs ./scripts/transform-cms-export.mjs --file tmp/real-cms-export.raw.json --out tmp/real-cms-export.facts.json`
  - `ok: true`
  - `categoryFacts: 3`
  - `productFacts: 2`

- `node --loader ./scripts/ts-import-loader.mjs ./scripts/validate-cms-export.mjs --file tmp/real-cms-export.facts.json`
  - `ok: true`
  - `source: file`
  - `categoryFacts: 3`
  - `productFacts: 2`

- `npm run validate:cms-facts -- --file tmp/real-cms-export.facts.json`
  - `ok: true`
  - `categoryTreeVersion: category-tree-v1`
  - `productRecords: 2`
  - `generatedSeoRecords: 2`
  - `generatedGeoRecords: 2`
  - `duplicateRisks.categoryIdDuplicates: []`
  - `duplicateRisks.productIdDuplicates: []`
  - `duplicateRisks.skuDuplicates: []`
  - `duplicateRisks.modelDuplicates: []`
  - `duplicateRisks.documentDuplicates: []`
  - `duplicateRisks.missingCategories: []`
  - `duplicateRisks.productsMissingOverloadLimit: 0`
  - `duplicateRisks.overloadLimitRisk.duplicateSignatureCount: 0`

- PowerShell replay:
  ```powershell
  $env:CMS_FACTS_JSON = Get-Content -Raw -LiteralPath 'tmp/real-cms-export.facts.json'
  npm run validate:domain
  Remove-Item Env:\CMS_FACTS_JSON
  ```
  - `ok: true`
  - `source: CMS_FACTS_JSON`
  - `categoryTreeVersion: category-tree-v1`
  - `maxDepth: 4`
  - `productRecords: 2`
  - `enIndexProducts: 2`
  - `zhIndexProducts: 2`

- `npm run validate:boundaries`
  - `ok: true`
  - `filesChecked: 61`
  - `violations: 0`

- `npm run typecheck`
  - `ok: true`

## Generated-Field Scan

A recursive scan of `tmp/real-cms-export.facts.json` found no occurrences of:

- `slug`
- `slugPath`
- `canonical`
- `canonicalPath`
- `breadcrumb`
- `seo`
- `localizedSeo`
- `jsonLd`
- `jsonLD`
- `geo`
- `geoAi`
- `localizedGeoAi`
- `geoEntity`
- `entity`
- `identity`
- `classification`
- `categoryPath`
- `depth`
- `children`

## Conflict Risk

The dry-run sample has no observed identity conflicts:

- Category ID duplicates: none
- Product ID duplicates: none
- SKU duplicates: none
- Model duplicates: none
- Missing categories: none
- Missing overload limits: `0`
- Duplicate overload signatures: `0`

## Repository Gate Note

The default `npm run validate:cms-facts` command also passed on the synthetic scale fixture.

That fixture reported `duplicateSignatureCount: 20` in `overloadLimitRisk`, which is expected synthetic fixture noise and not a collision in the dry-run sample.

## Verdict

The dry-run path is green for Strapi-shaped export -> `CmsFactInput` -> Domain -> SEO/GEO.

No real product import was performed, and mock data files were not modified.
