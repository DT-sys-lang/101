# Product Data Governance Plan

## Scope

This document defines product data governance for the first real CMS ingestion batch and the path from 300 to 1000+ industrial products.

It applies to:

- `ProductRecord`
- `CategoryTree`
- `SpecificationDefinition`
- adapter `CmsFactInput`
- CMS fact aggregation output

It does not define UI, Strapi implementation code, SEO generation logic, or a new architecture version.

## Architecture Stability Review

### ProductRecord

`ProductRecord` is stable enough for 300 to 1000+ industrial products.

Reasons:

- Identity, classification, content, measurements, outputs, connections, environmental limits, specifications, variants, certifications, documents, assets, commercial terms, SEO, and GEO are separated into explicit blocks.
- `measurements`, `outputs`, and `specificationGroups` are non-empty at the domain boundary.
- `measurements` hold normalized range/value facts, while `specificationGroups` hold governed display rows and source references.
- SEO and GEO are present on `ProductRecord` only as generated domain projections, not as CMS-authored facts.
- `ProductCatalogIndex` derives list, route, category, facet, lifecycle, output, certification, and search indexes from records instead of requiring UI-side scanning.

Governance decision: keep `ProductRecord` stable. Add new industrial parameters through `SpecificationDefinition`, not by adding ad hoc top-level product fields.

### SpecificationDefinition

`SpecificationDefinition` is stable enough for first CMS ingestion.

Reasons:

- Each governed spec key has a localized label, value type, optional unit family, optional allowed units, category scope, facet policy, comparison policy, datasheet policy, and GEO policy.
- Adapter validation can reject unknown spec keys by default through the registry.
- Unit governance is centralized in `specificationUnitFamilyUnits`.
- `facet` represents filterability and `comparison` represents comparability.
- Searchability remains a derived catalog-index concern, which avoids letting CMS control search ranking or generated search text.

Governance decision: registry changes require domain review. CMS editors may use registry keys but may not create new parameter semantics in product rows.

### CategoryTree

`CategoryTree` is stable enough for 300 to 1000+ products.

Reasons:

- Category depth is capped at 4.
- Nodes carry stable IDs, parent IDs, kind, slug, slug path, canonical path, localized names, sort order, facet keys, and SEO template input.
- Adapter validation rejects category graph cycles, multiple roots, depth over 4, unknown parents, and duplicate sibling slugs.
- Product filtering can include descendant categories through precomputed descendant sets.

Governance decision: the category tree remains the single taxonomy backbone. Add categories sparingly and only when they change navigation, filtering, or procurement meaning.

## CMS First Batch Readiness

The first real CMS batch should be treated as a controlled import, not open-ended content entry.

Minimum batch requirements:

- At least one complete root category and all categories referenced by products.
- Every product has a unique `prd_` ID, SKU, model, and generated model slug.
- Every product references one valid primary category.
- Every product includes measurements, outputs, connections, environmental limits, specification groups, documents, certifications, and commercial terms.
- Every measurement includes `overloadLimit`.
- Every product has at least one datasheet document.
- Every GEO-eligible spec value has source evidence or a source-backed document reference.
- No CMS payload includes generated fields such as slug, canonical path, SEO, JSON-LD, GEO, category path, breadcrumb, identity, or classification.

## Product ID / SKU / Model Rules

### Product ID

Rules:

- Must start with `prd_`.
- Must be stable for the life of the product record.
- Must not include locale, category slug, lifecycle state, or revision.
- Must not be reused after deletion or discontinuation.
- Should be lowercase snake case.

Recommended pattern:

```txt
prd_{series}_{model_normalized}
```

Examples:

```txt
prd_yf_p100
prd_yf_dp20
prd_yf_lt80
```

### SKU

Rules:

- Must be unique across all product facts.
- Represents the commercial ordering code, not the generated web slug.
- May include uppercase letters, digits, and hyphens.
- Must remain stable for customer-facing documents and RFQ flows.
- If a sellable configuration has multiple order codes, store the primary SKU on the product and variant order codes in `variants[].orderCode`.

Examples:

```txt
YF-P100-420MA-G14-M12
YF-DP20-010V-KPA
```

### Model

Rules:

- Must be unique after adapter slug normalization.
- Must not depend on category path or language.
- Must be stable enough to use in canonical product URLs.
- Must not include marketing claims that may change.

Examples:

```txt
YF-P100
YF-DP20
YF-LT80
```

Generated model slug examples:

