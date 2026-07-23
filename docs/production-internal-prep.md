# Production Internal Prep

This document records the project-side production preparation for the Next.js official site plus Strapi CMS deployment.

## Recommended Runtime

- Official site: Vercel, or another Next.js-capable host with Node.js route handlers.
- CMS: Strapi 5 on BaoTa/VPS through Docker Compose, backed by PostgreSQL.
- Media and downloads: S3-compatible object storage, not local VPS disk.
- Inquiry storage: Strapi `inquiry-submission` collection through the protected `/internal/cms/inquiries` endpoint.
- Analytics: GA4 through `@next/third-parties/google`.
- Search Console: DNS verification preferred; meta verification is supported through env.

Architecture and deployment phase documents:

- `docs/final-deployment-architecture.md`
- `docs/pretest-deployment-runbook.md`
- `deploy/README.md`

## Frontend Env

Required for production:

```env
NEXT_PUBLIC_SITE_ORIGIN=https://www.example.com
CMS_SOURCE_MODE=cms-facts-api
CMS_FACTS_API_URL=https://cms.example.com/internal/cms/facts
CMS_FACTS_API_ALLOW_FETCH=true
CMS_FACTS_API_TOKEN=replace-with-shared-internal-cms-facts-token
CMS_RESOURCES_API_URL=https://cms.example.com
CMS_STRAPI_API_VERSION=5
CMS_REVALIDATE_SECRET=replace-with-random-revalidate-secret
CMS_PREVIEW_SECRET=replace-with-random-preview-secret
STRAPI_INQUIRY_API_URL=https://cms.example.com/internal/cms/inquiries
STRAPI_INQUIRY_API_TOKEN=replace-with-shared-internal-cms-inquiry-token
```

Optional but recommended:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
RESEND_API_KEY=
INQUIRY_EMAIL_FROM=YUFAVOR <inquiry@example.com>
INQUIRY_EMAIL_TO=sales@example.com
```

## Strapi Env

Required for production:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
PUBLIC_URL=https://cms.example.com
DATABASE_CLIENT=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=industrial_cms
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=replace-with-strong-postgres-password
DATABASE_SSL=false
INTERNAL_CMS_FACTS_TOKEN=replace-with-shared-internal-cms-facts-token
INTERNAL_CMS_INQUIRY_TOKEN=replace-with-shared-internal-cms-inquiry-token
STRAPI_CORS_ORIGINS=https://www.example.com,https://preview.example.com
```

Production upload storage:

```env
STRAPI_UPLOAD_PROVIDER=aws-s3
STRAPI_S3_ACCESS_KEY_ID=
STRAPI_S3_SECRET_ACCESS_KEY=
STRAPI_S3_REGION=auto
STRAPI_S3_ENDPOINT=
STRAPI_S3_BUCKET=
STRAPI_UPLOAD_BASE_URL=
STRAPI_CSP_MEDIA_HOSTS=https://media.example.com
```

## Release Gates

Run these before connecting production traffic:

```bash
npm run typecheck
npm run validate:cms-facts
npm run validate:domain
npm run validate:seo
npm run validate:scale-300
npm run build
```

Run the Strapi build after env and object storage config are set:

```bash
cd strapi-cms
npm run build
```

For the BaoTa/VPS Docker deployment, use:

```bash
cp deploy/production.env.example deploy/production.env
docker compose --env-file deploy/production.env -f docker-compose.production.yml up -d --build
```

## Dependency Audit Note

The frontend package uses an npm override for `next -> sharp@0.35.3` to avoid the inherited libvips advisory in older Sharp builds. As of this prep pass, `npm audit --omit=dev` still reports a moderate PostCSS advisory through Next's internal `postcss@8.4.31` dependency. Do not run `npm audit fix --force` for this project without a separate compatibility review; npm currently proposes a breaking Next downgrade path.

The Strapi package has also had `npm audit fix` run without `--force`. Remaining Strapi audit items are inside the Strapi 5 dependency tree and npm proposes breaking Strapi 4 downgrade paths for several of them. Treat those as upstream-tracking items unless a Strapi 5 patch release or a tested override is selected.

## Smoke Checks

After preview or production deploy:

```bash
SMOKE_SITE_URL=https://www.example.com SMOKE_CMS_URL=https://cms.example.com npm run check:production
```

If checking the protected facts API as well:

```bash
SMOKE_SITE_URL=https://www.example.com \
SMOKE_CMS_URL=https://cms.example.com \
CMS_FACTS_API_URL=https://cms.example.com/internal/cms/facts \
CMS_FACTS_API_TOKEN=replace-with-token \
npm run check:production
```

Suggested schedule:

- First 7 days after launch: daily smoke check.
- After stabilization: weekly smoke check plus a monthly full release gate run.
- Run a full release gate after any CMS schema, product adapter, sitemap, SEO, inquiry, or deployment config change.

## BaoTa Notes

- Run Strapi and PostgreSQL with Docker Compose; keep BaoTa focused on Nginx, SSL, firewall, and server visibility.
- Put Nginx in front of Strapi and terminate SSL at `cms.example.com`.
- Do not expose PostgreSQL publicly.
- Restrict BaoTa panel access by IP where possible and enable 2FA.
- Back up PostgreSQL daily and sync backups to object storage.
- Keep uploaded media in S3-compatible storage so a VPS rebuild does not lose product images, manuals, or certificates.
