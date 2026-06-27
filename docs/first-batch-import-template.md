# First Batch Product Import Template

## Purpose

This document fixes the import template for the first 20 to 50 real industrial products.

It defines how source spreadsheets or CMS authoring fields should map into the adapter `CmsFactInput` shape without changing the Domain contract.

This document does not define UI, Strapi implementation code, SEO generation logic, GEO generation logic, or new domain fields.

## Import Boundary

The first batch must compile to this adapter shape:

```ts
interface CmsFactInput {
  readonly categoryFacts: readonly CategoryFact[]
  readonly productFacts: readonly ProductFact[]
}
```

The import template is an authoring aid only. The aggregator must output adapter fields exactly as defined in `adapter/validation.ts`.

Do not import these generated fields from CMS or spreadsheet sources:

- `slug`
- `canonical`
- `canonicalPath`
- `slugPath`
- `categoryPath`
- `breadcrumb`
- `identity`
- `classification`
- `seo`
- `localizedSeo`
- `jsonld`, `jsonLd`, `jsonLD`
- `geo`, `geoAi`, `localizedGeoAi`, `geoEntity`, `entity`

## Batch Size and Scope

Recommended first batch:

- 20 to 50 products.
- 4 to 8 categories maximum.
- 3 to 6 product series.
- Each category should have at least 3 products unless it is included only as a parent category.
- Every product should have at least one datasheet document.

Recommended first product families:

- Pressure transmitters.
- Differential pressure sensors.
- Submersible level sensors.
- Temperature transmitters.
- Pressure switches.

## Workbook Tabs

Use these tabs if the first batch starts from a spreadsheet:

1. `categories`
2. `products`
3. `measurements`
4. `outputs`
5. `connections`
6. `environmental_limits`
7. `specifications`
8. `variants`
9. `documents`
10. `assets`
11. `commercial_terms`
12. `lookup_industries_applications`

Each tab must use stable product IDs, not row numbers, as join keys.

## Field Mapping: Categories

Tab: `categories`

| Import column | Adapter field | Required | Rule |
| --- | --- | --- | --- |
| `category_id` | `categoryFacts[].id` | yes | Must start with `cat_`. |
| `parent_category_id` | `categoryFacts[].parentId` | yes | Use empty/null for the single root. Otherwise must reference another `category_id`. |
| `name_en` | `categoryFacts[].name.en` | yes | Used by adapter to generate slug. |
| `name_zh` | `categoryFacts[].name.zh` | yes | Required even if same as English for first batch. |

Do not include generated depth, slug, canonical path, SEO, children, or breadcrumb columns.

Example rows:

| category_id | parent_category_id | name_en | name_zh |
| --- | --- | --- | --- |
| `cat_industrial_sensors` |  | `Industrial Sensors` | `Industrial Sensors` |
| `cat_pressure_sensors` | `cat_industrial_sensors` | `Pressure Sensors` | `Pressure Sensors` |
| `cat_pressure_transmitters` | `cat_pressure_sensors` | `Pressure Transmitters` | `Pressure Transmitters` |

## Field Mapping: Products

Tab: `products`

