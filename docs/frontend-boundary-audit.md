# Frontend Boundary Audit

Date: 2026-06-24
Owner: Frontend / UI thread
Scope: `app/[locale]/**/*.tsx`, `components/**/*.tsx`, `lib/domain/page-view-models.ts`, `lib/domain/site.ts`, `docs/architecture-gap-report.md`, `docs/architecture-next-phase-plan.md`

## Verdict

The frontend UI boundary is holding for real CMS integration readiness.

`components/**/*.tsx` consume Domain view models/projections or shared UI utilities only. No component imports `lib/cms`, adapter modules, Strapi clients, CMS raw facts, Strapi field names, or product data model records directly.

`app/[locale]/**/*.tsx` route pages consume Domain view models/projections for visible UI data. Several route files also call `lib/seo` metadata and structured-data builders. This is not a direct CMS dependency, but it is a route-level boundary risk for the current frontend thread because future UI work must not expand canonical, hreflang, JSON-LD, or GEO generation in page components.

The executable enforcement gate is `npm run validate:boundaries`; keep it green before merging any UI or route change that touches import boundaries.

## Audit Method

- Scanned `app/[locale]` and `components` TSX files for `lib/cms`, adapter imports, Strapi names, raw facts markers, and CMS field-like tokens.
- Scanned route and component imports for `@/lib/domain`, `@/lib/seo`, `@/lib/runtime`, `@/lib/cms`, and adapter paths.
- Reviewed `lib/domain/page-view-models.ts` and `lib/domain/site.ts` as the frontend-facing Domain projection surface.
- Reviewed the architecture gap report and next-phase plan for Phase 2 CMS integration rules.
- Treat `npm run validate:boundaries` as the release gate that enforces the audit below.

## Compliance Points

- `components/layout/*` import only `SiteLayoutProjection` from `@/lib/domain` plus framework/UI dependencies.
- `components/products/*` consume `ProductListItem`, `ProductListPageViewModel`, or `ProductDetailViewModel` from `@/lib/domain`; no product fields are defined in UI components.
- `components/sections/*` consume `HomepageProjection`, `EntryPageViewModel`, or `StaticInfoPageViewModel`; homepage, industry, application, and static entry UI stay projection-driven.
- `components/shared/industrial-icons.ts` consumes only `IndustrialIconKey` from Domain and maps UI icons locally.
- `app/[locale]/layout.tsx` uses `getIndustrialSiteLayout()` from Domain for header/footer data.
- Homepage and product route pages resolve visible UI from Domain functions such as `getIndustrialHomepage()`, `listHomepageProducts()`, `resolveProductListViewModel()`, and `resolveProductDetailViewModel()`.
- Industry and application entry pages use Domain entry ViewModels/resolutions rather than CMS payloads.
- No scanned UI TSX file imports `@/lib/cms`, `lib/cms`, adapter modules, `@/lib/runtime`, or Strapi clients.
- No scanned component imports `ProductRecord` or `ProductDetailPageData`; those remain Domain/internal projection concerns.

## Risk Points

- Route files under `app/[locale]` still import `@/lib/seo/*` and `@/lib/seo/structured-data` for metadata and JSON-LD rendering. This should remain owned by the SEO/GEO runtime thread and should not be extended by UI iterations.
- `app/[locale]/products/[...slug]/page.tsx` imports SEO-layer product detail/list resolvers alongside Domain ViewModel resolvers. This is acceptable only for existing SEO output, not for visible UI data.
- `app/[locale]/industries/*` and `app/[locale]/applications/*` use Domain entry-page resolutions that return both `page` and `seo`. UI rendering should consume only `resolution.page`; SEO consumers should remain isolated.
- Text search flags like `facts` in `components/products/product-detail-page.tsx` refer to `data.geoSummary.facts` from `ProductDetailViewModel`, not CMS raw facts. This is safe, but future naming should keep raw CMS facts out of UI props.
- `lib/domain/page-view-models.ts` imports internal Domain records and detail page data in order to build UI ViewModels. That is inside Domain and is allowed; these types must not cross into components or route UI props directly.
- `lib/domain/site.ts` contains frontend projections and display copy. It may evolve as Domain-owned projection data, but UI components must not mirror or redefine its semantics.

## Files That Should Not Change For Real CMS Wiring

When connecting the real CMS, the following frontend files should generally remain unchanged unless a Domain ViewModel contract intentionally changes:

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

Real CMS wiring should happen behind the existing Domain/runtime/facade boundary, not inside these UI files.

## Import Rules For Future UI Iteration

Allowed in `components/**/*.tsx`:

- Framework imports such as `next/link` and React types.
- UI and shared component imports from `@/components/*`.
- Styling helpers such as `@/lib/utils`.
- Type-only imports from `@/lib/domain` for ViewModels/projections/list items already exposed by Domain.

Allowed in `app/[locale]/**/*.tsx` for visible UI data:

- Domain ViewModel/projection functions from `@/lib/domain`.
- Domain route/static-param helpers when they return page ViewModels or route params.
- Components from `@/components/*`.
- i18n routing helpers.

Not allowed in UI files:

- `@/lib/cms`, `lib/cms`, Strapi clients, or Strapi response types.
- Adapter modules or fact-normalization modules.
- CMS raw facts, raw Strapi payloads, `attributes`, `documentId`, collection-type fields, or generated slugs from CMS.
- Direct `ProductRecord`, `ProductDetailPageData`, or CMS fact types in component props.
- New canonical, hreflang, JSON-LD, or GEO generation inside UI components.

Route-level SEO imports should be treated as legacy/existing output responsibility. New frontend work should not add more `@/lib/seo` usage from UI routes; if SEO/GEO behavior changes, route loading should be aligned by the SEO/GEO or architecture thread through a Domain/runtime facade.

## CMS Integration Guidance

For real CMS integration, do not modify UI components to account for Strapi field names or response shapes. The CMS should provide facts only, the adapter should normalize and derive generated fields, and Domain should expose stable ViewModels/projections to the frontend.

If a CMS change requires different visible UI data, update the Domain ViewModel contract first, then adjust components to consume the new ViewModel field. Do not introduce temporary UI reads from CMS while waiting for Domain support.
