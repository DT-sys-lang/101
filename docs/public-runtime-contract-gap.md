# Public Runtime Contract Gap

This note is limited to the public runtime contracts listed below. It does not restate the integration readiness report, does not describe UI, and does not expose any raw CMS payload shape.

## Scope

Reviewed contracts:

- `app/sitemap.ts`
- `app/robots.ts`
- `app/llms.txt/route.ts`
- `app/api/cms/status`
- `app/api/revalidate/cms`
- `app/api/product-feed`
- `app/api/geo/index`
- `app/api/geo/products`
- `app/api/geo/answers`
- `app/api/inquiry`

## Short Verdict

The public contract surface is stable. The reviewed SEO/GEO routes either return Domain-normalized data, Domain-derived discovery documents, or operational metadata that is mapped into Domain-derived runtime behavior.

The live CMS source path is already defined below the public runtime boundary: `lib/cms/products.ts` reads CMS-normalized product facts and exposes Domain products through `lib/runtime/domain-products.ts`. Public SEO/GEO routes are not connected to live CMS directly and do not need a shape change for live CMS cutover.

## Contract Status

| Endpoint | Output boundary | Status | Conclusion |
| --- | --- | --- | --- |
| `GET /sitemap.xml` | SEO sitemap generated from Domain products and entry view models | Stable, facade-dependent | No route change required |
| `GET /robots.txt` | Robots policy generated from site config and sitemap URL | Stable, CMS-independent | No route change required |
| `GET /llms.txt` | LLM discovery text generated from Domain products, entry view models, and GEO endpoints | Stable, facade-dependent | No route change required |
| `GET /api/cms/status` | Runtime source status metadata from `lib/cms/products.ts` | Stable metadata boundary | No SEO/GEO route change required |
| `GET /api/revalidate/cms` | Webhook contract metadata only | Stable | No route change required |
| `POST /api/revalidate/cms` | Signed metadata mapped to Domain revalidation impact | Stable | No route change required |
| `GET /api/product-feed` | GEO feed generated from runtime Domain products | Stable, facade-dependent | No route change required |
| `GET /api/geo/index` | GEO index generated from runtime Domain products and entry view models | Stable, facade-dependent | No route change required |
| `GET /api/geo/products` | AI-readable product records generated from runtime Domain products | Stable, facade-dependent | No route change required |
| `GET /api/geo/answers` | GEO answer blocks generated from Domain projections | Stable, facade-dependent | No route change required |
| `GET /api/inquiry` | Inquiry API contract | Stable, CMS-independent | No route change required |
| `POST /api/inquiry` | Validated Domain inquiry submission result | Stable, CMS-independent | No route change required |

## Domain-Normalized Output Review

### `/sitemap.xml`

- Calls `buildSitemap()` from `lib/seo/sitemap.ts`.
- Sitemap generation uses runtime Domain products, localized product SEO, industry entry view models, and application entry view models.
- It does not import `lib/cms/*`, raw facts, adapter facts, or Strapi transport modules.

Conclusion: stable, provided `lib/runtime/domain-products.ts` remains the only product runtime facade.

### `/robots.txt`

- Calls `buildRobots()` from `lib/seo/robots.ts`.
- Robots output is generated from site configuration and the canonical sitemap URL.
- It is CMS-independent and does not touch Domain product records, raw facts, or Strapi transport.

Conclusion: stable. No route modification required.

### `/llms.txt`

- Calls `buildLlmsTxt(locale)` from `lib/geo`.
- `llms.txt` source entries are generated from runtime Domain products, industry entry view models, application entry view models, and GEO/feed endpoint URLs.
- It does not expose raw CMS payloads or CMS transport metadata.

Conclusion: stable, provided the runtime facade emits only Domain-normalized records.

### `/api/cms/status`

- Calls `getCmsProductStatus()` from `lib/cms/products.ts`.
- This endpoint reports runtime source status metadata, accepted input names, product count, catalog version, and source metadata.
- It is not an SEO/GEO data output and does not replace the SEO/GEO Domain runtime facade.

Conclusion: stable metadata boundary. It may observe CMS source status, but SEO/GEO routes must still use `lib/runtime/domain-products.ts` or SEO/GEO builders only.

### `/api/revalidate/cms`

- `GET` returns the webhook contract from `lib/api/cms-webhook.ts`.
- `POST` accepts signed CMS metadata only, rejects raw CMS payload fields, and returns `calculateRevalidationImpact` output.
- It does not fetch Strapi, does not accept CMS facts, and does not compute paths from CMS slugs.

