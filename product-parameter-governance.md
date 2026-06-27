# Product Parameter Governance Rules

## Scope

This document defines the governed specification layer for the industrial sensor catalog under Architecture Freeze v1.

It covers:

- specification dictionary design
- product-side specification value alignment
- category scope
- filterability, comparability, and searchability
- GEO eligibility
- long-term extension rules for 300 -> 1000+ products

It does not define UI, CMS implementation, or SEO generation logic.

## Canonical Contracts

- `SpecificationDefinition` is the dictionary entry that names a governed parameter.
- `ProductSpecificationValue` is the product-side value row.
- `ProductSpecificationGroup` is an authoring bucket only; it is not the source of truth for parameter semantics.
- `ProductRecord.specificationGroups` is the only product-side container for governed parameters.
- `ProductCatalogIndex` consumes product records and derived SEO/GEO projections for list, filter, compare, and search behavior.

## Governance Matrix

| Dimension | Definition field | Rule | Runtime use |
| --- | --- | --- | --- |
| Unit family | `unitFamily` + `allowedUnits` | `allowedUnits` must be a subset of the family and only present when units are meaningful. | Normalization and validation |
| Value type | `valueType` | The value type must match how the parameter is authored and displayed. | Validation and comparison |
| Filterable | `facet.enabled`, `facet.mode`, `facet.priority` | Only enabled specs may drive facet buckets. | Category/product filtering |
| Comparable | `comparison.enabled`, `comparison.normalize`, `comparison.priority` | Only enabled specs may participate in comparison tables. | Product compare views and tables |
| Searchable | Catalog index policy | Searchability is derived from the domain catalog index, not from user input. | Search tokens and ranking |
| Category scope | `appliesToCategoryIds` | Every governed key must declare the category ids where it is valid. | Adapter validation and category-aware UI/data consumers |
| GEO eligibility | `geo.includeInFactTable`, `geo.claimType` | Only source-backed, stable specs should feed GEO fact tables. | GEO answer generation |

## Value Type Rules

- `string` is the default for human-readable scalar values and formatted measurements.
- `number` is reserved for normalized numeric scalars.
- `boolean` is reserved for binary yes/no parameters.
- `enum` and `multi-enum` are reserved for controlled vocabularies.
- `range` is reserved for future structured range payloads. Current product records keep normalized numeric ranges in `ProductMeasurement.range` and expose display strings in spec rows.

For v1, specification values remain scalar at the product record boundary. If a future product line requires structured spec payloads, introduce a new versioned value type instead of weakening the current scalar contract.

## Unit Family Rules

- Every unit-bearing spec must declare a `unitFamily`.
- `allowedUnits` must be a strict subset of the declared family.
- Use `measurement` for cross-domain measurement descriptors such as sensor span or overload limit text.
- Use `pressure`, `temperature`, `length`, `current`, `voltage`, `frequency`, `percent`, `cycles`, `dimensionless`, or `custom` when the unit family is narrower.
- Prefer `custom` only for vendor-specific or symbolic units that do not normalize cleanly.

## Category Scope Rules

- Scope must be explicit in the registry.
- Broad, cross-cutting specs may target `cat_industrial_sensors`.
- Narrow, application-specific specs should target the smallest applicable leaf category set.
- Unknown spec keys and out-of-scope values must be rejected at the adapter boundary.

## Filter / Compare / Search Rules

- If `facet.enabled` is true, the spec may contribute to category filter facets.
- If `comparison.enabled` is true, the spec may contribute to side-by-side comparison.
- Search is catalog-index driven and should remain derived from domain data rather than CMS input.
- Search ranking must never change the canonical value stored in the registry or product record.
- Filter and compare policies should stay stable across locales; only display labels should localize.

## GEO Eligibility Rules

- `geo.includeInFactTable` should be true only when the value is source-backed and stable enough for AI extraction.
- `geo.claimType` should reflect the semantic role of the value, such as measurement range, capability, installation, limitation, or compatibility.
- GEO fact tables should prefer evidence-backed product records, documents, and review-approved values.
- Editorial or promotional text must not be used as GEO evidence.

## Product Record Alignment

- Every `ProductSpecificationValue.key` must exist in the registry when specification validation is enabled.
- `ProductRecord.specificationGroups` may use authoring labels such as measurement, electrical, mechanical, environmental, or commercial, but these group keys are not canonical semantics.
- A product should not rely on ad hoc keys to introduce new parameter semantics; new semantics require a new `SpecificationDefinition`.
- The registry remains the single source of truth for what a parameter means, how it is validated, and where it may be used.

## Extension Workflow

1. Add or update a `SpecificationDefinition`.
2. Assign unit family, value type, category scope, filter/comparison/search policies, and GEO eligibility.
3. Add product facts or mock data that use the new key.
4. Validate the registry and the catalog boundary.
5. Run the domain and scale gates.

## Current Coverage Snapshot

The current default registry covers these governed keys:

- `measurement_range`
- `range`
- `accuracy`
- `overload_limit`
- `output_signal`
- `output`
- `supply_voltage`
- `process_connection`
- `electrical_connection`
- `ingress_protection`
- `wetted_materials`
- `compatible_media`
- `ambient_temperature`
- `media_temperature`
- `feature`

This set is sufficient for the current industrial sensor catalog and is structured to grow without turning the product record into an unbounded custom object.

## Governance Conclusion

The current domain model is ready for 300 -> 1000+ products because the governed parameter layer is explicit, the category scope is finite, filter and comparison behavior are typed, and GEO eligibility is separately controlled.

Searchability is already handled as a derived catalog-index concern, which keeps it out of the CMS boundary and preserves the single source of truth.

When a new sensor family is introduced, the first change should be the registry, not the UI.
