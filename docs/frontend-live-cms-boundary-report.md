# Frontend Live CMS Boundary Report

Date: 2026-06-25
Owner: Thread 4 - Frontend / UI boundary
Gate: Staging live CMS traffic test readiness

## Verdict

Pass for frontend live CMS boundary readiness.

The live CMS runtime wiring does not require page UI changes. Visible UI routes and components continue to consume Domain view models, Domain projections, or approved Domain-normalized runtime facade outputs. They do not import `lib/cms`, adapter modules, CMS fact types, raw facts, Strapi types, `CMS_FACTS_JSON`, or public CMS/Strapi environment variables.

This report is the named frontend live-CMS boundary artifact required by `docs/staging-live-cms-readiness-report.md` and `docs/staging-live-cms-go-no-go.md`. It complements, but does not replace, the earlier `docs/frontend-boundary-audit.md`.

## Reviewed Inputs

- `docs/frontend-boundary-audit.md`
- `docs/staging-live-cms-readiness-report.md`
- `docs/staging-live-cms-go-no-go.md`
- `docs/domain-runtime-facade-plan.md`
- `docs/cms-runtime-wiring-decision.md`
- `app/[locale]`
- `components`
- `lib/domain/page-view-models.ts`
- `lib/domain/site.ts`
- `lib/runtime/domain-products.ts`
- `scripts/validate-boundaries.mjs`

## Boundary Model Confirmed

The approved live CMS flow is:

1. Live CMS facts enter through `lib/cms/source.ts` and `lib/cms/products.ts`.
2. Adapter code derives Domain records from exact CMS facts.
3. `lib/runtime/domain-products.ts` exposes Domain-normalized product records, catalogs, lists, source metadata, and category tree outputs.
4. Domain view model/projection builders consume Domain-normalized data.
5. `app/[locale]` visible routes and `components` render those view models/projections.

The frontend layer remains a consumption layer. It does not become CMS-aware during live CMS wiring.

## Static Scan Summary

A targeted static scan covered:

- `app/[locale]`
- `components`
- `lib/domain/page-view-models.ts`
- `lib/domain/site.ts`

The scan checked for:

- `lib/cms` imports
- adapter imports
- `Strapi` / `strapi` references
- `CMS_FACTS_JSON`
- `NEXT_PUBLIC_*CMS` and `NEXT_PUBLIC_*STRAPI`
- CMS fact type names and raw facts markers
- Strapi wrapper field names such as `attributes`, `documentId`, and `collectionType`
- direct `process.env` usage in the scanned UI/domain projection files

Result: no hits in the targeted frontend/live-CMS boundary scan.

## UI And Route-Level Visible Rendering

Status: Pass.

Visible rendering under `app/[locale]` resolves UI data through Domain-facing APIs and renders components with Domain-owned props.

Observed allowed patterns include:

- `getIndustrialSiteLayout()` for layout/header/footer projection data.
- `getIndustrialHomepage()` and `listHomepageProducts()` for homepage projection data.
- `resolveProductListViewModel()` and `resolveProductDetailViewModel()` for product UI pages.
- `getIndustryEntryPageViewModel()` and `getApplicationEntryPageViewModel()` for entry pages.
- `getStaticInfoPageViewModel()` for static info pages.
- Existing entry-page route helpers that return page ViewModels and static params.

No visible UI route imports `@/lib/cms/*`, adapter modules, CMS fact types, raw facts, Strapi types, or CMS environment variables.

## Components Boundary

Status: Pass.

`components/**/*.tsx` consume Domain view models/projections and shared UI utilities only.

Observed allowed component imports include:

- `SiteLayoutProjection`
- `HomepageProjection`
- `EntryPageViewModel`
- `StaticInfoPageViewModel`
- `ProductListItem`
- `ProductListPageViewModel`
- `ProductDetailViewModel`
- shared UI helpers such as `@/lib/utils`

No component imports CMS modules, adapter modules, raw CMS fact types, Strapi types, `CMS_FACTS_JSON`, or public CMS/Strapi environment variables.

## Runtime Facade Usage

Status: Pass.

`lib/runtime/domain-products.ts` is the public runtime facade for Domain-normalized product data. It is allowed to delegate internally to `lib/cms/products.ts` because that delegation is behind the runtime boundary and returns only Domain-normalized outputs.

