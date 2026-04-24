# Phase 4 — Pilot Deployment & UAT

> **Agent instruction:** This phase prepares and runs the system in a controlled pilot environment.
> Phase 3 must be `PHASE_3_COMPLETE` before starting.
> Agent tasks here are: build test harnesses, fix defects, prepare UAT data, run smoke tests.
> Human OCC users run the UAT scenarios — agent prepares the tooling.

**Phase goal:** Validate the system with real OCC scenarios. Fix defects. Produce go/no-go report.

---

## Task 4.1 — Staging Environment Setup

**Files:** `scripts/start-staging.mjs`, `scripts/verify-local-staging.mjs`, `.github/workflows/deploy-staging.yml`, `infrastructure/staging/`

Set up a production-mode staging path for pilot validation.

The accepted Phase 4 pilot path is the no-Docker local staging flow:

1. Build the frontend and backend with `npm run build`.
2. Start the root staging process with `npm start`.
3. Run Prisma deploy migrations automatically before app startup.
4. Serve the frontend on `http://localhost:3000`.
5. Serve the backend on `http://localhost:4000`.
6. Verify readiness with `npm run verify:staging:local`.

Docker/compose files may remain in the repository as optional deployment scaffolding, but Docker is not required for Task 4.1 acceptance.

**Acceptance criteria:**
- [ ] `npm run build` succeeds for frontend and backend
- [ ] `npm run verify:staging:local` starts the production-mode app and confirms readiness in < 60 seconds
- [ ] Database migrations run automatically on staging startup
- [ ] Frontend staging URL is accessible from browser at `http://localhost:3000/login`
- [ ] Backend health endpoint is accessible at `http://localhost:4000/health`

---

## Task 4.2 — UAT Scenario Data Loader

**File:** `database/prisma/uat-seed.ts`

Create a realistic UAT dataset that OCC pilots will use during testing.
This is separate from the development seed (`seed.ts`).

```typescript
// uat-seed.ts — creates exactly these scenarios:

// SCENARIO 1: AOG Aircraft
// Handover: Morning shift today
// AircraftItem: 9M-MXA, AOG hydraulic leak, Critical, Open, ownerId = supervisor
// AbnormalEvent: AOG, flights AXA001 AXA002 AXA003 affected
// Expected: Shows on dashboard as Critical, carry-forward to Afternoon

// SCENARIO 2: Weather Disruption Chain
// Handover: Yesterday Night shift
// WeatherItem: WMKK, Thunderstorm, High, Monitoring
// FlightScheduleItem: AXA100-AXA120, 45 min avg delay, Open
// isCarriedForward = true (carried from previous day)
// Expected: Acknowledgment required, carried-forward badge visible

// SCENARIO 3: Crew Positioning Issue
// Handover: Afternoon shift today  
// CrewItem: Captain missing for KUL-PMI route, Critical, Open, owner required
// CrewItem: Cabin crew short for AXA200, High, Monitoring
// Expected: Owner validation enforced, two crew items visible

// SCENARIO 4: System Degradation
// Handover: Morning shift yesterday, Resolved
// SystemItem: ACARS downtime 2h, Resolved
// Expected: Appears in log, not on dashboard active items

// SCENARIO 5: Multi-category Normal Shift
// Handover: Normal shift with Low priority items across 3 categories
// Expected: No red/amber highlighting, standard display
```

Run with: `npx tsx database/prisma/uat-seed.ts`

**Acceptance criteria:**
- [ ] 5 scenarios loaded with correct data
- [ ] Scenario 1 handover triggers carry-forward when Afternoon handover is created
- [ ] Scenario 2 shows acknowledgment requirement in UI
- [ ] Scenario 3 blocks submission without owner on Critical crew item

---

## Task 4.3 — UAT Test Scripts (for human testers)

**File:** `docs/uat/UAT_SCENARIOS.md`

Create human-readable UAT test scripts with step-by-step instructions:

```markdown
# UAT Scenario 1 — AOG Aircraft Handover

**Tester role:** OCC Supervisor
**Test data:** Load uat-seed.ts first
**Pre-condition:** Log in as supervisor@occ.test (password: Pilot2025!)

## Steps

1. Navigate to Dashboard
   **Expected:** KPI card "Critical Items" shows 1 or more (red)
   
2. Click the Morning shift handover (today) in Recent Handovers
   **Expected:** Handover detail opens, shows AOG AircraftItem with Critical red badge

3. Click "Acknowledge" button
   **Expected:** Button changes to "Acknowledged ✓ by [your name]"

4. Navigate to New Handover → create Afternoon shift handover for today
   **Expected:** AircraftItem from Morning shift appears with "Carried ↑" badge

5. Try to submit Afternoon handover without setting Owner on the Critical item
   **Expected:** Form shows validation error "Owner is required for Critical open items"

6. Set Owner and submit
   **Expected:** Redirect to new handover detail, referenceId shows HDO-YYYY-NNNNNN

## Pass / Fail Criteria
- PASS: All 6 steps produce expected results
- FAIL: Any step shows wrong result — capture screenshot and note step number
```

Create similar scripts for all 5 UAT scenarios.

**Acceptance criteria:**
- [ ] 5 UAT scenario scripts created
- [ ] Each script has: role, pre-condition, numbered steps, expected result per step, pass/fail criteria
- [ ] Scripts reference exact test user credentials

---

## Task 4.4 — Automated Smoke Tests

**File:** `tests/smoke/smoke.test.ts`

Create smoke tests that run against the staging environment to verify critical paths are working end-to-end:

```typescript
// tests/smoke/smoke.test.ts
// Uses fetch against STAGING_URL, not mocked

const BASE = process.env.STAGING_URL ?? 'http://localhost:3000'

describe('Smoke tests — critical paths', () => {
  let authToken: string
  let handoverId: string

  it('login returns session', async () => {
    const res = await fetch(`${BASE}/api/auth/session`)
    expect(res.status).toBe(200)
  })

  it('can create a handover via API', async () => {
    const res = await fetch(`${BASE}/api/v1/handovers`, {
      method: 'POST',
      headers: { 'Cookie': authToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(validHandoverPayload)
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.referenceId).toMatch(/^HDO-\d{4}-\d{6}$/)
    handoverId = body.id
  })

  it('handover appears in dashboard summary', async () => {
    const res = await fetch(`${BASE}/api/v1/dashboard/summary`, {
      headers: { 'Cookie': authToken }
    })
    const body = await res.json()
    expect(body.today.totalHandovers).toBeGreaterThan(0)
  })

  it('carry-forward creates items on next handover', async () => { ... })

  it('CSV export returns valid CSV', async () => {
    const res = await fetch(`${BASE}/api/v1/handovers/export/csv`, {
      headers: { 'Cookie': authToken }
    })
    expect(res.headers.get('content-type')).toContain('text/csv')
  })

  it('PDF export returns binary PDF', async () => {
    const res = await fetch(`${BASE}/api/v1/handovers/${handoverId}/export/pdf`, {
      headers: { 'Cookie': authToken }
    })
    expect(res.headers.get('content-type')).toContain('application/pdf')
  })
})
```

Run with: `STAGING_URL=https://staging.occ.internal npm run test:smoke`

**Acceptance criteria:**
- [ ] All smoke tests pass on staging environment
- [ ] Smoke tests run in < 30 seconds total
- [ ] Smoke test failures block deployment (add to CI pipeline)

---

## Task 4.5 — Performance & Load Check

**File:** `docs/performance-report.md`

Run basic performance checks and document results:

```bash
# Install k6 or autocannon for load testing
npm install -g autocannon

# Test dashboard endpoint under load
autocannon -c 20 -d 30 http://localhost:3000/api/v1/dashboard/summary

# Test handover list with 1000 records
autocannon -c 10 -d 30 "http://localhost:3000/api/v1/handovers?limit=20"
```

