# Strapi Bulk Import Runbook

Use this runbook for small-batch and full-batch product imports after the CMS
stack is live.

## Import Shape

The supported operations workflow is:

```text
Excel workbook
-> upload .xlsx to CMS import page
-> dry-run from the CMS import page
-> import from the CMS import page
-> run frontend diagnostics
```

For new product onboarding, use the simplified CSV contract:

- `categories.csv`
- `products.csv`
- `product_specs.csv`
- `product_assets.csv`

The example directory is:

```text
docs/data-pipeline/examples/simple-csv
```

## Local Conversion Fallback

Use local conversion only when you want to inspect or archive the generated JSON
before upload.

Run from the repository root:

```bash
npm run import:cms-facts -- --dir docs/data-pipeline/examples/simple-csv --out outputs/cms-facts-batch.json
npm run validate:cms-facts -- --file outputs/cms-facts-batch.json
```

Required result: both commands exit `0`.

## Recommended CMS Import

The easiest import path is the protected CMS import page:

```text
https://cms.yufavor.com/internal/cms/import
```

Before using it, add this value to the Strapi server environment and recreate
the `strapi` container:

```text
INTERNAL_CMS_IMPORT_TOKEN=<random-hex-token>
```

Open the import page, paste the token, choose a simplified `.xlsx` workbook,
and keep `Dry-run only` checked. The workbook must contain these sheets:

- `categories`
- `products`
- `product_specs`
- `product_assets` optional

Legacy `.xls` files are not supported; save the workbook as `.xlsx` first.
Required dry-run result:

```json
{
  "ok": true,
  "dryRun": true
}
```

Only after dry-run succeeds, uncheck `Dry-run only` and run the import.

JSON upload remains available as a fallback if you already generated
`outputs/cms-facts-batch.json`.

## Server Upload Fallback

Upload `outputs/cms-facts-batch.json` to the server repository, for example:

```text
/www/wwwroot/yufavor-site/outputs/cms-facts-batch.json
```

Do not commit real product batches unless the batch is intentionally part of
the repository.

## Server Import Fallback

Pull the latest image first, because the import command lives inside the Strapi
runtime image:

```bash
cd /www/wwwroot/yufavor-site
sudo git pull origin main
sudo docker compose --env-file deploy/production.env -f docker-compose.runtime.yml pull strapi
sudo docker compose --env-file deploy/production.env -f docker-compose.runtime.yml up -d strapi
```

Copy the JSON file into the running Strapi container:

```bash
sudo docker cp outputs/cms-facts-batch.json yufavor-strapi:/tmp/cms-facts-batch.json
```

Run a dry-run first:

```bash
sudo docker compose --env-file deploy/production.env -f docker-compose.runtime.yml exec strapi npm run import:cms-facts -- --file /tmp/cms-facts-batch.json --dry-run
```

If dry-run returns `"ok": true`, run the import:

```bash
sudo docker compose --env-file deploy/production.env -f docker-compose.runtime.yml exec strapi npm run import:cms-facts -- --file /tmp/cms-facts-batch.json
```

## Verification

After import, open the protected diagnostics endpoint:

```text
https://global.yufavor.com/api/cms/diagnostics?secret=<CMS_PREVIEW_SECRET>
```

Required result:

```json
{
  "ok": true
}
```

Then check:

```text
https://global.yufavor.com/api/cms/status
```

Required result:

```text
activeMode: cms-facts-api
productCount: expected imported product count
```

If status still shows an older product count, redeploy Vercel to clear the
server-side product snapshot.

## Rules

- Import 5-10 products first before importing the full catalog.
- Keep exactly one root category.
- Use stable IDs: `cat_...`, `prd_...`, `doc_...`, `asset_...`.
- Sensor products must include measurement, output, connection, and temperature
  facts through `product_specs.csv`.
- Valve products must include valve profile facts through `product_specs.csv`.
- Keep PostgreSQL backup enabled before importing real data.
