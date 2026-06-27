# First Real Product Import Governance

## Scope

This document defines the governance rules for the first real product import.

It is based on:

- `docs/real-cms-export-dry-run-report.md`
- `docs/product-data-governance-plan.md`
- `docs/real-product-import-risk-review.md`
- `docs/first-batch-import-template.md`
- `adapter/validation.ts`
- `lib/domain/product.ts`
- `lib/domain/specification.ts`

This document does not import real products, change UI, change Strapi implementation, or change the Domain contract.

## Dry-Run Review

The dry-run report proves that the local Strapi-shaped export path can produce valid facts:

- transform export to `CmsFactInput`: passed
- validate transformed facts: passed
- build Domain records from facts: passed
- generate SEO/GEO projections from Domain records: passed
- generated-field scan: no forbidden fields found
- duplicate identity checks in the dry-run sample: clean

Important limitation:

- the dry-run used a local sample under `tmp/`
- the dry-run did not import real products
- the dry-run did not replace the active runtime source
- the dry-run did not prove future real product identities are conflict-free

Therefore, the dry-run is a pipeline readiness signal, not import approval.

## Final Import Decision Rule

The first real product import must **replace the active product source**.

It must not merge real CMS facts with `mockProducts`.

Allowed source states:

| Stage | Active source rule |
| --- | --- |
| Local scaffold | `mockProducts` may remain active for development and validation. |
| Real export validation | Real facts are supplied as a complete `CmsFactInput` file or `CMS_FACTS_JSON`. |
| First real import acceptance | The active source must be the real `CmsFactInput` payload, not mock plus real rows. |
| Rollback | Use a complete known-good `CMS_FACTS_JSON` export, or fall back to mock only as an explicit emergency scaffold state. |

Hard reject:

- any import process that appends real `productFacts` to `mockProducts`
- any import process that treats mock records as existing real CMS products
- any import process that copies mock-generated SEO/GEO fields into CMS facts
- any validation report where the operator claims real import readiness while `validate:domain` still reports `source: mock-domain`

## Source Isolation Rules

Mock data may be used only for:

- scaffold validation
- local catalog and SEO/GEO projection checks
- field-shape examples for developers
- fallback smoke tests when no real payload exists

Mock data may not be used for:

- CMS seed content
- real Product ID reservation
- real SKU/model/document ownership
- source-backed datasheets or evidence refs
- real commercial terms
- generated SEO/GEO text

If a real product resembles a mock product, it must still be rebuilt from source-backed CMS facts. Reusing a mock-like ID is allowed only when the business confirms it is the same real product and the import replaces the scaffold record rather than merging with it.

## CMS-Authored Fields

CMS or the import aggregator must provide these facts.

### Category Facts

Required CMS fields:

- `categoryFacts[].id`
- `categoryFacts[].parentId`
- `categoryFacts[].name.en`
- `categoryFacts[].name.zh`

Rules:

- `id` must start with `cat_`.
- exactly one category must have `parentId: null`.
- parent IDs must exist in the same payload.
- category depth must not exceed 4 after adapter derivation.

### Product Identity Facts

Required CMS fields:

- `productFacts[].id`
- `productFacts[].sku`
- `productFacts[].model`
- `productFacts[].seriesId`
- `productFacts[].brand`
- `productFacts[].lifecycle`
- `productFacts[].availability`
- `productFacts[].revisedAt`

Optional CMS fields:

- `productFacts[].manufacturer`
- `productFacts[].releasedAt`

Rules:

- product IDs must start with `prd_`.
- series IDs must start with `ser_`.
- SKU must be the commercial order code.
- model must be stable and must generate a unique slug.

### Product Classification Facts

Required CMS fields:

- `productFacts[].primaryCategoryId`
- `productFacts[].industryIds`
- `productFacts[].applicationIds`
- `productFacts[].measurementKinds`

Optional CMS fields:

- `productFacts[].additionalCategoryIds`

Rules:

- every category reference must exist in `categoryFacts`.
- `measurementKinds` must match `measurements[].kind`.
- category assignment must reflect procurement taxonomy, not SEO keyword stuffing.

### Product Content Facts

Required CMS fields:

- `productFacts[].name.en`
- `productFacts[].name.zh`
- `productFacts[].shortName.en`
- `productFacts[].shortName.zh`
- `productFacts[].summary.en`
- `productFacts[].summary.zh`
- `productFacts[].highlights[]`
- `productFacts[].applications[]`

Rules:

- localized fields must include `en` and `zh` for the first batch.
- summary and highlights must be factual and source-aligned.
- do not store generated title, meta description, h1, or AI summary as CMS facts.

### Technical Product Facts

Required CMS fields:

- `productFacts[].measurements[]`
- `productFacts[].outputs[]`
- `productFacts[].connections`
- `productFacts[].environmentalLimits`
- `productFacts[].specificationGroups[]`
- `productFacts[].documents[]`
- `productFacts[].commercialTerms`

Optional CMS fields:

- `productFacts[].variants[]`
- `productFacts[].certifications[]`
- `productFacts[].assets[]`

Rules:

- every product must have at least one measurement.
- every adapter-boundary measurement must include `overloadLimit`.
- every product must have at least one output.
- every product must have process and electrical connection data.
- environmental limits must include media or ambient temperature.
- `wettedMaterials` and `compatibleMedia` must be non-empty.
- every product must have at least one document.
- specification keys must exist in `defaultSpecificationRegistry`.

## Adapter-Generated Fields

These fields must be generated by adapter/domain projections and must not be authored in CMS facts:

### Category Generated Fields

- `canonical`
- `slug`
- `depth`
- `slugPath`
- `canonicalPath`
- `children`
- `breadcrumb`
- `seo`
- `seo.canonicalPath`

