#!/usr/bin/env bash
#
# backup.sh — nightly MySQL dump for BrightBuy.          OWNER: Slice A
#
# Installed by the deploy pipeline to /opt/brightbuy/backup.sh and run by
# cron. Writes a gzipped dump to /opt/brightbuy/backups/ and deletes ones
# older than KEEP_DAYS.
#
#   Install the cron entry once, on the VM:
#     (crontab -l 2>/dev/null; echo "0 2 * * * /opt/brightbuy/backup.sh >> /opt/brightbuy/backups/backup.log 2>&1") | crontab -
#
#   Run it by hand any time (do this before a risky migration):
#     /opt/brightbuy/backup.sh
#
# ── WHY --routines AND --triggers ───────────────────────────────────
# Almost all of BrightBuy's behaviour lives in stored procedures and
# triggers: sp_place_order holds the transaction, and triggers guard
# stock. mysqldump does NOT include either by default. A dump taken
# without these flags restores a database that looks complete, has every
# row, and cannot place an order. That is the worst kind of backup —
# one that fails only when you need it.
#
# --single-transaction takes the dump inside one consistent InnoDB read
# view, so the site keeps serving while it runs and the dump is still a
# single point in time.

set -euo pipefail

APP_DIR="/opt/brightbuy"
COMPOSE="docker compose -f ${APP_DIR}/docker-compose.prod.yml"
OUT_DIR="${APP_DIR}/backups"
KEEP_DAYS=14

cd "$APP_DIR"
mkdir -p "$OUT_DIR"

STAMP="$(date +%F_%H%M)"
TARGET="${OUT_DIR}/brightbuy-${STAMP}.sql.gz"

echo "[$(date -Is)] starting backup -> ${TARGET}"

# The password is read inside the container from its own environment, so
# it never appears in this script, in the process list, or in cron's mail.
$COMPOSE exec -T mysql sh -c '
  exec mysqldump \
    -u root -p"$MYSQL_ROOT_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --default-character-set=utf8mb4 \
    "$MYSQL_DATABASE"
' | gzip > "$TARGET"

# set -o pipefail means a failed mysqldump has already aborted us, but a
# zero-byte or absurdly small file still means something went wrong.
SIZE=$(stat -c%s "$TARGET")
if [ "$SIZE" -lt 10240 ]; then
  echo "[$(date -Is)] FAILED: ${TARGET} is only ${SIZE} bytes" >&2
  rm -f "$TARGET"
  exit 1
fi

echo "[$(date -Is)] wrote ${TARGET} ($(numfmt --to=iec "$SIZE"))"

# Retention. -mtime +N is "older than N days".
DELETED=$(find "$OUT_DIR" -name 'brightbuy-*.sql.gz' -mtime "+${KEEP_DAYS}" -print -delete | wc -l)
echo "[$(date -Is)] pruned ${DELETED} dump(s) older than ${KEEP_DAYS} days"

echo "[$(date -Is)] done. Current dumps:"
ls -lh "$OUT_DIR"/brightbuy-*.sql.gz 2>/dev/null | tail -5 || echo "  (none)"
