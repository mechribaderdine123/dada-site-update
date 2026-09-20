#!/bin/sh
# One-time HTTPS bootstrap for Dada Hip Hop Academy.
#
# Requests a Let's Encrypt certificate for $DOMAIN using the certbot container
# and then reloads Nginx. Run it on the VPS, from the repository root:
#
#   sh deploy/init-letsencrypt.sh
#
# Set STAGING=1 to test against the Let's Encrypt staging server first.

set -eu

cd "$(dirname "$0")/.."

if [ -f .env ]; then
  # shellcheck disable=SC1091
  . ./.env
fi

: "${DOMAIN:?Set DOMAIN in .env before running this script}"
EMAIL="${EMAIL:-admin@$DOMAIN}"
STAGING="${STAGING:-0}"

CONF_DIR="./deploy/certbot/conf"
WWW_DIR="./deploy/certbot/www"
LIVE_DIR="$CONF_DIR/live/$DOMAIN"

mkdir -p "$CONF_DIR" "$WWW_DIR" "$LIVE_DIR"

echo "==> Creating a temporary self-signed certificate so Nginx can start"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "$LIVE_DIR/privkey.pem" \
  -out "$LIVE_DIR/fullchain.pem" \
  -subj "/CN=$DOMAIN" >/dev/null 2>&1

echo "==> Starting Nginx"
docker compose up -d nginx

echo "==> Removing the temporary certificate"
rm -rf "$LIVE_DIR"

STAGING_FLAG=""
if [ "$STAGING" != "0" ]; then
  STAGING_FLAG="--staging"
fi

echo "==> Requesting a certificate for $DOMAIN"
docker compose run --rm --entrypoint certbot certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  $STAGING_FLAG

echo "==> Reloading Nginx"
docker compose exec nginx nginx -s reload

echo
echo "HTTPS is ready. The certbot service renews the certificate automatically."
