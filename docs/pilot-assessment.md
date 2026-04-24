# Pilot Assessment Report

Status date: 2026-04-24

## Summary

- Pilot path assessed: no-Docker local production-mode staging
- Frontend URL: `http://localhost:3000`
- Backend URL: `http://localhost:4000`
- Participating seeded UAT users: 4 (`staff@occ.test`, `supervisor@occ.test`, `viewer@occ.test`, `admin@occ.test`)
- Participating seeded shifts: Morning, Afternoon, Night across the 5 UAT scenarios
- Active UAT scenarios verified: 5
- Latest active UAT references: `HDO-2026-001371` through `HDO-2026-001375`
- Defects found: P1=1, P2=0, P3=0, P4=0
- Defects resolved: 1
- Open P1 defects: 0
- Open P2 defects: 0

Task 4.1 scope note: Docker is no longer required for Phase 4 staging acceptance. The accepted pilot evidence is the local production-mode staging path verified by `npm run build`, `npm run verify:staging:local`, browser reachability, smoke tests, UAT dataset verification, and performance checks.

## Task 4.1 Staging Evidence

| Check | Evidence | Result |
| --- | --- | --- |
| Frontend and backend build | Outside-sandbox `npm run build` passed | PASS |
| Production-mode staging startup | Outside-sandbox `npm run verify:staging:local` passed | PASS |
| Automatic migration path | Root `npm start` runs `prisma migrate deploy` before app startup through `scripts/start-staging.mjs` | PASS |
| Frontend browser reachability | `http://localhost:3000/login` returned `200` during UAT prep | PASS |
| Backend health reachability | `http://localhost:4000/health` returned `200` during UAT prep | PASS |

## UAT Dataset Evidence

| Check | Evidence | Result |
| --- | --- | --- |
| UAT seed can refresh data | `npm run db:seed:uat` passed after BUG-001 fix | PASS |
| UAT users exist | `npm run verify:uat` checks all 4 `@occ.test` users | PASS |
| Five scenario records exist | `npm run verify:uat` checks 5 active scenarios | PASS |
| Scenario-specific data shape | `npm run verify:uat` checks item/audit shape and Scenario 1 Afternoon availability | PASS |
| Reference sequence health | `npm run verify:uat` passed with next sequence value `1378` greater than max suffix `1377` | PASS |

## Smoke Test Results

Latest recorded smoke evidence from Task 4.6:

| Check | Evidence | Result |
| --- | --- | --- |
| Frontend login reachable | Covered by `npm run test:smoke` against live local app | PASS |
| Backend health reachable | Covered by `npm run test:smoke` against live local app | PASS |
| Create handover | Covered by `npm run test:smoke` | PASS |
| Automatic carry-forward | Covered by `npm run test:smoke` | PASS |
| Acknowledgment | Covered by `npm run test:smoke` | PASS |
| Smoke-created cleanup | Smoke-created handovers are soft-archived | PASS |

## Performance Results

Final Task 4.5 benchmark evidence from `docs/performance-report.md`:

| Endpoint | Load Profile | Avg | P95 | P99 | Errors | Result |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /api/v1/dashboard/summary` | `20 concurrent x 30s` | `166.50ms` | `202.88ms` | `244.82ms` | `0` | PASS |
| `GET /api/v1/handovers?limit=20&sortBy=createdAt&sortOrder=desc` | `20 concurrent x 30s` | `170.45ms` | `217.67ms` | `284.85ms` | `0` | PASS |
| `POST /api/v1/handovers` | `5 concurrent x 20s` | `423.43ms` | `470.21ms` | `669.42ms` | `0` | PASS |

## Defect Summary

| Severity | Found | Fixed | Open | Evidence |
| --- | --- | --- | --- | --- |
| P1 | 1 | 1 | 0 | BUG-001 fixed in `database/prisma/uat-seed.ts`; regression coverage in `scripts/verify-uat-scenarios.mjs`, `npm run verify:uat`, and `npm run test:smoke` |
| P2 | 0 | 0 | 0 | `docs/uat/DEFECT_LOG.md` current snapshot |
| P3 | 0 | 0 | 0 | No P3 defects logged |
| P4 | 0 | 0 | 0 | No P4 defects logged |

## User Feedback Summary

Human browser UAT scripts are ready in `docs/uat/UAT_SCENARIOS.md`, but no separate human pilot feedback has been recorded in the repository yet. The current recommendation is therefore based on automated evidence, seeded scenario verification, and the defect log baseline.

Manual pilot lead sign-off remains a human step before declaring `PHASE_4_COMPLETE`.

## Go / No-Go Criteria

| Criterion | Target | Actual | Result |
| --- | --- | --- | --- |
| Task 4.1 staging path accepted without Docker | Yes | No-Docker local production-mode staging accepted and verified | PASS |
| Zero P1 defects open | 0 | 0 | PASS |
| Zero P2 defects open | 0 | 0 | PASS |
| Fixed defects have regression evidence | 100% | 1 of 1 fixed defects has regression evidence | PASS |
| Smoke tests pass | 100% | Latest `npm run test:smoke` passed | PASS |
| UAT dataset verifier passes | 100% | Latest `npm run verify:uat` passed | PASS |
| Dashboard P95 | `< 500ms` | `202.88ms` | PASS |
| Handover list P95 | `< 600ms` | `217.67ms` | PASS |
| Create handover P95 | `< 1s` | `470.21ms` | PASS |
| Carry-forward working | Yes | Smoke test and UAT verifier evidence pass | PASS |
| Users can create handover in browser in < 5 min | `< 5 min` | Human timing not yet recorded | PENDING |
| Pilot lead sign-off | Signed | Not yet recorded | PENDING |

## Recommendation

GO for the no-Docker Phase 4 pilot path based on current automated evidence.

Do not emit `PHASE_4_COMPLETE` or start Phase 5 until the pilot lead records manual sign-off and any human UAT findings are triaged in `docs/uat/DEFECT_LOG.md`.

## Sign-off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Pilot lead | Pending | Pending | Pending |
