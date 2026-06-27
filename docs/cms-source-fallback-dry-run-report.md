# CMS Source Fallback Dry-Run Report

Date: 2026-06-25

## Scope

This dry run validates the CMS facts source chain for future Strapi export replay without importing real product data, connecting a database, or changing UI code.

Source chain under test:

1. `cms-facts-api`
2. `CMS_FACTS_JSON`
3. `mock-domain`

Input fixture:

- `docs/cms-facts.example.json`
- 3 category facts
- 2 product facts
- Facts-only shape: `categoryFacts` and `productFacts`

## Dry-Run Matrix

| Scenario | Requested source mode | Active mode | Fallback reason | Product count | Raw CMS leak risk |
| --- | --- | --- | --- | ---: | --- |
| `CMS_FACTS_JSON` replay | `env-facts-json` | `env-facts-json` | `null` | 2 | Low: fixture validated as facts-only; derived SEO/GEO fields are generated after adapter hydration. |
| `cms-facts-api` disabled with env fallback | `cms-facts-api` | `env-facts-json` | `fetch-disabled` | 2 | Low: API fetch was intentionally disabled; valid `CMS_FACTS_JSON` replay became the active source. |
| Missing `CMS_FACTS_JSON` fallback | `env-facts-json` | `mock-domain` | `not-configured` | 20 | Low: no raw CMS payload was accepted because env facts were absent. |
| Invalid `CMS_FACTS_JSON` fallback | `env-facts-json` | `mock-domain` | `invalid-env-json` | 20 | Low: invalid env facts were rejected before domain hydration. |

## Commands Run

Validate the example fixture directly:

```powershell
npm run validate:cms-facts -- --file .\docs\cms-facts.example.json
```

Replay the fixture through `CMS_FACTS_JSON`:

```powershell
$env:CMS_SOURCE_MODE='env-facts-json'
$env:CMS_FACTS_JSON=(Get-Content -Raw 'docs/cms-facts.example.json')
node --loader ./scripts/ts-import-loader.mjs --input-type=module -e "import { preloadCmsProductSnapshotAsync, getCmsProductStatus } from './lib/cms/products.ts'; await preloadCmsProductSnapshotAsync(); console.log(JSON.stringify(getCmsProductStatus(), null, 2));"
```

Force `cms-facts-api` to fall back to `CMS_FACTS_JSON`:

```powershell
$env:CMS_SOURCE_MODE='cms-facts-api'
$env:CMS_FACTS_API_URL='https://cms.invalid/internal/cms/facts'
$env:CMS_FACTS_API_ALLOW_FETCH='false'
$env:CMS_FACTS_JSON=(Get-Content -Raw 'docs/cms-facts.example.json')
node --loader ./scripts/ts-import-loader.mjs --input-type=module -e "import { preloadCmsProductSnapshotAsync, getCmsProductStatus } from './lib/cms/products.ts'; await preloadCmsProductSnapshotAsync(); console.log(JSON.stringify(getCmsProductStatus(), null, 2));"
```

Force missing env facts to fall back to `mock-domain`:

```powershell
$env:CMS_SOURCE_MODE='env-facts-json'
Remove-Item Env:CMS_FACTS_JSON -ErrorAction SilentlyContinue
node --loader ./scripts/ts-import-loader.mjs --input-type=module -e "import { preloadCmsProductSnapshotAsync, getCmsProductStatus } from './lib/cms/products.ts'; await preloadCmsProductSnapshotAsync(); console.log(JSON.stringify(getCmsProductStatus(), null, 2));"
```

Force invalid env facts to fall back to `mock-domain`:

```powershell
$env:CMS_SOURCE_MODE='env-facts-json'
$env:CMS_FACTS_JSON='{"categoryFacts":[],"productFacts":[{"slug":"bad-derived-field"}]}'
node --loader ./scripts/ts-import-loader.mjs --input-type=module -e "import { preloadCmsProductSnapshotAsync, getCmsProductStatus } from './lib/cms/products.ts'; await preloadCmsProductSnapshotAsync(); console.log(JSON.stringify(getCmsProductStatus(), null, 2));"
```