```txt
yf-p100
yf-dp20
yf-lt80
```

## Category Depth and New Category Rules

### Depth Rules

Allowed depths:

- `0`: catalog root
- `1`: measurement family or major product family
- `2`: measurement principle or product function
- `3`: series group or specialized grouping
- `4`: reserved maximum depth for future specialized branches

Hard rules:

- Exactly one root category.
- Maximum depth is 4.
- No cycles.
- Every parent must exist.
- Sibling category names must generate unique slugs.
- CMS may provide only `id`, `parentId`, and localized `name`; the adapter derives slug, depth, path, children, breadcrumb, and category SEO.

### New Category Decision Rules

Create a new category only when at least one is true:

- Buyers search and compare the group as a separate procurement class.
- The group requires different filters or comparison columns.
- The group has distinct measurement principle, product function, or installation semantics.
- The group needs its own SEO/indexable listing path.
- The group will contain enough products to avoid an empty or thin category.

Do not create a new category for:

- One-off product features.
- Temporary campaigns.
- Locale-specific wording differences.
- A single SKU variant.
- SEO keyword stuffing.

## Specification Registry Governance

### Registry Ownership

The registry is the source of truth for product parameter semantics.

Rules:

- Every product spec value key must exist in `defaultSpecificationRegistry` when validation is enabled.
- New keys require domain owner review before CMS import.
- `ProductSpecificationGroup.key` is an authoring bucket only; it does not define semantics.
- Labels may localize, but the spec key must remain stable.
- Registry keys must not encode category, unit, locale, or display text.

### Required Definition Fields

Every new `SpecificationDefinition` must define:

- `key`
- `label.en` and `label.zh`
- `valueType`
- `appliesToCategoryIds`
- `facet`
- `comparison`
- `datasheet`
- `geo`

If units are used, it must also define:

- `unitFamily`
- `allowedUnits`

### Unit Rules

- `allowedUnits` must stay inside the declared `unitFamily`.
- Use `measurement` for cross-domain range displays such as pressure, level, and temperature spans.
- Use narrower families when possible: `pressure`, `temperature`, `length`, `current`, `voltage`, `frequency`, `percent`, `cycles`, `dimensionless`, or `custom`.
- Use `custom` only for values that cannot normalize to existing units.

### Value Type Rules

- `string`: formatted technical values and human-readable facts.
- `number`: normalized numeric scalar values.
- `boolean`: binary yes/no facts.
- `enum`: controlled single value.
- `multi-enum`: controlled list semantics represented as a scalar display value in v1.
- `range`: reserved for a future structured value model; do not weaken current scalar product values to support it prematurely.

### Facet and Comparison Rules

- `facet.enabled` means the spec may drive filtering.
- `comparison.enabled` means the spec may drive side-by-side comparison and parameter tables.
- `comparison.normalize` should be true only when values can be reliably normalized across units or formats.
- Facet and comparison priorities must be stable across locales.

### GEO Rules

- `geo.includeInFactTable` should be true only for stable, source-backed facts.
- `geo.claimType` must match the meaning of the value.
- Promotional claims and unverified editorial text must not be GEO facts.

## Datasheet / SourceRefs / Evidence Rules

### Product Documents

Every product must include at least one `ProductDocument`.

Rules:

- Datasheets should use `kind: 'datasheet'`.
- Document IDs must start with `doc_`.
- Documents need stable `href` values from the CMS aggregator or CDN.
- Use `revision` whenever the source document has a revision.
- Use `locale` when the document is language-specific.

Recommended document ID pattern:

```txt
doc_{product_model_normalized}_datasheet
```

Example:

```txt
doc_yf_p100_datasheet
```

### Source References

Use `sourceRefs` on spec values when the value is important for filtering, comparison, datasheets, or GEO.

Rules:

- `sourceRefs[].id` must start with `doc_` or `evidence_`.
- `sourceRefs[].label` must identify the source clearly.
- `sourceRefs[].confidence` must be one of `source-backed`, `derived`, `editorial`, or `unverified`.
- GEO fact table candidates should be `source-backed` whenever possible.
- Use `page` when the datasheet page is known.
- Do not use a source reference to hide uncertain data; mark uncertainty with confidence.

### Evidence References

Use `evidence_` IDs for non-document source records such as engineering notes, test records, or verified internal decisions.

Rules:

