# CMS Content Model: Strapi + PostgreSQL Fact Layer

## Purpose

This document defines the industrial CMS fact layer for Strapi + PostgreSQL. The CMS is an input system only: it stores raw industrial facts and lookup facts, then a backend aggregator normalizes those records into `CmsFactInput` for `adapter/product.adapter.ts`.

The CMS must not become a second domain model. It must not store generated routing, SEO, GEO, JSON-LD, or UI projection fields.

## Hard Boundaries

Allowed CMS content types:

- `ProductFact`
- `CategoryFact`
- `IndustryFact`
- `ApplicationFact`
- `DocumentAsset`
- `Certification`

Forbidden CMS fields anywhere:

- `slug`
- `slugPath`
- `canonical`
- `canonicalPath`
- `breadcrumb`
- `seo`
- `localizedSeo`
- `jsonld`
- `jsonLd`
- `jsonLD`
- `geo`
- `geoAi`
- `localizedGeoAi`
- `geoEntity`
- `entity`
- generated category `depth`
- generated category `children`
- domain projection `identity`
- domain projection `classification`

Generated only by adapter:

- category slug, depth, slugPath, canonicalPath, children, facet policy, category SEO inputs
- product classification categoryPath
- product slug and canonical path
- product breadcrumb and alternates
- Product JSON-LD
- ProductSeoFields
- ProductGeoAiProfile and AI-readable GEO entity

The frontend must not query Strapi raw responses. Frontend and SEO/GEO runtime continue to consume `lib/domain`, `lib/cms/products.ts`, and adapter-generated domain projections.

## Adapter Input Contract

The only shape allowed to leave the CMS aggregation boundary is:

```ts
interface CmsFactInput {
  readonly categoryFacts: readonly CategoryFact[]
  readonly productFacts: readonly ProductFact[]
}
```

`IndustryFact`, `ApplicationFact`, `DocumentAsset`, `Certification`, and media asset rows are Strapi persistence models. They are normalized into IDs and embedded facts inside `ProductFact` before the adapter runs.

## Final Schema Coverage Decision

The Strapi schema set is complete for the CMS Fact Layer when these six content types are present and no extra domain or generated collections are added:

| Adapter / persistence need | Strapi source | Aggregator output |
|---|---|---|
| `CategoryFact` | `category-fact.factId`, `parent`, `name` | `categoryFacts[].id`, `parentId`, `name` |
| `ProductFact` identity | `product-fact.factId`, identity fields, lifecycle fields | `productFacts[].id`, `sku`, `model`, `seriesId`, `brand`, `manufacturer`, `lifecycle`, `availability`, `releasedAt`, `revisedAt` |
| `ProductFact` classification refs | `primaryCategory`, `additionalCategories`, `industries`, `applications`, `measurementKinds` | `primaryCategoryId`, `additionalCategoryIds`, `industryIds`, `applicationIds`, `measurementKinds` |
| `ProductFact` localized facts | `name`, `shortName`, `summary`, `highlights`, `applicationCopy` | `name`, `shortName`, `summary`, `highlights`, `applications` |
| `ProductFact` technical facts | measurement, output, connection, environment, specification, variant, commercial components | matching adapter component shapes |
| `DocumentAsset` | `document-asset` relation filtered by `assetClass` | `documents[]` for `document`, `assets[]` for `media` |
| `Certification` | `certification.code` relation | `certifications[]` code array |
| `IndustryFact` | lookup collection only | `industryIds[]`; no standalone adapter output |
| `ApplicationFact` | lookup collection only | `applicationIds[]`; no standalone adapter output |

`factId` is the Strapi field name for stable content identifiers. The aggregator is the only layer that renames `factId` to adapter `id`. Strapi internal `id`, `documentId`, timestamps, relation envelopes, Upload metadata, and draft/publish metadata never cross the aggregation boundary.

The schema set intentionally excludes `slug`, `canonical`, `seo`, `jsonLd`, and `geo` fields. Those values are generated after `buildDomainFromCmsFacts(cmsFacts)` and belong to the adapter/domain runtime, not Strapi or PostgreSQL.

## Strapi Content Types

