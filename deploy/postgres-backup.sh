#!/bin/sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

run_backup() {
  mkdir -p "$BACKUP_DIR"

  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  backup_file="$BACKUP_DIR/${POSTGRES_DB}_${timestamp}.dump"

  export PGPASSWORD="$POSTGRES_PASSWORD"
  pg_dump \
    --host="$POSTGRES_HOST" \
    --port="$POSTGRES_PORT" \
    --username="$POSTGRES_USER" \
    --dbname="$POSTGRES_DB" \
    --format=custom \
    --file="$backup_file"

  find "$BACKUP_DIR" -type f -name "${POSTGRES_DB}_*.dump" -mtime "+$BACKUP_RETENTION_DAYS" -delete
  echo "Created backup: $backup_file"
}

if [ "${1:-loop}" = "once" ]; then
  run_backup
  exit 0
fi

while true; do
  run_backup
  sleep "$BACKUP_INTERVAL_SECONDS"
done