| Import column | Adapter field | Required | Rule |
| --- | --- | --- | --- |
| `product_id` | `productFacts[].id` | yes | Must start with `prd_`. Stable forever. |
| `sku` | `productFacts[].sku` | yes | Unique commercial SKU. |
| `model` | `productFacts[].model` | yes | Unique after slug normalization. |
| `series_id` | `productFacts[].seriesId` | yes | Must start with `ser_`. |
| `brand` | `productFacts[].brand` | yes | Example: `HEIYU Industrial`. |
| `manufacturer` | `productFacts[].manufacturer` | no | Use only if distinct or confirmed. |
| `lifecycle` | `productFacts[].lifecycle` | yes | `draft`, `active`, `phase-out`, `discontinued`, `hidden`. |
| `availability` | `productFacts[].availability` | yes | `stock-model`, `standard-lead-time`, `configurable`, `made-to-order`, `quote-required`, `not-available`. |
| `released_at` | `productFacts[].releasedAt` | no | ISO date `YYYY-MM-DD`. |
| `revised_at` | `productFacts[].revisedAt` | yes | ISO date `YYYY-MM-DD`. |
| `primary_category_id` | `productFacts[].primaryCategoryId` | yes | Must exist in `categories.category_id`. |
| `additional_category_ids` | `productFacts[].additionalCategoryIds` | no | Semicolon-separated `cat_` IDs, no duplicates. |
| `industry_ids` | `productFacts[].industryIds` | yes | Semicolon-separated `ind_` IDs; can be empty. |
| `application_ids` | `productFacts[].applicationIds` | yes | Semicolon-separated `app_` IDs; can be empty. |
| `measurement_kinds` | `productFacts[].measurementKinds` | yes | Semicolon-separated allowed values; must match measurement rows. |
| `name_en` | `productFacts[].name.en` | yes | Full product name. |
| `name_zh` | `productFacts[].name.zh` | yes | Required. May equal English for first batch. |
| `short_name_en` | `productFacts[].shortName.en` | yes | Listing label. |
| `short_name_zh` | `productFacts[].shortName.zh` | yes | Required. |
| `summary_en` | `productFacts[].summary.en` | yes | Factual, non-promotional summary. |
| `summary_zh` | `productFacts[].summary.zh` | yes | Required. |
| `highlights_en` | `productFacts[].highlights[].en` | yes | Semicolon-separated, non-empty. |
| `highlights_zh` | `productFacts[].highlights[].zh` | yes | Same item count as English. |
| `applications_en` | `productFacts[].applications[].en` | yes | Semicolon-separated; can be empty. |
| `applications_zh` | `productFacts[].applications[].zh` | yes | Same item count as English if not empty. |
| `certifications` | `productFacts[].certifications` | no | Semicolon-separated codes. |

## SKU / Model / Series Rules

### Product ID

Use:

```txt
prd_{series_code}_{model_code_normalized}
```

Examples:

```txt
prd_yf_p100
prd_yf_dp20
prd_yf_lt80
```

Rules:

- Lowercase snake case.
- Stable even if model display text changes.
- Never reuse a deleted product ID.
- Do not encode category, locale, lifecycle, or document revision.

### SKU

Use the commercial order code.

Examples:

```txt
YF-P100-420MA-G14-M12
YF-DP20-010V-KPA
YF-LT80-420MA-200M
```

Rules:

- Unique across the batch and full catalog.
- May be uppercase and hyphenated.
- Variant order codes belong in `variants[].orderCode`, not in separate product rows unless they are distinct models.

### Model

Examples:

```txt
YF-P100
YF-DP20
YF-LT80
```

Rules:

- Must normalize to a unique model slug.
- Do not include category text such as `pressure transmitter`.
- Do not include mutable marketing phrases such as `high performance`.

### Series ID

Use:

```txt
ser_{family_or_series_code}
```

Examples:

```txt
ser_pressure
ser_dp
ser_level
ser_temperature
ser_switch
```

Rules:

- Series IDs group related products and variants.
- Do not create a new series for every SKU.
- Do not encode locale or lifecycle.

## Field Mapping: Measurements

Tab: `measurements`

One row per product measurement.

| Import column | Adapter field | Required | Rule |
| --- | --- | --- | --- |
| `product_id` | join key | yes | Must match `products.product_id`. |
| `kind` | `measurements[].kind` | yes | Allowed `MeasurementKind`. |
| `range_min` | `measurements[].range.min` | yes | Number. |
| `range_max` | `measurements[].range.max` | yes | Number; must be >= min. |
| `range_unit` | `measurements[].range.unit` | yes | Allowed `UnitCode`. |
| `range_display` | `measurements[].range.display` | yes | Human-readable datasheet display. |
| `accuracy` | `measurements[].accuracy` | no | Example: `0.5% FS`, `Class A`. |
| `overload_value` | `measurements[].overloadLimit.value` | yes | Number. |
| `overload_unit` | `measurements[].overloadLimit.unit` | yes | Allowed `UnitCode`. |
| `overload_display` | `measurements[].overloadLimit.display` | yes | Human-readable display. |

