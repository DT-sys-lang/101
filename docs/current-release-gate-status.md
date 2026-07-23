# Current Release Gate Status

Date: 2026-07-03
Owner: QA / Scale / Release Gate
Scope: release gates and real batch import readiness for sensor + valve + optional CMS fact fields

## QA Status

Release gates are green for the current baseline and the import-test artifact.

The checked baseline covers:

- Current real CMS facts from `outputs/cms-facts.json`.
- Import-test CMS facts from `outputs/cms-facts-import-test.json` with 1 sensor and 1 valve.
- Sensor product facts with measurements, overload limits, outputs, and connection facts.
- Valve product facts with `valveProfile` and without requiring sensor-only `measurements`, `overloadLimit`, `outputs`, or `connections.electrical`.
- SEO and GEO readable output for both sensor and valve fixture products.
- UI/SEO/GEO boundary rules that prevent direct reads from Strapi/CMS raw facts.

## Current Data Reality

| Data source | Current status |
| --- | --- |
| `outputs/cms-facts.json` | 5 category facts, 6 real product facts, all sensors. |
| Real sensor data | 6 sensor product facts. |
| Real valve data | 0 valve product facts; no real valve data has been imported yet. |
| `outputs/cms-facts-import-test.json` | 5 category facts, 2 product facts: 1 sensor and 1 valve. |
| Sensor + valve gate fixture | Validation-only fixture with 1 sensor and 1 valve. |
| `ru` / `es` routes | Still not opened as public routes; current public locale gate remains `zh` + `en`. |
| Current production build output | `npm run build` generated 89 static pages. |

Current real-data watch item: `validate:cms-facts -- --file outputs\cms-facts.json` reports two overloadLimit signature duplicate groups: `prd_p13`/`prd_p14` and `prd_p10`/`prd_p11`. This is reported as duplicate-risk telemetry and did not fail the gate.

## Import Acceptance Checklist

Formal batch import must follow `docs/data-pipeline/real-import-acceptance-checklist.md`.

The checklist covers:

- Product ID, SKU, and model uniqueness.
- Category reference existence for `primaryCategoryId`, `core.primaryCategory`, and additional categories.
- Sensor requirements: `sensorProfile` or legacy `measurements`/`outputs`, measurement overload limits, output facts, and measurement kind alignment.
- Valve requirements: `valveProfile` with pressure rating, connection, material, mode, compatible media, and size.
- Optional degradation for `documents`, `assets`, `certifications`, and `commercialTerms`.
- Rejection of generated `slug`, `canonical`, `seo`, `jsonLd`, and `geo` fields.
- SEO/GEO generation after adapter conversion.
- Search acceptance by industry, application, medium, model, and family.

## Gate Scope

| Gate | Required coverage |
| --- | --- |
| `validate:cms-facts -- --file outputs\cms-facts-import-test.json` | Validates import-test JSON and the sensor+valve optional-field fixture. |
| `validate:cms-facts -- --file outputs\cms-facts.json` | Stats probe for the active real file: 6 sensors, 0 valves. |
| `validate:domain` | Must not require all products to have measurements, overload limits, outputs, or electrical connections. Sensor-only requirements apply only to sensor products. Valve products require `valveProfile`. |
| `validate:seo` | Confirms readable SEO/JSON-LD output for both sensor and valve fixture products. |
| `validate:geo` | Confirms readable AI/GEO output for both sensor and valve fixture products. Source references may be empty for products without evidence documents. |
| `validate:boundaries` | UI, SEO, and GEO layers must not directly import Strapi/CMS raw facts or read public CMS/Strapi/facts env vars. |
| `validate:scale-1000` | Uses mixed generated CMS facts, including both sensor and valve products. |
| `build` | Confirms Next.js production build and static generation. |

## Node / CI Notes

The root workspace currently runs the Next.js and validation gates on the root Node toolchain. If Strapi needs separate CI, run it as an isolated job with a Strapi-supported Node version. Strapi 4 requires Node `>=18 <=20`; do not reuse or mix the root Node 24 CI runtime for Strapi 4.

## Expected Sitemap Formula

Current `staticLocalizedEntryCount` is `7`.

```txt
2 locales * (1 home + 7 static localized entries + 5 industry entries + 3 application entries + product count)
```

## Final Rerun Evidence

Required command sequence completed on 2026-07-03.

| Command | Result | Evidence |
| --- | --- | --- |
| `npm run validate:cms-facts -- --file outputs\cms-facts-import-test.json` | Pass | exit `0`; 5 categories, 2 products; families: sensor 1, valve 1; generated SEO 2, GEO 2; no duplicate IDs/SKUs/models/documents/missing categories. |
| `npm run validate:cms-facts -- --file outputs\cms-facts.json` | Pass | exit `0`; 5 categories, 6 products; families: sensor 6, valve 0; generated SEO 6, GEO 6; duplicate-risk telemetry only for overloadLimit signatures. |
| `npm run lint` | Pass | exit `0`; quality gate returned `{ "ok": true }`. |
| `npm run typecheck` | Pass | exit `0`; `tsc --noEmit` completed. |
| `npm run validate:boundaries` | Pass | exit `0`; 70 files checked, 0 violations. |
| `npm run validate:domain` | Pass | exit `0`; mock domain 20 products; fixture has 1 sensor + 1 valve. |
| `npm run validate:seo` | Pass | exit `0`; 300 mixed products, 632 sitemap entries, sensor+valve readable SEO fixture. |
| `npm run validate:geo` | Pass | exit `0`; 300 mixed products, 1,106 answer blocks per locale, sensor+valve AI-readable fixture. |
| `npm run validate:scale-1000` | Pass | exit `0`; 1000 mixed products, 2,032 sitemap entries, 3,674 GEO answer blocks per locale. |
| `npm run build` | Pass | exit `0`; Next.js 16.2.9 production build generated 89 static pages. |

## Blocking Items

No release-gate command failed in this run.

Current non-blocking constraints before data go-live:

- Active real data still contains only 6 sensors and 0 valves.
- `ru` / `es` remain content fields only and are not public routes.
- Real imported data must still rerun the full gate sequence after replacing or wiring the active source.
- Search acceptance for the real batch must be checked against representative imported products by industry, application, medium, model, and family.

## Data Import Decision

Go to start formal batch import from a QA/release-gate perspective.

This is not a final public go-live decision for imported data. After the real batch replaces the active source or is wired through `CMS_FACTS_JSON`, rerun the full gate sequence and update this status with the real imported product, sensor, and valve counts.
