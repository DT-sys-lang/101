# Internal CMS Facts Aggregator Endpoint

## Endpoint

```txt
GET /internal/cms/facts
```

This is a backend-only endpoint. It is not a frontend data API and must not be called by UI components.

## Purpose

The endpoint reads Strapi facts, resolves relations, strips Strapi wrappers, rejects derived fields, and returns adapter-ready input:

```ts
interface CmsFactInput {
  readonly categoryFacts: readonly CategoryFact[]
  readonly productFacts: readonly ProductFact[]
}
```

The response is passed directly to:

```ts
buildDomainFromCmsFacts(cmsFacts)
```

Only this endpoint may read Strapi for runtime facts. UI routes, client components, SEO, GEO, sitemap, and product catalog code consume adapter/domain output, never raw Strapi responses.

## Query Parameters

| Parameter | Values | Default | Notes |
|---|---|---|---|
| `publicationState` | `live`, `preview` | `live` | `preview` includes draft facts for preview mode. |
| `localeSet` | `default`, `all` | `default` | The current adapter expects `en` and `zh` values in localized fact components. |
| `previewContentType` | Strapi content type UID | none | Required by preview callers when a draft lookup or asset must be overlaid into the graph. |
| `previewEntryId` | stable `factId`, `code`, or Strapi document id | none | Identifies the draft entry to include when `publicationState=preview`. |

Example:

```txt
GET /internal/cms/facts?publicationState=live
GET /internal/cms/facts?publicationState=preview
```

## Security

- Network scope: private backend network or authenticated server-to-server route only.
- Auth: bearer token or internal service secret.
- Cache: short server cache is allowed, but publish webhook must invalidate it.
- UI access: forbidden.

Required headers:

```txt
Authorization: Bearer <CMS_INTERNAL_TOKEN>
Accept: application/json
```

Preview requests use the same server-to-server token plus a verified Next draft-mode secret before this endpoint is called. The endpoint itself does not set cookies or enable draft mode.

## Response Shape

The response must contain no Strapi envelope fields such as `data`, `attributes`, `documentId`, `createdAt`, `updatedAt`, or `publishedAt`.

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

## Strapi Fetch Plan

The aggregator may query Strapi REST or GraphQL internally. It must normalize both into the same `CmsFactInput`.

### REST Source Queries

```txt
GET /api/category-facts?publicationState=live&populate[parent]=true&populate[name]=true
GET /api/product-facts?publicationState=live&populate=deep
GET /api/industry-facts?publicationState=live&populate[name]=true
GET /api/application-facts?publicationState=live&populate[name]=true
GET /api/document-assets?publicationState=live&populate[file]=true
GET /api/certifications?publicationState=live&populate[label]=true
```

REST source responses are implementation details. They must not leak beyond the aggregator.

### GraphQL Source Query

```graphql
query StrapiFactsForAggregator($publicationState: PublicationState!) {
  categoryFacts(publicationState: $publicationState) {
    factId
    parent { factId }
    name { en zh }
  }
  productFacts(publicationState: $publicationState) {
    factId
    sku
    model
    seriesId
    brand
    manufacturer
    lifecycle
    availability
    releasedAt
    revisedAt
    primaryCategory { factId }
    additionalCategories { factId }
    industries { factId }
    applications { factId }
    measurementKinds
    name { en zh }
    shortName { en zh }
    summary { en zh }
    highlights { en zh }
    applicationCopy { en zh }
    measurements { kind range { min max unit display } accuracy overloadLimit { value unit display } }
    outputs { kind value protocol wiring }
    connections { processKind processValue processMaterial electricalKind electricalValue }
    environmentalLimits {
      ingressProtection
      mediaTemperature { min max unit display }
      ambientTemperature { min max unit display }
      wettedMaterials
      compatibleMedia
    }
    specificationGroups {
      key
      label
      values { key label value unit display sourceRefs { sourceId label href page confidence } }
    }
    variants { factId orderCode optionValues { optionKey label value code } availability lifecycle }
    certifications { code }
    documents { factId title documentKind file { url } hrefOverride locale revision }
    assets { factId assetKind file { url } hrefOverride alt }
    commercialTerms { minimumOrderQuantity standardLeadTime warranty oemCustomizable privateLabelAvailable }
  }
}
```

## Normalization Rules

### Stable Output Rules

The aggregator must produce deterministic `CmsFactInput` for the same Strapi state:

1. Fetch a complete graph for all six CMS content types, scoped by `publicationState`.
2. Overlay the requested draft entry and directly related draft records only for preview requests.
3. Resolve all relations through stable keys: `factId` for fact content types and `code` for certifications.
4. Filter relation rows by publish state before normalization, except for the explicit preview overlay.
5. Split `DocumentAsset` relations by `assetClass`; documents cannot appear in `assets[]`, and media cannot appear in `documents[]`.
6. Sort `categoryFacts` by `parentId ?? ''`, then `id`; sort `productFacts` by `id`; sort relation arrays lexicographically by emitted ID/code.
7. Preserve author order only inside repeatable editorial components where order is meaningful: `highlights`, `applications`, `measurements`, `outputs`, `specificationGroups`, `specificationGroups.values`, `variants`, and `variant.optionValues`.
8. Remove null optional fields rather than emitting Strapi nulls, except `CategoryFact.parentId`, which must be `null` for the root category.
9. Reject any unknown or generated field before returning, then run adapter validation.

