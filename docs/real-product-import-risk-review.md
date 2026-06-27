# Real Product Import Risk Review

## Scope

This review covers only conflict risk before the first real product import.

Reviewed inputs:

- `docs/first-batch-import-template.md`
- `docs/product-data-governance-plan.md`
- `docs/cms-facts.example.json`
- `lib/domain/mock-products.ts`
- `adapter/validation.ts`

This document does not import real products, define UI, connect Strapi, or change the Domain contract.

## Final Decision

Mock product data must remain scaffold and local validation data only.

It can support local domain validation, catalog index checks, SEO/GEO projection checks, and scale fixture comparison. It must not be treated as a formal product source for the first real CMS batch.

The first real batch must be supplied as one complete `CmsFactInput` payload:

```ts
interface CmsFactInput {
  readonly categoryFacts: readonly CategoryFact[]
  readonly productFacts: readonly ProductFact[]
}
```

Do not merge real CMS facts with `mockProducts`. Replace the active input source at the import boundary when validating or publishing real data.

## Mock Data Isolation

Current roles:

| Source | Role | Import risk |
| --- | --- | --- |
| `lib/domain/mock-products.ts` | Local `ProductRecord` scaffold with generated SEO/GEO projections. | Must not be copied into CMS facts because it already contains domain projections and fixture values. |
| `lib/domain/product-source.ts` | Default local product source for `domain.product.records` and local catalog indexes. | Real rollout must not leave this as the published product source. |
| `docs/cms-facts.example.json` | Minimal adapter input example. | Example IDs and category shape are not real CMS records. |
| `adapter/validation.ts` | Real import boundary for facts-only validation. | Does not read `mockProducts`; it validates only the supplied payload. |
| `scripts/validate-domain.mjs` | Uses mock domain unless `CMS_FACTS_JSON` is set. | Default command output `source: mock-domain` does not prove a real payload is valid. |
| `scripts/validate-cms-facts.mjs` | Uses `--file`, `CMS_FACTS_JSON`, stdin, or generated scale fixtures. | For a real import, output source must be `file`, `CMS_FACTS_JSON`, or stdin, not `scale-fixture`. |

Isolation rule:

- Mock `ProductRecord` data is allowed for repository scaffold tests.
- Real CMS facts must be validated through `normalizeCmsFactInput` and `buildDomainFromCmsFacts`.
- Generated fields from mock records, such as `identity`, `classification`, `seo`, `localizedSeo`, `geoAi`, `localizedGeoAi`, `slug`, `canonicalPath`, and `breadcrumb`, are forbidden in CMS fact input.
- Any real product based on a mock-like model must be rebuilt from source-backed facts, not copied from the mock record.

## Mock Impact Assessment

The current mock data does not automatically contaminate real CMS import if the real import is passed as a separate `CmsFactInput` payload.

Why:

- `adapter/validation.ts` validates only the payload supplied to it.
- `buildDomainFromCmsFacts` builds category tree and product records from the supplied CMS facts, not from `mockProducts`.
- `validate:cms-facts -- --file path/to/cms-facts.json` uses the file payload as the source.
- `validate:domain` can validate real facts only when `CMS_FACTS_JSON` is set.

Residual risk:

- The default domain entry still points to mock products through `product-source.ts`.
- A real import can be falsely assumed valid if only the default `npm run validate:domain` is run and the output still says `source: mock-domain`.
- Real data can conflict with mock IDs only if a future integration accidentally merges mock records and CMS facts instead of replacing the source.
- Some mock product IDs and template examples use realistic `prd_yf_*`, `YF-*`, and `doc_yf_*` patterns. These must not be blindly reused as CMS seed records.

## Reuse Recommendation

Do not reuse mock product rows as formal CMS content.

Allowed uses:

- Use mock rows as shape examples for developers.
- Use mock products for local scaffold and regression checks.
- Use category ID concepts only when the real taxonomy meaning is identical and the real CMS category facts intentionally own that taxonomy.

Not allowed:

- Do not seed CMS from `mockProducts`.
- Do not reuse generated SEO/GEO text from mock records.
- Do not treat mock datasheet hrefs, evidence IDs, source refs, or commercial terms as source-backed data.
- Do not mix mock products with real CMS facts in one domain build.

If a real product genuinely has the same model as a mock product, create a new real `ProductFact` from source documents. Reusing the same product ID is acceptable only as a deliberate replacement of scaffold data, never as a merge with mock records.

## ID Conflict Checks Before Real Import

### Category IDs

Check:

- Every category ID starts with `cat_`.
- Category IDs are unique inside the real payload.
- Exactly one root category has `parentId: null`.
- Every non-root parent exists in the same payload.
- No category graph cycles exist.
- Maximum depth is 4.
- Sibling category names generate unique slugs in the default locale.

Risk notes:

- `docs/cms-facts.example.json` is a minimal adapter example and places `cat_pressure_transmitters` and `cat_temperature_transmitters` directly under `cat_industrial_sensors`.
- The mock taxonomy has deeper paths through categories such as `cat_pressure_sensors` and `cat_temperature_measurement`.
- Before real import, decide whether the CMS category facts intentionally replace the mock taxonomy paths. Category path changes change generated canonical product paths.

Hard reject when:

- A real category ID is reused for a different taxonomy concept.
- Two siblings normalize to the same slug.
- A category is added only to carry SEO keywords rather than navigation, filtering, or procurement meaning.

### Product IDs

Check:

- Every product ID starts with `prd_`.
- Product IDs are unique inside the real payload.
- Product IDs are checked against any previously imported real CMS products.
- Deleted or discontinued product IDs are not reused for different products.
- Product IDs do not encode locale, category path, lifecycle, or document revision.

