# Code Conventions — OCC Handover System

> **Agent instruction:** Follow all conventions here without exception.
> Consistent structure lets multiple agents work on the same codebase without conflicts.

---

## Directory Structure

```
occ-handover/
├── frontend/                        # Next.js 14 App Router
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx           # Sidebar + nav shell
│   │   │   ├── page.tsx             # Dashboard home
│   │   │   ├── handovers/
│   │   │   │   ├── page.tsx         # Handover log list
│   │   │   │   ├── new/page.tsx     # New handover form
│   │   │   │   └── [id]/page.tsx    # Handover detail view
│   │   │   └── admin/
│   │   │       └── users/page.tsx
│   │   └── api/                     # Next.js API routes (proxy to backend or direct Prisma)
│   ├── components/
│   │   ├── ui/                      # Base components (Button, Input, Badge, Modal)
│   │   ├── handover/                # Handover-specific components
│   │   │   ├── HandoverCard.tsx
│   │   │   ├── HandoverForm.tsx
│   │   │   ├── CategorySection.tsx
│   │   │   └── ItemRow.tsx
│   │   ├── dashboard/
│   │   │   ├── KpiCard.tsx
│   │   │   ├── TrendChart.tsx
│   │   │   └── CategoryBreakdown.tsx
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       └── TopNav.tsx
│   ├── lib/
│   │   ├── api.ts                   # Typed fetch wrapper
│   │   ├── auth.ts                  # NextAuth config
│   │   └── utils.ts                 # Shared helpers
│   ├── hooks/
│   │   ├── useHandovers.ts
│   │   └── useDashboard.ts
│   └── types/
│       └── index.ts                 # Shared TypeScript types (import from Zod schemas)
│
├── backend/                         # Express API (if separate service)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── handovers.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── export.routes.ts
│   │   │   └── users.routes.ts
│   │   ├── services/
│   │   │   ├── handover.service.ts  # Business logic here
│   │   │   ├── carryForward.service.ts
│   │   │   ├── audit.service.ts
│   │   │   └── export.service.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── role.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── schemas/                 # Zod schemas (shared with frontend via npm package or symlink)
│   │   │   ├── handover.schema.ts
│   │   │   └── item.schema.ts
│   │   └── lib/
│   │       └── prisma.ts            # Prisma singleton
│   └── prisma/
│       ├── schema.prisma
│       ├── migrations/
│       └── seed.ts
│
└── tests/
    ├── unit/
    │   ├── services/
    │   └── schemas/
    └── integration/
        └── api/
```

---

## Naming Conventions

### Files
- React components: `PascalCase.tsx` — e.g. `HandoverCard.tsx`
- Hooks: `camelCase.ts` prefixed with `use` — e.g. `useHandovers.ts`
- Services: `camelCase.service.ts` — e.g. `handover.service.ts`
- Routes: `camelCase.routes.ts`
- Schemas: `camelCase.schema.ts`
- Tests: `*.test.ts` or `*.spec.ts` alongside the file being tested

### Variables & Functions
- Boolean variables: prefix with `is`, `has`, `can`, `should` — e.g. `isCarriedForward`, `canAcknowledge`
- Async functions: always `await` — never `.then()` chains
- Constants: `UPPER_SNAKE_CASE` — e.g. `MAX_CARRY_FORWARD_DAYS`
- Enums: defined in Zod, export as TypeScript type with `z.infer<>`

### Database
- Table names: `PascalCase` (Prisma convention)
- Column names: `camelCase` (Prisma convention)
- Indexes: named `@@index([field1, field2])`

---

## Component Patterns

### Server vs Client Components (Next.js App Router)
- Default to **Server Components** — no `"use client"` unless necessary
- Use `"use client"` only for: forms with state, interactive filters, charts, modals
- Never fetch data in Client Components — use Server Components + pass data as props

```typescript
// ✅ Correct: Server Component fetches, Client Component renders form
// app/handovers/new/page.tsx (Server)
export default async function NewHandoverPage() {
  const users = await getUsers()       // server-side fetch
  return <HandoverForm users={users} /> // client component
}

// components/handover/HandoverForm.tsx
"use client"
export function HandoverForm({ users }: { users: User[] }) { ... }
```

### Form Handling
Use `react-hook-form` + `zodResolver`:

```typescript
"use client"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateHandoverSchema, type CreateHandoverInput } from '@/schemas/handover.schema'

export function HandoverForm() {
  const form = useForm<CreateHandoverInput>({
    resolver: zodResolver(CreateHandoverSchema),
    defaultValues: { overallPriority: 'Normal', ... }
  })

  async function onSubmit(data: CreateHandoverInput) {
    const res = await fetch('/api/v1/handovers', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    if (!res.ok) {
      const err = await res.json()
      // Handle error — display to user
    }
  }
}
```

---

## API Layer (Frontend)

All API calls go through `lib/api.ts`. Never call `fetch` directly in components.

```typescript
// lib/api.ts
export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`/api/v1${path}`, window.location.origin)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new ApiError(res.status, await res.json())
  return res.json()
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new ApiError(res.status, await res.json())
  return res.json()
}
```

---

## Service Layer (Backend)

All business logic lives in `services/`. Routes call services. Services call Prisma.

```typescript
// services/handover.service.ts
export async function createHandover(
  input: CreateHandoverInput,
  actingUserId: string
): Promise<Handover> {
  const referenceId = await generateReferenceId(prisma)  // BR-02

  const handover = await prisma.handover.create({
    data: {
      referenceId,
      ...input,
      preparedById: actingUserId,
      categories: { ... }
    }
  })

  // BR-09: audit log
  await auditService.log({
    handoverId: handover.id,
    userId: actingUserId,
    action: 'CREATED',
    targetModel: 'Handover',
    targetId: handover.id
  })

  return handover
}
```

---

## Testing Standards

### Unit tests — for all service functions

```typescript
// tests/unit/services/handover.service.test.ts
import { describe, it, expect, vi } from 'vitest'

describe('createHandover', () => {
  it('generates a referenceId automatically', async () => { ... })
  it('rejects if overallPriority is missing', async () => { ... })
  it('requires ownerId for Critical open items (BR-06)', async () => { ... })
  it('writes an audit log on creation (BR-09)', async () => { ... })
})
```

### Integration tests — for all API endpoints

```typescript
// tests/integration/api/handovers.test.ts
describe('POST /api/v1/handovers', () => {
  it('returns 201 with referenceId on valid input', async () => { ... })
  it('returns 400 VALIDATION_FAILED if shift is missing', async () => { ... })
  it('returns 403 if user role is MANAGEMENT_VIEWER', async () => { ... })
})
```

Coverage target: **80% minimum** for service layer.

---

## Git Commit Format

```
type(scope): short description

Types: feat | fix | chore | test | docs | refactor
Scope: handover | dashboard | auth | db | export | carry-forward

Examples:
feat(handover): add carry-forward service with audit log
fix(auth): restrict OCC_STAFF from viewing other users' handovers
test(dashboard): add unit tests for KPI summary endpoint
```

Reference the phase task in the commit body:
```
feat(handover): implement status transition validation

Enforces BR-05 status transitions (Open→Monitoring→Resolved).
Resolves PHASE_2 Task 2.3
```
