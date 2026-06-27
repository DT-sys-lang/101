# Architecture Next Phase Plan

Date: 2026-06-23
Role: Principal Architect thread
Scope: Post-Freeze CMS integration

## Purpose

This plan describes the next execution phase after Architecture Freeze v1.

The freeze remains unchanged. The goal of this phase is to connect a real Strapi + PostgreSQL CMS to the already-frozen domain model without changing the architecture shape, the domain contracts, or the UI boundary rules.

## Phase Objective

Move from CMS-ready architecture to real CMS integration while preserving:

- `lib/domain` as the single truth layer
- `adapter` as the only derivation layer
- `lib/seo` and `lib/geo` as domain-only output layers
- UI pages consuming view models only
- CMS storing facts only

## Phase 2 Execution Tracks

### Track 1 - Architecture / Domain / Adapter

Owner: Thread 1

Goals:

- Finalize domain facade and repository interface contracts.
- Remove any remaining direct runtime dependence on `lib/cms` from SEO/GEO consumers.
- Lock the Specification registry governance model.
- Keep boundary audits aligned to Freeze v1.

Deliverables:

- Domain facade or repository contract document.
- Boundary audit update if coupling is found.
- No UI implementation.

### Track 2 - CMS / Strapi / PostgreSQL

Owner: Thread 2

Goals:

- Define Strapi content types for facts only.
- Define PostgreSQL persistence and query shape.
- Preserve strict exclusion of generated fields.
- Define preview and publish lifecycle requirements.

Deliverables:

- CMS content model document.
- Fact-only API response contract.
- Webhook and preview plan.

### Track 3 - SEO / GEO Runtime

Owner: Thread 3

Goals:

- Keep SEO and GEO builders domain-only.
- Preserve sitemap, robots, canonical, hreflang, JSON-LD, llms.txt, and GEO outputs.
- Ensure route-level loading goes through a single runtime/domain facade.

Deliverables:

- SEO/GEO runtime gap note if needed.
- Validation checklist for SEO and GEO.
- No UI semantics.

### Track 4 - Frontend / UI

Owner: Thread 4

Goals:

- Continue consuming only domain view models.
- Avoid direct CMS or adapter imports.
- Keep page implementation unchanged unless the domain facade changes shape.

Deliverables:

- UI regression report if a domain contract changes.
- No page redesign work in this phase.

### Track 5 - QA / Scale / DevOps

Owner: Thread 5

Goals:

- Keep lint, typecheck, build, SEO, GEO, and scale gates green.
- Add real CMS export validation when Strapi payloads are available.
- Keep verification commands as release gates.

Deliverables:

- Verification checklist updates.
- Scale regression checks.
- CI-ready gate documentation.

## Coordination Rules

1. Do not change the freeze structure.
2. Do not move product semantics into UI.
3. Do not let CMS own slugs, canonical paths, SEO, JSON-LD, or GEO.
4. Keep all generated fields in the adapter or domain layers.
5. Use thread 1 to arbitrate boundary disputes before thread 2 or thread 3 changes shape.
6. Keep thread 5 as the final gate for validation and scale safety.

## Recommended Thread Order

1. Thread 1 - final boundary and facade cleanup.
2. Thread 2 - CMS content model and fact API design.
3. Thread 3 - SEO/GEO runtime alignment with the new facade.
4. Thread 5 - validation and scale gates.
5. Thread 4 - only if a domain contract update affects view models.

## Success Criteria

This phase is complete when:

- A real CMS can provide facts without violating the freeze.
- Domain, adapter, SEO, GEO, and UI boundaries remain unchanged.
- Validation gates still pass at 300 and 1000 product scale.
- The project is ready for long-term Strapi operation without schema churn.
