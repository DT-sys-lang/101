# Thread 1: Architecture / Domain / Adapter

You are responsible for the system backbone.

## Mission

Finish the Domain + Adapter core so the project can scale from 300 to 1000+ industrial sensor products without UI-side data definitions or CMS-derived-field leakage.

## Current Context

Key files to read first:

- `lib/domain/README.md`
- `lib/domain/architecture-freeze-v1.ts`
- `lib/domain/product.ts`
- `lib/domain/category.ts`
- `lib/domain/product-catalog.ts`
- `adapter/data-flow.md`
- `adapter/validation.ts`
- `adapter/product.adapter.ts`
- `adapter/seo.adapter.ts`
- `adapter/geo.adapter.ts`

## Tasks

1. Verify existing Domain contracts for Product, Category, SEO, and GEO.
2. Add or finish contracts for Industry, Application, Specification, Inquiry/RFQ, and final system target if incomplete.
3. Ensure CMS Fact Layer rejects derived fields:
   - slug
   - canonical
   - breadcrumb
   - SEO object
   - JSON-LD
   - GEO object
4. Ensure Adapter is the only place that generates:
   - ProductRecord
   - CategoryTree
   - SEO fields
   - JSON-LD fields
   - GEO AI structure
5. Add validation scripts or runtime validators for CMS fact payloads and domain consistency.
6. Do not write UI pages.

## Acceptance Criteria

- Domain exports Product, Category, Industry, Application, Specification, SEO, GEO, and Inquiry contracts.
- Adapter validates raw facts and rejects derived CMS fields.
- `npm run build` passes after changes.
- A clear doc or script explains how CMS facts become Domain records.

## Forbidden

- Do not let UI define product semantics.
- Do not let CMS provide slug, SEO, GEO, or JSON-LD.
- Do not introduce a second data model parallel to `lib/domain`.
