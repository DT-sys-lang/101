# Strapi Content Extension Design

Date: 2026-07-02
Owner: Strapi + PostgreSQL thread

## Purpose

This design adds editorial and recommendation content types next to the existing facts-only product chain.
It does not change `ProductFact`, `CategoryFact`, `IndustryFact`, `ApplicationFact`, `DocumentAsset`, `Certification`, `/internal/cms/facts`, or `CmsFactInput`.

## Boundary Decision

Existing product data remains strong-structured and facts-only:

- `GET /internal/cms/facts` still returns only `categoryFacts[]` and `productFacts[]`.
- New content types do not feed `buildDomainFromCmsFacts()`.
- New content types may relate to product/category/industry/application facts by stable Strapi relations, but they do not own product facts.
- Editorial content must not add product slugs, canonical paths, breadcrumbs, generated SEO objects, generated GEO entities, JSON-LD, identity, classification, or category paths to product facts.

New content types are separate CMS editorial/support collections:

- `company-page`
- `blog-post`
- `case-study`
- `product-manual`
- `industry-ecosystem-recommendation`
- `intent-phrase`

## Schema Design

### `company-page`

Purpose: light company/capability/service page content.

Key fields:

- `pageId`: unique stable ID, `company_*`.
- `title`, `summary`: localized text components.
- `body`: JSON body blocks, deliberately light structure.
- `pageKind`: `about`, `capability`, `quality`, `service`, `contact`, `custom`.
- `priority`: editorial ordering.

Relations:

- `relatedProducts` many-to-many `product-fact`.
- `relatedIndustries` many-to-many `industry-fact`.
- `intentPhrases` many-to-many `intent-phrase`.

### `blog-post`

Purpose: light editorial articles, guides, announcements, and application posts.

Key fields:

- `postId`: unique stable ID, `blog_*`.
- `title`, `excerpt`: localized text components.
- `body`: JSON body blocks.
- `topic`: `technology`, `application`, `selection-guide`, `maintenance`, `company`, `industry`, `custom`.
- `authorName`, `publishedOn`, `heroImage`.

Relations:

- `relatedProducts` many-to-many `product-fact`.
- `relatedCategories` many-to-many `category-fact`.
- `relatedIndustries` many-to-many `industry-fact`.
- `relatedApplications` many-to-many `application-fact`.
- `intentPhrases` many-to-many `intent-phrase`.

### `case-study`

Purpose: light customer/application story with factual relations to products, industries, applications, and evidence documents.

Key fields:

- `caseId`: unique stable ID, `case_*`.
- `title`, `summary`, `challenge`, `solution`, `outcome`: localized text components.
- `body`: JSON body blocks.
- `region`, `projectYear`, `isPublic`, `heroImage`.

Relations:

- `products` many-to-many `product-fact`.
- `industries` many-to-many `industry-fact`.
- `applications` many-to-many `application-fact`.
- `supportingDocuments` many-to-many `document-asset`.
- `intentPhrases` many-to-many `intent-phrase`.

### `product-manual`

Purpose: structured manual catalog that links products to document files without changing `ProductFact.documents[]`.

Key fields:

- `manualId`: unique stable ID, `manual_*`.
- `title`: localized text component.
- `manualKind`: `installation`, `operation`, `maintenance`, `calibration`, `wiring`, `software`, `safety`, `custom`.
- `locale`: `en`, `zh`, `multi`.
- `revision`, `effectiveDate`, `notes`.

Relations:

- `document` many-to-one `document-asset`; target row should have `assetClass=document`.
- `products` many-to-many `product-fact`.
- `relatedCategories` many-to-many `category-fact`.
- `intentPhrases` many-to-many `intent-phrase`.

### `industry-ecosystem-recommendation`

Purpose: manually curated product ecosystem combinations uploaded/maintained by editors.

Key fields:

- `recommendationId`: unique stable ID, `eco_*`.
- `title`, `rationale`, `curationNotes`: localized text components.
- `recommendationOrder`: JSON array of selected product `factId` values and optional notes; this preserves manual ranking beyond Strapi relation table order.
- `curatedBy`, `reviewedAt`.

Relations:

- `industry` many-to-one `industry-fact`.
- `applications` many-to-many `application-fact`.
- `anchorProduct` many-to-one `product-fact`.
- `recommendedProducts` many-to-many `product-fact`.
- `intentPhrases` many-to-many `intent-phrase`.

Recommended `recommendationOrder` shape:

```json
[
  {
    "productFactId": "prd_example_001",
    "rank": 1,
    "role": "primary sensor",
    "note": "Use as anchor measurement device."
  }
]
```