Required rule: every `measurement_kinds` value in `products` must have a matching measurement row.

## Field Mapping: Outputs

Tab: `outputs`

One or more rows per product.

| Import column | Adapter field | Required | Rule |
| --- | --- | --- | --- |
| `product_id` | join key | yes | Must match product. |
| `kind` | `outputs[].kind` | yes | `analog-current`, `analog-voltage`, `relay`, `switch`, `pulse`, `fieldbus`, `wireless`. |
| `value` | `outputs[].value` | yes | Example: `4-20 mA`, `0-10 V`, `SPDT relay`. |
| `protocol` | `outputs[].protocol` | no | Example: `HART`, `Modbus`. |
| `wiring` | `outputs[].wiring` | no | Example: `2-wire`, `3-wire`. |

## Field Mapping: Connections

Tab: `connections`

One row per product.

| Import column | Adapter field | Required | Rule |
| --- | --- | --- | --- |
| `product_id` | join key | yes | Must match product. |
| `process_kind` | `connections.process.kind` | yes | `thread`, `flange`, `clamp`, `submersible-cable`, `probe`, `remote`, `none`. |
| `process_value` | `connections.process.value` | yes | Example: `G1/4 male`. |
| `process_material` | `connections.process.material` | no | Example: `316L stainless steel`. |
| `electrical_kind` | `connections.electrical.kind` | yes | `cable`, `m12`, `din43650`, `terminal-head`, `connector`, `wireless`, `custom`. |
| `electrical_value` | `connections.electrical.value` | yes | Example: `M12 4-pin`. |

## Field Mapping: Environmental Limits

Tab: `environmental_limits`

One row per product.

| Import column | Adapter field | Required | Rule |
| --- | --- | --- | --- |
| `product_id` | join key | yes | Must match product. |
| `ingress_protection` | `environmentalLimits.ingressProtection` | no | Must match `IPNN` when present. |
| `media_temp_min` | `environmentalLimits.mediaTemperature.min` | conditional | Number. At least media or ambient temperature must exist. |
| `media_temp_max` | `environmentalLimits.mediaTemperature.max` | conditional | Number. |
| `media_temp_unit` | `environmentalLimits.mediaTemperature.unit` | conditional | Usually `c`. |
| `media_temp_display` | `environmentalLimits.mediaTemperature.display` | conditional | Example: `-20...85 C`. |
| `ambient_temp_min` | `environmentalLimits.ambientTemperature.min` | conditional | Number. |
| `ambient_temp_max` | `environmentalLimits.ambientTemperature.max` | conditional | Number. |
| `ambient_temp_unit` | `environmentalLimits.ambientTemperature.unit` | conditional | Usually `c`. |
| `ambient_temp_display` | `environmentalLimits.ambientTemperature.display` | conditional | Example: `-20...70 C`. |
| `wetted_materials` | `environmentalLimits.wettedMaterials` | yes | Semicolon-separated, non-empty. |
| `compatible_media` | `environmentalLimits.compatibleMedia` | yes | Semicolon-separated, non-empty. |

## Field Mapping: Specifications

Tab: `specifications`

One row per spec value. Group rows by `product_id` and `group_key` when building `specificationGroups`.

