# Production Deployment Readiness Checklist

This checklist matches the current target: Next.js 16 on Vercel at `global.yufavor.com`, and Strapi 5 plus PostgreSQL in Docker Compose behind `cms.yufavor.com`.

## Release Identity

- Record the Git commit used for the Vercel deployment and Strapi image.
- Use an immutable Strapi image digest for production and retain the previous digest for rollback.
- Run the frontend and Strapi CI gates on Node 24, matching `strapi-cms/Dockerfile`, `strapi-cms/.node-version`, and package engines.
- Do not deploy with uncommitted or ignored runtime assets.

## Vercel Frontend

Configure the production environment from `.env.example`:

- `NEXT_PUBLIC_SITE_ORIGIN=https://global.yufavor.com`
- `NEXT_PUBLIC_MEDIA_ORIGIN` equals the public R2/S3 media origin.
- `CMS_SOURCE_MODE=cms-facts-api`
- `CMS_FACTS_API_URL=https://cms.yufavor.com/internal/cms/facts`
- `CMS_FACTS_API_TOKEN` matches `INTERNAL_CMS_FACTS_TOKEN` on Strapi.
- `CMS_RESOURCES_API_URL=https://cms.yufavor.com`
- `CMS_RESOURCES_API_TOKEN` is a read-only editorial token when required.
- `CMS_STRAPI_API_VERSION=5`
- `CMS_REVALIDATE_SECRET` and `CMS_PREVIEW_SECRET` are unique production secrets.
- `STRAPI_INQUIRY_API_URL=https://cms.yufavor.com/internal/cms/inquiries`
- `STRAPI_INQUIRY_API_TOKEN` matches `INTERNAL_CMS_INQUIRY_TOKEN` on Strapi.
- Configure Resend values before relying on email notifications.

Never expose Strapi tokens through `NEXT_PUBLIC_*` variables.

## Strapi and PostgreSQL

Copy `deploy/production.env.example` to the ignored `deploy/production.env`, then verify:

- `PUBLIC_URL` and `STRAPI_ADMIN_BACKEND_URL` are `https://cms.yufavor.com`.
- `STRAPI_CORS_ORIGINS` contains only `https://global.yufavor.com` and approved preview origins.
- Every Strapi secret and database password is unique and no placeholder remains.
- PostgreSQL has no public host port.
- R2/S3 credentials, bucket, endpoint, and `STRAPI_UPLOAD_BASE_URL` are configured before media migration.
- PostgreSQL backup volume exists and backups are copied off the server.

Validate both Compose variants:

```bash
STRAPI_ENV_FILE=./deploy/production.env docker compose --env-file deploy/production.env -f docker-compose.production.yml config
STRAPI_ENV_FILE=./deploy/production.env docker compose --env-file deploy/production.env -f docker-compose.runtime.yml config
```

Prefer `docker-compose.runtime.yml` on a low-memory server and pull the prebuilt image by digest.

## Pre-Deploy Gates

From the repository root:

```bash
npm ci
npm run lint
npm run typecheck
npm run validate:boundaries
npm run validate:cms-facts
npm run validate:strapi-response
npm run validate:domain
npm run validate:seo
npm run validate:geo
npm run validate:scale-300
npm run build
```

From `strapi-cms` with Node 24:

```bash
npm ci
npm run build
```

Run `npm audit --omit=dev` in both workspaces and resolve production high/critical findings before launch.

## Post-Deploy Smoke Tests

- `https://global.yufavor.com/zh` and `/en` return 200 and the `<html lang>` value matches the locale.
- Core product, industry, application, resource, and contact pages return 200 in both languages.
- `/api/cms/status` reports `activeMode: cms-facts-api` and the expected product count.
- `/api/product-feed`, `/sitemap.xml`, `/robots.txt`, and `/llms.txt` return valid content.
- A known sensor and valve detail page render images, specifications, canonical metadata, and JSON-LD.
- Product pagination exposes every published product.
- `cms.yufavor.com/admin` loads through Nginx and the protected facts endpoint rejects missing tokens.
- Publish one CMS change and confirm the revalidation webhook refreshes the frontend.
- Submit one test inquiry and confirm the record exists in Strapi/PostgreSQL and the expected notification is delivered.
- Upload one image and one PDF through Strapi's provider-backed Media Library, then verify both resolve through the public media origin.
- With `STRAPI_UPLOAD_PROVIDER=aws-s3`, the custom resource ZIP importer intentionally permits dry-run only until it gains provider-backed upload support.
- Run localization validation against production:

```bash
LOCALIZATION_AUDIT_BASE_URL=https://global.yufavor.com npm run validate:localization
```

## Go / No-Go

Proceed only when all automated gates pass, the production-equivalent smoke tests have evidence, backups and rollback are proven, CMS mode is not `mock-domain`, and inquiry persistence is confirmed. Any missing runtime asset, language contamination, inaccessible product page, high/critical production dependency advisory, or unverified backup/rollback is a launch blocker.
