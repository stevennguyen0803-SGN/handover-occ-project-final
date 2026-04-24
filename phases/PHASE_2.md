# Phase 2 — MVP Build & Technical Conversion

> **Agent instruction:** This phase converts the frontend prototype into a working full-stack application.
> Complete tasks in order — later tasks depend on earlier ones.
> Run `npm test` after each task. Zero failing tests before moving to next task.

**Phase goal:** Replace `localStorage` with a real database. Add authentication.
Implement all 3 main views (Dashboard, New Handover, Handover Log) backed by the API.

**Input from Phase 1:**
- `shared/DATA_MODEL.md` — Prisma schema
- `shared/BUSINESS_RULES.md` — rules to enforce
- `shared/API_SPEC.md` — endpoints to implement
- `shared/schemas-design.md` — Zod schemas to implement
- `shared/setup-guide.md` — run this first

---

## Task 2.1 — Project Initialization & Database Setup

**Estimated effort:** 1–2 hours

**Steps:**

1. Execute all commands in `shared/setup-guide.md`

2. Create `database/prisma/schema.prisma` from `shared/DATA_MODEL.md` — copy the Prisma schema verbatim

3. Add `deletedAt DateTime?` to `Handover` and all category item models if not already present

4. Run initial migration:
```bash
npx prisma migrate dev --name init
```

5. Create seed file at `database/prisma/seed.ts`:
```typescript
// Create 3 test users with different roles
// Create 5 sample handovers across different shifts and dates
// Include at least 1 Critical item, 2 High items
// Include at least 1 carried-forward handover
// Include 1 AbnormalEvent with all required fields
```

6. Run seed:
```bash
npx prisma db seed
```

7. Verify in Prisma Studio:
```bash
npx prisma studio
```

**Acceptance criteria:**
- [ ] `npx prisma migrate dev` runs without error
- [ ] `npx prisma db seed` creates test data without error
- [ ] All 9 models exist in the database: User, Handover, AircraftItem, AirportItem, FlightScheduleItem, CrewItem, WeatherItem, SystemItem, AbnormalEvent, AuditLog, Acknowledgment
- [ ] Soft-delete middleware implemented in `backend/src/lib/prisma.ts`

---

## Task 2.2 — Authentication

**File:** `frontend/lib/auth.ts`, `frontend/app/api/auth/[...nextauth]/route.ts`

**Steps:**

1. Configure NextAuth v5 with credentials provider:
```typescript
// lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      authorize: async (credentials) => {
        // Look up user by email in database
        // Compare hashed password (use bcrypt)
        // Return user object with id, name, email, role
        // Return null if invalid
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      // Add user.role to JWT token
    },
    session: async ({ session, token }) => {
      // Add token.role and token.id to session.user
    }
  }
})
```

2. Create login page at `frontend/app/(auth)/login/page.tsx`

3. Create auth middleware `frontend/middleware.ts`:
```typescript
export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: ['/((?!api/auth|_next|login).*)']
}
```

4. Create `requireRole` backend middleware:
```typescript
// backend/src/middleware/role.middleware.ts
export function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.session.user  // from NextAuth session
    if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' })
    if (!roles.includes(user.role)) return res.status(403).json({ error: 'FORBIDDEN' })
    next()
  }
}
```

**Acceptance criteria:**
- [ ] Unauthenticated access to `/` redirects to `/login`
- [ ] Valid credentials create a session with `user.role` populated
- [ ] Invalid credentials return error (do not expose whether email exists)
- [ ] Session includes `id`, `name`, `email`, `role`
- [ ] Password stored as bcrypt hash in database (never plaintext)

**Tests to write:**
```typescript
// tests/unit/auth.test.ts
describe('auth middleware', () => {
  it('redirects unauthenticated users to /login')
  it('allows authenticated users through')
  it('blocks wrong role with 403')
})
```

---

## Task 2.3 — Zod Schemas Implementation

**File:** `backend/src/schemas/handover.schema.ts`, `backend/src/schemas/item.schema.ts`

**Steps:**

Implement all 5 schemas from `shared/schemas-design.md`:

