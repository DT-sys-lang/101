# Architecture Gap Report

Date: 2026-06-25
Role: Principal Architect thread
Project: Heiyu Trans industrial B2B global acquisition system

## Executive Summary

The project remains aligned with Architecture Freeze v1 and is now in **Phase 3 integration build** status.

The frozen architecture is holding: `lib/domain` remains the truth layer, `adapter` remains the only derivation layer, `lib/seo` and `lib/geo` consume normalized domain records, and UI routes consume domain projections rather than raw CMS payloads.

The main remaining gap is no longer architecture discovery. It is controlled live-CMS wiring: `lib/cms/source.ts` now has the async `cms-facts-api` source path, but `lib/cms/products.ts` still builds the public runtime snapshot through the synchronous source reader. The project can continue Strapi/PostgreSQL integration work, but it is not approved for production live CMS traffic.

Current architectural state: stable Phase 3 integration build, No-Go for production CMS cutover.

## Freeze Verdict

Architecture Freeze v1 is still valid.

What changed since the previous audit:

- Validation gates have been established for the current codebase.
- Product, category, industry, application, inquiry, SEO, and GEO contracts are all present in `lib/domain`.
- The system supports the scale target in validation terms, including the 1000-product gate.
- SEO/GEO outputs are derived from domain-normalized records, not authored inside UI components.
- `lib/cms/source.ts` now includes an async `cms-facts-api` request/fetch/normalization/fallback path.
- `lib/cms/products.ts` has not yet been wired to that async source path, so public runtime consumers are not serving live CMS facts.

## Boundary Audit

### Stable

- `lib/domain` owns product, category, SEO, GEO, industry, application, inquiry, and system target contracts.
- `adapter` validates CMS facts and generates `ProductRecord`, `CategoryTree`, SEO fields, JSON-LD, and GEO AI structure.
- `lib/seo` builds metadata, canonical URLs, hreflang, sitemap, robots, and JSON-LD from domain-normalized records.
- `lib/geo` builds product feeds, GEO indexes, answer blocks, LLMS text, and AI-readable product output from domain-normalized records.
- UI pages consume domain projections and page view models.
- CMS fact payloads reject derived fields such as slug, canonical, breadcrumb, SEO, JSON-LD, and GEO.
- `lib/runtime/domain-products.ts` remains the only public product runtime facade.

### Still Bridged

- `lib/runtime/domain-products.ts` delegates to `lib/cms/products.ts` as an internal bridge.
- `lib/cms/products.ts` emits Domain-normalized products and category tree only.
- `lib/cms/source.ts` contains live facts API mechanics, but `lib/cms/products.ts` still uses the synchronous source reader.
- `app/api/cms/status/route.ts` is still a source-status endpoint for operational metadata only.

### Not Yet Final

- Real Strapi content types and PostgreSQL persistence are not implemented.
- The real backend-only facts aggregator is not implemented.
- The approved async preload or async runtime boundary in `lib/cms/products.ts` is still pending.
- Publish webhook, preview mode, and ISR revalidation wiring for a real CMS are still pending.
- CI-backed integration checks against real CMS exports are still pending.
- Specification registry governance is present, but the long-term CMS-owned dictionary lifecycle still needs its own operational plan.

## Answer To The Four Questions

1. **Alpha or real CMS stage?**
   - The architecture is no longer exploratory Alpha.
   - It is in Phase 3 integration build: ready to continue real CMS integration work, not ready for production live CMS traffic.

2. **Are the boundaries stable?**
   - Yes.
   - Domain, Adapter, SEO, GEO, UI, and CMS boundaries remain aligned with Freeze v1.
   - The key boundary to protect next is the `lib/cms/products.ts` bridge: live facts may enter there only as validated `CmsFactInput` and may leave only as Domain-normalized records.

3. **Update docs or add a next-phase plan?**
   - Yes.
   - `docs/domain-runtime-facade-plan.md` and `docs/phase-3-go-no-go.md` have been updated to reflect the current code state.
   - `docs/architecture-next-phase-plan.md` remains valid as the thread coordination plan, but the execution stage should now be read as Phase 3 integration work.

4. **Does thread allocation need adjustment?**
   - No structural change is needed.
   - Thread focus should shift from design proof to runtime wiring, CMS facts aggregation, SEO/GEO boundary verification, and release gates.

## Remaining Gaps

- Real Strapi/PostgreSQL fact storage.
- Backend-only facts aggregator returning exact `CmsFactInput`.
- Approved async preload or async runtime boundary in `lib/cms/products.ts`.
- CMS fact query shape for ProductFact, CategoryFact, IndustryFact, ApplicationFact, DocumentAsset, Certification, and media assets.
- CMS publish and preview lifecycle.
- CI-backed integration checks against real CMS exports.
- Production rollback policy for failed live facts fetch or adapter validation.

## Updated Thread Focus

### Thread 1 - Architecture / Domain / Adapter

- Keep Freeze v1 enforcement as the gate.
- Arbitrate the approved async preload or async runtime boundary for `lib/cms/products.ts`.
- Ensure live CMS facts cannot bypass `adapter` or `lib/domain`.
- Keep ownership on semantic contracts, not Strapi implementation details.

### Thread 2 - CMS / Strapi / PostgreSQL

- Move from schema planning into facts-only CMS implementation planning.
- Define Strapi content types, PostgreSQL persistence assumptions, and backend-only aggregator output.
- Preserve the forbidden-field contract for slugs, SEO, JSON-LD, and GEO.
- Return exact `CmsFactInput`, not Strapi transport envelopes.

### Thread 3 - SEO / GEO Runtime

- Keep SEO/GEO builders domain-only.
- Verify all route-level loading goes through `lib/runtime/domain-products.ts` or domain projections.
- Preserve sitemap, robots, hreflang, JSON-LD, llms.txt, GEO feed, GEO index, and answer blocks.

### Thread 4 - Frontend / UI

- Continue consuming only view models and domain projections.
- Do not introduce direct CMS or adapter coupling.
- No page-structure changes are required unless a domain/view-model contract changes.

### Thread 5 - QA / Scale / DevOps

- Keep lint, typecheck, build, SEO, GEO, boundary, CMS facts, domain, and scale gates as release gates.
- Add real CMS export validation and integration checks once a real export is available.
- Protect the freeze with CI, not with manual review alone.

## Next Decision

Proceed with Phase 3 integration work without changing Architecture Freeze v1.

The correct next move is not to redesign the system. It is to connect the real CMS to the already-frozen domain model by adding the approved runtime wiring behind `lib/cms/products.ts`, while preserving the public runtime facade and Domain-normalized outputs.
