# Staging Observation Window Verification

Date: 2026-06-25
Owner: Thread 5 - QA / Scale / DevOps
Scope: verify whether the staging observation window may open after live CMS smoke testing

## Final Decision

No-Go, return to specific thread: System integration thread / staging environment configuration.

The staging smoke evidence does not satisfy the required live CMS activation condition. The observed runtime still reports `requestedMode: mock-domain` and `activeMode: mock-domain`, so the smoke test did not prove `cms-facts-api` activation.

This decision does not indicate a boundary regression. The release gates, SEO/GEO checks, and build still pass.

## Smoke Test Review

| Requirement | Expected | Observed | Result |
| --- | --- | --- | --- |
| `/api/cms/status` requested mode | `cms-facts-api` | `mock-domain` | Fail |
| `/api/cms/status` active mode | `cms-facts-api` | `mock-domain` | Fail |
| `productCount` | `> 0` while live mode is active | `20` on fallback runtime | Fail for live-mode proof |
| Public SEO/GEO/API output shape | Domain-normalized | Domain-normalized on fallback runtime | Pass for shape safety only |
| Raw CMS / Strapi / `CMS_FACTS_JSON` leakage | None | None found in smoke report | Pass |

## Smoke Verification Review

The smoke verification report correctly classifies the issue:

- It records the active mode mismatch as the blocking failure.
- It assigns the failure to the System integration thread / staging environment configuration.
- It states the runtime fell back to `mock-domain`, so the result cannot be accepted as live CMS smoke success.
- It preserves the required rerun condition: server-only staging CMS env must be injected before another smoke test.

## Boundary And Regression Review

Status: Pass.

Evidence reviewed this turn confirms the following remain true:

- `docs/frontend-live-cms-boundary-report.md` still states visible UI routes and components do not import CMS, adapter, raw facts, Strapi, or public CMS env.
- `docs/live-cms-runtime-integration-report.md` still keeps live facts ingress behind `lib/cms/source.ts` -> `lib/cms/products.ts` -> `lib/runtime/domain-products.ts`.
- `docs/seo-geo-live-cms-regression-report.md` still states SEO/GEO consume Domain-normalized runtime outputs only.
- `docs/real-cms-export-dry-run-report.md` still shows the Strapi-shaped export dry run normalizes into `CmsFactInput` and Domain without mutating mock data.
- `docs/strapi-backend-integration-report.md` still keeps the backend facts endpoint facts-only and rejects Strapi envelopes and raw transport fields.

## Required Gates

All gates requested for this verification passed in the current turn:

- `npm run validate:boundaries`
- `npm run typecheck`
- `npm run validate:seo`
- `npm run validate:geo`
- `npm run build`

## Risk Summary

- No raw CMS / Strapi / `CMS_FACTS_JSON` leak was observed in the smoke report.
- No boundary regression was observed in the frontend, SEO, GEO, or runtime facade reports.
- The only blocking issue is missing server-only staging env injection for live CMS activation.

## Conclusion

The staging observation window must remain closed until a new smoke report proves `requestedMode: cms-facts-api`, `activeMode: cms-facts-api`, and `productCount > 0` under the live CMS source.

Return to the System integration thread / staging environment configuration thread for env injection and rerun.
