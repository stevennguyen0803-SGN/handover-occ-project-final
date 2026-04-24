# Phase 3 — Operational Workflow Enhancement

> **Agent instruction:** This phase adds the operational features that make the system usable
> in real shift operations. Phase 2 must be `PHASE_2_COMPLETE` before starting.
> All new features must have unit tests. All existing tests must continue to pass.

**Phase goal:** Implement carry-forward, ownership tracking, incoming shift acknowledgment,
advanced search/filter, and improved dashboard for OCC pilot readiness.

---

## Prerequisites

- [ ] `PHASE_2_COMPLETE` confirmed
- [ ] All Phase 2 tests passing
- [ ] Seed data updated to include multi-shift scenarios

---

## Task 3.1 — Carry-Forward Service

> **Business rule:** BR-07

**File:** `backend/src/services/carryForward.service.ts`

Implement the `carryForwardOpenItems` function:

```typescript
export async function carryForwardOpenItems(
  sourceHandoverId: string,
  targetHandoverId: string,
  actingUserId: string
): Promise<CarryForwardResult> {
  // 1. Load source handover with all category items
  // 2. Filter items where status is 'Open' or 'Monitoring'
  // 3. For each open/monitoring item:
  //    a. Create a copy on the target handover
  //    b. Set isCarriedForward = true on target handover
  //    c. Set carriedFromId = sourceHandoverId on target handover
  //    d. Write AuditLog: action = 'CARRIED_FORWARD', oldValue = { sourceHandoverId }
  // 4. Return { carriedItemCount, targetHandoverId }
}
```

Rules:
- Carry-forward creates NEW item records — never moves the original
- Original items on source handover remain unchanged
- All 7 category types must be carried: aircraft, airport, flightSchedule, crew, weather, system, abnormalEvents
- Carried items inherit: `issue`, `status`, `priority`, `ownerId`, `dueTime`, `flightsAffected`, `remarks`
- Carried items do NOT inherit: `id`, `handoverId`, `resolvedAt`, `createdAt`

**Trigger:** When a new handover is created (`POST /api/v1/handovers`), automatically check if previous shift has unresolved items and call `carryForwardOpenItems`.

Previous shift logic:
```typescript
function getPreviousShift(date: Date, shift: Shift): { date: Date, shift: Shift } {
  const order: Shift[] = ['Morning', 'Afternoon', 'Night']
  const currentIndex = order.indexOf(shift)
  if (currentIndex > 0) {
    return { date, shift: order[currentIndex - 1] }
  } else {
    // shift is Morning — previous is Night of the day before
    return { date: subtractDays(date, 1), shift: 'Night' }
  }
}
```

**Acceptance criteria:**
- [ ] `carryForwardOpenItems` is wrapped in a Prisma transaction
- [ ] Carrying 5 items creates 5 new rows, original 5 rows unchanged
- [ ] `AuditLog` entry written for each carried item with `action = 'CARRIED_FORWARD'`
- [ ] New handover has `isCarriedForward = true` if any items were carried
- [ ] `POST /api/v1/handovers` automatically triggers carry-forward check

**Tests:**
```
tests/unit/services/carryForward.service.test.ts
  ✓ carries all Open items from previous shift
  ✓ carries all Monitoring items from previous shift
  ✓ does NOT carry Resolved items
  ✓ creates copies, does not modify originals
  ✓ handles cross-day carry (Night → next day Morning)
  ✓ writes audit log entry for each carried item
  ✓ handles empty source handover (no items to carry)
```

---

## Task 3.2 — Manual Carry-Forward API Endpoint

**File:** `backend/src/routes/handovers.routes.ts`

Implement `POST /api/v1/handovers/:id/carry-forward` from `API_SPEC.md`.

Allow SUPERVISOR+ to manually trigger carry-forward to a specified target handover.

```typescript
router.post('/:id/carry-forward',
  requireRole(['SUPERVISOR', 'ADMIN']),
  async (req, res) => {
    const { targetHandoverId } = req.body
    if (!targetHandoverId) return res.status(400).json({ error: 'TARGET_HANDOVER_REQUIRED' })
    const result = await carryForwardService.carryForwardOpenItems(
      req.params.id,
      targetHandoverId,
      req.user.id
    )
    res.json(result)
  }
)
```

**Acceptance criteria:**
- [ ] Returns `carriedItemCount` and `targetHandoverId`
- [ ] Returns `403` for OCC_STAFF
- [ ] Returns `404` if source or target handover not found

---

## Task 3.3 — Carried-Forward UI Indicators

**Files:** `frontend/components/handover/ItemRow.tsx`, `frontend/app/(dashboard)/handovers/[id]/page.tsx`

Add visual indicators for carried-forward items:

1. **Item badge:** Show `Carried ↑` badge next to items that are carried-forward
2. **Handover header badge:** If `isCarriedForward = true`, show `Contains carried items` alert banner at top of detail view
3. **Log list:** Carried-forward handovers show `CF` badge in the Reference ID column
4. **Link to source:** Carried item shows "From: HDO-2025-000040" with a link to the source handover

**Acceptance criteria:**
- [ ] Carried items visually distinct from new items
- [ ] Link to source handover opens correctly
- [ ] Non-carried handovers show no carry-forward UI

---

## Task 3.4 — Ownership & Due Time Tracking

**Files:** `backend/src/services/handover.service.ts`, `frontend/components/handover/`

Enhance all item forms to support:

1. **Owner field** — dropdown of active OCC users. Required for High/Critical Open items (BR-06 already in schema, now add to UI)
2. **Due time field** — datetime picker. Must be in the future (BR-14)
3. **Overdue indicator** — if `dueTime` is in the past and item is not Resolved, show red "OVERDUE" badge