The facade exposes allowed outputs such as:

- `ProductRecord[]`
- `CategoryTree`
- `ProductCatalogIndex`
- `ProductListResult`
- source metadata

It does not expose raw CMS facts, Strapi envelopes, Strapi IDs, raw transport payloads, `CmsFactInput`, generated CMS fields, or UI view models.

Frontend visible routes do not need to import `lib/cms/products.ts`. Real live CMS wiring belongs behind the runtime facade and Domain projection layer.

## Environment Variable Boundary

Status: Pass.

The scanned UI and visible route surfaces do not read:

- `CMS_FACTS_JSON`
- `process.env.CMS_FACTS_JSON`
- `NEXT_PUBLIC_*CMS`
- `NEXT_PUBLIC_*STRAPI`
- public webhook/facts environment variables

Live CMS configuration remains server-only and owned by the CMS/runtime layer, not by UI components or route-level visible rendering.

## Live CMS Wiring Impact On Frontend

Live CMS wiring should not modify page UI, visual components, or product card semantics.

If live CMS data changes visible content, the change must enter through one of these allowed paths:

- CMS facts -> adapter -> Domain records -> Domain ViewModel/projection -> existing UI component.
- CMS facts -> adapter -> Domain records -> runtime facade -> Domain ViewModel/projection -> existing UI component.

The frontend should only change when a Domain ViewModel/projection contract intentionally changes. It must not add temporary CMS reads or Strapi field mapping in route files or components.

## Files That Should Not Be Modified For Live CMS Wiring

The following files should remain unchanged for runtime CMS connectivity unless a Domain ViewModel contract intentionally changes:

- `app/[locale]/layout.tsx`
- `app/[locale]/page.tsx`
- `app/[locale]/products/page.tsx`
- `app/[locale]/products/[...slug]/page.tsx`
- `app/[locale]/industries/page.tsx`
- `app/[locale]/industries/[...slug]/page.tsx`
- `app/[locale]/applications/page.tsx`
- `app/[locale]/applications/[...slug]/page.tsx`
- `app/[locale]/oem/page.tsx`
- `app/[locale]/resources/page.tsx`
- `app/[locale]/contact/page.tsx`
- `components/layout/**/*.tsx`
- `components/products/**/*.tsx`
- `components/sections/**/*.tsx`
- `components/shared/**/*.tsx`

## Import Rules For The Live CMS Test Window

Allowed in `components/**/*.tsx`:

- React and Next.js framework imports.
- `@/components/*` imports.
- `@/lib/utils` styling helpers.
- Type-only imports from `@/lib/domain` for Domain view models/projections and list item contracts.

Allowed in `app/[locale]/**/*.tsx` visible routes:

- Domain ViewModel/projection functions from `@/lib/domain`.
- Domain route/static-param helpers that return ViewModels or route params.
- Components from `@/components/*`.
- i18n routing helpers.

Forbidden in `app/[locale]` visible routes and `components`:

- `@/lib/cms/*` or `lib/cms` imports.
- `@/adapter/*`, `adapter/*`, or adapter helper imports.
- Raw CMS facts or CMS fact type imports.
- Strapi clients, Strapi response types, Strapi envelope fields, or Strapi relation/upload payloads.
- `CMS_FACTS_JSON` reads.
- `NEXT_PUBLIC_*CMS` or `NEXT_PUBLIC_*STRAPI` reads.
- Temporary CMS field mapping in UI files.
- Product data model changes or UI-defined product semantics.

## Notes On Existing Route-Level SEO

Some existing route files have SEO or structured-data calls owned by the SEO/GEO runtime boundary. Those calls are not CMS imports and must not be expanded by frontend work during the live CMS test window.

Visible UI rendering must continue to use Domain ViewModels/projections. SEO/GEO ownership remains outside Thread 4.

## Verification

Current-turn verification is required before using this report as a live CMS readiness precondition:

- `npm run validate:boundaries`
- `npm run typecheck`

Results will be recorded by the executing thread after the commands complete.

## Final Gate Statement

Frontend live CMS boundary is ready for the staging readiness gate once the required verification commands pass.

Live CMS traffic can be wired through the CMS/runtime facade without modifying page UI or components, and without exposing CMS, Strapi, adapter, raw facts, or CMS environment variables to the frontend layer.
