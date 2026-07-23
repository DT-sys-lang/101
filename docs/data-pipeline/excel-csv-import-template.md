# Excel CSV Import Template

## Scope

This document defines the CSV directory contract consumed by:

```powershell
npm run import:cms-facts -- --dir <csv-directory> --out outputs\cms-facts-import-test.json
```

The importer reads CSV files exported from Excel tabs. It does not read `.xlsx` files directly.

For new product onboarding, use **simplified mode**. Simplified mode is the operations-friendly template for first-batch product entry and keeps day-to-day authoring to four sheets:

1. `categories.csv`
2. `products.csv`
3. `product_specs.csv`
4. `product_assets.csv`

Legacy multi-sheet mode is still supported for existing exports and migration work. Legacy mode is selected when `product_specs.csv` is absent and the directory contains the older `specifications.csv` contract with optional `measurements.csv`, `outputs.csv`, `connections.csv`, `environmental_limits.csv`, `valve_profiles.csv`, `documents.csv`, `assets.csv`, `variants.csv`, and `commercial_terms.csv` files.

The CSV input is facts-only. It must not contain generated Domain, SEO, JSON-LD, GEO, route, breadcrumb, Strapi envelope, or runtime projection fields.

Optional `ru` and `es` columns are CMS content fields only. Filling them does not open Russian or Spanish frontend routes.

## Mode Selection

- Simplified mode is enabled when `product_specs.csv` exists in the import directory.
- Simplified mode requires `categories.csv`, `products.csv`, and `product_specs.csv`.
- `product_assets.csv` is optional at the importer boundary, but recommended for real product acceptance because it carries images and document links.
- Legacy mode remains accepted for previously prepared multi-sheet batches, but new product entry should use simplified mode.

## Why Simplified Mode

In simplified mode, `product_specs.csv` carries all technical parameters. Operators no longer need to separately maintain `measurements.csv`, `outputs.csv`, `connections.csv`, `environmental_limits.csv`, or `valve_profiles.csv` for new product entry.

The system derives the runtime sensor profile and valve profile from `product_specs.csv`:

- Sensor specs such as `measurement_range`, `accuracy`, `output_signal`, `supply_voltage`, `process_connection`, `electrical_connection`, `ingress_protection`, `compatible_media`, `wetted_materials`, `media_temperature`, and `ambient_temperature` are converted into sensor measurements, outputs, connections, and environmental limits.
- Valve specs such as `pressure_rating`, `size`, `connection` or `process_connection`, `material` or `wetted_materials`, `mode`, and `compatible_media` are converted into the valve profile.
- The same `product_specs.csv` rows are also preserved as product specification groups for CMS review and product-page technical tables.

## Forbidden Columns

Do not include generated fields, frontend routing fields, SEO/GEO projections, product domain identity projections, or Strapi envelope fields in any CSV header.

Forbidden column names include:

- `slug`, `slugPath`, `canonical`, `canonicalPath`, `canonicalUrl`
- `categoryPath`, `breadcrumb`, `depth`, `children`
- `seo`, `localizedSeo`, `jsonLd`, `jsonld`, `jsonLD`
- `geo`, `geoAi`, `localizedGeoAi`, `geoEntity`, `entity`
- `identity`, `classification`
- Strapi envelope fields: `data`, `attributes`, `meta`, `documentId`, `createdAt`, `updatedAt`, `publishedAt`, `createdBy`, `updatedBy`

Legacy-only note: if a legacy `valve_profiles.csv` file is used, it must not include `role` or `function`. The valve profile contract is limited to pressure rating, connection, material, mode, compatible media, and size.

## CSV Formatting Rules

- Use UTF-8 CSV.
- Keep one header row per file.
- Use stable IDs as joins; never use row numbers as IDs.
- Use semicolon-separated lists for multi-value cells.
- Leave optional cells blank rather than using placeholders such as `N/A`.
- Use ISO dates in `YYYY-MM-DD` format.
- Use `true` or `false` for boolean cells.
- Keep `en` and `zh` localized fields present for the first batch.
- Keep `ru` and `es` columns optional; they are CMS content fields only and do not enable frontend routes.

## `categories.csv`

Required in simplified mode.

| Column | Required | Rule |
| --- | --- | --- |
| `category_id` | yes | Must start with `cat_`; unique in payload. |
| `parent_category_id` | yes | Blank for the single root; otherwise must reference another `category_id`. |
| `name_en` | yes | English CMS category name. |
| `name_zh` | yes | Chinese CMS category name for the first batch. |
| `name_ru` | no | Optional CMS content only. |
| `name_es` | no | Optional CMS content only. |