Document results in `docs/performance-report.md`:

| Endpoint | Avg Response | P95 | P99 | Under Load (20 concurrent) |
|---|---|---|---|---|
| GET /dashboard/summary | < 200ms | < 500ms | < 1s | ✅ / ❌ |
| GET /handovers | < 300ms | < 600ms | < 1s | ✅ / ❌ |
| POST /handovers | < 500ms | < 1s | < 2s | ✅ / ❌ |

If any endpoint fails targets: profile with `EXPLAIN ANALYZE` in PostgreSQL, add missing indexes, re-test.

**Acceptance criteria:**
- [ ] All endpoints meet targets under 20 concurrent users
- [ ] No N+1 queries in Prisma (use `include` not separate queries)
- [ ] Dashboard query uses aggregation (no in-memory calculation)

---

## Task 4.6 — Defect Tracking & Fix

**File:** `docs/uat/DEFECT_LOG.md`

Create `DEFECT_LOG.md` template for recording pilot defects:

```markdown
# Defect Log

| ID | Scenario | Step | Description | Severity | Status | Fixed In |
|----|----------|------|-------------|----------|--------|----------|
| BUG-001 | Scenario 1 | Step 3 | Acknowledge button not visible for Supervisor role | P1 Critical | Fixed | commit abc123 |
```

**Agent responsibility during pilot:**
1. Read each defect reported in `DEFECT_LOG.md`
2. Fix P1 (Critical) defects immediately — deploy hotfix to staging
3. Fix P2 (High) defects within current sprint
4. P3/P4 defects — log for Phase 5 backlog
5. After each fix: add test to prevent regression, update `DEFECT_LOG.md` Status to Fixed

**Acceptance criteria:**
- [ ] Zero P1 defects open at pilot sign-off
- [ ] Zero P2 defects open at pilot sign-off
- [ ] Each fixed defect has a regression test

---

## Task 4.7 — Go/No-Go Assessment

**File:** `docs/pilot-assessment.md`

After UAT completes, generate `docs/pilot-assessment.md`:

```markdown
# Pilot Assessment Report

## Summary
- Pilot duration: [dates]
- Participating shifts: [list]
- Participating users: [count]
- Total handovers created: [count]
- Defects found: P1=[n] P2=[n] P3=[n]
- Defects resolved: [count]

## Smoke Test Results
[paste smoke test output]

## Performance Results  
[paste from performance-report.md]

## User Feedback Summary
[summarize usability observations]

## Go / No-Go Criteria

| Criterion | Target | Actual | Pass/Fail |
|---|---|---|---|
| Zero P1 defects open | 0 | [n] | |
| Zero P2 defects open | 0 | [n] | |
| Smoke tests pass | 100% | [%] | |
| Dashboard < 500ms P95 | 500ms | [ms] | |
| Users can create handover < 5 min | 5 min | [min] | |
| Carry-forward working | Yes | Yes/No | |

## Recommendation
GO / NO-GO — [reasoning]
```

**Acceptance criteria:**
- [ ] All Go/No-Go criteria evaluated
- [ ] Recommendation documented with evidence
- [ ] Report signed by pilot lead (manual step — human)

---

## Phase 4 Completion Checklist

- [ ] Task 4.1 — Staging environment running
- [ ] Task 4.2 — UAT seed data loaded in staging
- [ ] Task 4.3 — 5 UAT scenario scripts written
- [ ] Task 4.4 — Smoke tests passing on staging
- [ ] Task 4.5 — Performance targets met
- [ ] Task 4.6 — All P1/P2 defects resolved with regression tests
- [ ] Task 4.7 — Pilot assessment report generated with GO recommendation

**Gate:** `docs/pilot-assessment.md` must show **GO** recommendation before starting Phase 5.
Agent must output `PHASE_4_COMPLETE` before starting Phase 5.