| Import column | Adapter field | Required | Rule |
| --- | --- | --- | --- |
| `product_id` | join key | yes | Must match product. |
| `group_key` | `specificationGroups[].key` | yes | Authoring bucket, not semantic key. Recommended: `measurement`, `electrical`, `mechanical`, `environmental`, `commercial`. |
| `group_label` | `specificationGroups[].label` | yes | Example: `Measurement`. |
| `spec_key` | `specificationGroups[].values[].key` | yes | Must exist in `defaultSpecificationRegistry`. |
| `spec_label` | `specificationGroups[].values[].label` | yes | Human label. Use registry label unless there is a known datasheet label. |
| `value` | `specificationGroups[].values[].value` | yes | String, number, or boolean matching registry `valueType`. |
| `unit` | `specificationGroups[].values[].unit` | no | Required when the value is unit-bearing and allowed by registry. |
| `display` | `specificationGroups[].values[].display` | yes | Human-readable value shown in datasheet/parameter table. |
| `source_ref_ids` | `sourceRefs[].id` | recommended | Semicolon-separated `doc_` or `evidence_` IDs. |
| `source_ref_labels` | `sourceRefs[].label` | recommended | Same item count as IDs. |
| `source_ref_pages` | `sourceRefs[].page` | no | Same item count as IDs if used. |
| `source_ref_confidences` | `sourceRefs[].confidence` | recommended | `source-backed`, `derived`, `editorial`, `unverified`. |

Required spec keys for first batch where available:

- `measurement_range` or `range`
- `accuracy`
- `overload_limit`
- `output_signal` or `output`
- `process_connection`
- `electrical_connection`
- `ingress_protection`
- `wetted_materials`
- `compatible_media`
- `ambient_temperature`
- `media_temperature`

Optional spec key:

- `feature`

Do not create ad hoc keys such as `measurementRange`, `span`, `sensor_output`, `ip_rating`, or `media`.

## Specification Registry Usage Matrix

| Spec key | Typical group | Value type | Unit rule | Source ref requirement |
| --- | --- | --- | --- | --- |
| `measurement_range` | `measurement` | string | Use range unit when known. | Required for first batch. |
| `range` | `measurement` | string | Use range unit when known. | Required if `measurement_range` is not used. |
| `accuracy` | `measurement` | string | Use `percent` only when the value is numeric percent; omit unit for `Class A`. | Required when used for comparison. |
| `overload_limit` | `measurement` | number | Unit must match allowed measurement units. | Required. |
| `output_signal` | `electrical` | string | Usually no unit. | Required. |
| `output` | `electrical` | string | Usually no unit. | Required if `output_signal` is not used. |
| `supply_voltage` | `electrical` | string | Unit `v` when unit-bearing. | Recommended. |
| `process_connection` | `mechanical` | string | No unit. | Recommended. |
| `electrical_connection` | `mechanical` | string | No unit. | Recommended. |
| `ingress_protection` | `environmental` | string | No unit. | Recommended. |
| `wetted_materials` | `environmental` | multi-enum | No unit. | Required for media compatibility. |
| `compatible_media` | `environmental` | multi-enum | No unit. | Required for media compatibility. |
| `ambient_temperature` | `environmental` | string | `c`, `f`, or `k` when unit-bearing. | Recommended. |
| `media_temperature` | `environmental` | string | `c`, `f`, or `k` when unit-bearing. | Recommended. |
| `feature` | any relevant group | string | No unit unless truly needed. | Optional; do not use for core measurable parameters. |

## Field Mapping: Variants

Tab: `variants`

Variants are optional for first batch. Use them only for sellable configurations under the same model.

| Import column | Adapter field | Required | Rule |
| --- | --- | --- | --- |
| `product_id` | join key | yes | Must match product. |
| `variant_id` | `variants[].id` | yes | Must start with `var_`. |
| `order_code` | `variants[].orderCode` | yes | Sellable variant order code. |
| `option_key` | `variants[].optionValues[].optionKey` | yes | Example: `range`, `output`, `connection`. |
| `option_label` | `variants[].optionValues[].label` | yes | Human label. |
| `option_value` | `variants[].optionValues[].value` | yes | Human value. |
| `option_code` | `variants[].optionValues[].code` | no | Compact ordering code. |
| `availability` | `variants[].availability` | yes | Same enum as product availability. |
| `lifecycle` | `variants[].lifecycle` | yes | Same enum as product lifecycle. |

If a variant has different measurements, outputs, or connections, add them only when the aggregator can emit valid nested variant facts. Otherwise keep first batch variants limited to option values.

