# Deploying to Hostinger

This app stores **everything in PostgreSQL** (accounts, profiles, tracks, feed
posts, page content) plus an uploads volume for media files. Both must be
created and preserved on the server.

## 0. Check your Hostinger plan first

Docker is required. **Hostinger Shared** and **Cloud** hosting cannot run
Docker or a database server. You need **Hostinger VPS** (or Business Cloud with
Docker enabled). If your existing server is shared hosting, this stack will not
run there — confirm before continuing.

## 1. One-time server setup

```bash
# on the Hostinger VPS
apt update && apt install -y docker.io docker-compose-plugin git
mkdir -p /root/dada-site-update
cd /root/dada-site-update
git clone <your-repo-url> .
```

Create the server's `.env` (never commit it — it is already gitignored):

```bash
cd /root/dada-site-update
cp .env.example .env          # if present, otherwise create it from the list below
openssl rand -hex 32          # use this for SESSION_SECRET
openssl rand -base64 24       # use this for POSTGRES_PASSWORD
```

Required keys:

| Key                 | Value                                                |
| ------------------- | ---------------------------------------------------- |
| `POSTGRES_DB`       | `dadahiphop`                                         |
| `POSTGRES_USER`     | `dadahiphop`                                         |
| `POSTGRES_PASSWORD` | **new random password** — do not reuse `change-me-…` |
| `SESSION_SECRET`    | **new random 32-byte hex**                           |
| `ADMIN_EMAIL`       | first admin login                                    |
| `ADMIN_PASSWORD`    | **new strong password**                              |
| `DOMAIN`            | your real domain                                     |
| `SITE_URL`          | `https://your-domain` — used to build the links inside outgoing e-mails |

### Outgoing e-mail (confirmation and password reset)

An artist account is only usable once they confirm their address, so a mail
transport must be configured. **Until one is set, `/sign-up` refuses to create
an account** rather than leaving somebody locked out of an address nobody can
prove they own.

Pick one transport; `RESEND_API_KEY` wins when both are present.

| Key                              | Used for                                              |
| -------------------------------- | ----------------------------------------------------- |
| `RESEND_API_KEY`                 | Resend HTTP API (3 000 e-mails/month free tier)        |
| `MAIL_FROM`                      | sender address, e.g. `Dada <no-reply@your-domain>`     |
| `SMTP_HOST` / `SMTP_PORT`        | SMTP instead of Resend, e.g. `mail.your-domain`, 587   |
| `SMTP_USER` / `SMTP_PASS`        | SMTP credentials (leave empty for an open relay)       |
| `SMTP_SECURE`                    | `true` for implicit TLS (port 465 is implied)          |

Production uses the Hostinger business mailbox `no-reply@dadahiphop.com` over
implicit TLS:

```bash
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-reply@dadahiphop.com
MAIL_FROM=Dada Hip Hop Academy <no-reply@dadahiphop.com>
```

```bash
docker compose up -d --force-recreate app   # picks up new .env values
```

With Resend, add and verify the sending domain first: until it is verified,
delivery silently fails for addresses that are not yours.

`DATABASE_URL` is **not** needed in `.env` for the container. `docker-compose.yml`
builds it from the `POSTGRES_*` values and points at `db:5432`. A `localhost`
host there would point at the app container itself and the app could never
reach the database.

## 2. First boot creates the schema

```bash
cd /root/dada-site-update
docker compose up -d --build
docker compose logs -f app      # look for "[db] applied migration 00N_…"
```

Migrations `001`–`005` are compiled into the image and applied automatically on
first connection, recorded in `schema_migrations`. Nothing to run by hand.

Verify:

```bash
docker compose exec db psql -U dadahiphop -d dadahiphop \
  -c "select id from schema_migrations order by id;"
```

`005_moderation` must be listed — it adds the track/post approval columns.

## 3. Move your existing data across

The live data lives in two places: the database and the uploads volume.
Copy **both**, or you will get an empty site / broken images and audio.

### 3a. Dump the database from your machine

```bash
docker exec dada-db pg_dump -U dadahiphop -d dadahiphop --clean --if-exists > dadahiphop.sql
```