Conclusion: stable. No route modification required.

### `/api/product-feed`

- Calls `buildGeoProductFeed(locale)`.
- Feed generation uses runtime Domain product records through the GEO layer.
- It does not import `lib/cms/*` or call a CMS transport.

Conclusion: stable, provided `lib/runtime/domain-products.ts` remains the only product runtime facade.

### `/api/geo/index`

- Calls `buildGeoIndex(locale)`.
- GEO index generation is based on Domain products, Domain entry view models, and runtime source metadata.
- It does not expose raw CMS state.

Conclusion: stable, provided the runtime facade emits only Domain-normalized records.

### `/api/geo/products`

- Reads `getRuntimeDomainProductRecords()` and maps each record through `buildAiReadableIndustrialProduct`.
- The endpoint output is a Domain-derived projection, not a CMS transport response.

Conclusion: stable, provided the runtime facade stays behind `lib/cms/products.ts` and adapter validation.

### `/api/geo/answers`

- Calls `buildGeoAnswerBlocksDocument(locale)`.
- Answer blocks are generated from Product GEO FAQ and application answer Domain projections.
- It does not expose CMS facts or Strapi relation payloads.

Conclusion: stable. No route modification required.

### `/api/inquiry`

- `GET` returns the inquiry contract.
- `POST` validates and normalizes the inquiry payload, then uses server-only inquiry persistence.
- It is not part of the CMS data source switch.

Conclusion: stable and CMS-independent. No route modification required.

## SEO/GEO Domain Output Confirmation

- `canonical` is derived from Domain product SEO canonical paths plus configured site origin.
- `hreflang` is derived from `next-intl` routing locales and Domain product SEO paths.
- Product JSON-LD is generated from `ProductDetailPageData` and Domain product identity/specification fields.
- FAQPage JSON-LD is generated from Domain product detail data and Domain GEO FAQ/derived product facts.
- GEO feed, GEO index, GEO products, GEO answers, and `llms.txt` are generated from runtime Domain products and Domain entry page view models.

## CMS Source Path Status

The source path for live CMS is already defined below the public SEO/GEO runtime boundary:

- `lib/cms/source.ts` owns source selection and CMS source configuration.
- `lib/cms/products.ts` calls `readCmsProductSource()` and normalizes the resulting facts through `buildDomainFromCmsFacts(source.cmsFacts)`.
- `lib/runtime/domain-products.ts` exposes only Domain-normalized products, catalogs, category tree, and source metadata to SEO/GEO.

Current public SEO/GEO runtime is not directly connected to live CMS transport. When live CMS is enabled, it must enter only through `lib/cms/products.ts` and then through `lib/runtime/domain-products.ts`. Public SEO/GEO routes keep their current shape and continue to consume Domain-normalized records.

Required boundary for live CMS cutover:

1. CMS source selection remains below `lib/cms/*`.
2. `lib/cms/products.ts` remains the only bridge from CMS facts to Domain product records.
3. `lib/runtime/domain-products.ts` remains the only product runtime facade consumed by SEO/GEO.
4. Public routes continue to read SEO/GEO builders or `lib/runtime/domain-products.ts` only.
5. Raw Strapi envelopes, relation wrappers, draft state, upload metadata, and CMS transport errors with payload fragments never leave `lib/cms/*`.

This is not a public route contract gap. It is a source-layer responsibility below the runtime facade.

## Live CMS Cutover Requirements

Before switching public runtime traffic to real CMS data:

- configure CMS source selection below `lib/cms/*`
- keep `lib/cms/products.ts` as the only bridge from CMS facts to Domain records
- keep `lib/runtime/domain-products.ts` as the only product runtime facade for SEO/GEO
- configure `CMS_REVALIDATE_SECRET` for `/api/revalidate/cms`
- keep CMS webhook payloads metadata-only

## No-Change Conclusions

- Do not modify `app/sitemap.ts`, `app/robots.ts`, or `app/llms.txt/route.ts` for CMS cutover.
- Do not modify `app/api/product-feed`, `app/api/geo/index`, `app/api/geo/products`, or `app/api/geo/answers` for CMS cutover.
- Do not modify `app/api/cms/status` unless the status metadata contract changes.
- Do not modify `app/api/revalidate/cms` unless the signing scheme changes.
- Do not modify `app/api/inquiry` for CMS cutover.
- Do not add Strapi fetches to public route handlers.

The public runtime contract is ready to stay stable while live CMS data enters only through the CMS source layer and runtime Domain facade.