1. `CreateHandoverSchema` — enforce BR-01, BR-06, BR-13
2. `UpdateHandoverSchema` — partial version
3. `AircraftItemSchema` (and equivalent for all other categories)
4. `AbnormalEventSchema` — enforce BR-08
5. `ItemStatusTransitionSchema` — enforce BR-05

Add comment above every `.superRefine()` referencing the business rule:
```typescript
.superRefine((data, ctx) => {
  // BR-06: ownerId required for Critical/High open items
  if (['High', 'Critical'].includes(data.priority) && data.status === 'Open' && !data.ownerId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Owner is required for High/Critical open items',
      path: ['ownerId']
    })
  }
})
```

**Acceptance criteria:**
- [ ] All schemas implemented and exported
- [ ] Every business rule in `BUSINESS_RULES.md` that targets schemas has a test
- [ ] Schemas export both the Zod validator and the inferred TypeScript type

**Tests to write:**
```
tests/unit/schemas/handover.schema.test.ts
  ✓ accepts valid handover payload
  ✓ rejects missing shift (BR-01)
  ✓ rejects missing overallPriority (BR-01)
  ✓ rejects Critical item without ownerId (BR-06)
  ✓ rejects AbnormalEvent AOG without flightsAffected (BR-08)
  ✓ rejects AbnormalEvent Critical without notificationRef (BR-08)
  ✓ rejects empty category array when category activated (BR-13)
```

---

## Task 2.4 — Backend API: Handover CRUD

**Files:** `backend/src/routes/handovers.routes.ts`, `backend/src/services/handover.service.ts`

**Steps:**

Implement these endpoints from `shared/API_SPEC.md` in order:

### 2.4.1 — `POST /api/v1/handovers`
```typescript
router.post('/', requireRole(['OCC_STAFF', 'SUPERVISOR', 'ADMIN']), async (req, res) => {
  const parsed = CreateHandoverSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION_FAILED', details: parsed.error.flatten() })
  const handover = await handoverService.createHandover(parsed.data, req.user.id)
  res.status(201).json({ id: handover.id, referenceId: handover.referenceId, createdAt: handover.createdAt })
})
```

Service function must:
- Generate `referenceId` (BR-02)
- Create all category items in the same transaction
- Write `AuditLog` with action `CREATED` (BR-09)

### 2.4.2 — `GET /api/v1/handovers`
Implement filtering, sorting, pagination.
OCC_STAFF filter: `WHERE preparedById = req.user.id`
Include `itemCounts` in response (count by status per handover).

### 2.4.3 — `GET /api/v1/handovers/:id`
Include all category items + audit log + acknowledgments.
Check ownership for OCC_STAFF role.

### 2.4.4 — `PATCH /api/v1/handovers/:id`
Validate with `UpdateHandoverSchema`.
Write audit log with `oldValue`/`newValue` diff.

**Acceptance criteria:**
- [ ] `POST` creates handover with auto-generated `referenceId` in format `HDO-YYYY-NNNNNN`
- [ ] `GET` list respects role-based visibility
- [ ] All endpoints write audit log (verify in database after each test)
- [ ] Soft-deleted records never appear in responses
- [ ] `409 DUPLICATE_SHIFT_HANDOVER` returned if same date+shift already active

**Integration tests:**
```
tests/integration/api/handovers.test.ts
  POST /api/v1/handovers
    ✓ 201 with referenceId on valid payload
    ✓ 400 VALIDATION_FAILED if shift missing
    ✓ 400 OWNER_REQUIRED for Critical item without owner
    ✓ 403 if role is MANAGEMENT_VIEWER
    ✓ 409 DUPLICATE_SHIFT_HANDOVER if same date+shift exists

  GET /api/v1/handovers
    ✓ OCC_STAFF sees only own handovers
    ✓ SUPERVISOR sees all handovers
    ✓ status filter works
    ✓ priority filter works
    ✓ pagination returns correct page
```

---

## Task 2.5 — Backend API: Item Management

**File:** `backend/src/routes/items.routes.ts`

Implement for ALL 7 categories:
- `POST /api/v1/handovers/:id/items/:category` — add item
- `PATCH /api/v1/handovers/:id/items/:category/:itemId` — update item (with status transition check BR-05, immutability check BR-15)
- `DELETE /api/v1/handovers/:id/items/:category/:itemId` — soft delete (SUPERVISOR+ only, BR-12)

