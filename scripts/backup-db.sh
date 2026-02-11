#!/usr/bin/env bash
set -euo pipefail

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

docker compose -f docker/docker-compose.yml exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-novel}" "${POSTGRES_DB:-novel_ide_web}" > "$BACKUP_DIR/novel_ide_web_$DATE.sql"

gzip "$BACKUP_DIR/novel_ide_web_$DATE.sql"

echo "Backup created at $BACKUP_DIR/novel_ide_web_$DATE.sql.gz"