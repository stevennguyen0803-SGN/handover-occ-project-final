# Setup Guide - OCC Handover System

This guide is the Phase 1 setup baseline for turning the current documentation repo into the planned application structure.

## Prerequisites

- Node.js 20 LTS
- npm 10+
- PostgreSQL 15
- Git

Recommended local verification:

```bash
node -v
npm -v
psql --version
```

## Target Repository Layout

```text
occ-handover/
|-- PLAN.md
|-- shared/
|-- phases/
|-- frontend/
|-- backend/
|-- database/
|-- docs/
`-- memory-bank/
```

## Step 1 - Initialize the Root Workspace

Create a lightweight root `package.json` so the repo can orchestrate frontend, backend, and database commands:

```bash
npm init -y
```

Update the root `package.json` to:

```json
{
  "name": "occ-handover",
  "private": true,
  "scripts": {
    "dev": "npm --prefix frontend run dev",
    "build": "npm --prefix frontend run build && npm --prefix backend run build",
    "test": "npm --prefix frontend run test && npm --prefix backend run test",
    "test:coverage": "npm --prefix frontend run test:coverage && npm --prefix backend run test:coverage",
    "db:generate": "prisma generate --schema database/prisma/schema.prisma",
    "db:migrate": "prisma migrate dev --schema database/prisma/schema.prisma",
    "db:seed": "tsx database/prisma/seed.ts",
    "db:studio": "prisma studio --schema database/prisma/schema.prisma"
  }
}
```

Install the root database tooling:

```bash
npm install prisma@6.16.2 @prisma/client@6.16.2 tsx bcryptjs
```

## Step 2 - Scaffold the Next.js Frontend

From the repository root:

```bash
npx create-next-app@14 frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*" --use-npm
```

Install frontend dependencies:

```bash
npm install --prefix frontend next-auth@beta zod @hookform/resolvers react-hook-form clsx tailwind-merge lucide-react recharts @react-pdf/renderer csv-stringify
npm install --prefix frontend -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom
```

Update `frontend/package.json` scripts to include:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

## Step 3 - Initialize the Express Backend

Create the backend package:

```bash
npm init -y --prefix backend
npm install --prefix backend express zod csv-stringify
npm install --prefix backend -D typescript tsx @types/node @types/express vitest @vitest/coverage-v8
```

Initialize TypeScript in `backend/`:

```bash
cd backend
npx tsc --init --rootDir src --outDir dist --module commonjs --target ES2022 --esModuleInterop --resolveJsonModule --strict
cd ..
```

Create the backend folders:

```bash
mkdir backend/src
mkdir backend/src/routes
mkdir backend/src/services
mkdir backend/src/schemas
mkdir backend/src/middleware
mkdir backend/src/lib
```

Update `backend/package.json` scripts to include:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

## Step 4 - Initialize Prisma

Install Prisma in the backend package, then initialize it:

```bash
cd backend
npx prisma init --datasource-provider postgresql
cd ..
```

After Prisma creates `backend/prisma/schema.prisma`, move the generated schema into `database/prisma/schema.prisma` so the repo matches the design documents.

Ensure the final structure looks like this:

```text
database/
`-- prisma/
    |-- schema.prisma
    |-- migrations/
    `-- seed.ts
```

Use `shared/DATA_MODEL.md` as the only source of truth when filling `database/prisma/schema.prisma`.

## Step 5 - Create `.env.example`

Create `.env.example` at the repository root:

```bash
# Root environment shared by frontend and backend
DATABASE_URL="postgresql://user:pass@localhost:5432/occ_handover"
DIRECT_URL="postgresql://user:pass@localhost:5432/occ_handover"
DATABASE_CONNECTION_LIMIT="10"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

Local setup after that:

```bash
cp .env.example .env
```

If working on Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

## Step 6 - Create Initial Files

Create the first backend entrypoint:

```typescript
// backend/src/server.ts
import express from 'express'

const app = express()
app.use(express.json())

app.listen(4000, () => {
  console.log('OCC backend listening on http://localhost:4000')
})
```

Create the first seed file placeholder:

```typescript
// database/seed.ts
export {}
```

## Step 7 - Run the Bootstrap Checks

Run these commands from the repository root:

```bash
npm install
npm --prefix backend run db:migrate
npm test
npm run build
```

Expected outcome:
- frontend dependencies install without peer dependency conflicts on Node 20 LTS
- backend dependencies install successfully
- Prisma can see `database/schema.prisma`
- test commands run in both workspaces
- build succeeds for both frontend and backend

## Notes for the Agent Who Executes This

- Do not start implementation before `shared/DATA_MODEL.md`, `shared/BUSINESS_RULES.md`, `shared/API_SPEC.md`, `shared/roles.md`, and `shared/schemas-design.md` are the approved baseline.
- Keep Prisma schema and migrations under `database/` to match the design docs.
- Use the root `.env.example` as the complete environment variable source until the codebase proves otherwise.
- If the app uses a pooled Postgres URL in a long-lived local or staging process, keep `DATABASE_CONNECTION_LIMIT` above `1` so Prisma does not inherit serverless-style pool starvation during concurrent pilot checks.
- If a new dependency is needed later, update this guide and `memory-bank/techContext.md` in the same session.
