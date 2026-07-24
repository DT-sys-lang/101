# Docker Production Deployment

This deployment keeps the Next.js official site on Vercel and runs only the Strapi CMS stack on the BaoTa/VPS server.

## Files

- `../strapi-cms/Dockerfile` builds the production Strapi image.
- `../docker-compose.production.yml` runs Strapi, PostgreSQL, and a daily PostgreSQL backup service.
- `../docker-compose.runtime.yml` runs the same stack from prebuilt images and does not build on the server.
- `production.env.example` is the production environment template.
- `postgres-backup.sh` creates daily `pg_dump --format=custom` backups.
- `baota-nginx-cms.example.conf` is the BaoTa/Nginx reverse proxy snippet for `cms.example.com`.

## First Deploy

On the server:

```bash
cp deploy/production.env.example deploy/production.env
```

Edit `deploy/production.env` and replace every placeholder. Keep these values aligned with Vercel:

- `PUBLIC_URL`
- `INTERNAL_CMS_FACTS_TOKEN`
- `INTERNAL_CMS_INQUIRY_TOKEN`
- `STRAPI_CORS_ORIGINS`
- object storage values

Start the stack from source on a build-capable server:

```bash
docker compose --env-file deploy/production.env -f docker-compose.production.yml up -d --build
```

On a low-memory BaoTa/VPS server, prefer the runtime compose file after the
Strapi image has been built and pushed by CI:

```bash
docker compose --env-file deploy/production.env -f docker-compose.runtime.yml pull
docker compose --env-file deploy/production.env -f docker-compose.runtime.yml up -d
```

The default runtime image is:

```text
ghcr.io/dt-sys-lang/101-strapi-cms:main
```

If the GitHub package is private, log in on the server before pulling:

```bash
echo '<github-token-with-read-packages>' | docker login ghcr.io -u '<github-user>' --password-stdin
```

If GHCR is slow or blocked from the server region, publish the same image to
Alibaba Cloud Container Registry and set `STRAPI_IMAGE` in `deploy/production.env`
to that registry URL.

Dry-check the Compose file before the real env file exists:

```bash
STRAPI_ENV_FILE=./deploy/production.env.example docker compose --env-file deploy/production.env.example -f docker-compose.production.yml config
STRAPI_ENV_FILE=./deploy/production.env.example docker compose --env-file deploy/production.env.example -f docker-compose.runtime.yml config
```

Check status:

```bash
docker compose --env-file deploy/production.env -f docker-compose.production.yml ps
docker compose --env-file deploy/production.env -f docker-compose.production.yml logs -f strapi
```

For runtime deployments, replace `docker-compose.production.yml` with
`docker-compose.runtime.yml` in the commands above.

BaoTa should proxy `https://cms.example.com` to `http://127.0.0.1:1337`.

## Updates

After uploading new code or running `git pull`:

```bash
docker compose --env-file deploy/production.env -f docker-compose.production.yml up -d --build
```

After CI publishes a new runtime image:

```bash
docker compose --env-file deploy/production.env -f docker-compose.runtime.yml pull strapi
docker compose --env-file deploy/production.env -f docker-compose.runtime.yml up -d
```

## Backups

The `postgres-backup` service writes daily backups to the `strapi-postgres-backups` Docker volume.

Run a manual backup:

```bash
docker compose --env-file deploy/production.env -f docker-compose.production.yml exec postgres-backup /usr/local/bin/postgres-backup.sh once
```

List backup files:

```bash
docker compose --env-file deploy/production.env -f docker-compose.production.yml exec postgres-backup ls -lh /backups
```

For production, also sync these backup files to object storage or download them regularly from the server.

## Important

- Do not expose PostgreSQL to the public internet.
- Do not commit `deploy/production.env`.
- Do not run `docker compose down -v` unless you intentionally want to delete database and backup volumes.
- Keep product media in object storage, not only in `public/uploads`.
