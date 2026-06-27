# Runtime API Contracts

This document is the integration contract for the public runtime endpoints. The boundary is fixed: CMS facts are normalized through `lib/cms`, exposed to runtime through `lib/runtime/domain-products.ts`, shaped by `lib/api/*` and `lib/geo/*`, and returned only from `app/api/*` route handlers. Frontend code must not call a Strapi raw API.

## Layer Ownership

| Layer | Owns | Must not do |
| --- | --- | --- |
| `lib/cms/*` | Reads CMS facts or mock facts and runs the adapter into Domain records. | Return raw CMS facts to public routes. |
| `lib/runtime/domain-products.ts` | Provides the runtime source of truth for domain-normalized products, category tree, catalogs, and source metadata. | Build UI view models or expose CMS transport details. |
| `lib/api/contracts.ts` | Wraps JSON responses in a stable API envelope with `api-contract-v1`, route name, boundary, and runtime source metadata. | Encode endpoint-specific business rules. |
| `lib/api/revalidation.ts` | Calculates ISR affected paths from Domain catalogs, product SEO, industry entry pages, and application entry pages. | Call `revalidatePath` directly. |
| `lib/api/cms-webhook.ts` | Verifies signed CMS webhook metadata and maps it into revalidation input. | Accept raw Strapi facts or expose raw CMS payloads. |
| `lib/api/preview.ts` | Verifies CMS preview secret and resolves generated preview routes from Domain/runtime records. | Fetch raw CMS/Strapi data, enable draft facts transport, or expose raw preview payloads. |
| `lib/api/inquiry.ts` | Validates and normalizes inquiry payloads into Domain inquiry structures. | Persist inquiries or call third-party CRM/email systems. |
| `lib/server/inquiry/*` | Server-only JSONL persistence and outbound placeholders for inquiry inbox/outbox. | Run in client/UI code or implement real third-party CRM adapters here without a separate integration change. |
| `app/api/*` | Thin route-handler boundary: parse request, call `lib/api` or server adapters, return contract envelopes. | Read CMS raw APIs, shape UI pages, or bypass Domain normalization. |

## Endpoint Contract Matrix

| Endpoint | Runtime | Data Source | Output Contract | Cache |
| --- | --- | --- | --- | --- |
| `GET /api/product-feed` | Route handler | `buildGeoProductFeed(locale)` from domain product records | JSON envelope named `product-feed`, data version `geo-product-feed-v1` | ISR `3600` |
| `GET /api/geo/index` | Route handler | GEO index built from domain products, industry entries, application entries, and runtime source metadata | JSON envelope named `geo-index`, data version `geo-index-v2` | ISR `3600` |
| `GET /api/geo/products` | Route handler | `getRuntimeDomainProductRecords()` plus `buildAiReadableIndustrialProduct` | JSON envelope named `geo-products`, data version `geo-products-v1` | ISR `3600` |
| `GET /api/geo/answers` | Route handler | Product GEO FAQ and application answer blocks from Domain view models | JSON envelope named `geo-answers`, data version `geo-answer-blocks-v2` | ISR `3600` |
| `GET /api/revalidate` | Dynamic route handler | `calculateRevalidationImpact` only | JSON envelope named `revalidate`, dry-run affected paths | No cache |
| `POST /api/revalidate` | Dynamic route handler | Validated scope, locale, productId, categoryId | JSON envelope named `revalidate`, affected paths plus `revalidated: true` | Calls `revalidatePath` |
| `GET /api/revalidate/cms` | Dynamic route handler | Signed CMS webhook contract metadata only | JSON envelope named `cms-revalidate`, webhook contract description | No cache |
| `POST /api/revalidate/cms` | Node route handler | HMAC-verified CMS publish/update/unpublish metadata only | JSON envelope named `cms-revalidate`, verified webhook metadata, affected paths plus `revalidated: true` | Calls `calculateRevalidationImpact` then `revalidatePath` |
| `GET /api/preview/cms` | Node route handler | Preview secret plus Domain/runtime route resolution | JSON envelope named `cms-preview`, data version `cms-preview-v1` | No cache |
| `GET /api/inquiry` | Node route handler | Inquiry API contract | JSON envelope named `inquiry`, data version `inquiry-api-v2` | No cache |
| `POST /api/inquiry` | Node route handler | Validated inquiry payload, server-only JSONL persistence | JSON envelope named `inquiry`, Domain inquiry payload and submission result | No cache |
| `GET /llms.txt` | Route handler | Domain products, industry entries, application entries, GEO endpoint links | Plain text `llms.txt` source map | ISR `3600` |

## Domain Normalization Rule

All public JSON endpoints return data derived from Domain-normalized records or Domain view models:

- Product data comes from `getRuntimeDomainProductRecords`, `getRuntimeDomainProductCatalog`, `ProductRecord`, `ProductCatalogIndex`, Product SEO, or Product GEO projections.
- Industry and application data comes from `getIndustryEntryPageViewModel`, `getApplicationEntryPageViewModel`, or generated Domain entry route mappings.
- GEO documents are generated by `lib/geo/*` from Domain products and entry page view models.
- Inquiry responses are generated by `normalizeInquiryPayload` and `submitInquiry`; persistence output is a Domain inquiry submission result, not raw storage data.
- CMS webhook revalidation accepts metadata only, maps it to Domain-derived revalidation input, and never emits raw Strapi facts or raw webhook payloads.
- CMS preview accepts secret-protected route metadata only and returns generated canonical route information; it never emits raw Strapi facts, draft facts, or CMS transport payloads.
- No public route returns Strapi IDs, Strapi JSON API envelopes, draft states, relation payloads, or CMS transport metadata.

