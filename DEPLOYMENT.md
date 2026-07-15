# VPS deployment

This deployment runs Next.js, Spring Boot, MySQL, and Caddy with Docker Compose. Caddy terminates HTTPS and routes `/api/*` and `/oauth/*` to Spring Boot; all other traffic goes to Next.js.

## 1. VPS prerequisites

- Ubuntu VPS with ports 22, 80, and 443 open.
- A domain with an `A` record pointing to the VPS IPv4 address.
- Docker Engine with the Compose plugin.
- Git access to this repository.

## 2. First server setup

Clone the repository into a dedicated deployment directory, then create the production environment file:

```bash
git clone https://github.com/MohammedSalmande/myapp.git /opt/smart-task-manager
cd /opt/smart-task-manager
cp .env.production.example .env.production
chmod 600 .env.production
```

Replace every placeholder in `.env.production`. Generate secrets on the VPS, for example:

```bash
openssl rand -base64 48
```

Do not commit `.env.production`.

## 3. Google OAuth

Google login is disabled in the production image by default. The current backend callback is a development placeholder: it does not yet exchange Google's authorization code for tokens or verify the Google identity. Keep this setting disabled until the real OAuth callback is implemented:

```text
NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=false
```

After implementing and testing the complete flow, configure this exact authorized redirect URI in Google Cloud Console:

```text
https://YOUR_DOMAIN/oauth/google/callback
```

Set the same domain and Google credentials in `.env.production`, then explicitly change the feature flag to `true`.

## 4. First deployment

```bash
docker compose --env-file .env.production -f compose.production.yml config
docker compose --env-file .env.production -f compose.production.yml up -d --build
docker compose --env-file .env.production -f compose.production.yml ps
```

Caddy obtains and renews TLS certificates automatically after DNS points to the VPS and ports 80/443 are reachable.

## 5. GitHub environment

Create a GitHub Actions environment named `production` and add these secrets:

- `VPS_HOST`: VPS hostname or IP.
- `VPS_USER`: restricted deployment user.
- `VPS_SSH_KEY`: private key used only for deployment.
- `VPS_DEPLOY_PATH`: `/opt/smart-task-manager` or your chosen clone path.

The matching public SSH key must be in the deployment user's `~/.ssh/authorized_keys`. The deployment user needs permission to run Docker without `sudo`.

Pushes to `main` run frontend tests, backend tests, and container builds before deployment. Pull requests run validation only. Use GitHub environment protection if you want a manual approval before production deployment.

## 6. Operations

```bash
docker compose --env-file .env.production -f compose.production.yml ps
docker compose --env-file .env.production -f compose.production.yml logs -f --tail=200
docker compose --env-file .env.production -f compose.production.yml restart backend
```

Back up the `db_data` volume before database or schema changes. Never use `docker compose down -v` in production because it deletes persistent volumes.
