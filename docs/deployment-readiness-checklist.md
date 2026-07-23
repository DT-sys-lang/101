# Deployment Readiness Checklist

This checklist covers the current production target: Next.js frontend, Strapi 4.25.20, PostgreSQL, Railway for Strapi/PostgreSQL, and GitHub as the source repository.

## Source Control Rules

These files and directories must not be committed:

- `.env.local`
- `strapi-cms/.env`
- `node_modules/`
- `strapi-cms/node_modules/`
- `.next/`
- `strapi-cms/dist/`
- `strapi-cms/.strapi/`
- `*.log`
- `*.tsbuildinfo`
- `.runtime/`

These files are safe and expected to commit:

- `.env.example`
- `strapi-cms/.env.example`
- `docs/deployment-readiness-checklist.md`
- `public/assets/products/**`
- `outputs/cms-facts.json`, only when the frontend uses the static JSON fallback

`public/assets/products/**` must be committed before deployment because product records reference images under `/assets/products/...`.

## Railway PostgreSQL

1. Create a PostgreSQL service in the same Railway project as Strapi.
2. Bind the PostgreSQL service variables to the Strapi service.
3. Prefer `DATABASE_URL` from the Railway PostgreSQL service binding.
4. Keep `DATABASE_SSL=true` for Railway production connections.
5. Use `DATABASE_SSL_REJECT_UNAUTHORIZED=false` unless Railway provides a trusted CA configuration for this service.

Required PostgreSQL/Strapi database variables:

```env
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_SCHEMA=public
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
```

The expanded host/user/password variables can also be provided for local compatibility:

```env
DATABASE_HOST=HOST
DATABASE_PORT=5432
DATABASE_NAME=DATABASE
DATABASE_USERNAME=USER
DATABASE_PASSWORD=PASSWORD
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_CONNECTION_TIMEOUT_MS=60000
```

## Railway Strapi Service

Set the Railway service root directory to:

```text
strapi-cms
```

Set the Node version to 20. The repository already contains:

```text
strapi-cms/.node-version
```

The Strapi package also declares:

```json
{
  "engines": {
    "node": ">=18 <=20"
  }
}
```

Required Strapi runtime variables:

```env
NODE_ENV=production
HOST=0.0.0.0
PUBLIC_URL=https://your-strapi-service.up.railway.app
APP_KEYS=replace-with-random-key-1,replace-with-random-key-2,replace-with-random-key-3,replace-with-random-key-4
API_TOKEN_SALT=replace-with-random-api-token-salt
ADMIN_JWT_SECRET=replace-with-random-admin-jwt-secret
TRANSFER_TOKEN_SALT=replace-with-random-transfer-token-salt
JWT_SECRET=replace-with-random-jwt-secret
ENCRYPTION_KEY=replace-with-random-encryption-key
STRAPI_REST_PREFIX=/internal/cms
INTERNAL_CMS_FACTS_TOKEN=replace-with-shared-internal-cms-facts-token
STRAPI_TELEMETRY_DISABLED=true
```

`PORT` is normally provided by Railway. Do not hard-code a public port unless Railway requires it for this service.

`INTERNAL_CMS_FACTS_TOKEN` protects the Strapi facts endpoint. It must be a strong random value and must match the frontend `CMS_FACTS_API_TOKEN` exactly.

The Strapi facts endpoint is:

```text
https://your-strapi-service.up.railway.app/internal/cms/facts
```

It must be accessed with:

```http
Authorization: Bearer replace-with-shared-internal-cms-facts-token
```

## Frontend Environment

Choose one production source mode.

Live Strapi API mode:

```env
CMS_SOURCE_MODE=cms-facts-api
CMS_FACTS_API_URL=https://your-strapi-service.up.railway.app/internal/cms/facts
CMS_FACTS_API_ALLOW_FETCH=true
CMS_FACTS_API_TOKEN=replace-with-shared-internal-cms-facts-token
CMS_FACTS_API_TIMEOUT_MS=5000
CMS_REVALIDATE_SECRET=replace-with-random-revalidate-secret
CMS_PREVIEW_SECRET=replace-with-random-preview-secret
```