Risk notes:

- Mock IDs such as `prd_yf_p100` are scaffold IDs. They should not reserve real catalog identity unless the business confirms the matching real product.
- If mock and real records are ever merged, product ID conflicts must block import.

### SKUs

Check:

- SKUs are unique across the full real catalog, not only the first batch.
- SKUs represent commercial order codes.
- Variant order codes are stored in `variants[].orderCode`, not duplicated as separate product SKUs unless the variant has distinct product identity.

Hard reject when:

- Two product facts share the same SKU.
- A product SKU duplicates a variant order code that should belong under another product.
- A temporary internal ordering code is used as the stable commercial SKU.

### Models and Slugs

Check:

- `model` is non-empty.
- Generated model slug is unique across the payload and existing real catalog.
- Models that differ only by spacing, punctuation, or case are treated as possible conflicts.

Examples that normalize to the same slug:

```txt
YF-P100
YF P100
YF_P100
yf-p100
```

Hard reject when:

- Two product facts generate the same model slug.
- The same generated canonical path would be produced for two products.
- The model includes category text or mutable marketing phrases.

### Category Assignments

Check:

- `primaryCategoryId` exists in `categoryFacts`.
- `additionalCategoryIds` exist in `categoryFacts`.
- A product does not repeat its primary category in `additionalCategoryIds`.
- Additional category IDs are unique per product.
- `measurementKinds` match the product's measurement rows.

Hard reject when:

- A product references a missing category.
- A product is assigned to a category only for SEO coverage.
- The category assignment would move the generated canonical path away from the intended procurement taxonomy.

### Document IDs

Check:

- Every document ID starts with `doc_`.
- Document IDs are globally unique across the real payload.
- Every product has at least one document, preferably a datasheet.
- `href` is stable and points to the intended source file.
- `locale` and `revision` are present when the source document is localized or revised.

Recommended pattern for real documents:

```txt
doc_{model_normalized}_{kind}_{locale_or_revision_if_needed}
```

Examples:

```txt
doc_yf_p100_datasheet_en_v1
doc_yf_p100_certificate_ce_en_v1
```

Risk notes:

- `validate:cms-facts` reports `duplicateRisks.documentDuplicates`, but duplicate documents are a risk summary and must be treated as an import rejection even if a command exits successfully.
- Source refs currently validate ID prefix and confidence, but source ref existence still needs an import-owner cross-check against `documents[]` or an approved `evidence_` registry.

## Additional Reference Checks

These are not the main requested conflict keys, but they matter before real import:

- `asset_` IDs should be unique across the payload.
- `var_` IDs should be unique across the payload.
- Variant `orderCode` values should not collide with unrelated product SKUs.
- `evidence_` IDs should be stable and traceable to engineering notes, tests, or reviews.
- `sourceRefs[].id` should point to a real `doc_` or `evidence_` source.
- Unknown spec keys must be rejected while registry validation is enabled.

## Pre-Import Commands

For repository scaffold regression:

```bash
npm run validate:cms-facts
npm run validate:domain
npm run validate:scale-1000
```

For a real CMS payload file:

```bash
npm run validate:cms-facts -- --file path/to/cms-facts.json
```

Then validate the same payload through the domain validator instead of the default mock source:

```powershell
$env:CMS_FACTS_JSON = Get-Content -Raw -LiteralPath "path\to\cms-facts.json"
npm run validate:domain
Remove-Item Env:\CMS_FACTS_JSON
```

Then run the scale regression gate:

```bash
npm run validate:scale-1000
```

Expected source labels:

- `validate:cms-facts -- --file ...` should print `source: file`.
- `validate:domain` with `CMS_FACTS_JSON` should print `source: CMS_FACTS_JSON`.
- A real import is not validated if `validate:domain` prints `source: mock-domain`.
- A real import is not validated if `validate:cms-facts` prints `source: scale-fixture`.

## Output Review Gate

After running `validate:cms-facts` on a real payload, inspect `duplicateRisks`.

Reject the batch when any of these are non-empty or non-zero:

- `categoryIdDuplicates`
- `productIdDuplicates`
- `skuDuplicates`
- `modelDuplicates`
- `documentDuplicates`
- `missingCategories`
- `productsMissingOverloadLimit`

Also review `overloadLimitRisk.duplicateSignatures` manually. Duplicate measurement signatures may be legitimate for configurable families, but in the first real batch they often indicate copied fixture values or unreviewed source rows.

## First Real Import Go/No-Go Checklist

Go only when all statements are true:

1. The payload is a facts-only `CmsFactInput` object.
2. No generated SEO, GEO, slug, canonical path, breadcrumb, identity, or classification fields are present.
3. The payload is not copied from `mockProducts`.
4. Category facts are the intended real taxonomy source.
5. Product IDs, SKUs, model slugs, and document IDs are unique across the real payload and prior real imports.
6. Every product category reference exists.
7. Every product has documents and traceable source refs for comparison-critical and GEO-eligible facts.
8. `validate:cms-facts` is run against the real file or real JSON, not scale fixtures.
9. `validate:domain` is run with the same real payload through `CMS_FACTS_JSON`.
10. `validate:scale-1000` still passes after the import boundary is accepted.

## Boundary Decision

The safest path for the first real import is source replacement, not source merging.

Keep mock data in the repository as scaffold. Treat real CMS facts as the single source of truth for imported products. If any mock-like identity is reused, it must be because the real product owner has confirmed the identity and supplied source-backed facts, not because the scaffold row already exists.