## Field Mapping: Documents

Tab: `documents`

At least one document row is required per product.

| Import column | Adapter field | Required | Rule |
| --- | --- | --- | --- |
| `product_id` | join key | yes | Must match product. |
| `document_id` | `documents[].id` | yes | Must start with `doc_`. |
| `title` | `documents[].title` | yes | Example: `YF-P100 Datasheet`. |
| `kind` | `documents[].kind` | yes | `datasheet`, `manual`, `certificate`, `drawing`, `catalog`, `software`. |
| `href` | `documents[].href` | yes | Public or internal stable file URL. |
| `locale` | `documents[].locale` | no | Example: `en`, `zh`. |
| `revision` | `documents[].revision` | no | Example: `v1`, `v1.2`. |

Recommended ID pattern:

```txt
doc_{model_normalized}_{kind}
```

Examples:

```txt
doc_yf_p100_datasheet
doc_yf_p100_certificate_ce
```

## Field Mapping: Assets

Tab: `assets`

Assets are optional, but recommended for product quality.

| Import column | Adapter field | Required | Rule |
| --- | --- | --- | --- |
| `product_id` | join key | yes | Must match product. |
| `asset_id` | `assets[].id` | yes | Must start with `asset_`. |
| `kind` | `assets[].kind` | yes | `primary-image`, `gallery-image`, `diagram`, `dimension-drawing`, `installation-photo`. |
| `href` | `assets[].href` | yes | Stable asset URL. |
| `alt` | `assets[].alt` | yes | Factual product image alt text. |

## Field Mapping: Commercial Terms

Tab: `commercial_terms`

One row per product.

| Import column | Adapter field | Required | Rule |
| --- | --- | --- | --- |
| `product_id` | join key | yes | Must match product. |
| `minimum_order_quantity` | `commercialTerms.minimumOrderQuantity` | no | Number. |
| `standard_lead_time` | `commercialTerms.standardLeadTime` | no | Example: `2-4 weeks`. |
| `warranty` | `commercialTerms.warranty` | no | Example: `18 months`. |
| `oem_customizable` | `commercialTerms.oemCustomizable` | yes | Boolean. |
| `private_label_available` | `commercialTerms.privateLabelAvailable` | yes | Boolean. |

## Lookup IDs

Tab: `lookup_industries_applications`

Use this tab as a controlled list for product rows.

Industry IDs must start with `ind_`.

Application IDs must start with `app_`.

Do not use free-text industry/application names inside product rows. Product rows should reference IDs only.

## Evidence Refs Entry Rules

### SourceRef Columns

For spreadsheet authoring, represent source refs in four parallel columns:

```txt
source_ref_ids
source_ref_labels
source_ref_pages
source_ref_confidences
```

Use semicolon separation for multiple refs.

Example:

| source_ref_ids | source_ref_labels | source_ref_pages | source_ref_confidences |
| --- | --- | --- | --- |
| `doc_yf_p100_datasheet` | `YF-P100 Datasheet` | `2` | `source-backed` |

### Confidence Rules

Use:

- `source-backed`: value is directly present in datasheet, certificate, test report, or engineering source.
- `derived`: value is calculated from source-backed values, such as overload ratio.
- `editorial`: value is product-owner text but not direct test/datasheet data.
- `unverified`: imported legacy value that needs review.

For first batch, avoid `unverified` on filterable, comparable, or GEO-eligible specs.

### Evidence ID Rules

Use `evidence_` IDs only when the source is not a document asset.

Examples:

```txt
evidence_yf_p100_engineering_review
evidence_yf_p100_pressure_test
```

Evidence refs must still have clear labels and confidence.

## First Batch Spec Set by Product Family

### Pressure Transmitters

Minimum specs:

- `measurement_range`
- `accuracy`
- `overload_limit`
- `output_signal`
- `supply_voltage` if available
- `process_connection`
- `electrical_connection`
- `ingress_protection`
- `wetted_materials`
- `compatible_media`
- `ambient_temperature`
- `media_temperature`

