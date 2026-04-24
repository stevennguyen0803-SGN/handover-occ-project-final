# Performance Report

Status on `2026-04-24`: Final no-Docker benchmark pass completed after dashboard, handover list, create-path, and runtime pool optimizations. Performance targets are now **met** for all scoped Task 4.5 endpoints.

## Goal

Validate the Phase 4 pilot environment under light operational load without Docker or WSL on this Windows host.

This plan is intentionally scoped to the already verified local path:

1. `npm run build`
2. `npm run verify:staging:local`
3. `npm run db:seed:uat`
4. `npm run test:smoke`
5. Run the performance checks below against the live local URLs

## No-Docker Constraints

- Docker Desktop Linux engine cannot start on this host because WSL is not installed.
- The local production-mode app is already reachable without Docker at:
  - Frontend: `http://localhost:3000`
  - Backend: `http://localhost:4000`
- Performance checks should therefore measure the real no-Docker pilot path, not container startup or compose networking.
- Backend API load should hit `:4000` directly where possible, because the current frontend does not proxy every reporting endpoint and direct backend auth is already proven by the smoke harness.

## Test Scope

The first no-Docker pass should cover 3 endpoints that map directly to the Phase 4 acceptance targets:

| Endpoint | Why it matters | Target |
| --- | --- | --- |
| `GET http://localhost:4000/api/v1/dashboard/summary` | Most important read path for operational overview | Avg `< 200ms`, P95 `< 500ms`, P99 `< 1s` |
| `GET http://localhost:4000/api/v1/handovers?limit=20&sortBy=createdAt&sortOrder=desc` | Main log/list query used in browser UAT | Avg `< 300ms`, P95 `< 600ms`, P99 `< 1s` |
| `POST http://localhost:4000/api/v1/handovers` | Critical write path for new handover creation | Avg `< 500ms`, P95 `< 1s`, P99 `< 2s` |

Secondary sanity probes:

- `GET http://localhost:4000/health`
- `GET http://localhost:3000/login`

These secondary probes are not performance targets; they only confirm the environment is still healthy before and after the load run.

## Authentication Strategy

Use the same signed backend header model that already works in:

- `tests/smoke/smoke.test.ts`
- Phase 3 manual verification

Recommended users:

- Read load: `supervisor@occ.test`
- Write load: `staff@occ.test`
- Cleanup and archive ownership: `admin@occ.test`

This avoids browser-cookie complexity and keeps the benchmark focused on the backend and database path that actually does the work.

## Data Strategy

Start with the current UAT dataset from `npm run db:seed:uat`.

For the first no-Docker pass:

- `dashboard/summary` and `handovers?limit=20` can run on the standard UAT seed.
- `POST /handovers` should create uniquely tagged records and soft-archive them after the run, similar to the smoke test cleanup pattern.

If the first read tests are comfortably below target, but the list query still needs a larger dataset to be meaningful, add a follow-up bulk loader in a later subtask:

- optional file: `database/prisma/perf-seed.ts`
- purpose: create hundreds of historical handovers without changing production behavior

That bulk seed is not required for the first no-Docker pass.

## Execution Plan

### Step 1 - Environment Warmup

Run these commands in order:

```bash
npm run build
npm run verify:staging:local
npm run db:seed:uat
npm run test:smoke
```

Expected:

- frontend and backend are healthy
- seeded `@occ.test` users exist
- create/carry-forward/acknowledge path is already green before any load is applied

### Step 2 - Baseline Latency Check

Before concurrency testing, send a small number of sequential requests to record warm-cache and cold-start behavior:

- 10 sequential requests to `GET /api/v1/dashboard/summary`
- 10 sequential requests to `GET /api/v1/handovers?...`
- 5 sequential requests to `POST /api/v1/handovers` with unique tags

Capture:

- min
- avg
- max
- any non-2xx responses

### Step 3 - Sustained Read Load

Run read endpoints under concurrency using a no-Docker local tool.

Preferred tool:

- `autocannon` if available locally

Fallback tool:

- a repo-local Node script using `fetch`, `performance.now()`, and `Promise.allSettled`

Recommended read-load stages:

1. `5` concurrent clients for `30s`
2. `10` concurrent clients for `30s`
3. `20` concurrent clients for `30s`

Record:

- requests/sec
- avg latency
- P95
- P99
- non-2xx count

### Step 4 - Controlled Write Load

Do not hammer `POST /handovers` at `20` concurrent writes immediately.

Use a controlled write profile:

1. `2` concurrent clients for `20s`
2. `5` concurrent clients for `20s`

Rules:

- each request must generate a unique date/shift slot or unique tagged payload strategy
- all created records must be soft-archived after the test
- stop immediately if duplicate-slot conflicts dominate the sample

The goal is not maximum throughput; it is to confirm the write path remains stable and comfortably under the Phase 4 latency target during realistic pilot pressure.

### Step 5 - Evidence Capture

Document final numbers in the results table below and mark each endpoint `PASS` or `FAIL`.

If any target fails:

1. inspect the corresponding backend service and Prisma query path
2. check for N+1 behavior
3. inspect query filters/order clauses
4. use PostgreSQL `EXPLAIN ANALYZE` for the slow path
5. add missing indexes only if the query plan proves they are needed
6. rerun the same load profile and update this report

## Implemented Benchmark Runner

Task 4.5 uses a lightweight standalone runner:

1. `scripts/perf-check.mjs` reuses the signed backend auth helper pattern from `tests/smoke/smoke.test.ts`.
2. The runner emits plain-text tables plus JSON so benchmark evidence can be pasted into this report.
3. Performance-created handovers are soft-archived automatically through the same no-hard-delete rule used elsewhere.

