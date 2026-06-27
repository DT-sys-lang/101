# CMS Fact Layer to Domain Adapter Flow

```mermaid
flowchart LR
  CMS["CMS Fact Store"] --> VF["Validation Layer\nadapter/validation.ts"]
  VF --> CF["CategoryFact\nid parentId name"]
  VF --> PF["ProductFact\nindustrial factual fields only"]

  CF --> CA["Category Adapter\nadapter/category.adapter.ts"]
  CA --> CT["CategoryTree\ndepth slug slugPath canonicalPath children"]
  CA --> CB["Category Breadcrumb Projection"]

  PF --> PA["Product Adapter\nadapter/product.adapter.ts"]
  CT --> PA
  PA --> CORE["Product Core\nidentity classification specs measurements limits"]

  CORE --> SA["SEO Adapter\nadapter/seo.adapter.ts"]
  CT --> SA
  SA --> SEO["ProductSeoFields\nslug meta h1 breadcrumbs OpenGraph"]
  SA --> SCHEMA["ProductJsonLd ItemList FAQPage"]

  CORE --> GA["GEO Adapter\nadapter/geo.adapter.ts"]
  SEO --> GA
  CT --> GA
  GA --> GEO["AIReadableIndustrialProduct\nentity facts summary guidance evidence"]

  CORE --> PR["ProductRecord"]
  SEO --> PR
  GEO --> PR

  PR --> DOMAIN["lib/domain contract"]
  CT --> DOMAIN
  DOMAIN --> UI["UI SEO GEO consumers"]
```

## Enforcement

- CMS may provide `CategoryFact` only as `id`, `parentId`, and `name`.
- CMS may provide product facts only as raw ids, category ids, measurements, environmental limits, specs, documents, media assets, certifications, and commercial terms.
- CMS-provided `slug`, `slugPath`, `canonicalPath`, `categoryPath`, `jsonld`, `jsonLd`, `jsonLD`, `seo`, `geo`, `geoAi`, `geoEntity`, `children`, `breadcrumb`, and `depth` are rejected at runtime.
- Category consistency is verified before tree generation: single root, valid parents, no cycles, max depth 4, and unique generated sibling slugs.
- Product consistency is verified before record generation: valid category ids, unique ids/skus/model slugs, measurement kind alignment, overload limits, media/temperature limits, and evidence documents.
