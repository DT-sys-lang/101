# Thread 2: CMS / Strapi / PostgreSQL

You are responsible for the CMS Fact Layer and backend persistence design.

## Mission

Prepare a Strapi + PostgreSQL backend that stores only raw industrial facts and feeds the Adapter layer.

## Current Context

Key files to read first:

- `lib/cms/products.ts`
- `lib/cms/adapter.ts`
- `adapter/validation.ts`
- `adapter/data-flow.md`
- `lib/domain/product.ts`
- `lib/domain/category.ts`

## Tasks

1. Design or scaffold CMS structure for:
   - ProductFact
   - CategoryFact
   - IndustryFact
   - ApplicationFact
   - DocumentAsset
   - Certification
   - Media assets
2. Ensure PostgreSQL persistence is planned or scaffolded.
3. Provide REST/GraphQL query shape that returns facts only.
4. Define webhook plan for publish events and ISR revalidation.
5. Define preview mode plan.
6. Keep the current mock/env CMS source working until Strapi is fully wired.

## CMS Allowed Fields

CMS may store:

- product basic identity facts
- category parent/name facts
- technical measurements
- specifications
- documents
- assets
- certifications
- industry/application factual relationships

## CMS Forbidden Fields

CMS must not store:

- slug path
- canonical path
- breadcrumb
- SEO object
- JSON-LD
- GEO object
- AI summary object
- generated category depth

## Acceptance Criteria

- CMS content model document exists.
- Fact API shape matches Adapter input.
- No derived fields are included in CMS content types.
- Existing build remains passing if files are changed.

## Forbidden

- Do not wire UI directly to Strapi raw responses.
- Do not bypass `adapter` or `lib/domain`.