The frontend `CMS_FACTS_API_TOKEN` must equal the Strapi `INTERNAL_CMS_FACTS_TOKEN`.

Editorial resources API mode for blog, case, and manual content:

```env
CMS_RESOURCES_API_URL=https://your-strapi-service.up.railway.app
CMS_RESOURCES_API_TOKEN=replace-with-optional-strapi-content-api-token
CMS_RESOURCES_API_TIMEOUT_MS=5000
```

`CMS_RESOURCES_API_URL` points to the Strapi content API origin or REST root. It can be the Strapi origin, `/internal/cms`, or `/api`; this project defaults an origin-only value to `/internal/cms` to match `STRAPI_REST_PREFIX`. Set `CMS_RESOURCES_API_TOKEN` only if the Strapi content API requires authorization for `blog-posts`, `case-studies`, or `product-manuals`.

Static JSON fallback mode:

```env
CMS_SOURCE_MODE=env-facts-json
CMS_FACTS_JSON_FILE=cms-facts.json
```

The application resolves `CMS_FACTS_JSON_FILE` by basename under `outputs/`, so `CMS_FACTS_JSON_FILE=cms-facts.json` reads `outputs/cms-facts.json`. Commit `outputs/cms-facts.json` when this mode is used.

Do not use `mock-domain` for production unless intentionally running a demo with fixture data.

## Pre-Deploy Build Checks

Run these commands from a clean working tree before deployment:

```powershell
Set-Location -LiteralPath "<project-root>"
npm run build

Set-Location -LiteralPath "<project-root>\strapi-cms"
npm run build
```

Equivalent `cmd.exe` form:

```cmd
cd /d "<project-root>"
npm run build

cd /d "<project-root>\strapi-cms"
npm run build
```

The Strapi build should run with Node 20 in CI/Railway. If the local machine uses Node 24, treat local success as useful but not a substitute for Railway Node 20 validation.

## Post-Deploy Smoke Tests

Replace domains and secrets with production values.

1. Frontend CMS status should not be mock:

```powershell
Invoke-RestMethod "https://your-frontend-domain/api/cms/status"
```

Expected: `activeMode` is not `mock-domain`. For live Strapi, it should be `cms-facts-api`; for static fallback, it should be `env-facts-json`.

2. Product feed should contain 10 products:

```powershell
Invoke-RestMethod "https://your-frontend-domain/api/product-feed"
```

Expected: product count is `10`.

3. Product listing should be accessible:

```text
https://your-frontend-domain/zh/products
```

4. One sensor detail page should be accessible:

```text
https://your-frontend-domain/zh/products/<sensor-product-path>
```

Use a known sensor product from the feed, such as a `YF-P*` product.

5. One valve detail page should be accessible:

```text
https://your-frontend-domain/zh/products/<valve-product-path>
```

Use a known valve product from the feed, such as a `YF-F*` product.

6. Strapi facts endpoint should be accessible with the Bearer token:

```powershell
Invoke-RestMethod `
  -Headers @{ Authorization = "Bearer replace-with-shared-internal-cms-facts-token" } `
  "https://your-strapi-service.up.railway.app/internal/cms/facts"
```

Expected: response is direct CMS facts JSON, not a Strapi `{ data, meta }` envelope.

## Go/No-Go Criteria

Go when all are true:

- Frontend build passes.
- Strapi build passes on Node 20.
- Railway PostgreSQL is created and bound to Strapi.
- Strapi root directory is `strapi-cms`.
- `NODE_ENV=production` is set for Strapi.
- Strapi secrets are unique production values, not example placeholders.
- `ENCRYPTION_KEY` is injected from the secret manager so protected admin users can recover API-token keys.
- `INTERNAL_CMS_FACTS_TOKEN` and frontend `CMS_FACTS_API_TOKEN` match.
- The frontend source mode is intentionally selected.
- `CMS_RESOURCES_API_URL` is set if blog, case, or manual pages should read Strapi editorial content.
- `public/assets/products/**` is committed.
- `outputs/cms-facts.json` is committed if static JSON fallback is used.
- `.env.local` and `strapi-cms/.env` are not tracked.
- Post-deploy smoke tests pass.
