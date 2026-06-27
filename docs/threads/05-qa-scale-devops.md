# Thread 5: QA / Scale / DevOps

You are responsible for making the system verifiable and scale-safe.

## Mission

Create quality gates that prove the architecture works for industrial-scale content, not only the current mock data.

## Current Context

Key files to read first:

- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `app/sitemap.ts`
- `lib/domain/product-catalog.ts`
- `lib/cms/products.ts`
- `adapter/validation.ts`

## Tasks

1. Fix or replace the broken lint script.
2. Add `typecheck` script if missing.
3. Add validation scripts for:
   - domain consistency
   - CMS fact safety
   - SEO output completeness
   - GEO output completeness
4. Add a scale test plan for 300+ generated/mock products.
5. Verify sitemap and build behavior at larger scale.
6. Document required verification commands.

## Suggested Scripts

- `npm run build`
- `npm run typecheck`
- `npm run validate:domain`
- `npm run validate:seo`
- `npm run validate:geo`

## Acceptance Criteria

- Verification commands are documented.
- Build passes after changes.
- TypeScript strict remains enabled.
- Large catalog scale test strategy is present.
- Lint command no longer points to invalid `next lint` behavior.

## Forbidden

- Do not claim passing status without running commands.
- Do not reduce strictness to silence errors.
- Do not skip sitemap/hreflang/GEO checks for scale testing.