Add to dashboard `GET /api/v1/dashboard/summary`:
```json
{
  "overdueItems": 2,
  "itemsDueInNext2Hours": 4
}
```

Add to dashboard UI: "Overdue" KPI card (always red if > 0).

**Acceptance criteria:**
- [ ] Owner dropdown filters to active users only
- [ ] Due time in the past rejected on form submit
- [ ] Overdue items highlighted in log and detail view
- [ ] Dashboard shows overdue count

---

## Task 3.5 — Incoming Shift Acknowledgment Flow

> **Business rule:** BR-10

**Files:** `backend/src/routes/handovers.routes.ts`, `frontend/components/handover/AcknowledgeButton.tsx`

**Backend:** `POST /api/v1/handovers/:id/acknowledge` already defined in API_SPEC.md. Ensure it:
- Checks `preparedById !== req.user.id` (BR-10) → return `403 CANNOT_ACK_OWN_HANDOVER`
- Creates `Acknowledgment` record with `userId` and timestamp
- Updates `Handover.acknowledgedAt` on first acknowledgment
- Writes audit log with `action = 'ACKNOWLEDGED'`
- Supports multiple acknowledgments from different users

**Frontend:**
```typescript
// AcknowledgeButton.tsx
// Show only if:
//   - handover.overallPriority is 'High' or 'Critical'
//   - current user is not preparedById
//   - current user has not already acknowledged (check acknowledgments array)

export function AcknowledgeButton({ handover, currentUserId }: Props) {
  const alreadyAcknowledged = handover.acknowledgments.some(a => a.userId === currentUserId)
  const canAcknowledge = !alreadyAcknowledged && handover.preparedById !== currentUserId
  // ...
}
```

**Acceptance criteria:**
- [ ] `POST /acknowledge` with own handover returns `403`
- [ ] Acknowledged handover shows green "Acknowledged by X at Y" in detail view
- [ ] Multiple users can acknowledge same handover
- [ ] Acknowledgment appears in audit log

---

## Task 3.6 — Advanced Search & Filter

**Files:** `frontend/app/(dashboard)/handovers/page.tsx`, `backend/src/routes/handovers.routes.ts`

Extend the existing log filters:

1. **Full-text search** — search across: `referenceId`, `generalRemarks`, `nextShiftActions`, item `issue` fields
   ```typescript
   // Prisma full-text search (PostgreSQL)
   where: {
     OR: [
       { referenceId: { contains: q, mode: 'insensitive' } },
       { generalRemarks: { contains: q, mode: 'insensitive' } },
       { aircraftItems: { some: { issue: { contains: q, mode: 'insensitive' } } } }
     ]
   }
   ```

2. **Carried forward filter** — checkbox: "Show carried-forward only"

3. **My handovers** — toggle: "My handovers only" (for SUPERVISOR who wants to filter own)

4. **Overdue filter** — checkbox: "Overdue items only"

5. **Save filter preset** — "Save current filters" button stores filter set to `localStorage` (frontend only, not persisted to DB)

**Acceptance criteria:**
- [ ] Search returns results within 500ms for 10,000 handover records
- [ ] All filters combinable (AND logic between different filter types)
- [ ] URL reflects all active filters (shareable links)
- [ ] Clearing all filters returns full list

---

## Task 3.7 — Improved Dashboard Views

**Files:** `frontend/app/(dashboard)/page.tsx`, `frontend/components/dashboard/`

Enhance dashboard with:

1. **Current shift summary** — auto-detect current shift (Morning 06:00–14:00, Afternoon 14:00–22:00, Night 22:00–06:00) and highlight its handover at top
2. **Priority heatmap** — 7-day grid showing open/critical count per day (colored cells: green=none, amber=some, red=critical)
3. **Unresolved by category** — sortable table: Category | Open | Monitoring | Oldest Open Date
4. **Shift comparison** — for last 7 days: Morning vs Afternoon vs Night open counts (grouped bar chart)

**Acceptance criteria:**
- [ ] Current shift auto-detected correctly (UTC+8 timezone for OCC)
- [ ] All new charts render without console errors
- [ ] Heatmap cells clickable — navigates to that day's handover log

---

## Task 3.8 — Item Update & Close Workflow (Inline)

**File:** `frontend/components/handover/ItemStatusControl.tsx`

Allow users to update item status directly from the detail view without navigating away:

1. Dropdown: Open → Monitoring → Resolved (respecting BR-05 transition rules)
2. On "Resolve" — show confirmation modal: "Mark this item as Resolved? This cannot be undone."
3. On confirm — PATCH request to update status, optimistic UI update
4. Show "Updated by X at Y" below resolved items

**Acceptance criteria:**
- [ ] Status dropdown only shows valid next transitions (BR-05)
- [ ] Resolved items dropdown is disabled (BR-15)
- [ ] Confirmation modal shown before resolving
- [ ] UI updates without full page reload

---

## Phase 3 Completion Checklist

- [x] Task 3.1 — Carry-forward service with full test coverage
- [x] Task 3.2 — Manual carry-forward API endpoint
- [x] Task 3.3 — Carry-forward UI indicators
- [x] Task 3.4 — Ownership + due time + overdue tracking
- [x] Task 3.5 — Acknowledgment flow (backend + frontend)
- [x] Task 3.6 — Advanced search and filter
- [x] Task 3.7 — Enhanced dashboard views
- [x] Task 3.8 — Inline item status update

**Final gate checks:**
- [x] `npm test` — all tests pass (including carry-forward unit tests)
- [x] `npm run build` — zero TypeScript errors
- [x] Carry-forward tested end-to-end with seed data
- [x] Acknowledgment tested with two different user sessions

**Gate:** Agent must output `PHASE_3_COMPLETE` before starting Phase 4.
