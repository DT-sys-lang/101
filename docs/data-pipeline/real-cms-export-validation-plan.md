# Real CMS Export Validation Plan

## Objective

Validate a Strapi export against the facts-only adapter boundary before it ever reaches the domain layer.

## 1) Strapi export -> `CmsFactInput`

Strapi should export raw content only. The export transform must map records into this structure:

- `categoryFacts[]` with `id`, `parentId`, and localized `name`
- `productFacts[]` with raw ids, category references, localized text, measurements, outputs, connections, environmental limits, specification groups, documents, assets, and commercial terms

The transform must strip or reject any derived field, including:

- `slug`, `slugPath`, `canonicalPath`
- `depth`, `children`, `breadcrumb`
- `seo`, `jsonLd`, `geo`, `geoAi`
- any alternate generated aliases such as `localizedSeo` or `localizedGeoAi`

## 2) Local validation workflow

### PowerShell

```powershell
$exportPath = 'docs/cms-facts.example.json'
$factsPath = 'tmp/cms-facts.from-export.json'
New-Item -ItemType Directory -Force -Path 'tmp' | Out-Null
node --loader ./scripts/ts-import-loader.mjs ./scripts/transform-cms-export.mjs --file $exportPath --out $factsPath
npm run validate:cms-facts -- --file $factsPath
$env:CMS_FACTS_JSON = Get-Content $factsPath -Raw
npm run validate:domain
Remove-Item Env:\CMS_FACTS_JSON
npm run validate:scale-300
npm run validate:scale-1000
```

Use the same commands on a real Strapi export file; the transform script emits `CmsFactInput` and fails if derived fields such as `slug`, `canonicalPath`, `seo`, `jsonLd`, `geo`, or `geoAi` are present.

## 3) CI validation

CI should run the same gates on the exported artifact or on a generated `CMS_FACTS_JSON` value:

- `node --loader ./scripts/ts-import-loader.mjs ./scripts/transform-cms-export.mjs --file <export.json> --out <facts.json>`
- `npm run validate:cms-facts -- --file <facts.json>`
- `npm run validate:domain`
- `npm run validate:scale-300`
- `npm run validate:scale-1000`
- `npm run build`

The CI job should fail fast when the export contains derived fields, invalid references, duplicate identities, or missing evidence documents.

## 4) Common failures and ownership

- Derived field leakage (`slug`, `seo`, `jsonLd`, `geo`) -> CMS export transform owner
- Missing required product facts -> CMS/content owner
- Duplicate `sku`, `model`, `document`, or category ids -> CMS/content owner
- Invalid category graph or category depth -> taxonomy/content owner
- Invalid specification keys or measurement definitions -> adapter/domain owner
- SEO or GEO contract mismatch after conversion -> adapter owner

## 5) Operational note

`lib/cms/products.ts` reads `CMS_FACTS_JSON`, passes it through the adapter, and publishes the generated domain records. That makes the environment variable path the canonical runtime contract for headless CMS integration.
