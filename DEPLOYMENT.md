# Automatic Hostinger deployment

Every push to the `main` branch deploys this site to a Hostinger VPS. The workflow pulls the new code, rebuilds the Docker image, and restarts the application.

## One-time server setup

1. Install Docker and the Docker Compose plugin on the VPS.
2. Clone this repository to a permanent server folder, for example `/opt/dada-hip-hop-academy`.
3. In that folder, create `.env` using `.env.example` and enter the real Supabase values. Never commit this file.
4. Run `docker compose up -d --build` once on the server.
5. Ensure the domain/reverse proxy forwards HTTPS traffic to port `3000`.

## One-time GitHub setup

In GitHub, open the repository, then **Settings → Secrets and variables → Actions → New repository secret**. Add:

| Secret | Value |
| --- | --- |
| `HOSTINGER_HOST` | Your VPS IP address or host name |
| `HOSTINGER_USER` | Your SSH user, usually `root` or your VPS user |
| `HOSTINGER_SSH_KEY` | The full private SSH key used to access the VPS |
| `HOSTINGER_PORT` | Usually `22` |
| `HOSTINGER_DEPLOY_PATH` | Full server path to this repository, e.g. `/opt/dada-hip-hop-academy` |

The SSH public key matching `HOSTINGER_SSH_KEY` must be in the server user's `~/.ssh/authorized_keys` file.

## Daily use

```bash
git add .
git commit -m "Update site"
git push origin main
```

Open the **Actions** tab on GitHub to see the deployment status. You can also run **Deploy to Hostinger** manually from that tab.