### Differential Pressure Sensors

Minimum specs:

- `measurement_range`
- `accuracy`
- `overload_limit`
- `output_signal`
- `process_connection`
- `electrical_connection`
- `ingress_protection`
- `wetted_materials`
- `compatible_media`
- `ambient_temperature`
- `media_temperature`

### Level Sensors

Minimum specs:

- `measurement_range`
- `accuracy`
- `overload_limit`
- `output_signal`
- `process_connection`
- `electrical_connection`
- `ingress_protection`
- `wetted_materials`
- `compatible_media`
- `ambient_temperature`
- `media_temperature`

### Temperature Products

Minimum specs:

- `measurement_range`
- `accuracy`
- `output_signal`
- `process_connection`
- `electrical_connection`
- `ingress_protection`
- `wetted_materials`
- `compatible_media`
- `ambient_temperature`
- `media_temperature`

If overload is not meaningful for a temperature product, the adapter still requires `measurements[].overloadLimit` for CMS facts. Use a source-backed or derived limit agreed by product engineering before import.

### Pressure Switches

Minimum specs:

- `measurement_range`
- `accuracy` or setpoint note
- `overload_limit`
- `output_signal`
- `process_connection`
- `electrical_connection`
- `ingress_protection`
- `wetted_materials`
- `compatible_media`
- `ambient_temperature`
- `media_temperature`

## Aggregated JSON Skeleton

The aggregator must produce this shape for each product after reading the import tabs:

```json
{
  "id": "prd_yf_p100",
  "sku": "YF-P100-420MA-G14-M12",
  "model": "YF-P100",
  "seriesId": "ser_pressure",
  "brand": "HEIYU Industrial",
  "manufacturer": "HEIYU Industrial",
  "lifecycle": "active",
  "availability": "standard-lead-time",
  "releasedAt": "2026-01-10",
  "revisedAt": "2026-06-24",
  "primaryCategoryId": "cat_pressure_transmitters",
  "additionalCategoryIds": [],
  "industryIds": ["ind_water", "ind_hydraulics"],
  "applicationIds": ["app_pump", "app_hydraulic_power_unit"],
  "measurementKinds": ["pressure"],
  "name": { "en": "P100 Industrial Pressure Transmitter", "zh": "P100 Industrial Pressure Transmitter" },
  "shortName": { "en": "P100 Pressure Transmitter", "zh": "P100 Pressure Transmitter" },
  "summary": { "en": "Source-backed pressure transmitter for pump and hydraulic monitoring.", "zh": "Source-backed pressure transmitter for pump and hydraulic monitoring." },
  "highlights": [
    { "en": "0...600 bar range", "zh": "0...600 bar range" },
    { "en": "4-20 mA output", "zh": "4-20 mA output" }
  ],
  "applications": [
    { "en": "Pump pressure monitoring", "zh": "Pump pressure monitoring" }
  ],
  "measurements": [
    {
      "kind": "pressure",
      "range": { "min": 0, "max": 600, "unit": "bar", "display": "0...600 bar" },
      "accuracy": "0.5% FS",
      "overloadLimit": { "value": 900, "unit": "bar", "display": "900 bar" }
    }
  ],
  "outputs": [
    { "kind": "analog-current", "value": "4-20 mA", "wiring": "2-wire" }
  ],
  "connections": {
    "process": { "kind": "thread", "value": "G1/4 male", "material": "316L stainless steel" },
    "electrical": { "kind": "m12", "value": "M12 4-pin" }
  },
  "environmentalLimits": {
    "ingressProtection": "IP67",
    "mediaTemperature": { "min": -20, "max": 120, "unit": "c", "display": "-20...120 C" },
    "ambientTemperature": { "min": -20, "max": 85, "unit": "c", "display": "-20...85 C" },
    "wettedMaterials": ["316L stainless steel", "FKM"],
    "compatibleMedia": ["Water", "Hydraulic oil", "Compressed air"]
  },
  "specificationGroups": [
    {
      "key": "measurement",
      "label": "Measurement",
      "values": [
        {
          "key": "measurement_range",
          "label": "Measurement range",
          "value": "0...600 bar",
          "unit": "bar",
          "display": "0...600 bar",
          "sourceRefs": [
            { "id": "doc_yf_p100_datasheet", "label": "YF-P100 Datasheet", "page": 2, "confidence": "source-backed" }
          ]
        },
        {
          "key": "overload_limit",
          "label": "Overload limit",
          "value": 900,
          "unit": "bar",
          "display": "900 bar",
          "sourceRefs": [
            { "id": "doc_yf_p100_datasheet", "label": "YF-P100 Datasheet", "page": 2, "confidence": "source-backed" }
          ]
        }
      ]
    },
    {
      "key": "electrical",
      "label": "Electrical",
      "values": [
        {
          "key": "output_signal",
          "label": "Output signal",
          "value": "4-20 mA",
          "display": "4-20 mA",
          "sourceRefs": [
            { "id": "doc_yf_p100_datasheet", "label": "YF-P100 Datasheet", "page": 2, "confidence": "source-backed" }
          ]
        }
      ]
    }
  ],
  "variants": [],
  "certifications": ["ce", "rohs", "iso9001"],
  "documents": [
    { "id": "doc_yf_p100_datasheet", "title": "YF-P100 Datasheet", "kind": "datasheet", "href": "/uploads/yf-p100-datasheet.pdf", "locale": "en", "revision": "v1" }
  ],
  "assets": [
    { "id": "asset_yf_p100_primary", "kind": "primary-image", "href": "/uploads/yf-p100.png", "alt": "YF-P100 pressure transmitter" }
  ],
  "commercialTerms": {
    "minimumOrderQuantity": 10,
    "standardLeadTime": "2-4 weeks",
    "warranty": "18 months",
    "oemCustomizable": true,
    "privateLabelAvailable": true
  }
}
```