### CategoryFact

Collection type: `category-fact`

Purpose: minimal category tree facts. The adapter derives category kind, sort order, slug, path, canonical URL, description, breadcrumbs, facet keys, and category SEO fields.

Fields:

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `factId` | string unique | yes | Stable domain ID, must start with `cat_`. Not Strapi document id; aggregator outputs `id`. |
| `parent` | relation many-to-one `category-fact` | no | Null means root. Aggregator outputs `parentId`. |
| `name` | localized text component | yes | Must include `en` and `zh`. Used to generate slug. |

Forbidden in `CategoryFact`: `slug`, `depth`, `slugPath`, `canonicalPath`, `children`, `breadcrumb`, `seo`.

Adapter output shape:

```json
{
  "id": "cat_industrial_sensors",
  "parentId": null,
  "name": { "en": "Industrial Sensors", "zh": "Industrial Sensors" }
}
```

### ProductFact

Collection type: `product-fact`

Purpose: raw product facts sufficient to generate `ProductRecord`.

Identity fields:

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `factId` | string unique | yes | Stable product ID, must start with `prd_`; aggregator outputs `id`. |
| `sku` | string | yes | Unique commercial SKU. |
| `model` | string | yes | Used by adapter to generate product slug. |
| `seriesId` | string | yes | Must start with `ser_`. |
| `brand` | string | yes | Product brand fact. |
| `manufacturer` | string | no | Optional manufacturer fact. |
| `lifecycle` | enum | yes | `draft`, `active`, `phase-out`, `discontinued`, `hidden`. |
| `availability` | enum | yes | `stock-model`, `standard-lead-time`, `configurable`, `made-to-order`, `quote-required`, `not-available`. |
| `releasedAt` | date | no | ISO date. |
| `revisedAt` | date | yes | ISO date, also used for generated GEO governance. |

Classification fields:

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `primaryCategory` | relation many-to-one `category-fact` | yes | Aggregator outputs `primaryCategoryId`. |
| `additionalCategories` | relation many-to-many `category-fact` | no | Aggregator outputs `additionalCategoryIds`. |
| `industries` | relation many-to-many `industry-fact` | yes, can be empty | Aggregator outputs `industryIds`. |
| `applications` | relation many-to-many `application-fact` | yes, can be empty | Aggregator outputs `applicationIds`. |
| `measurementKinds` | enum array | yes | Must match measurement records. |

Localized content fields:

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `name` | localized text component | yes | Product full name. |
| `shortName` | localized text component | yes | Listing label source. |
| `summary` | localized text component | yes | Product factual summary. |
| `highlights` | repeatable localized text component | yes | Non-empty. |
| `applicationCopy` | repeatable localized text component | yes, can be empty | Aggregator outputs `applications`. |

Technical components:

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `measurements` | repeatable component `measurement-fact` | yes | Non-empty; each item requires `overloadLimit`. |
| `outputs` | repeatable component `signal-output-fact` | yes | Non-empty. |
| `connections` | component `connection-set-fact` | yes | Process and electrical connection facts. |
| `environmentalLimits` | component `environmental-limit-fact` | yes | Requires compatible media and at least one temperature limit. |
| `specificationGroups` | repeatable component `specification-group-fact` | yes | Non-empty. |
| `variants` | repeatable component `variant-fact` | no | Optional. |
| `documents` | relation many-to-many `document-asset` filtered to `assetClass=document` | yes | At least one document for GEO evidence. |
| `assets` | relation many-to-many `document-asset` filtered to `assetClass=media` | no | Product images/diagrams. |
| `certifications` | relation many-to-many `certification` | no | Aggregator outputs enum code array. |
| `commercialTerms` | component `commercial-term-fact` | yes | MOQ, lead time, warranty, OEM flags. |

Forbidden in `ProductFact`: `slug`, `identity`, `classification`, `categoryPath`, `slugPath`, `canonicalPath`, `breadcrumb`, `seo`, `localizedSeo`, `jsonld`, `jsonLd`, `jsonLD`, `geo`, `geoAi`, `localizedGeoAi`, `geoEntity`, `entity`.

### IndustryFact

