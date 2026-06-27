# CMS Export Dry Run Report

## Input File

- Source export: `docs/cms-facts.example.json`
- Shape: already-valid `CmsFactInput` with `categoryFacts` and `productFacts`
- Contents: 3 category facts, 2 product facts
- Derived fields observed: none

## Transform Result

Command:

```powershell
node --loader ./scripts/ts-import-loader.mjs ./scripts/transform-cms-export.mjs --file .\docs\cms-facts.example.json --out .\docs\cms-facts.transformed.example.json
```

Result:

```json
{
  "ok": true,
  "outputPath": ".\\docs\\cms-facts.transformed.example.json",
  "categoryFacts": 3,
  "productFacts": 2
}
```

Compatibility conclusion: `scripts/transform-cms-export.mjs` accepts an export that is already `CmsFactInput`; it does not require a Strapi envelope. The transformed output remains facts-only.

## `validate:cms-facts` Result

Original input command:

```powershell
npm run validate:cms-facts -- --file .\docs\cms-facts.example.json
```

Original input result: passed with 3 category facts, 2 product facts, 2 generated `ProductRecord` entries, 2 generated SEO records, and 2 generated GEO records.

Transformed output command:

```powershell
npm run validate:cms-facts -- --file .\docs\cms-facts.transformed.example.json
```

Transformed output result: passed with 3 category facts, 2 product facts, 2 generated `ProductRecord` entries, 2 generated SEO records, and 2 generated GEO records.

## Domain Validation Result

Command:

```powershell
npm run validate:domain
```

Result: passed on the default mock-domain source with 20 domain products and valid EN/ZH catalog indexes.

## Failures And Risks

- No validation failures were observed in the dry run.
- No derived-field leakage was observed in the source or transformed facts.
- Duplicate risk summary for the transformed output reported no duplicate category ids, product ids, SKUs, models, documents, or missing categories.
- `productsMissingOverloadLimit` was `0` and `duplicateSignatureCount` was `0` for the transformed output.
- Node emitted the existing experimental `--loader` warning; this is a runtime warning from the loader mechanism, not a CMS facts failure.
