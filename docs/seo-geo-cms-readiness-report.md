# SEO/GEO CMS Readiness Report

## Scope

This report audits the SEO and GEO runtime surface after real CMS fact integration. The reviewed boundary is intentionally narrow: SEO/GEO output must be generated from Domain-normalized records or Domain view models, not CMS transport payloads.

Reviewed areas:

- `lib/seo/sitemap.ts`, `lib/seo/canonical.ts`, `lib/seo/hreflang.ts`, `lib/seo/product-detail.ts`, `lib/seo/product-list.ts`
- `lib/seo/home.ts`, `lib/seo/static-info.ts`, `lib/seo/entry-page.ts`, `lib/seo/jsonld/*`
- `lib/geo/*`
- `app/llms.txt/route.ts`, `app/api/geo/*/route.ts`, `app/api/product-feed/route.ts`
- `docs/runtime-api-contracts.md`

## Stable Outputs

### Domain-only source policy

SEO/GEO runtime output is stable against real CMS facts as long as the CMS adapter continues to emit valid Domain records.

- Product SEO/GEO reads `ProductRecord`, `ProductCatalogIndex`, `ProductDetailPageData`, product SEO projections, and product GEO projections.
- Industry/application SEO reads `EntryPageSeoData` and `EntryPageViewModel`.
- API route handlers remain thin wrappers around `lib/geo` and `lib/api/contracts`.
- No reviewed `lib/seo/*` or `lib/geo/*` module directly imports CMS modules or reads raw CMS envelopes.
- Public API envelopes declare `normalizedBy: adapter/domain` and include runtime source metadata from the facade.

### Sitemap

`buildSitemapForProducts(products)` covers the current static and dynamic entry set from Domain sources:

- Home: localized `/{locale}` entries.
- Static landings: `/products`, `/industries`, `/applications`, `/oem`, `/resources`, `/contact` for every configured locale.
- Product detail: every Domain product and locale, using `selectProductSeo(product, locale).slug.canonicalPath`.
- Industry detail: every entry from `getIndustryEntryPageViewModel(locale)`.
- Application detail: every entry from `getApplicationEntryPageViewModel(locale)`.
- Product images: generated from Domain product assets.

The sitemap generator has a pure testable variant, `buildSitemapForProducts(products)`, which lets validation inject generated CMS facts without touching raw CMS transport state.

### Canonical and hreflang

Canonical and hreflang generation is aligned with `next-intl` routing:

- Locales come from `routing.locales`.
- Default locale is `routing.defaultLocale`.
- Locale prefix policy is `always`, so canonical paths are localized as `/{locale}{canonicalPath}`.
- Product hreflang uses localized product canonical paths from `selectProductSeo`.
- Static, home, industry, and application hreflang use `buildStaticPathHrefLangs` or `buildHomeHrefLangs`.
- `x-default` points to the configured default locale URL.

### JSON-LD

Structured data is generated centrally from `lib/seo` helpers:

- Home: `Organization`, `WebSite`, `WebPage`, `BreadcrumbList`, and entry `ItemList`.
- Product list/category pages: `CollectionPage` and `ItemList`.
- Product detail pages: `Organization`, `WebSite`, `WebPage`, `BreadcrumbList`, `Product`, and dynamic `FAQPage`.
- Industry hub/detail pages: `CollectionPage`, `BreadcrumbList`, `ItemList`, and dynamic `FAQPage`.
- Application hub/detail pages: `CollectionPage`, `BreadcrumbList`, `ItemList`, and dynamic `FAQPage`.
- OEM/resources/contact pages: `WebPage` or `ContactPage`, `BreadcrumbList`, and quick-link `ItemList` when available.

Page routes render structured data through `lib/seo/structured-data.tsx`; page components do not construct schema payloads themselves.

### GEO answers and AI-readable product output

GEO output is generated from Domain product records and Domain entry-page view models:

- `/api/product-feed` returns `geo-product-feed-v1` with canonical URLs, key specs, datasheets, and per-product GEO endpoints.
- `/api/geo/index` returns `geo-index-v2` with products, industries, applications, endpoint discovery, locale list, and runtime source metadata.
- `/api/geo/products` returns `AIReadableIndustrialProduct` records for all Domain products.
- `/{locale}/geo/products/{...slug}` returns the product-detail scoped AI-readable record for a canonical product route.
- `/api/geo/answers` returns product FAQ answer blocks plus application answer blocks.
- Application answer blocks are based on application entry view models and recommended Domain products.