Collection type: `industry-fact`

Purpose: lookup fact only. It does not become a domain entity. It can be used for CMS editorial pages later, but product-domain integration only reads `id`.

Fields:

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `factId` | string unique | yes | Must start with `ind_`; aggregator uses it in `industryIds`. |
| `name` | localized text component | yes | Editor label and internal lookup display. |
| `description` | localized text component | no | Content-only, not adapter input. |

Forbidden: `slug`, `canonicalPath`, `seo`, `geo`, `products` as a source-of-truth field.

### ApplicationFact

Collection type: `application-fact`

Purpose: lookup fact only. Product relation outputs `applicationIds`.

Fields:

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `factId` | string unique | yes | Must start with `app_`; aggregator uses it in `applicationIds`. |
| `name` | localized text component | yes | Editor label and internal lookup display. |
| `description` | localized text component | no | Content-only, not adapter input. |

Forbidden: `slug`, `canonicalPath`, `seo`, `geo`, reverse product ownership.

### DocumentAsset

Collection type: `document-asset`

Purpose: factual documents and media assets used by `ProductFact.documents` and `ProductFact.assets`.

Fields:

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `factId` | string unique | yes | `doc_` for documents, `asset_` for media; aggregator outputs `id`. |
| `assetClass` | enum | yes | `document` or `media`. |
| `title` | string | conditionally | Required for `document`. |
| `documentKind` | enum | conditionally | `datasheet`, `manual`, `certificate`, `drawing`, `catalog`, `software`. Required for `document`. |
| `assetKind` | enum | conditionally | `primary-image`, `gallery-image`, `diagram`, `dimension-drawing`, `installation-photo`. Required for `media`. |
| `file` | media | yes | Strapi Upload file. Aggregator converts to public `href`. |
| `hrefOverride` | string | no | Optional external/private CDN path. |
| `alt` | string | conditionally | Required for `media`. |
| `locale` | string | no | Optional document locale. |
| `revision` | string | no | Optional document revision. |

Mapping:

```ts
assetClass === 'document' -> ProductDocument
assetClass === 'media' -> ProductAsset
```

Forbidden: `canonicalPath`, `seo`, `geo`, `jsonLd`.

### Certification

Collection type: `certification`

Purpose: controlled compliance code lookup. Product relation outputs certification code strings.

Fields:

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `code` | enum/string unique | yes | `ce`, `rohs`, `atex`, `iecex`, `sil`, `iso9001`, `food-grade`, `marine`, `custom`. |
| `label` | localized text component | yes | Editor display only. |
| `issuer` | string | no | Factual issuer/source text. |

Forbidden: SEO/GEO/routing fields.

## Reusable Components

### `localized-text`

```json
{ "en": "string", "zh": "string" }
```

### `quantity-range`

```json
{ "min": 0, "max": 10, "unit": "bar", "display": "0...10 bar" }
```

### `quantity-value`

```json
{ "value": 15, "unit": "bar", "display": "15 bar" }
```

### `measurement-fact`

```json
{
  "kind": "pressure",
  "range": { "min": 0, "max": 10, "unit": "bar", "display": "0...10 bar" },
  "accuracy": "0.5% FS",
  "overloadLimit": { "value": 15, "unit": "bar", "display": "15 bar" }
}
```

### `signal-output-fact`

```json
{ "kind": "analog-current", "value": "4-20 mA", "protocol": null, "wiring": "2-wire" }
```

### `connection-set-fact`

```json
{
  "process": { "kind": "thread", "value": "G1/4", "material": "316L stainless steel" },
  "electrical": { "kind": "m12", "value": "M12x1 connector" }
}
```

### `environmental-limit-fact`

```json
{
  "ingressProtection": "IP67",
  "mediaTemperature": { "min": -20, "max": 85, "unit": "c", "display": "-20...85 C" },
  "ambientTemperature": { "min": -20, "max": 70, "unit": "c", "display": "-20...70 C" },
  "wettedMaterials": ["316L stainless steel"],
  "compatibleMedia": ["Water", "Hydraulic oil"]
}
```

### `specification-group-fact`

