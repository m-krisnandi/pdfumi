#!/usr/bin/env bash
set -euo pipefail

# ========================================================
# Pdfumi Automated PostgreSQL Daily Backup Script
# Simpan di crontab VPS: 0 2 * * * /path/to/pdfumi/deploy/backup-db.sh
# ========================================================

BACKUP_DIR="${HOME}/pdfumi-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/pdfumi_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Memulai backup database Pdfumi..."

# Dump via docker compose
cd "$(dirname "$0")/.."
docker compose -f docker-compose.prod.yml exec -T postgres \
    pg_dump -U "${POSTGRES_USER:-pdfumi}" -d "${POSTGRES_DB:-pdfumi}" | gzip > "${BACKUP_FILE}"

echo "[$(date)] Backup sukses disimpan ke: ${BACKUP_FILE} (Ukuran: $(du -h "${BACKUP_FILE}" | cut -f1))"

# Hapus backup yang lebih tua dari RETENTION_DAYS
echo "[$(date)] Membersihkan backup lama (> ${RETENTION_DAYS} hari)..."
find "${BACKUP_DIR}" -type f -name "pdfumi_backup_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete

echo "[$(date)] Selesai."
