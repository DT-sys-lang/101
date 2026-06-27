# Strapi Schema Scaffold: CMS Fact Layer

This folder is a Strapi scaffold design draft, not a wired CMS app. It translates `docs/cms-content-model.md` into Strapi content-type schemas and an internal aggregator endpoint contract.

The CMS stores only source facts. It must not store generated fields such as slug, canonical path, breadcrumb, SEO, JSON-LD, GEO, or domain projections. The backend aggregator maps these Strapi records into the adapter input shape:

```ts
interface CmsFactInput {
  readonly categoryFacts: readonly CategoryFact[]
  readonly productFacts: readonly ProductFact[]
}
```

## Files

- `content-types/category-fact.schema.json`
- `content-types/product-fact.schema.json`
- `content-types/industry-fact.schema.json`
- `content-types/application-fact.schema.json`
- `content-types/document-asset.schema.json`
- `content-types/certification.schema.json`
- `components/facts/*.schema.json`
- `internal-cms-facts-endpoint.md`

## Stable ID Convention

Strapi owns its internal numeric/string `id`. The domain-stable fact ID is stored as `factId` in content types and is converted by the aggregator:

- `category-fact.factId -> CategoryFact.id`
- `product-fact.factId -> ProductFact.id`
- `industry-fact.factId -> ProductFact.industryIds[]`
- `application-fact.factId -> ProductFact.applicationIds[]`
- `document-asset.factId -> ProductFact.documents[].id` or `ProductFact.assets[].id`
- `certification.code -> ProductFact.certifications[]`

## Forbidden Field Rule

No schema in this folder may define these field names:

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

The adapter generates all derived fields from facts.

## Final Scope Lock

The current schema set fully covers the CMS Fact Layer contract:

- `ProductFact` is the only product source record and maps to `productFacts[]`.
- `CategoryFact` is the only category source record and maps to `categoryFacts[]`.
- `IndustryFact` and `ApplicationFact` are lookup persistence only and map to product ID arrays.
- `DocumentAsset` maps to product `documents[]` or `assets[]` based on `assetClass`.
- `Certification` maps to product certification code arrays.

No schema file defines CMS-owned `slug`, `canonical`, `seo`, `jsonLd`, or `geo` fields. PostgreSQL stores Strapi facts and relations only; the internal facts endpoint returns deterministic `CmsFactInput`, then the adapter generates all Domain, SEO, JSON-LD, GEO, and route projections.