## Revalidation Contract

`/api/revalidate` accepts these scopes:

| Scope | Affected paths |
| --- | --- |
| `all` | Static files, localized static pages, product lists, category paths, product details, per-product GEO routes, GEO/feed API endpoints, industry hubs/details, and application hubs/details. |
| `static` | `/sitemap.xml`, `/robots.txt`, `/llms.txt`, localized homepage, product hub, industry hub, application hub, OEM, resources, contact, industry details, and application details. |
| `feed` | `/api/cms/status`, `/api/product-feed`, `/api/geo/index`, `/api/geo/products`, and `/api/geo/answers`. |
| `geo` | GEO/feed API endpoints and per-product localized GEO routes. |
| `category` | Product hub, affected generated category paths, industry hubs/details, and application hubs/details for the selected locale or all locales. |
| `product` | Product hub, affected generated category paths, product detail pages, per-product GEO routes, industry hubs/details, and application hubs/details for the selected locale or all locales. |

The route accepts optional `locale`, `productId`, and `categoryId`. Invalid IDs are ignored rather than passed through. Path generation uses generated Domain canonical paths only.

### Signed CMS Webhook

`/api/revalidate/cms` is the production CMS ingress for publish-triggered revalidation.

Required headers:

| Header | Rule |
| --- | --- |
| `x-cms-signature` | Required. Accepts `hmac-sha256=<hex>`, `hmac-sha256:<hex>`, `sha256=<hex>`, `sha256:<hex>`, or raw hex. |
| `x-cms-timestamp` | Required ISO-8601 timestamp. Maximum skew is 5 minutes. |

Signature rule:

```txt
hmac-sha256(timestamp + rawBody, CMS_REVALIDATE_SECRET)
```

Accepted webhook metadata fields:

- `event` with values `entry.publish`, `entry.update`, or `entry.unpublish`
- `contentType`
- `entity`
- `entryId`
- `locale`
- `productId`
- `categoryId`
- `campaign`
- `scope`
- `publishedAt`
- `updatedAt`
- `occurredAt`
- `sourcePath`
- `industryId`
- `applicationId`

Rejected payload shapes:

- Raw fact arrays and objects such as `data`, `attributes`, `entry`, `entries`, `fact`, `facts`, `productFact`, `productFacts`, `categoryFact`, `categoryFacts`, `products`, `categoryTree`, `cmsFacts`, and `raw`
- Any CMS transport envelope or Strapi response wrapper

Implementation Round 1 does not fetch Strapi or CMS facts inside the webhook route. The webhook only verifies metadata, maps it to `calculateRevalidationImpact`, and calls `revalidatePath` for the returned paths.

## Preview Contract

`/api/preview/cms` is the signed CMS preview ingress for generated route discovery before real draft facts transport is connected.

Required secret:

| Input | Rule |
| --- | --- |
| `x-cms-preview-secret` | Preferred. Must equal `CMS_PREVIEW_SECRET`. |
| `secret` query parameter | Accepted for CMS preview buttons. Must equal `CMS_PREVIEW_SECRET`. |

Accepted query fields:

| Field | Rule |
| --- | --- |
| `entryId` | Required Domain-normalized identifier with `prd_`, `cat_`, `ind_`, or `app_` prefix. |
| `contentType` | Optional; must resolve to `product`, `category`, `industry`, or `application` and match `entryId` when both are present. |
| `locale` | Optional configured runtime locale; defaults to `routing.defaultLocale`. |

Success output:

- `version`: `cms-preview-v1`
- `locale`
- `contentType`
- `entryId`
- `resolvedFrom`: `product-record`, `category-tree`, `industry-entry`, or `application-entry`
- `canonicalPath`: generated Domain canonical path
- `redirectTo`: localized frontend path such as `/{locale}{canonicalPath}`

The current route returns JSON only; it does not enable draft mode or fetch draft facts. Future live preview source selection must stay behind `lib/cms/*` or a server-only CMS source helper, pass facts through adapter validation and Domain normalization, and keep public route output limited to generated route/projection data.

## Inquiry Source Tracking

`POST /api/inquiry` requires or preserves the following source fields after normalization:

| Field | Rule |
| --- | --- |
| `locale` | Must be a configured locale or defaults to `routing.defaultLocale` when omitted. |
| `sourceType` | Must be one of homepage, product-detail, product-list, industry-page, application-page, resource-page, or contact-page. |
| `sourcePath` | Must start with `/` or be an absolute URL that is normalized to path/search/hash. |
| `productId` | Optional, must start with `prd_` when present. |
| `industryId` | Optional, must start with `ind_` when present. |
| `applicationId` | Optional, must start with `app_` when present. |
| `campaign` | Optional non-empty string. |

The current implementation persists JSONL inbox/outbox records behind `lib/server/inquiry/*`. Email notification and CRM sync are queued as server-only placeholder channels; no third-party CRM implementation is connected.

## Stability Notes

- Keep `api-contract-v1` envelope fields stable unless all consumers are updated together.
- Endpoint data versions such as `geo-index-v2`, `cms-preview-v1`, and `inquiry-api-v2` may evolve independently inside the envelope.
- Public runtime contracts must remain Domain-first; any future Strapi integration belongs behind `lib/cms` and adapter validation.
- New public runtime endpoints must document source layer, output contract, cache policy, and revalidation impact here before they are treated as stable.