```json
{
  "key": "measurement",
  "label": "Measurement",
  "values": [
    {
      "key": "range",
      "label": "Range",
      "value": "0...10 bar",
      "unit": "bar",
      "display": "0...10 bar",
      "sourceRefs": [
        { "id": "doc_example_datasheet", "label": "Datasheet", "confidence": "source-backed" }
      ]
    }
  ]
}
```

### `variant-fact`

```json
{
  "id": "var_example_default",
  "orderCode": "EX-001",
  "optionValues": [{ "optionKey": "range", "label": "Range", "value": "0...10 bar" }],
  "availability": "configurable",
  "lifecycle": "active"
}
```

### `commercial-term-fact`

```json
{
  "minimumOrderQuantity": 10,
  "standardLeadTime": "2-4 weeks",
  "warranty": "18 months",
  "oemCustomizable": true,
  "privateLabelAvailable": false
}
```

## PostgreSQL Persistence Design

Logical tables, implemented by Strapi collection types and component tables:

```sql
category_facts (
  strapi_id integer primary key, -- generated by Strapi
  fact_id text unique not null check (fact_id like 'cat_%'),
  parent_id text null references category_facts(fact_id),
  name jsonb not null,
  published_at timestamptz null,
  updated_at timestamptz not null
);

industry_facts (
  strapi_id integer primary key, -- generated by Strapi
  fact_id text unique not null check (fact_id like 'ind_%'),
  name jsonb not null,
  description jsonb null,
  published_at timestamptz null,
  updated_at timestamptz not null
);

application_facts (
  strapi_id integer primary key, -- generated by Strapi
  fact_id text unique not null check (fact_id like 'app_%'),
  name jsonb not null,
  description jsonb null,
  published_at timestamptz null,
  updated_at timestamptz not null
);

certifications (
  strapi_id integer primary key, -- generated by Strapi
  code text unique not null,
  label jsonb not null,
  issuer text null,
  published_at timestamptz null,
  updated_at timestamptz not null
);

product_facts (
  strapi_id integer primary key, -- generated by Strapi
  fact_id text unique not null check (fact_id like 'prd_%'),
  sku text not null unique,
  model text not null,
  series_id text not null check (series_id like 'ser_%'),
  brand text not null,
  manufacturer text null,
  lifecycle text not null,
  availability text not null,
  released_at date null,
  revised_at date not null,
  primary_category_id text not null references category_facts(fact_id),
  name jsonb not null,
  short_name jsonb not null,
  summary jsonb not null,
  highlights jsonb not null,
  application_copy jsonb not null,
  measurements jsonb not null,
  outputs jsonb not null,
  connections jsonb not null,
  environmental_limits jsonb not null,
  specification_groups jsonb not null,
  variants jsonb null,
  commercial_terms jsonb not null,
  published_at timestamptz null,
  updated_at timestamptz not null
);

product_fact_additional_categories (
  product_id text references product_facts(fact_id),
  category_id text references category_facts(fact_id),
  primary key (product_id, category_id)
);

product_fact_industries (
  product_id text references product_facts(fact_id),
  industry_id text references industry_facts(fact_id),
  primary key (product_id, industry_id)
);

product_fact_applications (
  product_id text references product_facts(fact_id),
  application_id text references application_facts(fact_id),
  primary key (product_id, application_id)
);

product_fact_certifications (
  product_id text references product_facts(fact_id),
  certification_code text references certifications(code),
  primary key (product_id, certification_code)
);

document_assets (
  strapi_id integer primary key, -- generated by Strapi
  fact_id text unique not null check (fact_id like 'doc_%' or fact_id like 'asset_%'),
  asset_class text not null check (asset_class in ('document', 'media')),
  title text null,
  document_kind text null,
  asset_kind text null,
  file_id integer not null,
  href_override text null,
  alt text null,
  locale text null,
  revision text null,
  published_at timestamptz null,
  updated_at timestamptz not null
);

product_fact_document_assets (
  product_id text references product_facts(fact_id),
  asset_id text references document_assets(fact_id),
  primary key (product_id, asset_id)
);
```