## Evidence

`validate:cms-facts -- --file .\docs\cms-facts.example.json` returned:

```json
{
  "ok": true,
  "source": "file",
  "categoryFacts": 3,
  "productFacts": 2,
  "categoryTreeVersion": "category-tree-v1",
  "productRecords": 2,
  "generatedSeoRecords": 2,
  "generatedGeoRecords": 2,
  "duplicateRisks": {
    "categoryIdDuplicates": [],
    "productIdDuplicates": [],
    "skuDuplicates": [],
    "modelDuplicates": [],
    "documentDuplicates": [],
    "missingCategories": [],
    "productsMissingOverloadLimit": 0,
    "overloadLimitRisk": {
      "measurementCount": 2,
      "missingCount": 0,
      "uniqueSignatureCount": 2,
      "duplicateSignatureCount": 0,
      "duplicateMeasurementCount": 0,
      "duplicateSignatures": []
    }
  }
}
```

Fresh source status outputs:

```json
[
  {
    "scenario": "CMS_FACTS_JSON replay",
    "mode": "env-facts-json",
    "requestedMode": "env-facts-json",
    "activeMode": "env-facts-json",
    "productCount": 2,
    "sourceVersion": "cms-facts-json-env-v1",
    "fallbackReason": null,
    "factsJsonConfigured": true,
    "factsJsonValid": true,
    "factsApiConfigured": false,
    "factsApiFetchEnabled": false
  },
  {
    "scenario": "cms-facts-api disabled falls back to CMS_FACTS_JSON",
    "mode": "env-facts-json",
    "requestedMode": "cms-facts-api",
    "activeMode": "env-facts-json",
    "productCount": 2,
    "sourceVersion": "cms-facts-json-env-v1",
    "fallbackReason": "fetch-disabled",
    "factsJsonConfigured": true,
    "factsJsonValid": true,
    "factsApiConfigured": true,
    "factsApiFetchEnabled": false
  },
  {
    "scenario": "missing CMS_FACTS_JSON falls back to mock-domain",
    "mode": "mock-domain",
    "requestedMode": "env-facts-json",
    "activeMode": "mock-domain",
    "productCount": 20,
    "sourceVersion": "mock-products-v1",
    "fallbackReason": "not-configured",
    "factsJsonConfigured": false,
    "factsJsonValid": false,
    "factsApiConfigured": false,
    "factsApiFetchEnabled": false
  },
  {
    "scenario": "invalid CMS_FACTS_JSON falls back to mock-domain",
    "mode": "mock-domain",
    "requestedMode": "env-facts-json",
    "activeMode": "mock-domain",
    "productCount": 20,
    "sourceVersion": "mock-products-v1",
    "fallbackReason": "invalid-env-json",
    "factsJsonConfigured": true,
    "factsJsonValid": false,
    "factsApiConfigured": false,
    "factsApiFetchEnabled": false
  }
]
```

Node emitted the expected experimental `--loader` warning during these dry runs; the commands exited with code 0.

## Result

- `CMS_FACTS_JSON` can replay the existing facts fixture into hydrated domain records.
- `cms-facts-api` can fall back to valid `CMS_FACTS_JSON` when fetch is disabled.
- Missing or invalid `CMS_FACTS_JSON` falls back to `mock-domain` instead of hydrating unsafe raw facts.
- The example fixture validates as facts-only and rejects derived-field leakage through the same validation path used by local dry runs.

## Remaining Risk

The dry run does not call a real Strapi endpoint. The next real-export dry run should feed a transformed Strapi export into `CMS_FACTS_JSON` and re-run the same validation matrix before enabling `CMS_FACTS_API_ALLOW_FETCH=true` in any CI or preview environment.
