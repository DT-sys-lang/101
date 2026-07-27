# Strapi Bulk Import Runbook

Use this runbook for small-batch and full-batch product imports after the CMS
stack is live.

## Import Shape

The supported operations workflow is:

```text
Excel workbook
-> export tabs as CSV files
-> convert CSV directory to CmsFactInput JSON
-> dry-run Strapi import
-> import into Strapi
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

## Local Conversion

Run from the repository root:

```bash
npm run import:cms-facts -- --dir docs/data-pipeline/examples/simple-csv --out outputs/cms-facts-batch.json
npm run validate:cms-facts -- --file outputs/cms-facts-batch.json
```

Required result: both commands exit `0`.

## Server Upload

Upload `outputs/cms-facts-batch.json` to the server repository, for example:

```text
/www/wwwroot/yufavor-site/outputs/cms-facts-batch.json
```

Do not commit real product batches unless the batch is intentionally part of
the repository.

## Server Import

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
