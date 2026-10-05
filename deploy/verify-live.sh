#!/bin/bash
# End-to-end verification against the live site, run on the server itself so
# the admin password never leaves the box or appears in a transcript.
set -uo pipefail
cd /root/dada-site-update

EMAIL=$(grep '^ADMIN_EMAIL=' .env | cut -d= -f2-)
PW=$(grep '^ADMIN_PASSWORD=' .env | cut -d= -f2-)
BASE=https://dadahiphop.com

JAR=$(mktemp)
BODY=$(printf '{"email":"%s","password":"%s"}' "$EMAIL" "$PW")

echo "=== POST /api/auth/sign-in ==="
CODE=$(curl -s -o /tmp/signin.out -w '%{http_code}' -c "$JAR" \
  -H 'Content-Type: application/json' \
  -H "Origin: $BASE" \
  --data "$BODY" "$BASE/api/auth/sign-in" --max-time 25)
echo "HTTP $CODE"
echo "body: $(head -c 300 /tmp/signin.out)"

echo
echo "=== cookie set? ==="
grep -c . "$JAR" >/dev/null && awk '!/^#/ && NF {print "cookie name:", $6}' "$JAR"

echo
echo "=== GET /api/auth/session with that cookie ==="
curl -s -b "$JAR" "$BASE/api/auth/session" --max-time 25 | head -c 400
echo

echo
echo "=== authenticated admin page ==="
curl -s -o /dev/null -w 'GET /admin -> %{http_code}\n' -b "$JAR" "$BASE/admin" --max-time 25

rm -f "$JAR" /tmp/signin.out