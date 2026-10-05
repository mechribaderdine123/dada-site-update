#!/bin/bash
# One-time server hardening for dada-site-update.
# Writes real secrets into .env and rotates the live Postgres role password.
# Secrets are read from files and never echoed to stdout.
set -euo pipefail

APP_DIR=/root/dada-site-update
cd "$APP_DIR"

PGPASS=$(cat /root/.pgpass.gen)
SESS=$(cat /root/.sess.gen)
ADMINPW=$(cat /root/.adminpw.gen)

# --- 1. Rotate the password of the existing Postgres role -------------------
# The db_data volume was initialised with the old placeholder password.
# Rewriting .env alone would NOT work: Postgres keeps the password hash in
# pg_authid, so the app would fail to authenticate. Change both sides.
if docker ps --format '{{.Names}}' | grep -qE '^dada-site-update-db-1$|^dada-db$'; then
  DBC=$(docker ps --format '{{.Names}}' | grep -E '^dada-site-update-db-1$|^dada-db$' | head -1)
  docker exec -i "$DBC" psql -U dadahiphop -d dadahiphop -v ON_ERROR_STOP=1 \
    <<SQL
ALTER ROLE dadahiphop WITH PASSWORD '$PGPASS';
SQL
  echo "postgres role password rotated"
else
  echo "WARNING: no running db container; role password left as-is"
fi

# --- 2. Write the real .env -------------------------------------------------
umask 077
cat > .env <<ENV
# Dada Hip Hop Academy — production configuration.
# Generated $(date -u '+%Y-%m-%d %H:%M UTC'). Real secrets; keep out of git.

# --- Database ---
POSTGRES_DB=dadahiphop
POSTGRES_USER=dadahiphop
POSTGRES_PASSWORD=$PGPASS
# Used by host-side tooling only. Inside compose the app gets DATABASE_URL
# built from the POSTGRES_* values above so it always points at db:5432.
DATABASE_URL=postgres://dadahiphop:$PGPASS@localhost:5432/dadahiphop
DB_POOL_MAX=10

# --- Sessions ---
SESSION_SECRET=$SESS
SESSION_DAYS=30

# --- Uploads ---
UPLOAD_DIR=/data/uploads
MAX_AUDIO_BYTES=78643200
MAX_IMAGE_BYTES=8388608

# --- First administrator ---
# Only used the very first time the account is created. To (re)set it later:
#   docker compose exec app node scripts/create-admin.mjs <email> <password>
ADMIN_EMAIL=admin@dadahiphop.com
ADMIN_PASSWORD=$ADMINPW

# --- Domain ---
DOMAIN=dadahiphop.com
ENV
chmod 600 .env
echo ".env written with real secrets"

# --- 3. Install the corrected compose file ---------------------------------
cp /tmp/new-compose.yml docker-compose.yml
echo "compose file installed"

# --- 4. Report only non-secret facts ---------------------------------------
docker compose config >/dev/null && echo "compose config: VALID"
grep -E '^(POSTGRES_DB|POSTGRES_USER|DOMAIN|ADMIN_EMAIL)=' .env
echo "secret lengths: POSTGRES_PASSWORD=$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2 | wc -c) SESSION_SECRET=$(grep '^SESSION_SECRET=' .env | cut -d= -f2 | wc -c) ADMIN_PASSWORD=$(grep '^ADMIN_PASSWORD=' .env | cut -d= -f2 | wc -c)"