Rules:

- Exactly one row must have blank `parent_category_id`.
- Category depth after system derivation must not exceed 4.
- Sibling names must generate unique slugs.
- Do not author category slug, depth, path, children, breadcrumb, SEO, GEO, or Strapi envelope columns.

Recommended first-batch category tree:

```text
Industrial Products
Industrial Sensors
Pressure Sensors
Pressure Transmitters
Differential Pressure Sensors
Level Sensors
Temperature Sensors
Flow Sensors
Industrial Valves
Solenoid Valves
Ball Valves
Butterfly Valves
```

## `products.csv`

Required in simplified mode.

| Column | Required | Rule |
| --- | --- | --- |
| `product_id` | yes | Must start with `prd_`; unique in payload and prior real imports. |
| `family` | yes | `sensor` or `valve`. |
| `sku` | yes | Unique commercial SKU. |
| `model` | yes | Product model; must generate a unique product slug. |
| `series_id` | no | Must start with `ser_` when present. |
| `brand` | yes | Brand display name. |
| `manufacturer` | no | Use only when confirmed. |
| `availability` | yes | `stock-model`, `standard-lead-time`, `configurable`, `made-to-order`, `quote-required`, or `not-available`. |
| `released_at` | no | ISO date. |
| `revised_at` | yes | ISO date; required by importer. |
| `primary_category_id` | yes | Must exist in `categories.csv`. |
| `additional_category_ids` | no | Semicolon-separated `cat_` IDs; no duplicates. |
| `industry_ids` | no | Semicolon-separated `ind_` IDs. |
| `application_ids` | no | Semicolon-separated `app_` IDs. |
| `measurement_kinds` | sensor recommended; valve blank | Semicolon-separated measurement kind IDs such as `pressure`, `level`, `temperature`, or `flow`. |
| `name_en` | yes | Full English product name. |
| `name_zh` | yes | Full Chinese product name for the first batch. |
| `name_ru` | no | Optional CMS content only. |
| `name_es` | no | Optional CMS content only. |
| `short_name_en` | yes | Listing label. |
| `short_name_zh` | yes | Chinese listing label. |
| `short_name_ru` | no | Optional CMS content only. |
| `short_name_es` | no | Optional CMS content only. |
| `summary_en` | yes | Factual summary, not SEO copy. |
| `summary_zh` | yes | Chinese factual summary. |
| `summary_ru` | no | Optional CMS content only. |
| `summary_es` | no | Optional CMS content only. |
| `highlights_en` | no | Semicolon-separated list. |
| `highlights_zh` | no | Same item count as English when provided. |
| `highlights_ru` | no | Optional CMS content only. |
| `highlights_es` | no | Optional CMS content only. |
| `applications_en` | no | Semicolon-separated list. |
| `applications_zh` | no | Same item count as English when provided. |
| `applications_ru` | no | Optional CMS content only. |
| `applications_es` | no | Optional CMS content only. |
| `certifications` | no | Semicolon-separated certification codes. |

Minimum product identity/content fields for operations:

- `product_id`
- `family`
- `sku`
- `model`
- `brand`
- `availability`
- `revised_at`
- `primary_category_id`
- `measurement_kinds` for sensors
- `name_en`, `name_zh`
- `short_name_en`, `short_name_zh`
- `summary_en`, `summary_zh`

Valve products should leave `measurement_kinds` blank.

## `product_specs.csv`

Required in simplified mode. This is the core technical sheet.

One row is one product technical parameter. Rows with the same `product_id` and `group_key` become one specification group. Operators should enter technical facts here instead of maintaining separate measurement/output/connection/environment/valve sheets.

