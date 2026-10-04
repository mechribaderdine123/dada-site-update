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
mkdir -p /opt/dada-hip-hop-academy
cd /opt/dada-hip-hop-academy
git clone <your-repo-url> .
```

Create the server's `.env` (never commit it — it is already gitignored):

```bash
cd /opt/dada-hip-hop-academy
cp .env.example .env          # if present, otherwise create it from the list below
openssl rand -hex 32          # use this for SESSION_SECRET
openssl rand -base64 24       # use this for POSTGRES_PASSWORD
```

Required keys:

| Key | Value |
| --- | --- |
| `POSTGRES_DB` | `dadahiphop` |
| `POSTGRES_USER` | `dadahiphop` |
| `POSTGRES_PASSWORD` | **new random password** — do not reuse `change-me-…` |
| `SESSION_SECRET` | **new random 32-byte hex** |
| `ADMIN_EMAIL` | first admin login |
| `ADMIN_PASSWORD` | **new strong password** |
| `DOMAIN` | your real domain |

`DATABASE_URL` is **not** needed in `.env` for the container. `docker-compose.yml`
builds it from the `POSTGRES_*` values and points at `db:5432`. A `localhost`
host there would point at the app container itself and the app could never
reach the database.

## 2. First boot creates the schema

```bash
cd /opt/dada-hip-hop-academy
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
scp dadahiphop.sql root@<server>:/opt/dada-hip-hop-academy/
ssh root@<server>
cd /opt/dada-hip-hop-academy
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
cd /opt/dada-hip-hop-academy
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

## 4. Domain and TLS

```bash
cd /opt/dada-hip-hop-academy
bash deploy/init-letsencrypt.sh          # once, after DNS points at the server
docker compose up -d
```

Only ports **80** and **443** should be open. Port **3000** is published by
compose for convenience — you may restrict or drop it. PostgreSQL is bound to
`127.0.0.1` only and must never be exposed publicly.

## 5. Updating later

Pushes to `main` redeploy automatically via `.github/workflows/deploy.yml`, which
SSHes into the VPS, runs `git pull --ff-only`, then `docker compose up -d --build`.

GitHub secrets required: `HOSTINGER_HOST`, `HOSTINGER_USER`,
`HOSTINGER_SSH_KEY`, `HOSTINGER_PORT`, `HOSTINGER_DEPLOY_PATH`.

Schema migrations run on boot, so new columns appear automatically after a
deploy. **Your data is never overwritten by a deploy** — the database and
uploads live in named volumes (`db_data`, `uploads`) that survive rebuilds.

## Local development note

Locally you run `npm run dev` on the host and it connects to the container via
`DATABASE_URL` with `localhost:5432` in `.env`. That is why the Postgres port is
published to `127.0.0.1`. Inside Docker Compose the app uses `db:5432`.