The only successful response body is the exact two-key adapter input: `categoryFacts` and `productFacts`. `IndustryFact`, `ApplicationFact`, `DocumentAsset`, and `Certification` never appear as top-level arrays.

### CategoryFact

```ts
{
  id: row.factId,
  parentId: row.parent?.factId ?? null,
  name: row.name,
}
```

### ProductFact Identity

```ts
{
  id: row.factId,
  sku: row.sku,
  model: row.model,
  seriesId: row.seriesId,
  brand: row.brand,
  manufacturer: row.manufacturer,
  lifecycle: row.lifecycle,
  availability: row.availability,
  releasedAt: row.releasedAt,
  revisedAt: row.revisedAt,
}
```

### ProductFact Relations

```ts
{
  primaryCategoryId: row.primaryCategory.factId,
  additionalCategoryIds: row.additionalCategories.map((item) => item.factId),
  industryIds: row.industries.map((item) => item.factId),
  applicationIds: row.applications.map((item) => item.factId),
  certifications: row.certifications.map((item) => item.code),
}
```

If an optional relation is absent, emit an empty array for required adapter arrays (`industryIds`, `applicationIds`, `measurementKinds`) and omit optional arrays only when the adapter marks them optional (`additionalCategoryIds`, `variants`, `certifications`, `assets`). `documents` is required and must contain at least one normalized document.

### Connections

The Strapi component is flattened for editor ergonomics. The aggregator converts it to adapter shape:

```ts
{
  process: {
    kind: row.connections.processKind,
    value: row.connections.processValue,
    material: row.connections.processMaterial,
  },
  electrical: {
    kind: row.connections.electricalKind,
    value: row.connections.electricalValue,
  },
}
```

### SourceRef

```ts
{
  id: row.sourceId,
  label: row.label,
  href: row.href,
  page: row.page,
  confidence: row.confidence,
}
```

### DocumentAsset

For `assetClass=document`:

```ts
{
  id: row.factId,
  title: row.title,
  kind: row.documentKind,
  href: row.hrefOverride ?? row.file.url,
  locale: row.locale,
  revision: row.revision,
}
```

For `assetClass=media`:

```ts
{
  id: row.factId,
  kind: row.assetKind,
  href: row.hrefOverride ?? row.file.url,
  alt: row.alt,
}
```

### Variant

```ts
{
  id: row.factId,
  orderCode: row.orderCode,
  optionValues: row.optionValues,
  availability: row.availability,
  lifecycle: row.lifecycle,
}
```

### PostgreSQL Relation Handling

The endpoint reads through Strapi entity services, REST, or GraphQL, but relation semantics are fixed:

- Category self-relations use `category-fact.factId`, not Strapi numeric IDs, in emitted `parentId`.
- Product category, industry, application, document/media, and certification relations are many-to-one or many-to-many persistence details and must be flattened to primitive IDs/codes.
- Strapi relation order is not trusted for ID arrays; deterministic sorting is required before validation.
- Upload file metadata is reduced to `href` from `hrefOverride ?? file.url`; no Upload provider internals leave the endpoint.
- Draft/publish state is evaluated before relation flattening so unpublished related rows do not leak into live output.

## Endpoint Validation

Before returning, the endpoint must run:

```ts
assertCmsFactInput(cmsFacts)
buildDomainFromCmsFacts(cmsFacts)
```

If validation fails, return:

```json
{
  "ok": false,
  "error": {
    "code": "CMS_FACT_VALIDATION_FAILED",
    "path": "productFacts[0].measurements[0].overloadLimit",
    "message": "measurement overloadLimit is required at the adapter boundary"
  }
}
```

Use HTTP `422` for invalid facts and HTTP `500` only for infrastructure failures.

Validation order is fixed: forbidden field scan, normalization to `CmsFactInput`, `assertCmsFactInput(cmsFacts)`, then `buildDomainFromCmsFacts(cmsFacts)`. A later step must not mask an earlier forbidden-field failure.

## Forbidden Field Enforcement

The aggregator must reject any source row or normalized output containing generated field names:

```txt
slug
slugPath
canonical
canonicalPath
breadcrumb
seo
localizedSeo
jsonld
jsonLd
jsonLD
geo
geoAi
localizedGeoAi
geoEntity
entity
identity
classification
categoryPath
depth
children
```

## Revalidation Contract

`/internal/cms/facts` does not revalidate pages. Publish webhooks should call a separate Next route, which fetches this endpoint, runs the adapter, computes generated paths, and performs ISR revalidation.

```txt
POST /api/revalidate/cms
```

Webhook payload:

```json
{
  "event": "entry.publish",
  "contentType": "api::product-fact.product-fact",
  "entryId": "prd_example_001"
}
```

The revalidation route must compute affected paths from adapter output, never from Strapi fields.

## Preview Contract

Preview mode uses this endpoint with `publicationState=preview`; it does not introduce a separate preview data shape.

```txt
GET /internal/cms/facts?publicationState=preview&previewContentType=api::product-fact.product-fact&previewEntryId=prd_example_001
```

Preview rules:

- The caller verifies preview secrets and draft mode before fetching this endpoint.
- The endpoint overlays the requested draft entry onto the complete graph, then returns normal `CmsFactInput`.
- Preview routing is derived only after `buildDomainFromCmsFacts`; Strapi never stores preview slugs or canonical URLs.
- Lookup and asset previews resolve through related products or catalog surfaces and do not create second-domain records.