| Column | Required | Rule |
| --- | --- | --- |
| `product_id` | yes | Must match `products.product_id`. |
| `group_key` | no | Defaults from `spec_key` when blank; examples: `measurement`, `electrical`, `mechanical`, `environmental`, `valve`. |
| `group_label` | no | Defaults from `group_key` when blank. |
| `spec_key` | yes | Supported simplified spec key. |
| `spec_label` | no | Defaults from `spec_key` when blank. |
| `value` | yes | Scalar value. Ranges should use forms like `0...10 bar` or `-20...85 C`. |
| `value_type` | no | Use `number` or `boolean` when needed; blank means string. |
| `unit` | no | Recommended for numeric ranges and values. |
| `display` | no | Human-readable display; defaults to `value` when blank. |
| `is_filterable` | no | Operator note for filter intent; accepted as a CSV column but not required for derivation. |
| `is_highlight` | no | Operator note for highlight intent; accepted as a CSV column but not required for derivation. |
| `source_ref_ids` | recommended | Semicolon-separated document or evidence IDs, usually `doc_...`. |
| `source_ref_labels` | recommended | Same item count as IDs. |
| `source_ref_pages` | no | Same item count as IDs when used. |
| `source_ref_confidences` | recommended | `source-backed`, `derived`, `editorial`, or `unverified`. |

Supported simplified sensor `spec_key` values:

- `measurement_range` or `range`
- `accuracy`
- `overload_limit`
- `output_signal` or `output`
- `supply_voltage`
- `process_connection`
- `electrical_connection`
- `ingress_protection`
- `compatible_media`
- `wetted_materials`
- `media_temperature`
- `ambient_temperature`
- `feature`

For sensor products, the importer currently requires the sensor profile source keys above, including `overload_limit` and `ambient_temperature`, so it can derive complete measurements and environmental limits.

Supported simplified valve `spec_key` values:

- `pressure_rating`
- `size`
- `connection` or `process_connection`
- `material` or `wetted_materials`
- `mode`
- `compatible_media`
- `feature`

Valve alias behavior:

- `connection` maps to the internal `process_connection` specification and valve profile connection.
- `material` maps to the internal `wetted_materials` specification and valve profile material.
- `pressure_rating`, `size`, and `mode` are retained as specification features and also derive the valve profile.

Example sensor rows:

```csv
product_id,group_key,group_label,spec_key,spec_label,value,value_type,unit,display,is_filterable,is_highlight,source_ref_ids,source_ref_labels,source_ref_pages,source_ref_confidences
prd_yf_p100,measurement,Measurement,measurement_range,Measurement range,0...10 bar,,bar,0...10 bar,true,true,doc_yf_p100_datasheet,YF-P100 Datasheet,2,source-backed
prd_yf_p100,measurement,Measurement,accuracy,Accuracy,0.5% FS,,,0.5% FS,true,true,doc_yf_p100_datasheet,YF-P100 Datasheet,2,source-backed
prd_yf_p100,measurement,Measurement,overload_limit,Overload limit,20,number,bar,20 bar,false,true,doc_yf_p100_datasheet,YF-P100 Datasheet,2,source-backed
prd_yf_p100,electrical,Electrical,output_signal,Output signal,4-20 mA,,,4-20 mA,true,true,doc_yf_p100_datasheet,YF-P100 Datasheet,3,source-backed
prd_yf_p100,electrical,Electrical,supply_voltage,Supply voltage,12...30 V,,v,12...30 V,true,false,doc_yf_p100_datasheet,YF-P100 Datasheet,3,source-backed
prd_yf_p100,mechanical,Mechanical,process_connection,Process connection,G1/4 male,,,G1/4 male,true,false,doc_yf_p100_datasheet,YF-P100 Datasheet,3,source-backed
prd_yf_p100,mechanical,Mechanical,electrical_connection,Electrical connection,M12 4-pin,,,M12 4-pin,true,false,doc_yf_p100_datasheet,YF-P100 Datasheet,3,source-backed
prd_yf_p100,environmental,Environmental,ingress_protection,Ingress protection,IP67,,,IP67,true,false,doc_yf_p100_datasheet,YF-P100 Datasheet,4,source-backed
prd_yf_p100,environmental,Environmental,compatible_media,Compatible media,Water;Compressed air,,,Water;Compressed air,true,false,doc_yf_p100_datasheet,YF-P100 Datasheet,4,source-backed
prd_yf_p100,environmental,Environmental,wetted_materials,Wetted materials,316L stainless steel;FKM,,,316L stainless steel;FKM,true,false,doc_yf_p100_datasheet,YF-P100 Datasheet,4,source-backed
prd_yf_p100,environmental,Environmental,media_temperature,Media temperature,-20...85 C,,c,-20...85 C,false,false,doc_yf_p100_datasheet,YF-P100 Datasheet,4,source-backed
```

Example valve rows:

```csv
product_id,group_key,group_label,spec_key,spec_label,value,value_type,unit,display,is_filterable,is_highlight,source_ref_ids,source_ref_labels,source_ref_pages,source_ref_confidences
prd_yf_sv15,valve,Valve,pressure_rating,Pressure rating,PN16,,,PN16,true,true,doc_yf_sv15_datasheet,YF-SV15 Datasheet,2,source-backed
prd_yf_sv15,valve,Valve,size,Size,DN15,,,DN15,true,true,doc_yf_sv15_datasheet,YF-SV15 Datasheet,2,source-backed
prd_yf_sv15,valve,Valve,connection,Connection,G1/2 threaded,,,G1/2 threaded,true,true,doc_yf_sv15_datasheet,YF-SV15 Datasheet,2,source-backed
prd_yf_sv15,valve,Valve,material,Material,316L stainless steel,,,316L stainless steel,true,false,doc_yf_sv15_datasheet,YF-SV15 Datasheet,2,source-backed
prd_yf_sv15,valve,Valve,mode,Mode,normally closed,,,normally closed,true,false,doc_yf_sv15_datasheet,YF-SV15 Datasheet,2,source-backed
prd_yf_sv15,valve,Valve,compatible_media,Compatible media,Water;Compressed air,,,Water;Compressed air,true,false,doc_yf_sv15_datasheet,YF-SV15 Datasheet,2,source-backed
```

## `product_assets.csv`

Recommended in simplified mode. This sheet carries both product image assets and product documents.

| Column | Required | Rule |
| --- | --- | --- |
| `product_id` | yes | Must match `products.product_id`. |
| `asset_id` | yes | Use `asset_...` for image assets and `doc_...` for documents. |
| `asset_type` | yes | Supported values listed below. Hyphenated variants are normalized to underscores. |
| `title` | recommended | Human title for CMS documents or operator review. |
| `href` | yes | Stable CMS/CDN/internal file URL. |
| `locale` | no | Example: `en`, `zh`. Mostly used for documents. |
| `alt` | image yes | Factual image alt text; documents can leave blank. |
| `sort_order` | no | Operator ordering hint. |
| `revision` | no | Document revision such as `v1` or `2026-07`. |

Supported image asset types:

- `primary_image`
- `gallery_image`
- `diagram`
- `dimension_drawing`
- `installation_photo`

Supported document asset types:

- `datasheet`
- `manual`
- `certificate`
- `drawing`
- `catalog`
- `software`

Example rows:

```csv
product_id,asset_id,asset_type,title,href,locale,alt,sort_order,revision
prd_yf_p100,asset_yf_p100_primary,primary_image,YF-P100 Primary Image,/images/products/yf-p100-primary.jpg,,YF-P100 pressure transmitter front view,1,
prd_yf_p100,asset_yf_p100_gallery_01,gallery_image,YF-P100 Side View,/images/products/yf-p100-side.jpg,,YF-P100 pressure transmitter side view,2,
prd_yf_p100,doc_yf_p100_datasheet,datasheet,YF-P100 Datasheet,/docs/products/yf-p100-datasheet.pdf,en,,1,2026-07
prd_yf_p100,doc_yf_p100_manual,manual,YF-P100 Manual,/docs/products/yf-p100-manual.pdf,en,,2,v1
prd_yf_p100,doc_yf_p100_certificate,certificate,YF-P100 CE Certificate,/docs/products/yf-p100-ce.pdf,en,,3,2026
```

Image recommendations:

| Asset type | Recommended size | Notes |
| --- | --- | --- |
| `primary_image` | 1200x1200 | Square product inspection image; exact product or representative series hardware. |
| `gallery_image` | 1200x1200 | Additional angles, variants, ports, labels, or product kit photos. |
| `diagram` | 1600x1000 | Wiring, fluid path, mounting, or application diagram. |
| `dimension_drawing` | 1600x1000 | Dimensioned technical drawing. |
| `installation_photo` | 1600x1000 | Installed context, mounting, piping, panel, or line photo. |

Preferred sources are original manufacturer or in-house product photography. Avoid generic stock photos, dark cropped thumbnails, or images that cannot support buyer inspection.

## First Batch Recommendation

A practical first import batch should include 5 to 10 sensors and 2 to 5 valves. The sample directory in `docs/data-pipeline/examples/simple-csv/` contains 7 sensors and 3 valves.

Recommended sensor entries:

