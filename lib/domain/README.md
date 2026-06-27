# Architecture Freeze v1 - Product Data Domain

This folder is the domain boundary for the industrial sensor product data system. It contains no UI code and is intended to support 1,000+ products through typed records, category paths, SEO slugs, and GEO AI summaries.

`index.ts` is the unified domain entry. It exports `domain`, where `singleSourceOfTruth.productSource.products` is the only mock product source, `singleSourceOfTruth.categoryTree` is the only category source, and locale catalog indexes are derived from those sources.

## Freeze Rules

1. `lib/domain` owns product semantics, category semantics, SEO route semantics, and GEO AI contracts.
2. UI, API, CMS, and import jobs consume domain projections; they do not redefine product fields.
3. Product detail resolution starts from locale and slug path, then resolves category, product, variant, SEO, and GEO projections.
4. Category depth is explicit: catalog root, measurement family, measurement principle, product function, and series/accessory grouping.
5. AI/GEO answers must be source-backed and traceable to documents, evidence records, or product engineering review.

## Product Model

`ProductRecord` is the canonical product detail model. It is composed from:

- `ProductIdentity`: stable id, sku, model, series, brand, lifecycle, availability, release and revision dates.
- `ProductClassification`: primary category path, secondary categories, industries, applications, and measurement kinds.
- `ProductContent`: localized names, summaries, highlights, and application text.
- Technical blocks: measurements, outputs, process/electrical connections, environmental limits, specification groups, variants, certifications, documents, and assets.
- Commercial blocks: MOQ, lead time, warranty, OEM customization, and private label availability.
- Search blocks: `ProductSeoFields` and `ProductGeoAiProfile`.

The listing contract is intentionally smaller: `ProductListingProjection` includes identity, classification, localized content, measurements, and SEO enough for catalog cards or search results.

`ProductCatalogIndex` is the executable list data structure for 1,000+ products. It precomputes product ids, localized list items, route entries, category maps, descendant category sets, facet indexes, and search tokens. List filtering uses `Set` intersections instead of scanning every field for every request.

`mockProducts` currently contains 20 industrial sensor records and is shaped for expansion by adding product seeds, not by adding UI-side data or route-local copies.

## Category Tree Model

`CategoryTree` keeps catalog navigation stable while allowing large product growth. The canonical root is `cat_industrial_sensors`, with level-one families such as pressure sensors, level sensors, temperature measurement, and industrial switches.

Each `CategoryNode` carries:

- Stable `cat_` id, parent id, depth, kind, slug, slug path, and canonical path.
- Localized name and description.
- Facet keys used by filters and search indexing.
- SEO template input for category pages.
- Optional children for multi-level taxonomy.

The exported `industrialSensorCategoryTree` is the v1 baseline. New categories should be added by extending the tree, not by hardcoding categories in UI or page copy.

## Product Detail Data Flow

`productDetailDataFlow` defines the domain pipeline:

1. Route resolution: locale plus `/products/{categorySlugPath}/{productSlug}` becomes `ProductRouteKey`.
2. Category resolution: category slug path maps to `CategoryPath` and category facet policy.
3. Product lookup: canonical slug, legacy alias, or model redirect resolves to `ProductRecord`.
4. Variant resolution: selected options narrow variants and availability.
5. Domain enrichment: documents, certificates, specs, assets, and commercial terms become `ProductDetailProjection`.
6. SEO projection: canonical URL, alternates, breadcrumbs, metadata, Open Graph, and Product JSON-LD are produced.
7. GEO AI projection: source-backed facts become `ProductGeoAiProfile`.
8. Delivery contract: a serializable detail payload is ready for API, static generation, CMS sync, or search indexing.

`resolveProductDetailPage` implements this flow. It accepts a pathname or `{ categorySlugPath, productSlug }`, resolves canonical slugs, legacy aliases, and model redirects, then returns a serializable `ProductDetailPageData` contract containing the product, list projection, category path, selected variants, SEO fields, GEO AI profile, and cache key.

## SEO Field Design

`ProductSeoFields` separates slug identity from page metadata:

- `slug`: canonical product segment, category path, canonical path, aliases, and redirects.
- `title`, `metaDescription`, `h1`: localized search fields.
- `indexingPolicy`: page-level crawler policy.
- `searchIntent`: explicit intent tags for discovery, model lookup, comparison, application selection, OEM, datasheet, and quote flows.
- `breadcrumb` and `alternates`: navigation and multilingual canonical support.
- `openGraph`: social and preview metadata.
- `jsonLd`: Schema.org-style Product structured data with brand, sku, category, description, properties, and offer status.

The v1 slug pattern is `/products/{root-category}/{family}/{function}/{product-slug}`. Locale prefixes stay outside the domain model so routing can handle `/en` or `/zh` without changing product identity.

`ProductRecord.localizedSeo` can hold per-locale SEO fields when localized slugs or metadata differ. If a locale-specific SEO block is not present, the catalog layer falls back to `ProductRecord.seo` while still using localized product copy from `ProductContent`.

## AI/GEO Structure

GEO means Generative Engine Optimization in this domain. `ProductGeoAiProfile` is built for AI summaries, answer engines, and retrieval systems.

The JSON Schema is stored in `geo-ai.schema.json` and validates:

- Governance: schema version, locale, review owner, review time, and AI extraction permission.
- Entity: product id, canonical name, model, brand, canonical path, and category ids.
- Answer summary: one-sentence answer, short paragraph, technical abstract, use cases, and limitations.
- Fact table: source-backed claims with claim type, label, value, unit, and evidence references.
- Selection guidance: best-fit scenarios, decision criteria, media compatibility, installation notes, and required options.
- Evidence: datasheets, manuals, certificates, reports, catalogs, and engineering notes.
- FAQ: audience-specific questions with source references.

## Category Filtering Logic

`filterProductCatalog` supports category filters, descendant category expansion, measurement kinds, availability, lifecycle, industries, applications, output kinds, certifications, free-text token search, sorting, pagination, and facet counts. It is designed for 1,000+ product catalogs by reusing indexes created once by `createProductCatalogIndex`.
