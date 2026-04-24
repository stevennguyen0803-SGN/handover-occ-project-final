# Staging Environment

Task 4.1 accepts the no-Docker local production-mode staging path.

- the root `npm start` process serves the Next.js frontend on port `3000`
- the same staging process starts the Express backend on port `4000`
- `prisma migrate deploy` runs automatically before either service starts

Docker/compose files remain available as optional deployment scaffolding, but they are not required for Phase 4 Task 4.1 acceptance.

## Primary No-Docker Path

Run a local production-mode sanity check:

```bash
npm run build
npm run verify:staging:local
```

This starts the same root `npm start` staging process, waits for the frontend session endpoint and backend `/health` route, then shuts the stack down again.

For human UAT, start the local staging app with `npm start` and use:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:4000/health`

## Optional Docker Bring-up

The compose stack is no longer a Task 4.1 gate, but it can still be used later on a Docker-capable host.

1. Copy `infrastructure/staging/.env.staging.example` to `infrastructure/staging/.env.staging`
2. Fill in the staging secrets and URL values
3. Run:

```bash
docker compose \
  --env-file infrastructure/staging/.env.staging \
  -f infrastructure/staging/docker-compose.staging.yml \
  up --build
```

The staging URL is whatever you set in `STAGING_URL`, typically `http://localhost:3000` for local validation.

## Optional GitHub Actions deployment

The staging workflow can perform Docker compose validation on `main` or manual dispatch when a Docker-capable runner is available. This is optional deployment evidence, not a Phase 4 Task 4.1 blocker.

The optional deploy step expects these repository secrets:

- `STAGING_SSH_HOST`
- `STAGING_SSH_USER`
- `STAGING_SSH_KEY`
- `STAGING_APP_PATH`
- `STAGING_SSH_PORT` (optional, defaults to `22`)

The remote staging host must already have:

- Docker Engine with Compose plugin
- this repository cloned at `STAGING_APP_PATH`
- an environment file at `infrastructure/staging/.env.staging`