The SQL above is logical documentation for Strapi/PostgreSQL persistence, not a migration to run by hand. In a real Strapi database, Strapi owns numeric primary keys and generated join table names; `fact_id` and `certifications.code` are business keys that the aggregator reads and exposes as adapter IDs.

PostgreSQL relation rules:

- `category_facts.parent_id` is a self-relation and maps to `CategoryFact.parentId`; the adapter validates one root, no cycles, sibling slug uniqueness, and max depth.
- `product_facts.primary_category_id` is required and maps to `primaryCategoryId`; additional category, industry, application, certification, and document/media relations map to arrays.
- `industry_facts` and `application_facts` are lookup tables only. They do not own products and do not produce standalone domain records.
- `document_assets.asset_class` decides whether a related row becomes `documents[]` or `assets[]`; the same row must not be emitted into both arrays for one product.
- Publish state is controlled by Strapi `published_at`; `publicationState=live` includes only rows with `published_at`, while `publicationState=preview` may include draft rows for the requested preview context.

Recommended indexes:

```sql
create unique index product_facts_model_generated_slug_guard on product_facts (lower(regexp_replace(model, '[^a-zA-Z0-9]+', '-', 'g')));
create index product_facts_primary_category_idx on product_facts (primary_category_id);
create index category_facts_parent_idx on category_facts (parent_id);
create index document_assets_asset_class_idx on document_assets (asset_class);
```

The model-slug index is a guard only. The canonical product slug remains adapter-generated.

## Aggregated REST Shape

Strapi raw REST should not be consumed by UI. Expose a backend-only aggregator endpoint such as:

```txt
GET /internal/cms/facts?publicationState=live
GET /internal/cms/facts?publicationState=preview
```

Response must exactly match adapter input:

```json
{
  "categoryFacts": [
    {
      "id": "cat_industrial_sensors",
      "parentId": null,
      "name": { "en": "Industrial Sensors", "zh": "Industrial Sensors" }
    }
  ],
  "productFacts": [
    {
      "id": "prd_example_001",
      "sku": "EX-001",
      "model": "HY-EX-001",
      "seriesId": "ser_example",
      "brand": "HEIYU Industrial",
      "manufacturer": "HEIYU Industrial",
      "lifecycle": "active",
      "availability": "configurable",
      "releasedAt": "2026-01-10",
      "revisedAt": "2026-06-22",
      "primaryCategoryId": "cat_industrial_sensors",
      "additionalCategoryIds": [],
      "industryIds": ["ind_water"],
      "applicationIds": ["app_pump"],
      "measurementKinds": ["pressure"],
      "name": { "en": "Example Pressure Sensor", "zh": "Example Pressure Sensor" },
      "shortName": { "en": "Example Sensor", "zh": "Example Sensor" },
      "summary": { "en": "Source-backed pressure sensor facts.", "zh": "Source-backed pressure sensor facts." },
      "highlights": [{ "en": "0...10 bar measurement", "zh": "0...10 bar measurement" }],
      "applications": [{ "en": "Pump monitoring", "zh": "Pump monitoring" }],
      "measurements": [
        {
          "kind": "pressure",
          "range": { "min": 0, "max": 10, "unit": "bar", "display": "0...10 bar" },
          "accuracy": "0.5% FS",
          "overloadLimit": { "value": 15, "unit": "bar", "display": "15 bar" }
        }
      ],
      "outputs": [{ "kind": "analog-current", "value": "4-20 mA", "wiring": "2-wire" }],
      "connections": {
        "process": { "kind": "thread", "value": "G1/4", "material": "316L stainless steel" },
        "electrical": { "kind": "m12", "value": "M12x1 connector" }
      },
      "environmentalLimits": {
        "ingressProtection": "IP67",
        "mediaTemperature": { "min": -20, "max": 85, "unit": "c", "display": "-20...85 C" },
        "wettedMaterials": ["316L stainless steel"],
        "compatibleMedia": ["Water"]
      },
      "specificationGroups": [
        {
          "key": "measurement",
          "label": "Measurement",
          "values": [
            {
              "key": "range",
              "label": "Range",
              "value": "0...10 bar",
              "display": "0...10 bar",
              "sourceRefs": [{ "id": "doc_example_datasheet", "label": "Datasheet", "confidence": "source-backed" }]
            }
          ]
        }
      ],
      "variants": [],
      "certifications": ["ce", "rohs"],
      "documents": [
        { "id": "doc_example_datasheet", "title": "Example Datasheet", "kind": "datasheet", "href": "/uploads/example.pdf", "locale": "en", "revision": "v1" }
      ],
      "assets": [
        { "id": "asset_example_primary", "kind": "primary-image", "href": "/uploads/example.png", "alt": "Example Pressure Sensor" }
      ],
      "commercialTerms": {
        "minimumOrderQuantity": 10,
        "standardLeadTime": "2-4 weeks",
        "warranty": "18 months",
        "oemCustomizable": true,
        "privateLabelAvailable": false
      }
    }
  ]
}
```