### 3b. Restore it on the server

```bash
scp dadahiphop.sql root@<server>:/root/dada-site-update/
ssh root@<server>
cd /root/dada-site-update
docker compose cp dadahiphop.sql db:/tmp/dadahiphop.sql
docker compose exec db psql -U dadahiphop -d dadahiphop -f /tmp/dadahiphop.sql
```

> Restoring replaces the fresh tables. Do this **before** anyone uses the site,
> otherwise you will overwrite new rows.

> **Important:** the dump references the `dadahiphop` role by name. If the server
> uses a different `POSTGRES_USER`, the restore fails with
> `ERROR: role "dadahiphop" does not exist`. Keep `POSTGRES_USER=dadahiphop` on
> the server and change only its password.

### 3c. Copy the uploads volume

Locally the files are in `C:/data/uploads` (about 11 MB across `avatars`,
`covers`, `feed-images`, `music`, `site-images`). On the server they live in the
`uploads` named volume, which is mounted at `/data/uploads` **inside the app
container**. So copy the buckets straight into the app container — that writes
into the volume:

```bash
# from your machine: upload the folders first
scp -r "C:/data/uploads/avatars" "C:/data/uploads/covers" \
      "C:/data/uploads/feed-images" "C:/data/uploads/music" \
      "C:/data/uploads/site-images" root@<server>:/tmp/

# then on the server
cd /root/dada-site-update
for b in avatars covers feed-images music site-images; do
  docker compose cp "/tmp/$b" "app:/data/uploads/$b"
done

# confirm they landed in the volume
docker compose exec app ls /data/uploads
```

Copy into `app`, **not** `db` — the database container does not mount the
uploads volume.

### 3d. Re-point paths if needed

Rows store media as `<user-id>/<file>` (for example
`4595d0c6-…/feed-879c7df5….jpg`), which is relative to `UPLOAD_DIR`, so no SQL
rewrite is needed as long as the folder layout above is preserved.

### 3e. Image uploads are compressed automatically

Every image uploaded through `/api/storage/upload` is re-encoded as WebP before
it is written to disk (`src/server/storage/image-optimiser.server.ts`): photos
are capped at 1920 px, sponsor logos at 480 px. The response carries the stored
path, so `.png` uploads come back as `.webp` and the database stores that path.

Files that were uploaded before this existed can be converted in one pass. The
script rewrites the matching `site_content` / `sponsors` rows and copies every
original into `/data/uploads/_backup/site-images/` first:

```bash
docker compose cp scripts/optimize-site-images.mjs app:/app/scripts/
docker compose exec app node scripts/optimize-site-images.mjs --dry-run
docker compose exec app node scripts/optimize-site-images.mjs
```

`/media` is served with `immutable` caching, so the script never overwrites a
file in place: an already-compressed file is re-emitted as `<name>.min.webp` and
the row is repointed. Delete the backup folder once the new images look right.

## 4. Domain and TLS

The live server does **not** use the `nginx` / `certbot` services from
`docker-compose.yml` — it runs **Caddy** as the single edge, and Caddy already
owns ports 80 and 443. `server-docker-compose.yml` is the trimmed variant of
the compose file that ships on this host (app + db only); using the full file
there makes compose fail to start `nginx` because the ports are taken.

```bash
cd /root/dada-site-update
cp /path/to/server-docker-compose.yml docker-compose.yml
docker compose up -d --build
```

Caddy terminates TLS and proxies to the app. Its whole configuration is:

```caddyfile
dadahiphop.com, www.dadahiphop.com {
    reverse_proxy localhost:3000
}
```

Edit `/etc/caddy/Caddyfile` and `systemctl reload caddy` to change it. Caddy
obtains and renews the Let's Encrypt certificate itself, so `deploy/init-letsencrypt.sh`
and the `certbot` service are unnecessary on this host.

Only ports **80** and **443** should be open to the world. Compose binds the
app to `127.0.0.1:3000` and PostgreSQL to `127.0.0.1:5432`, so both are
loopback-only. Do not "simplify" those bindings to `0.0.0.0` — Docker's
published-port rules bypass `ufw`, so a `0.0.0.0:5432` binding exposes the
database to the internet regardless of the host firewall.