Write audit log for every mutation (BR-09).

**Acceptance criteria:**
- [ ] Status transition `Resolved → Open` returns `400 STATUS_TRANSITION_INVALID`
- [ ] Editing resolved item (except remarks) returns `409 ITEM_RESOLVED_IMMUTABLE`
- [ ] Soft-delete sets `deletedAt`, does not remove row

---

## Task 2.6 — Dashboard API

**File:** `backend/src/routes/dashboard.routes.ts`

Implement `GET /api/v1/dashboard/summary` from `API_SPEC.md`.

Query strategy:
```typescript
// Use Prisma groupBy + count — do NOT load all records into memory
const openCounts = await prisma.handover.groupBy({
  by: ['overallStatus'],
  where: { handoverDate: today, deletedAt: null },
  _count: true
})
```

Include `trend7Days` — last 7 days of open/resolved counts.
Include `openByCategory` — count open items per category model.

**Acceptance criteria:**
- [ ] Response matches shape in `API_SPEC.md` exactly
- [ ] Uses database aggregation (not in-memory calculation)
- [ ] Response time < 500ms with 1000 handover records in database

---

## Task 2.7 — Frontend: Layout & Navigation

**Files:** `frontend/app/(dashboard)/layout.tsx`, `frontend/components/layout/Sidebar.tsx`

Build the app shell with:
- Sidebar with links: Dashboard / New Handover / Handover Log / Admin (admin only)
- Top nav with: user name, role badge, sign out button
- Active link highlighting
- Role-based nav item visibility (hide Admin for non-ADMIN)

Tailwind classes only. No custom CSS files.

**Acceptance criteria:**
- [ ] All 3 nav items visible for OCC_STAFF
- [ ] Admin nav item hidden for OCC_STAFF and MANAGEMENT_VIEWER
- [ ] Sign out works and redirects to `/login`
- [ ] Layout renders without hydration errors

---

## Task 2.8 — Frontend: Dashboard View

**File:** `frontend/app/(dashboard)/page.tsx`, `frontend/components/dashboard/`

Build the dashboard using data from `GET /api/v1/dashboard/summary`:

1. **KPI Cards** (4 cards):
   - Total Open Items (amber if > 5, red if > 10)
   - Monitoring Items
   - Critical Items (always red if > 0)
   - Unacknowledged High Priority (amber)

2. **Trend Chart** — 7-day bar chart using Recharts
   - X axis: date labels
   - Two bars per day: Open (amber) + Resolved (green)

3. **Category Breakdown** — horizontal bar or donut chart
   - One entry per category with open item count

4. **Recent Handovers** — last 5 handovers as cards
   - Show: referenceId, shift, priority badge, status, preparedBy name
   - Critical/High items show colored left border

Use Server Component for page. Fetch data server-side. Pass to client chart components.

**Acceptance criteria:**
- [ ] KPI cards display correct counts from API
- [ ] Chart renders without console errors
- [ ] Zero open items = no amber/red states
- [ ] Dashboard loads in < 2 seconds (server-side data fetch)

---

## Task 2.9 — Frontend: New Handover Form

**File:** `frontend/app/(dashboard)/handovers/new/page.tsx`, `frontend/components/handover/HandoverForm.tsx`

Build the handover creation form:

1. **Header section** — Date picker, Shift selector, Prepared By (auto-filled = current user), Handed To (user selector), Overall Priority

2. **Category sections** (collapsible, one per category) — each has:
   - Toggle to activate the section
   - When activated: shows "Add Item" button
   - Each item: fields from the data model for that category
   - "Add another item" supports multiple items (BR — multi-item per category)

3. **Next Shift Actions** — textarea at bottom

4. **Submit** — validates all fields, calls `POST /api/v1/handovers`, redirects to handover detail on success

5. **Form state** — use `react-hook-form` + `zodResolver(CreateHandoverSchema)`

Display inline validation errors below each field. Show a global error banner if API returns `400`.