### `intent-phrase`

Purpose: shared phrase library for internal search, SEO planning, and GEO answer planning. It stores intent phrases, not generated metadata.

Key fields:

- `phraseId`: unique stable ID, `intent_*`.
- `phrase`: literal phrase.
- `locale`: `en`, `zh`.
- `intentType`: `informational`, `commercial`, `comparison`, `troubleshooting`, `navigation`, `specification`, `manual`, `case`, `brand`.
- `usageSurfaces`: JSON array such as `["search", "seo-planning", "geo-planning"]`.
- `priority`, `source`, `status`, `notes`.

Relations:

- `products` many-to-many `product-fact`.
- `categories` many-to-many `category-fact`.
- `industries` many-to-many `industry-fact`.
- `applications` many-to-many `application-fact`.

## Relationship Rules

- Product relations are references to `product-fact`, never product ownership.
- Category/industry/application relations are context tags, never generated route or classification data.
- `product-manual.document` must point to `document-asset.assetClass=document`.
- `case-study.supportingDocuments` should point to `document-asset.assetClass=document` unless intentionally using media as visual support in a later extension.
- `industry-ecosystem-recommendation.recommendationOrder` must contain only products also selected in `recommendedProducts`.
- `intent-phrase` can be reused across content and product contexts, but generated page metadata remains downstream runtime work.

## Lifecycle Hooks

No lifecycle hooks are required for bootstrapping these content types.

Recommended before production publishing:

- `product-manual`: validate `document.assetClass === 'document'`; require at least one related product or category.
- `industry-ecosystem-recommendation`: validate `recommendationOrder[].productFactId` exists in `recommendedProducts`; reject duplicate ranks; require `industry` or at least one `application`.
- `intent-phrase`: normalize phrase whitespace and validate uniqueness on `(locale, lower(phrase))`; validate `usageSurfaces` values against the allowed planning surfaces.
- `case-study`: validate supporting documents are document assets if the story is public.

These hooks should guard editorial quality only. They must not generate product facts, product slugs, canonical paths, SEO objects, GEO entities, or JSON-LD.

## PostgreSQL Index Suggestions

Strapi creates primary keys and many relation join tables. Add business-key and query indexes after the schemas stabilize.

Recommended unique indexes:

```sql
create unique index company_pages_page_id_uidx on company_pages (page_id);
create unique index blog_posts_post_id_uidx on blog_posts (post_id);
create unique index case_studies_case_id_uidx on case_studies (case_id);
create unique index product_manuals_manual_id_uidx on product_manuals (manual_id);
create unique index industry_ecosystem_recommendations_recommendation_id_uidx on industry_ecosystem_recommendations (recommendation_id);
create unique index intent_phrases_phrase_id_uidx on intent_phrases (phrase_id);
create unique index intent_phrases_locale_phrase_uidx on intent_phrases (locale, lower(phrase));
```

Recommended filter indexes:

```sql
create index blog_posts_topic_idx on blog_posts (topic);
create index blog_posts_published_on_idx on blog_posts (published_on);
create index case_studies_project_year_idx on case_studies (project_year);
create index case_studies_is_public_idx on case_studies (is_public);
create index product_manuals_manual_kind_idx on product_manuals (manual_kind);
create index product_manuals_locale_idx on product_manuals (locale);
create index industry_ecosystem_recommendations_reviewed_at_idx on industry_ecosystem_recommendations (reviewed_at);
create index intent_phrases_locale_idx on intent_phrases (locale);
create index intent_phrases_intent_type_idx on intent_phrases (intent_type);
create index intent_phrases_status_idx on intent_phrases (status);
```

Recommended JSON indexes if query volume justifies them:

```sql
create index industry_ecosystem_recommendations_order_gin_idx on industry_ecosystem_recommendations using gin (recommendation_order jsonb_path_ops);
create index intent_phrases_usage_surfaces_gin_idx on intent_phrases using gin (usage_surfaces jsonb_path_ops);
```

Actual Strapi join table names should be confirmed from generated PostgreSQL schema before writing final migrations.

## Acceptance Commands

Run these from the repository root:

```txt
Get-ChildItem strapi-cms\src\api -Recurse -Filter schema.json | ForEach-Object { Get-Content -Raw $_.FullName | ConvertFrom-Json | Out-Null }
Get-ChildItem strapi-cms -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
npm run validate:cms-facts
npm run validate:domain
npm run typecheck
```

Optional if the Strapi package is installed under `strapi-cms/`:

```txt
cd strapi-cms
npm install
npm run build
```