### Product Generated Fields

- `canonical`
- `slug`
- `identity`
- `classification`
- `categoryPath`
- `slugPath`
- `canonicalPath`
- `breadcrumb`
- `seo`
- `localizedSeo`
- `jsonld`
- `jsonLd`
- `jsonLD`
- `geoAi`
- `geo`
- `localizedGeoAi`
- `geoEntity`
- `entity`

Hard reject:

- any CMS payload containing these generated fields
- any Strapi export transformer that maps CMS fields into these generated fields
- any spreadsheet tab that asks editors to author these fields

## Conflict Check Checklist

### Product ID

Check:

- all IDs start with `prd_`
- no duplicate product IDs in the real payload
- no duplicate product IDs against prior real imports
- no real product silently reuses a mock ID unless it is a deliberate scaffold replacement
- deleted/discontinued product IDs are not reassigned to different products

Reject when:

- `duplicateRisks.productIdDuplicates` is non-empty
- a real ID conflicts with a retained mock record in a merged source
- an ID encodes locale, category path, revision, or lifecycle state

### SKU

Check:

- every product SKU is non-empty
- SKUs are unique across the full real catalog
- product SKU does not duplicate another product SKU
- product SKU does not duplicate a variant order code under an unrelated model

Reject when:

- `duplicateRisks.skuDuplicates` is non-empty
- a temporary internal code is used as the stable commercial SKU
- one configurable family is split into many product rows only because it has multiple order codes

### Model and Generated Slug

Check:

- every model is non-empty
- model values normalize to unique slugs
- punctuation/case/spacing variants are treated as possible collisions

Examples that collide:

```txt
YF-P100
YF P100
YF_P100
yf-p100
```

Reject when:

- `duplicateRisks.modelDuplicates` is non-empty
- two products produce the same generated canonical path
- model contains category text or mutable marketing claims

### Document ID

Check:

- all document IDs start with `doc_`
- document IDs are globally unique across the real payload
- every product has at least one document
- datasheet documents use `kind: 'datasheet'`
- `href`, `locale`, and `revision` are stable where available

Reject when:

- `duplicateRisks.documentDuplicates` is non-empty
- a source ref points to a non-existent `doc_` or unapproved `evidence_` ID
- a mock datasheet href or evidence ref is reused as real source evidence

### Category

Check:

- category IDs start with `cat_`
- exactly one root exists
- parent IDs exist
- no cycles exist
- generated sibling slugs are unique
- depth is no more than 4
- every product `primaryCategoryId` and `additionalCategoryIds[]` exists

Reject when:

- `duplicateRisks.categoryIdDuplicates` is non-empty
- `duplicateRisks.missingCategories` is non-empty
- the first batch changes taxonomy meaning by reusing a mock category ID for a different buyer concept

### Specification Keys

Check:

- every `specificationGroups[].values[].key` exists in `defaultSpecificationRegistry`
- value type matches registry policy
- unit is allowed by registry when provided
- comparison-critical and GEO-eligible values have source refs

Reject when:

- adapter validation reports unknown specification keys
- a new spec key is created only to avoid data cleanup
- a value has unit drift outside the allowed unit family

## First Import Go/No-Go Gate

Go only when all statements are true:

1. The real payload is a complete `CmsFactInput` object.
2. The payload replaces the active product source for validation.
3. The payload is not merged with `mockProducts`.
4. The payload has no generated adapter/domain fields.
5. Product ID, SKU, model slug, category, and document ID checks are clean.
6. Every product has source-backed documents or evidence refs for comparison-critical facts.
7. `npm run validate:cms-facts -- --file path/to/cms-facts.json` prints `source: file` and `ok: true`.
8. `npm run validate:domain` is run with the same payload through `CMS_FACTS_JSON` and prints `source: CMS_FACTS_JSON` and `ok: true`.
9. `duplicateRisks` is reviewed manually and all identity/document/category arrays are empty.
10. No Domain contract change is required to accept the batch.

No-Go when any statement is false.

## Required Validation Commands

Repository scaffold validation:

```bash
npm run validate:cms-facts
npm run validate:domain
```

Real payload validation:

```bash
npm run validate:cms-facts -- --file path/to/cms-facts.json
```

PowerShell domain replay for the same real payload:

```powershell
$env:CMS_FACTS_JSON = Get-Content -Raw -LiteralPath "path\to\cms-facts.json"
npm run validate:domain
Remove-Item Env:\CMS_FACTS_JSON
```

Interpretation rules:

- `validate:cms-facts` with no file validates fixture/scaffold behavior only.
- `validate:cms-facts -- --file ...` validates the real payload file.
- `validate:domain` with no `CMS_FACTS_JSON` validates the mock domain scaffold.
- `validate:domain` with `CMS_FACTS_JSON` validates the real payload replay.
- first import approval requires the real-payload variants, not only the scaffold variants.

## Blocking Items And Escalation

Do not change `ProductRecord`, `SpecificationDefinition`, `CategoryTree`, or adapter input contracts to make first-batch data easier to enter.

Escalate to the chief architect only when a real source-backed product cannot be represented after all of these checks:

1. the value does not fit measurements, outputs, connections, environmental limits, variants, documents, assets, certifications, or commercial terms
2. no existing specification key in `defaultSpecificationRegistry` fits
3. normalizing the source data would lose material industrial product meaning
4. rejecting the field would block real procurement, comparison, datasheet, or compliance requirements

Until the chief architect approves a contract change, the batch remains No-Go.

## Final Governance Decision

The first real product import is approved only as a full active-source replacement with facts-only CMS input.

Mock/scaffold records stay in the repository for local validation but must not participate in the real import source.

The adapter remains the only path from CMS facts to Domain-normalized product records.
