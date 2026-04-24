# OCC Handover System — Agent Coding Plan

> **For AI Coding Agents (Claude Code / Codex / Cursor)**
> Read this file first. It defines the full project, tech stack, conventions, and phase order.
> Each phase has its own `PHASE_X.md` file with detailed tasks and acceptance criteria.

---

## Project Overview

Build the **OCC Handover System** — a centralized web application for Operations Control Centre shift handover management. It replaces spreadsheets, emails, and verbal updates with a structured digital platform.

**Prototype already exists** as a browser-only HTML demo using `localStorage`. This project converts it into a production-capable application with a real backend, database, authentication, and audit trail.

---

## Repository Structure

```
occ-handover/
├── PLAN.md                        ← You are here
├── phases/
│   ├── PHASE_1.md                 ← Business alignment & design artifacts
│   ├── PHASE_2.md                 ← MVP build & technical conversion
│   ├── PHASE_3.md                 ← Operational workflow enhancement
│   ├── PHASE_4.md                 ← Pilot deployment & UAT
│   └── PHASE_5.md                 ← Production rollout
├── shared/
│   ├── DATA_MODEL.md              ← Canonical database schema & field definitions
│   ├── API_SPEC.md                ← REST API contracts (all endpoints)
│   ├── BUSINESS_RULES.md          ← All business rules the code must enforce
│   └── CONVENTIONS.md             ← Code style, naming, file structure rules
├── frontend/                      ← React/Next.js app
├── backend/                       ← Node.js/Express API
├── database/                      ← SQL migrations & seeds
└── docs/                          ← Generated docs, ERDs, ADRs
```

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18 + Next.js 14 (App Router) | TypeScript, Tailwind CSS |
| Backend | Node.js + Express 5 | TypeScript |
| Database | PostgreSQL 15 | via Prisma ORM |
| Auth | NextAuth.js v5 | Company SSO or credentials provider |
| Validation | Zod | Shared schemas frontend + backend |
| Testing | Vitest + React Testing Library | Jest-compatible |
| Export | react-pdf + csv-stringify | PDF & CSV export |
| CI | GitHub Actions | Lint → test → build on PR |

---

## Phase Execution Order

Execute phases **strictly in order**. Do not start Phase 2 until Phase 1 artifacts are committed.

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
```

| Phase | Name | Goal | Key Output |
|---|---|---|---|
| 1 | Business Alignment | Define schema, rules, roles | Approved data model + API spec |
| 2 | MVP Build | Working app with DB + auth | UAT-ready build |
| 3 | Workflow Enhancement | Carry-forward, ownership, ack | Pilot-ready build |
| 4 | Pilot | Real OCC validation | Assessment report + fixes |
| 5 | Production | Live deployment | Stable production system |

---

## Global Coding Rules

These apply across ALL phases. Never violate them.

### 1. TypeScript Strict Mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### 2. Zod for all input validation
Every API endpoint must validate its request body with a Zod schema before touching the database. Share the same schema with the frontend form.

```typescript
// Example: shared/schemas/handover.schema.ts
import { z } from 'zod'

export const ShiftEnum = z.enum(['Morning', 'Afternoon', 'Night'])
export const PriorityEnum = z.enum(['Low', 'Normal', 'High', 'Critical'])
export const StatusEnum = z.enum(['Open', 'Monitoring', 'Resolved'])

export const CreateHandoverSchema = z.object({
  handoverDate: z.string().date(),
  shift: ShiftEnum,
  preparedBy: z.string().min(2).max(100),
  handedTo: z.string().min(2).max(100).optional(),
  overallPriority: PriorityEnum,
  categories: z.object({
    aircraft: AircraftSchema.optional(),
    airport: AirportSchema.optional(),
    // ... other categories
  })
})
```

### 3. Error handling — never swallow errors
```typescript
// backend: always return structured errors
res.status(400).json({
  error: 'VALIDATION_FAILED',
  details: zodError.flatten()
})

// frontend: always display errors to user, never console.log only
```

### 4. Audit trail — mandatory on all mutations
Every `POST`, `PUT`, `PATCH`, `DELETE` to a handover record must write an audit log row. Use the `auditLog` Prisma model. See `shared/DATA_MODEL.md` for schema.

### 5. Role checks on every protected route
```typescript
// backend middleware pattern
router.post('/handovers', requireRole(['OCC_STAFF', 'SUPERVISOR']), createHandover)
router.delete('/handovers/:id', requireRole(['SUPERVISOR']), deleteHandover)
```

### 6. No `localStorage` in production code
The prototype used `localStorage`. Any new code must use the database via API. Remove all `localStorage` references during Phase 2.

### 7. Database migrations via Prisma
Never edit the database directly. All schema changes go through `prisma migrate dev`.

```bash
npx prisma migrate dev --name describe_your_change
```

---

## Environment Variables

```bash
# .env.example — commit this, never commit .env
DATABASE_URL="postgresql://user:pass@localhost:5432/occ_handover"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## Definition of Done (per task)

A task is complete when:
- [ ] Code written and compiles with zero TypeScript errors
- [ ] Unit tests written and passing (`npm test`)
- [ ] Zod schema validates all inputs
- [ ] Audit log written for all mutations
- [ ] Role-based access enforced
- [ ] No `console.log` left in production paths
- [ ] PR description links to the Phase task number

---

## Start Here

1. Read `shared/DATA_MODEL.md` — understand the full schema
2. Read `shared/BUSINESS_RULES.md` — understand what the code must enforce
3. Read `phases/PHASE_1.md` — begin Phase 1 tasks