## Import QA Checklist

Before the first batch is accepted:

1. All category IDs start with `cat_`.
2. All product IDs start with `prd_`.
3. All series IDs start with `ser_`.
4. All variant IDs start with `var_`.
5. All document IDs start with `doc_`.
6. All asset IDs start with `asset_`.
7. All evidence IDs start with `evidence_`.
8. SKUs are unique.
9. Models are unique after slug normalization.
10. Every product has exactly one primary category.
11. Every product has at least one measurement row.
12. Every measurement has overload limit.
13. Every product has at least one output row.
14. Every product has connections.
15. Every product has environmental limits with media or ambient temperature.
16. Every product has non-empty wetted materials and compatible media.
17. Every product has at least one specification group.
18. Every spec key exists in `defaultSpecificationRegistry`.
19. Every unit-bearing spec uses an allowed unit.
20. Every product has at least one document.
21. Every comparison-critical spec has a `source-backed` or `derived` source ref.
22. No generated SEO, GEO, slug, canonical path, breadcrumb, identity, or classification fields are present.
23. `npm run validate:cms-facts` passes on the aggregated payload.

## First Batch Acceptance Gate

The first batch is ready for engineering import only when these commands pass:

```bash
npm run validate:domain
npm run validate:cms-facts
npm run validate:scale-1000
```

If a real CMS payload file is available, validate it directly:

```bash
npm run validate:cms-facts -- --file path/to/cms-facts.json
```

## Change Control

Do not change `ProductRecord`, `SpecificationDefinition`, `CategoryTree`, or adapter input contracts to make the first batch easier to enter.

If the template does not fit a real product:

1. Check whether the value belongs in an existing measurement, output, connection, environmental limit, document, asset, variant, or commercial field.
2. Check whether an existing spec key covers the parameter.
3. If no spec key fits, propose a new `SpecificationDefinition` in the domain layer.
4. Re-run validation before importing the batch.

The default answer for first-batch friction should be better source normalization, not domain contract expansion.