This response is then passed to:

```ts
buildDomainFromCmsFacts(cmsFacts)
```

## Aggregated GraphQL Shape

GraphQL can expose the same adapter input behind a backend-only query:

```graphql
type Query {
  cmsFacts(publicationState: PublicationState = LIVE): CmsFactInput!
}

type CmsFactInput {
  categoryFacts: [CategoryFact!]!
  productFacts: [ProductFact!]!
}
```

The GraphQL resolver must not expose Strapi-generated fields such as `documentId`, `createdAt`, `updatedAt`, relation wrapper nodes, or media upload internals. It must resolve relations into primitive IDs and embedded facts before returning.

Example query:

```graphql
query CmsFactsForAdapter {
  cmsFacts(publicationState: LIVE) {
    categoryFacts { id parentId name { en zh } }
    productFacts {
      id sku model seriesId brand manufacturer lifecycle availability releasedAt revisedAt
      primaryCategoryId additionalCategoryIds industryIds applicationIds measurementKinds
      name { en zh }
      shortName { en zh }
      summary { en zh }
      highlights { en zh }
      applications { en zh }
      measurements { kind range { min max unit display } overloadLimit { value unit display } accuracy }
      outputs { kind value protocol wiring }
      connections { process { kind value material } electrical { kind value } }
      environmentalLimits { ingressProtection mediaTemperature { min max unit display } ambientTemperature { min max unit display } wettedMaterials compatibleMedia }
      specificationGroups { key label values { key label value unit display sourceRefs { id label href page confidence } } }
      variants { id orderCode optionValues { optionKey label value code } availability lifecycle }
      certifications
      documents { id title kind href locale revision }
      assets { id kind href alt }
      commercialTerms { minimumOrderQuantity standardLeadTime warranty oemCustomizable privateLabelAvailable }
    }
  }
}
```

## Publish Validation

Before publishing any relevant Strapi entry, run aggregation and adapter validation:

1. Fetch all published facts plus the draft entry being published.
2. Normalize to `CmsFactInput`.
3. Run `assertCmsFactInput(cmsFacts)`.
4. Run `buildDomainFromCmsFacts(cmsFacts)`.
5. Reject publish if adapter validation throws.

Validation must reject:

- illegal derived fields
- duplicate product IDs, SKUs, or generated model slugs
- category graph cycles
- more than one root category
- category depth greater than 4
- product category IDs not present in `CategoryFact`
- `measurementKinds` without matching measurement records
- measurements without `overloadLimit`
- missing temperature/media environmental facts
- products without at least one document

The publish gate is allowed to read draft data for the entry being published, but it must still aggregate a complete graph before validation. Partial-entry validation is insufficient because product facts depend on category, lookup, asset, certification, and generated slug uniqueness checks.

## Publish Webhook to ISR Revalidation

### Event Source

Strapi lifecycle/webhook events:

- `entry.publish`
- `entry.unpublish`
- `entry.update` when published
- media replacement for `DocumentAsset`

Payload should include only metadata, not raw full facts:

```json
{
  "event": "entry.publish",
  "contentType": "api::product-fact.product-fact",
  "entryId": "prd_example_001",
  "publishedAt": "2026-06-22T10:00:00.000Z"
}
```

### Security

Strapi signs the request:

```txt
POST /api/revalidate/cms
x-cms-signature: hmac-sha256(timestamp + body, CMS_REVALIDATE_SECRET)
x-cms-timestamp: 2026-06-22T10:00:00.000Z
```

The Next backend verifies timestamp skew and HMAC before doing any work.

### Revalidation Flow

1. Receive signed webhook at Next backend route.
2. Fetch aggregated direct `CmsFactInput` from backend-only CMS facts endpoint.
3. Run `buildDomainFromCmsFacts(cmsFacts)` to produce `CategoryTree` and `ProductRecord[]`.
4. Determine affected IDs from webhook metadata.
5. Revalidate broad tags first:
   - `cms-facts`
   - `product-catalog`
   - `sitemap`
   - `home`
6. Revalidate affected generated paths after adapter derivation:
   - `/[locale]`
   - `/[locale]/products`
   - `/[locale]/products/{generated-category-path}`
   - `/[locale]/products/{generated-category-path}/{generated-product-slug}`
   - `/[locale]/geo/products/{generated-category-path}/{generated-product-slug}`
   - `/sitemap.xml`
7. Return a revalidation report with affected product IDs, category IDs, and paths.

Do not compute affected paths from Strapi slugs because CMS stores no slugs. Paths must be computed from adapter output.

### Revalidation Granularity

- `ProductFact` publish: product detail, GEO route, product listing pages, homepage product modules, sitemap.
- `CategoryFact` publish: all category listing pages and product detail pages whose generated category path may change.
- `IndustryFact` or `ApplicationFact` publish: product listing/search facets and any future content pages only; no direct domain entity output.
- `DocumentAsset` publish: related products, GEO evidence, OpenGraph image if media asset.
- `Certification` publish: related products and product listing facets.

## Preview Mode Plan

Preview must still use the adapter.

1. Strapi preview button calls `/api/preview/cms?contentType=...&entryId=...&secret=...`.
2. Next verifies preview secret.
3. Next fetches draft aggregated facts from backend-only endpoint with `publicationState=preview`.
4. Next runs `buildDomainFromCmsFacts` in memory.
5. Next finds the generated canonical path for the requested entry.
6. Next enables draft mode and redirects to the generated frontend route.

The preview UI must never receive Strapi raw response objects. It receives the same domain projection as live pages, with draft facts substituted before adapter generation.

Preview resolution rules:

- `ProductFact` preview resolves to the generated product detail path after adapter derivation.
- `CategoryFact` preview resolves to the generated category listing path after adapter derivation.
- `IndustryFact`, `ApplicationFact`, `DocumentAsset`, `Certification`, and media asset previews resolve through related products or catalog/search surfaces; they do not create standalone domain routes in this phase.
- Preview fetches must pass `publicationState=preview` to `/internal/cms/facts` and must never call Strapi from client components.

## Migration and Compatibility

Current mock/env CMS source remains valid:

- no `CMS_FACTS_JSON`: `lib/cms/products.ts` uses mock domain fallback.
- with `CMS_FACTS_JSON`: the env payload must match `CmsFactInput` and passes through `buildDomainFromCmsFacts`.
- `CMS_SOURCE_MODE=cms-facts-api`: the async source path can fetch the backend-only facts endpoint when enabled, but live product runtime still stays on sync mock/env behavior until `lib/cms/products.ts` is wired to the async source boundary.
- `CMS_FACTS_API_URL` and related `CMS_FACTS_API_*` variables configure the async `cms-facts-api` path; they are not required for normal mock or env JSON execution.

Strapi rollout sequence:

1. Implement Strapi content types and components.
2. Build backend-only fact aggregator REST/GraphQL endpoint.
3. Validate aggregator output with `npm run validate:cms-facts`.
4. Connect live runtime in `lib/cms/products.ts` to the async `cms-facts-api` source boundary or an explicit preload step.
5. Add signed publish webhook revalidation.
6. Enable preview mode after live validation passes.

## Non-Goals

- No frontend UI changes.
- No direct UI-to-Strapi data fetching.
- No storage of SEO/GEO/routing projections in PostgreSQL.
- No Industry or Case domain expansion in this thread.
- No data migration from mock products in this thread.
