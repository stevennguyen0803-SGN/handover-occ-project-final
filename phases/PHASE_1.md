# Phase 1 — Business Alignment & Design

> **Agent instruction:** This phase produces NO runnable code.
> Output is documentation files, schema definitions, and approved baselines.
> All output from this phase is consumed by Phase 2 as source of truth.
> Complete ALL tasks before moving to Phase 2.

**Phase goal:** Freeze the data model, business rules, API spec, and role definitions
so that Phase 2 build begins with zero ambiguity.

---

## Prerequisites

- [ ] `PLAN.md` read and understood
- [ ] `shared/DATA_MODEL.md` read
- [ ] `shared/BUSINESS_RULES.md` read
- [ ] `shared/API_SPEC.md` read

---

## Task 1.1 — Validate and Freeze Data Model

**File to produce:** `shared/DATA_MODEL.md` (already seeded — review and confirm)

**Agent actions:**
1. Read `shared/DATA_MODEL.md` in full
2. Check that every OCC category is represented as a model:
   - `AircraftItem` ✓
   - `AirportItem` ✓
   - `FlightScheduleItem` ✓
   - `CrewItem` ✓
   - `WeatherItem` ✓
   - `SystemItem` ✓
   - `AbnormalEvent` ✓
3. Confirm `AuditLog` model covers all `AuditAction` enum values
4. Confirm `Acknowledgment` model has `@@unique([handoverId, userId])` constraint
5. Confirm `Handover` has carry-forward fields: `isCarriedForward`, `carriedFromId`

**Acceptance criteria:**
- [ ] All 7 category models present
- [ ] `referenceId` field exists on `Handover` as `@unique`
- [ ] No field named `localStorage` or any browser-only concept exists
- [ ] `deletedAt` soft-delete field is on `Handover` (if not yet added, add it now)

**Output:** Annotate `shared/DATA_MODEL.md` with `<!-- PHASE 1 APPROVED -->` comment at top when complete.

---

## Task 1.2 — Confirm Business Rules Coverage

**File to produce:** `shared/BUSINESS_RULES.md` (already seeded — review and confirm)

**Agent actions:**
1. Read all 15 business rules (BR-01 through BR-15)
2. For each rule, add an **Implementation Note** section below it specifying exactly which file/layer enforces it:

```markdown
**Implementation:** `backend/src/schemas/handover.schema.ts` — Zod `.superRefine()`
**Test file:** `tests/unit/schemas/handover.schema.test.ts`
```

3. Identify any gaps — rules that have no clear enforcement layer — and add `**GAP: TBD**`

**Acceptance criteria:**
- [ ] All 15 rules have Implementation Note
- [ ] No rules marked GAP (resolve any gaps before Phase 2)
- [ ] BR-07 (carry-forward) has a named service function: `carryForwardOpenItems`
- [ ] BR-11 (soft delete) has named Prisma middleware described

---

## Task 1.3 — Define Zod Schemas (Design Only)

**File to produce:** `shared/schemas-design.md`

**Agent actions:**
Create `shared/schemas-design.md` with the designed (not yet implemented) Zod schema shapes for:

1. `CreateHandoverSchema` — full handover with nested categories
2. `UpdateHandoverSchema` — partial, same shape
3. `AircraftItemSchema` — with BR-06 superRefine
4. `AbnormalEventSchema` — with BR-08 superRefine
5. `ItemStatusTransitionSchema` — for PATCH status changes (BR-05)

For each schema, write the TypeScript Zod definition in a code block AND list which business rules it enforces.

**Template:**
```markdown
## CreateHandoverSchema

Enforces: BR-01, BR-06, BR-13

\`\`\`typescript
export const CreateHandoverSchema = z.object({
  handoverDate: z.string().date(),
  shift: ShiftEnum,
  preparedById: z.string().cuid(),
  overallPriority: PriorityEnum,
  // ... full definition
}).superRefine((data, ctx) => {
  // BR-13: if category arrays present, must have at least one item
})
\`\`\`
```

**Acceptance criteria:**
- [ ] All 5 schemas defined
- [ ] BR reference in every `.superRefine()` comment
- [ ] `ItemStatusTransitionSchema` validates transition matrix from BR-05

---

## Task 1.4 — Define Role & Permission Matrix

**File to produce:** `shared/roles.md`

**Agent actions:**
Create `shared/roles.md` with:

1. Full permission matrix table (expand BR-12 with every route from `API_SPEC.md`)
2. Middleware design:

```typescript
// Describe (not implement) the middleware signature
function requireRole(allowedRoles: UserRole[]): RequestHandler
function requireOwnership(resourceType: 'handover' | 'item'): RequestHandler
```

3. Edge cases to handle:
   - OCC_STAFF tries to view another user's handover → `403`
   - OCC_STAFF tries to acknowledge own handover → `403` (BR-10)
   - MANAGEMENT_VIEWER tries to POST → `403`
   - Unauthenticated request → `401`

**Acceptance criteria:**
- [ ] Every endpoint from API_SPEC.md has a role assignment in the matrix
- [ ] Edge cases documented with HTTP status codes
- [ ] Middleware signatures defined (not implemented yet)

---

## Task 1.5 — Environment & Project Setup Plan

**File to produce:** `shared/setup-guide.md`

**Agent actions:**
Create `shared/setup-guide.md` with step-by-step commands to:

1. Initialize the Next.js project:
```bash
npx create-next-app@latest occ-handover \
  --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

2. Install all dependencies:
```bash
# ORM
npm install prisma @prisma/client

# Auth
npm install next-auth@beta

# Validation
npm install zod @hookform/resolvers react-hook-form

# UI utilities
npm install clsx tailwind-merge lucide-react

# Charts
npm install recharts

# Export
npm install @react-pdf/renderer csv-stringify

# Dev
npm install -D vitest @vitest/coverage-v8 @testing-library/react
```

3. Initialize Prisma:
```bash
npx prisma init --datasource-provider postgresql
```

4. Create `.env.example` with all required variables

5. Define `package.json` scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

**Acceptance criteria:**
- [ ] All install commands produce zero peer-dependency conflicts
- [ ] `.env.example` covers every variable referenced in codebase
- [ ] `setup-guide.md` can be executed top-to-bottom by a fresh agent with no prior context

---

## Phase 1 Completion Checklist

Before proceeding to Phase 2, confirm ALL of the following:

- [ ] Task 1.1 — Data model approved and annotated
- [ ] Task 1.2 — All 15 business rules have implementation notes, zero gaps
- [ ] Task 1.3 — All 5 Zod schemas designed and documented
- [ ] Task 1.4 — Full permission matrix with every API route covered
- [ ] Task 1.5 — Setup guide executable from scratch

**Gate:** Agent must output `PHASE_1_COMPLETE` before starting any Phase 2 task.