| Product ID | Family | Category | Key specs |
| --- | --- | --- | --- |
| `prd_yf_p100` | sensor | Pressure Transmitters | 0...10 bar, 4-20 mA, G1/4, IP67 |
| `prd_yf_p300` | sensor | Pressure Transmitters | 0...25 bar, 4-20 mA + HART, G1/2, IP67 |
| `prd_yf_dp200` | sensor | Differential Pressure Sensors | 0...100 kPa, 4-20 mA, G1/4, IP65 |
| `prd_yf_l100` | sensor | Level Sensors | 0...5 mH2O, 4-20 mA, submersible cable, IP68 |
| `prd_yf_t200` | sensor | Temperature Sensors | -50...200 C, Pt100/4-20 mA, M20x1.5, IP65 |
| `prd_yf_f300` | sensor | Flow Sensors | 0...60 m3/h, pulse/4-20 mA, DN25 flange, IP65 |
| `prd_yf_ps50` | sensor | Pressure Sensors | 0...6 bar, SPDT relay, G1/4, IP65 |

Recommended valve entries:

| Product ID | Family | Category | Key specs |
| --- | --- | --- | --- |
| `prd_yf_sv15` | valve | Solenoid Valves | PN16, DN15, G1/2 threaded, normally closed |
| `prd_yf_bv25` | valve | Ball Valves | PN25, DN25, flange, manual |
| `prd_yf_bfv80` | valve | Butterfly Valves | PN16, DN80, wafer, modulating |

## Minimum Fields for Operations

For a real simplified import, operations should fill at least:

- `categories.csv`: `category_id`, `parent_category_id`, `name_en`, `name_zh`.
- `products.csv`: `product_id`, `family`, `sku`, `model`, `brand`, `availability`, `revised_at`, `primary_category_id`, sensor `measurement_kinds`, `name_en`, `name_zh`, `short_name_en`, `short_name_zh`, `summary_en`, `summary_zh`.
- `product_specs.csv` for sensors: `product_id`, `spec_key`, `value`, plus enough rows for `measurement_range`, `accuracy`, `overload_limit`, `output_signal`, `supply_voltage`, `process_connection`, `electrical_connection`, `ingress_protection`, `compatible_media`, `wetted_materials`, `media_temperature`, and `ambient_temperature`.
- `product_specs.csv` for valves: `product_id`, `spec_key`, `value`, plus rows for `pressure_rating`, `size`, `connection` or `process_connection`, `material` or `wetted_materials`, `mode`, and `compatible_media`.
- `product_assets.csv`: one `primary_image` and one `datasheet` per real product; add `gallery_image`, `manual`, and `certificate` when available.

For source governance, add `source_ref_ids`, `source_ref_labels`, `source_ref_pages`, and `source_ref_confidences` to comparison-critical specs.

## Execution Flow

Use an isolated output path for import testing:

```powershell
npm run import:cms-facts -- --dir docs\data-pipeline\examples\simple-csv --out outputs\cms-facts-import-simple-test.json
npm run validate:cms-facts -- --file outputs\cms-facts-import-simple-test.json
$env:CMS_FACTS_JSON = Get-Content -Raw -LiteralPath "outputs\cms-facts-import-simple-test.json"
npm run validate:domain
Remove-Item Env:\CMS_FACTS_JSON
npm run validate:seo
npm run validate:geo
```

Do not overwrite `outputs/cms-facts.json` during smoke tests. The first real import must replace the active source as a complete `CmsFactInput`; it must not merge with `mockProducts`.

## Legacy Mode Reference

Legacy mode is still supported. Use it only for existing multi-sheet exports or migrations that already maintain these files:

Required legacy files:

- `categories.csv`
- `products.csv`
- `specifications.csv`

Optional legacy files:

- `measurements.csv`
- `outputs.csv`
- `connections.csv`
- `environmental_limits.csv`
- `valve_profiles.csv`
- `variants.csv`
- `documents.csv`
- `assets.csv`
- `commercial_terms.csv`

In new product entry, do not ask operators to manually maintain the legacy technical profile sheets. Use `product_specs.csv` instead and let the system derive sensor and valve profiles.

## Real Import Data Checklist

Before formal batch import, provide:

- Final category tree with stable `cat_` IDs.
- Product identity table with final `prd_` IDs, SKUs, models, family, brand, and primary category.
- Complete `product_specs.csv` rows for all sensor and valve required spec keys.
- Datasheet/document files or stable URLs in `product_assets.csv`.
- Product images: primary image, gallery images, dimensions, diagrams, and installation photos where available.
- Certification codes and certificate documents where available.
- Commercial terms only when confirmed.
- Source refs for comparison-critical and GEO-eligible facts.