**Acceptance criteria:**
- [ ] Form submits valid data to `POST /api/v1/handovers`
- [ ] Zod validation errors shown inline before API call
- [ ] Multiple items can be added per category
- [ ] Activating a category section then submitting empty → shows error (BR-13)
- [ ] On success, redirects to `/handovers/:id`
- [ ] Prepared By field is auto-filled and read-only

---

## Task 2.10 — Frontend: Handover Log

**File:** `frontend/app/(dashboard)/handovers/page.tsx`

Build the log view:

1. **Filter bar** — Status (multi-select), Priority (multi-select), Shift, Date range, Search text
2. **Table** — Columns: Reference ID, Date, Shift, Prepared By, Priority (badge), Status (badge), Item Counts, Actions
3. **Pagination** — Previous / Next / page indicator
4. **Row click** — navigates to `/handovers/:id`
5. **Priority color coding** — Critical row = red left border, High = amber, others = none

Filters update URL query params (use `useRouter` + `useSearchParams`). Shareable URLs.

**Acceptance criteria:**
- [ ] Changing filters updates URL and re-fetches
- [ ] Empty state shows "No handovers found" with a "Create handover" link
- [ ] Priority badges use correct colors (Critical=red, High=amber, Normal=blue, Low=gray)
- [ ] Pagination works with > 20 records

---

## Task 2.11 — Frontend: Handover Detail View

**File:** `frontend/app/(dashboard)/handovers/[id]/page.tsx`

Build the detail page:

1. **Header** — referenceId, date, shift, priority badge, status, preparedBy → handedTo
2. **Category sections** — one section per category, shows all items with status badges
3. **Item actions** (for non-resolved items): "Update status" dropdown, "Edit" button
4. **Acknowledge button** — shown if High/Critical + not yet acknowledged + not own handover
5. **Carried Forward badge** — shown if `isCarriedForward = true`
6. **Audit Log section** — collapsible, shows all audit events
7. **Export buttons** — PDF and Print

**Acceptance criteria:**
- [ ] Carried-forward items show "Carried Forward" badge
- [ ] Acknowledge button only visible to eligible users (BR-10)
- [ ] Status update inline — no page reload required
- [ ] Audit log shows all events with timestamps and user names

---

## Task 2.12 — Export: CSV & PDF

**Files:** `backend/src/services/export.service.ts`

### CSV Export
```typescript
import { stringify } from 'csv-stringify/sync'

export async function exportHandoversCsv(filters: HandoverFilters): Promise<string> {
  const handovers = await fetchHandoversForExport(filters)
  return stringify(handovers, {
    header: true,
    columns: ['referenceId', 'handoverDate', 'shift', 'preparedBy', 'overallPriority', 'overallStatus', 'openItemCount']
  })
}
```

### PDF Export
Use `@react-pdf/renderer` to generate a single handover summary PDF.
Include: header info, all category items, next shift actions.
Render Critical/High items with colored text.

**Acceptance criteria:**
- [ ] CSV download triggers in browser with correct filename
- [ ] PDF includes all category items
- [ ] Both exports work for MANAGEMENT_VIEWER role

---

## Phase 2 Completion Checklist

- [ ] Task 2.1 — Database initialized with migrations and seed data
- [ ] Task 2.2 — Authentication working with role in session
- [ ] Task 2.3 — All Zod schemas implemented and tested
- [ ] Task 2.4 — Handover CRUD API with audit trail
- [ ] Task 2.5 — Item management API with transition validation
- [ ] Task 2.6 — Dashboard API with aggregated counts
- [ ] Task 2.7 — App layout and navigation
- [ ] Task 2.8 — Dashboard view with KPI cards and charts
- [ ] Task 2.9 — New handover form with multi-item support
- [ ] Task 2.10 — Handover log with filters and pagination
- [ ] Task 2.11 — Handover detail view
- [ ] Task 2.12 — CSV and PDF export

**Final gate checks:**
- [ ] `npm test` — all tests pass
- [ ] `npm run build` — zero TypeScript errors
- [ ] No `localStorage` references in codebase (`grep -r localStorage frontend/` returns empty)
- [ ] All API endpoints return correct HTTP status codes per `API_SPEC.md`

**Gate:** Agent must output `PHASE_2_COMPLETE` before starting Phase 3.