- Evidence IDs must be stable.
- Evidence must not be invented for marketing text.
- Evidence should point back to a document, engineering note, test report, or product engineering review.
- If a spec value lacks evidence, it may still exist in the product record, but it should not be promoted to GEO fact tables.

## CMS Entry Quality Gate

Before importing or publishing the first real batch:

1. Aggregate CMS data to `CmsFactInput`.
2. Run `normalizeCmsFactInput(cmsFacts)`.
3. Run `buildDomainFromCmsFacts(cmsFacts)`.
4. Run `npm run validate:cms-facts` against the aggregated payload.
5. Run `npm run validate:domain` against the active domain source.
6. Run `npm run validate:scale-1000` as the scale regression gate.

Reject the batch if any of these are true:

- Duplicate product IDs, SKUs, or generated model slugs.
- Category graph has multiple roots, cycles, unknown parents, duplicate sibling slugs, or depth above 4.
- Product category references are missing.
- `measurementKinds` do not match measurement records.
- Measurement records are missing `overloadLimit`.
- Environmental limits lack both media and ambient temperature.
- `wettedMaterials` or `compatibleMedia` are empty.
- Specification groups are empty.
- Spec keys are unknown under registry validation.
- Required documents are missing.
- CMS payload includes generated fields.

## 1000+ Product Expansion Risks

### Risk: Spec Key Drift

Symptoms:

- Editors create similar keys such as `range`, `measurementRange`, `measuring_range`, and `span`.

Controls:

- Keep registry validation enabled by default.
- Review new keys in domain PRs before CMS import.
- Maintain a spec key migration table when consolidating old fields.

### Risk: Category Overgrowth

Symptoms:

- Thin categories with one or two products.
- SEO-only taxonomy branches.
- Deep trees that exceed buyer navigation needs.

Controls:

- Keep max depth at 4.
- Require business/filtering rationale for new categories.
- Prefer specs, facets, applications, or industries for non-taxonomy grouping.

### Risk: Evidence Gaps

Symptoms:

- Product detail has values that cannot be traced to datasheets or engineering sources.
- GEO summaries repeat unsupported claims.

Controls:

- Require at least one document per product.
- Require sourceRefs for comparison-critical and GEO-eligible specs.
- Track confidence on every evidence reference.

### Risk: Duplicate Routes

Symptoms:

- Different models normalize to the same slug.
- Category renames unintentionally move product canonical paths.

Controls:

- Validate generated model slug uniqueness.
- Treat category renames as route migrations.
- Do not store slugs in CMS; generate them in adapter/domain only.

### Risk: Slow Catalog Operations

Symptoms:

- Filtering or search scans all product fields on every request.
- Large lists create repeated derived work.

Controls:

- Build `ProductCatalogIndex` per locale.
- Use set intersections for filters.
- Keep search token generation derived and cacheable.
- Run `validate:scale-1000` before catalog schema changes.

### Risk: Variant Explosion

Symptoms:

- Each configurable option becomes a full product record.
- Product families become hard to compare.

Controls:

- Use `variants` for sellable configurations under a stable product model.
- Promote a variant to a product only when it has distinct model identity, datasheet, category, or search demand.

## First CMS Batch Checklist

For each category:

- `factId` starts with `cat_`.
- `parent` is correct or null for the single root.
- `name.en` and `name.zh` are present.
- No generated fields are present.

For each product:

- `factId` starts with `prd_`.
- `sku` is unique.
- `model` is unique after slug normalization.
- `seriesId` starts with `ser_`.
- `brand`, `lifecycle`, `availability`, and `revisedAt` are present.
- `primaryCategory` exists.
- `measurementKinds` match `measurements[].kind`.
- `measurements[]`, `outputs[]`, `connections`, `environmentalLimits`, `specificationGroups[]`, `documents[]`, and `commercialTerms` are complete.
- `documents[]` includes a datasheet where available.
- `specificationGroups[].values[].key` exists in registry.
- GEO-eligible values have source-backed document or evidence references.
- No generated SEO/GEO/routing fields are present.

## Final Decision

The current product data model can carry the 300 to 1000+ industrial product target without changing Architecture Freeze v1.

The first real CMS batch should focus on data discipline, not schema expansion. The stable path is:

1. Keep CMS as facts only.
2. Keep product semantics in `ProductRecord`.
3. Keep taxonomy in `CategoryTree`.
4. Keep parameter semantics in `SpecificationDefinition`.
5. Keep list/search/detail behavior derived through `ProductCatalogIndex` and adapters.