No hidden SEO/GEO claims are generated outside visible Domain facts. The AI-readable blocks expose source policy, source URL, hreflang, product facts, specifications, selection guidance, evidence refs, and FAQ content from Domain projections.

### `llms.txt`

`llms.txt` lists the machine-readable discovery surface:

- GEO index endpoint.
- Product feed endpoint.
- GEO products endpoint.
- GEO answer blocks endpoint.
- Industry hub and detail pages.
- Application hub and detail pages.
- Per-product GEO records for the first 100 Domain products.

The first-100 product listing is an intentional size control; complete product discovery remains available through `/api/product-feed`, `/api/geo/products`, and `/api/geo/index`.

## Runtime Facade Dependencies

SEO/GEO readiness depends on the runtime facade preserving these Domain contracts:

- `getRuntimeDomainProductRecords()` returns validated `ProductRecord[]`.
- `getRuntimeDomainProductCatalog(locale)` returns a `ProductCatalogIndex` with product/category lookup maps.
- `listRuntimeDomainProducts(locale, query)` returns `ProductListResult` without raw CMS payload fields.
- `listRuntimeDomainHomepageProducts(locale)` returns homepage-safe product list results.
- `getRuntimeDomainProductSource()` returns source metadata only: source kind, upstream mode, source version, and product count.
- `getRuntimeDomainProductSourceVersion()` returns a stable product source version for AI-readable cache/source metadata.
- `getIndustryEntryPageViewModel(locale)` and `getApplicationEntryPageViewModel(locale)` keep industry/application landing data in Domain view-model form.

The runtime facade is allowed to depend on CMS normalization. `lib/seo`, `lib/geo`, route handlers, and page structured-data helpers must continue to consume only this facade or Domain/ViewModel APIs.

## Real CMS Validation Commands

Run these commands after enabling or changing real CMS facts:

```bash
npm run validate:seo
npm run validate:geo
npm run validate:scale-1000
npm run build
```

Useful runtime-mode checks when validating currently configured runtime data instead of generated scale facts:

```bash
npm run validate:seo -- --scale false
npm run validate:geo -- --scale false
```

Validation coverage:

- `validate:seo` checks sitemap entry counts, absolute URLs, hreflang completeness, product SEO fields, canonical product paths, and Product JSON-LD projections.
- `validate:geo` checks feed/index/answers/all-products contracts, localized GEO endpoints, answer block completeness, AI-readable product facts/evidence/FAQ presence, and payload budgets.
- `validate:scale-1000` checks generated CMS facts through adapter, Domain records, catalog indexes, sitemap, GEO feed, GEO index, GEO answers, payload budgets, and duplicate-risk summaries.
- `build` checks Next.js route generation, metadata usage, TypeScript compilation, and production bundle validity.

## AI-readable and Evidence Ref Risks

The system is ready for real CMS facts, with these operational risks to monitor:

- Evidence refs are only as strong as adapter-normalized datasheet/manual/certificate/source references. Missing source refs will weaken answer attribution.
- Product GEO quality depends on non-empty `geoAi.factTable`, `geoAi.evidence`, and `geoAi.faq` on each normalized product.
- Product FAQ schema combines GEO FAQ with derived measurement/output/compatibility/installation/commercial answers. Derived answers are still Domain-based, but poor CMS specs produce poor derived FAQ quality.
- Application answer blocks derive recommendations and evidence from matched Domain products. If an application has no matched products, its answer can remain structurally valid while source refs and product IDs become weak.
- `llms.txt` intentionally truncates per-product source entries to 100 products; large catalogs should rely on feed/index endpoints for full discovery.
- Localized SEO/GEO quality depends on normalized localized copy. The current boundary prevents raw CMS leakage, but it cannot fix bad translations or mojibake introduced upstream.
- Payload budgets are enforced by validation scripts; unusually large CMS facts should be checked before release.

## Readiness Conclusion

SEO/GEO output remains stable under real CMS facts when the runtime facade emits valid Domain-normalized records. Sitemap, canonical, hreflang, JSON-LD, `llms.txt`, product feed, GEO index, GEO products, and GEO answers are all generated from Domain or ViewModel data and are suitable for Google SEO plus AI search discovery.

No page UI changes are required for this readiness state. No Strapi transport details need to be connected at this layer.