## Results Table

| Endpoint | Load Profile | Avg Response | P95 | P99 | Errors | Pass/Fail | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /api/v1/dashboard/summary` | `20 concurrent x 30s` | `166.50ms` | `202.88ms` | `244.82ms` | `0` | `PASS` | Dashboard aggregation now runs as a consolidated raw SQL path and stays under every target at the acceptance profile. |
| `GET /api/v1/handovers?limit=20&sortBy=createdAt&sortOrder=desc` | `20 concurrent x 30s` | `170.45ms` | `217.67ms` | `284.85ms` | `0` | `PASS` | The default list path now uses a raw SQL fast path with primitive result casting to avoid Prisma native Date/enum decode overhead. |
| `POST /api/v1/handovers` | `5 concurrent x 20s` | `423.43ms` | `470.21ms` | `669.42ms` | `0` | `PASS` | Concurrent writes stayed stable after simplifying reference ID generation and parallelizing pre-create reads. |

## Final Pass Notes

Execution date: `2026-04-24`

Warmup and verification path used before the final benchmark:

1. `npm --prefix backend run build`
2. Focused service tests for carry-forward, dashboard, and handover query behavior
3. Restarted the local production-mode app
4. `npm run test:smoke`
5. `npm run perf:check`

Environment used:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Prisma runtime override: `DATABASE_CONNECTION_LIMIT=20`
- Dataset: current UAT seed plus benchmark-created records, with `[PERF-CHECK]` handovers soft-archived after the run

Key optimization findings:

- Dashboard latency was primarily query fan-out plus connection queueing; consolidating the dashboard into a single aggregate query removed the fan-out, and matching the pool to the `20` concurrent read profile removed the queue.
- Handover list DB execution was already sub-millisecond under `EXPLAIN ANALYZE`; the remaining cost was the remote Prisma round trip and native Date/enum decoding. Casting list Date/enum fields to text/epoch in the SQL fast path reduced the list endpoint to the target range.
- Create latency was reduced by using sequence-only reference ID generation, parallelizing pre-create checks, and skipping carry-forward lookups when no previous handover exists.

Cleanup verification:

- The final run soft-archived `338` active `[PERF-CHECK]` handovers after the run.
- The local app stayed reachable after cleanup on both `http://localhost:3000/login` and `http://localhost:4000/health`.

## Second Pass Notes

Execution date: `2026-04-24`

Warmup path used before the benchmark:

1. `npm run verify:staging:local`
2. `npm run db:seed:uat`
3. `npm run test:smoke`
4. `npm run perf:check`

Environment used:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Existing no-Docker production-mode app process restarted after the backend rebuild
- Prisma runtime override: `DATABASE_CONNECTION_LIMIT=10`

Observed baseline behavior before concurrency ramps:

- `GET /api/v1/dashboard/summary` stayed functionally correct at `10 sequential`, but still averaged `373.03ms`.
- `GET /api/v1/handovers?limit=20&sortBy=createdAt&sortOrder=desc` stayed functionally correct at `10 sequential`, but still averaged `760.85ms`.
- `POST /api/v1/handovers` succeeded at `5 sequential`, but still averaged `1173.00ms`.

Cleanup verification:

- The performance runner soft-archived `99` active `[PERF-CHECK]` handovers after the run.
- The local app stayed reachable after cleanup on both `http://localhost:3000/login` and `http://localhost:4000/health`.

## First Pass Comparison

The second pass removed the first pass's hard failures, but it did not yet meet the latency targets:

- `GET /api/v1/dashboard/summary`: improved from `9267.78ms` avg with `67` errors to `4545.79ms` avg with `0` errors.
- `GET /api/v1/handovers?limit=20&sortBy=createdAt&sortOrder=desc`: improved from `9460.92ms` avg with `23` errors to `1423.78ms` avg with `0` errors.
- `POST /api/v1/handovers`: improved from `4793.01ms` avg with `1` error to `1865.59ms` avg with `0` errors.

The biggest reliability wins in the second pass came from:

- increasing the Prisma runtime pool size for the long-lived local pilot process with `DATABASE_CONNECTION_LIMIT=10`
- fixing raw SQL enum comparisons in `dashboard.service.ts` so `dashboard/summary` no longer fails with PostgreSQL `42883`

## Resolved Bottleneck

The dominant failure mode moved in stages:

1. The first pass failed due to Prisma pool starvation and some transient write errors.
2. The second pass removed errors but exposed query fan-out and result decoding latency.
3. The final pass met all latency targets by reducing dashboard/list round trips, avoiding expensive native decode work on the list path, simplifying create reference generation, and sizing the long-lived local app pool to the acceptance concurrency profile.

No unexpected `5xx` responses occurred in the final benchmark.

## Acceptance Mapping

Task 4.5 can be considered complete for the no-Docker pilot path when all of the following are true:

- the 3 core endpoints above meet their latency targets
- there are no unexpected 5xx errors during the planned load profiles
- the dashboard path is still aggregation-based and does not regress into in-memory counting
- the handover list path does not show obvious N+1 behavior
- write-test records are cleaned up through soft-delete, not hard delete

## Out Of Scope

This no-Docker plan does not attempt to certify:

- Docker compose networking performance
- Linux host tuning
- production-grade multi-node scaling
- browser rendering metrics such as Core Web Vitals

Those belong to later staging or production-hardening work, not the current Windows-host pilot fallback path.