## 5. Updating later

Pushes to `main` redeploy automatically via `.github/workflows/deploy.yml`, which
SSHes into the VPS, runs `git pull --ff-only`, then `docker compose up -d --build`.

GitHub secrets required: `HOSTINGER_HOST`, `HOSTINGER_USER`,
`HOSTINGER_SSH_KEY`, `HOSTINGER_PORT`, `HOSTINGER_DEPLOY_PATH`.

Schema migrations run on boot, so new columns appear automatically after a
deploy. **Your data is never overwritten by a deploy** — the database and
uploads live in named volumes (`db_data`, `uploads`) that survive rebuilds.

## Troubleshooting

### The site returns 502 and `dada-app` is "unhealthy"

The single most likely cause is that the app and the database ended up on
**different Docker networks**, so the host name `db` does not resolve:

```
[api] server is not ready: Error: getaddrinfo EAI_AGAIN db
```

Diagnose it by comparing the two containers' networks — they must match:

```bash
docker inspect dada-app dada-db \
  --format '{{.Name}} {{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

If the names differ, the fix is in `docker-compose.yml`: give **every** service
an explicit `networks: [dada]` entry instead of relying on Compose's implicit
default network. Relying on the default is what allowed the two services to drift
apart in the first place. After correcting the file:

```bash
docker compose up -d --build
docker compose ps        # both must read (healthy)
```

Symptom to watch for: the app stays unhealthy and the site 502s, and no new
migrations are ever applied — `select id from schema_migrations order by id;`
should list all five (`001_init` … `005_moderation`).

### nginx fails to start with "address already in use"

Caddy already owns 80/443 on this host. Use `server-docker-compose.yml`, which
omits the `nginx` and `certbot` services.

### `/api/auth/sign-in` returns 401 with the right password

The seeder only sets a password when the account does **not** already exist, so
editing `ADMIN_PASSWORD` in `.env` does nothing for an existing account. Reset
it explicitly:

```bash
cd /root/dada-site-update
docker compose exec app node scripts/create-admin.mjs admin@dadahiphop.com 'new-password'
```

### Changing `POSTGRES_PASSWORD` in `.env` breaks the app

Postgres stores the password hash inside the data volume, so rewriting `.env`
alone makes the app fail to authenticate. Rotate both sides:

```bash
docker exec -i dada-db psql -U dadahiphop -d dadahiphop \
  -c "ALTER ROLE dadahiphop WITH PASSWORD '<new-password>';"
```

Keep `POSTGRES_USER=dadahiphop` as well: a `pg_dump` taken from the old server
hardcodes that role name and fails to restore under any other name.

### An artist says they never received the confirmation link

Check the app log first — a transport problem is logged there:

```bash
docker logs dada-app --tail 50 | grep -Ei "mail|auth"
```

Then confirm what the server actually did:

```bash
docker exec dada-db psql -U dadahiphop -d dadahiphop -c \
  "select u.email, t.purpose, t.created_at, t.expires_at, t.used_at
     from auth_tokens t join users u on u.id = t.user_id
    order by t.created_at desc limit 10;"
```

A row with `used_at` still null means the link was issued but never opened; the
artist can ask for a new one from the sign-in page, which invalidates the
previous link. No rows at all means the e-mail was never issued — check that the
mail transport from §1 is configured in the container's environment.

### An artist cannot sign in and the page says the address is not confirmed

The account exists but `users.email_verified_at` is null. To confirm it by hand
(after checking with the artist by another channel):

```bash
docker exec dada-db psql -U dadahiphop -d dadahiphop -c \
  "update users set email_verified_at = now() where email = 'artist@example.com';"
```

## Local development note

Locally you run `npm run dev` on the host and it connects to the container via
`DATABASE_URL` with `localhost:5432` in `.env`. That is why the Postgres port is
published to `127.0.0.1`. Inside Docker Compose the app uses `db:5432`.
