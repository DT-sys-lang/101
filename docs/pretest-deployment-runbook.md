# Pre-Test Deployment Runbook

This runbook starts the pre-test deployment phase. Use it before importing full real product data or connecting production traffic.

## Gate 0: Local Release Check

Run from the project root:

```bash
npm run typecheck
npm run lint
npm run validate:cms-facts
npm run validate:domain
npm run validate:seo
npm run build
```

Run from `strapi-cms`:

```bash
npm run build
```

Required result: every command exits `0`.

## Gate 1: Server Baseline

On the BaoTa/VPS server, install and confirm:

```bash
docker --version
docker compose version
```

BaoTa should manage:

- `cms.example.com` site
- SSL certificate
- Nginx reverse proxy to `http://127.0.0.1:1337`
- firewall rules

Do not expose PostgreSQL to the public internet.

## Gate 2: Upload Code And Configure Env

Upload the repository or run `git pull` on the server.

Create the production env file:

```bash
cp deploy/production.env.example deploy/production.env
```

Edit `deploy/production.env` and replace placeholders:

- `PUBLIC_URL=https://cms.example.com`
- `STRAPI_ADMIN_BACKEND_URL=https://cms.example.com`
- `APP_KEYS`
- `API_TOKEN_SALT`
- `ADMIN_JWT_SECRET`
- `TRANSFER_TOKEN_SALT`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `POSTGRES_PASSWORD`
- `DATABASE_PASSWORD`
- `INTERNAL_CMS_FACTS_TOKEN`
- `INTERNAL_CMS_INQUIRY_TOKEN`
- `STRAPI_CORS_ORIGINS=https://preview.example.com,https://www.example.com`
- object storage credentials and public media base URL

Before starting, dry-check Compose:

```bash
STRAPI_ENV_FILE=./deploy/production.env docker compose --env-file deploy/production.env -f docker-compose.production.yml config
```

Required result: Compose renders without errors.

## Gate 3: Start CMS Stack

Start Strapi/PostgreSQL/backup:

```bash
docker compose --env-file deploy/production.env -f docker-compose.production.yml up -d --build
```

Check status:

```bash
docker compose --env-file deploy/production.env -f docker-compose.production.yml ps
docker compose --env-file deploy/production.env -f docker-compose.production.yml logs -f strapi
```

If the server is too small to build Strapi reliably, use the prebuilt-image
runtime file instead:

```bash
docker compose --env-file deploy/production.env -f docker-compose.runtime.yml pull
docker compose --env-file deploy/production.env -f docker-compose.runtime.yml up -d
docker compose --env-file deploy/production.env -f docker-compose.runtime.yml ps
```

If the Strapi image is stored in a private registry, log in to that registry on
the server before `pull`. If GHCR is unreachable from the server region, set
`STRAPI_IMAGE` to an Alibaba Cloud Container Registry image URL and keep the
same runtime compose commands.

Required result:

- `postgres` is healthy.
- `strapi` is healthy.
- `postgres-backup` is running.
- `https://cms.example.com/admin` loads.

## Gate 4: Configure BaoTa/Nginx

Use `deploy/baota-nginx-cms.example.conf` as the reverse proxy pattern.

Required checks:

```bash
curl -I https://cms.example.com/admin
curl -I https://cms.example.com/_health
```

Acceptable result:

- `/admin` returns `200` or a valid Strapi admin response.
- Nginx does not expose PostgreSQL.
- request body limit supports uploads up to the configured Strapi upload limit.

## Gate 5: Configure Vercel Preview

In Vercel, configure the preview deployment environment:

```env
NEXT_PUBLIC_SITE_ORIGIN=https://preview.example.com
CMS_SOURCE_MODE=cms-facts-api
CMS_FACTS_API_URL=https://cms.example.com/internal/cms/facts
CMS_FACTS_API_ALLOW_FETCH=true
CMS_FACTS_API_TOKEN=same-as-INTERNAL_CMS_FACTS_TOKEN
CMS_RESOURCES_API_URL=https://cms.example.com
CMS_STRAPI_API_VERSION=5
CMS_REVALIDATE_SECRET=replace-with-random-secret
CMS_PREVIEW_SECRET=replace-with-random-secret
STRAPI_INQUIRY_API_URL=https://cms.example.com/internal/cms/inquiries
STRAPI_INQUIRY_API_TOKEN=same-as-INTERNAL_CMS_INQUIRY_TOKEN
```

Do not enable GA4 or Search Console on pre-test unless there is a specific measurement need.

## Gate 6: Smoke Test

From a local machine or CI environment:

```bash
SMOKE_SITE_URL=https://preview.example.com \
SMOKE_CMS_URL=https://cms.example.com \
CMS_FACTS_API_URL=https://cms.example.com/internal/cms/facts \
CMS_FACTS_API_TOKEN=replace-with-token \
npm run check:production
```

Required result: all smoke checks pass.

## Gate 7: Small Real Data Trial

Before importing all real data:

1. Add or import 5-10 real products.
2. Upload at least one product image and one PDF/datasheet.
3. Publish records in Strapi.
4. Trigger revalidate.
5. Open the preview site and verify:
   - product list
   - product detail
   - images and PDFs
   - sitemap
   - robots
   - inquiry submission
   - Strapi inquiry record

Required result: no missing product facts, no broken media URLs, no inquiry loss.

## Gate 8: Pre-Test Exit Criteria

Pre-test is passed only when:

- Docker Compose stack is stable after restart.
- PostgreSQL backup file is generated.
- Strapi admin is reachable through HTTPS.
- Vercel preview reads protected CMS facts.
- Inquiry persists to Strapi.
- Object storage media loads through public URLs.
- `npm run check:production` passes against preview and CMS.
- Local release gates still pass after any required fixes.

After this, proceed to full real data import and main pre-launch testing.
