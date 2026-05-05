# OCC Handover System — Backend

Backend API for the **Operations Control Centre (OCC) Handover System**: a REST service for shift-handover management, replacing spreadsheets, emails, and verbal updates with a structured digital workflow with full audit trail.

> **Repo scope.** This repository currently contains the production-leaning backend, the database schema, design documentation, and design-stub React components. There is no runnable frontend in this repo yet; the backend is consumed by an external Next.js client (or any client that signs requests with the `X-OCC-AUTH-*` headers — see [Auth](#auth) below).

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Language | TypeScript 5 (strict) |
| API | Express 5 |
| Database | PostgreSQL 15 via Prisma ORM 6 |
| Validation | Zod 4 |
| Testing | Vitest 4 |
| Export | csv-stringify |

## Repository layout

```
.
├── backend/                # Express + Prisma backend (the runnable service)
│   ├── src/                # Source code
│   ├── package.json
│   └── tsconfig.json
├── database/prisma/        # Prisma schema, migrations, seed scripts
├── tests/
│   ├── unit/               # Vitest unit tests (run in CI)
│   └── smoke/              # End-to-end smoke tests (require live DB + backend)
├── docs/                   # UAT scenarios, pilot assessment, performance notes
├── shared/                 # Canonical design docs (DATA_MODEL, API_SPEC, BUSINESS_RULES, …)
├── frontend-stubs/         # Reference React/Tailwind components for a future frontend
├── memory-bank/, phases/, PLAN.md, AGENTS.md, CLAUDE.md
│                           # AI-agent process documentation (not production code)
├── scripts/                # npm helper scripts
├── package.json            # Root scripts (dev/build/test/db:*)
├── tsconfig.json           # TS config for root tests
├── vitest.config.mts       # Unit-test runner config
└── vitest.smoke.config.mts # Smoke-test runner config
```

## Quick start

### 1. Prerequisites

- Node.js 20+
- PostgreSQL 15 (local or hosted, e.g. Supabase)

### 2. Install dependencies

```bash
npm ci
npm --prefix backend ci
```

### 3. Configure environment

Copy the example file and fill in your values:

```bash
cp .env.example .env
# Edit .env: DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | Pooled Postgres connection string used by the app at runtime. |
| `DIRECT_URL` | yes | Direct (non-pooled) connection used by Prisma migrations. |
| `NEXTAUTH_SECRET` | yes | HMAC secret used to validate signed `X-OCC-AUTH-*` request headers. Generate with `openssl rand -base64 32`. |
| `DATABASE_CONNECTION_LIMIT` | no | Optional Prisma `connection_limit` override. |
| `DATABASE_POOL_TIMEOUT` | no | Optional Prisma `pool_timeout` override. |
| `PORT` | no | Backend listen port (default `4000`). |

### 4. Set up the database

```bash
npm run db:generate         # Generate Prisma client
npm run db:migrate:deploy   # Apply migrations
npm run db:seed             # Seed baseline users + reference data
# Optional: npm run db:seed:uat for the UAT dataset
```

### 5. Run the backend

```bash
npm run dev      # tsx watch mode
# or
npm run build && npm start
```

The server listens on `http://localhost:4000` by default. Health check: `GET /health`.

## Auth

The backend does **not** issue sessions. It expects every request to carry signed identity headers minted by an upstream client (the planned Next.js frontend uses NextAuth.js v5 to mint these):

| Header | Value |
|---|---|
| `X-OCC-Auth-User-Id` | User ID |
| `X-OCC-Auth-User-Name` | User display name |
| `X-OCC-Auth-User-Email` | User email |
| `X-OCC-Auth-User-Role` | One of `OCC_STAFF`, `SUPERVISOR`, `MANAGEMENT_VIEWER`, `ADMIN` |
| `X-OCC-Auth-Timestamp` | Millisecond Unix timestamp (must be within ±5 minutes) |
| `X-OCC-Auth-Signature` | `base64url(HMAC-SHA256(NEXTAUTH_SECRET, "{id}:{name}:{email}:{role}:{timestamp}"))` |

Use `createBackendAuthHeaders(user)` from `backend/src/lib/auth-bridge.ts` to mint these headers in your client/tests.

Without valid headers, all `/api/v1/*` endpoints return `401`.

## Common scripts

| Command | Description |
|---|---|
| `npm run dev` | Start backend in watch mode (tsx) |
| `npm run build` | Compile backend to `backend/dist/` |
| `npm start` | Run the compiled server |
| `npm test` | Run unit tests (root + backend) |
| `npm run test:smoke` | Run end-to-end smoke tests (requires live backend + DB) |
| `npm run test:coverage` | Run tests with coverage |
| `npm run typecheck` | Type-check backend without emitting JS |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Run `prisma migrate dev` |
| `npm run db:migrate:deploy` | Run `prisma migrate deploy` (production) |
| `npm run db:seed` | Run baseline seed |
| `npm run db:seed:uat` | Run UAT seed |
| `npm run db:studio` | Open Prisma Studio |

## API surface

Implemented endpoints (see [`shared/API_SPEC.md`](shared/API_SPEC.md) for the canonical contract):

- `GET /health`
- `GET /api/v1/dashboard/today`
- `GET /api/v1/dashboard/trends`
- `GET /api/v1/dashboard/categories`
- `GET /api/v1/handovers`
- `GET /api/v1/handovers/:id`
- `POST /api/v1/handovers`
- `PUT /api/v1/handovers/:id`
- `POST /api/v1/handovers/:id/acknowledge`
- `POST /api/v1/handovers/:id/carry-forward`
- `GET /api/v1/handovers/:id/export.csv`
- `GET /api/v1/handovers/:id/export.pdf`
- Per-category item CRUD under `/api/v1/handovers/:id/items/:category` for the seven categories (aircraft, airport, flightSchedule, crew, weather, system, abnormalEvents).

Every mutation writes an `auditLog` row.

## Testing

```bash
npm test                # unit tests
npm run test:smoke      # smoke tests (requires running backend + seeded DB)
```

CI runs `npm test` and `npm run build` on every PR (see `.github/workflows/ci.yml`).

## Documentation

- **[`shared/DATA_MODEL.md`](shared/DATA_MODEL.md)** — canonical database schema and field definitions.
- **[`shared/API_SPEC.md`](shared/API_SPEC.md)** — full REST API contract.
- **[`shared/BUSINESS_RULES.md`](shared/BUSINESS_RULES.md)** — invariants the backend enforces.
- **[`shared/CONVENTIONS.md`](shared/CONVENTIONS.md)** — code style / structure rules.
- **[`shared/roles.md`](shared/roles.md)** — role-permission matrix.
- **[`docs/`](docs)** — UAT scenarios, pilot assessment, performance notes.
- **[`PLAN.md`](PLAN.md)** — overall phased delivery plan.

## License

Internal — not for public distribution.
