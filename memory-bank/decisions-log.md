# Decisions Log - OCC Handover System

> Append-only record of important product, architecture, and workflow decisions.

## Decision History

### 2026-04-21 - Use project memory files for every session
- Context: The project is documentation-heavy and will span multiple sessions. Relying on chat history alone would make it easy to lose the current phase, unresolved gaps, and next actions.
- Options considered:
  - Option A: rely on conversation history only
  - Option B: maintain a dedicated `memory-bank/` inside the repo
- Decision: Choose **Option B**
- Why: `activeContext.md` and `progress.md` provide a durable session handoff and keep the project state explicit for every new session.
- Accepted trade-offs: small documentation overhead at the end of each session
- Revisit if: the team later adopts a different shared project memory tool

### 2026-04-21 - Align seeded docs to the structure defined in `PLAN.md`
- Context: The repository started with shared and phase docs at repo root, but `PLAN.md` and `PHASE_1.md` both reference `shared/` and `phases/` paths.
- Options considered:
  - Option A: keep root-level files and update every reference manually
  - Option B: move the docs into `shared/` and `phases/` so the repo matches the documented structure
- Decision: Choose **Option B**
- Why: matching the documented structure reduces ambiguity and makes all later Phase 1 outputs land in the right place.
- Accepted trade-offs: any old direct references to root-level file paths need to be updated
- Revisit if: the user chooses a different repository layout later

### 2026-04-21 - Keep Phase 1 documentation-only
- Context: `phases/PHASE_1.md` explicitly states that this phase produces no runnable code and serves as the baseline for Phase 2.
- Options considered:
  - Option A: start scaffolding code while refining docs
  - Option B: freeze the docs first and delay implementation
- Decision: Choose **Option B**
- Why: the project has several unresolved rule and API gaps that would otherwise leak into implementation and cause rework.
- Accepted trade-offs: slower visible progress in code during the first phase
- Revisit if: the phase definition itself is formally changed

### 2026-04-21 - Add soft delete directly to the canonical data model
- Context: BR-11 requires soft delete on handovers and items, but the seeded data model did not include `deletedAt`.
- Options considered:
  - Option A: leave soft delete as an implementation detail outside the schema docs
  - Option B: add `deletedAt` to `Handover` and all item models in the canonical model
- Decision: Choose **Option B**
- Why: soft delete affects query behavior, indexes, and API semantics, so it belongs in the baseline data model.
- Accepted trade-offs: more schema fields and default query rules to maintain
- Revisit if: the project adopts a separate archival storage strategy

### 2026-04-21 - Use a sequence-backed reference ID strategy
- Context: the seeded `referenceId` example used `count()`, which can break the "never reused" rule under deletes or concurrent writes.
- Options considered:
  - Option A: continue with count-based numbering
  - Option B: switch to a database-backed monotonic sequence
- Decision: Choose **Option B**
- Why: it is safer for concurrency and aligns with the business rule that IDs are never reused.
- Accepted trade-offs: requires a database migration to create the sequence
- Revisit if: the reference ID format requirements become year-local instead of globally monotonic

### 2026-04-21 - Keep both automatic and manual carry-forward paths
- Context: BR-07 requires automatic carry-forward, while the API specification already exposed a manual carry-forward endpoint.
- Options considered:
  - Option A: remove the manual endpoint and rely only on automatic carry-forward
  - Option B: keep automatic carry-forward in the service layer and retain the endpoint for supervisor/admin retry flows
- Decision: Choose **Option B**
- Why: the automatic path satisfies the business rule, and the manual path gives operations a recovery tool without weakening the rule.
- Accepted trade-offs: two entry points need clear documentation so the implementation does not double-carry items
- Revisit if: operations decides the manual recovery endpoint is unnecessary

### 2026-04-21 - Add nullable `passwordHash` to `User`
- Context: Phase 2 authentication uses a credentials provider, but the Phase 1 `User` model did not include any stored password hash.
- Options considered:
  - Option A: keep the `User` model unchanged and defer credentials auth
  - Option B: add `passwordHash String?` so credentials users can authenticate while SSO-only users remain supported
- Decision: Choose **Option B**
- Why: credentials auth is part of the Phase 2 scope, and a nullable hash keeps the model compatible with future SSO users.
- Accepted trade-offs: Phase 1 data model needed a small follow-up amendment after implementation started
- Revisit if: the project fully commits to SSO and removes credentials auth

### 2026-04-21 - Pin Prisma to `6.16.2`
- Context: installing the latest Prisma CLI pulled Prisma 7, which no longer supports the classic `url = env("DATABASE_URL")` schema format used by the Phase 1 baseline.
- Options considered:
  - Option A: rewrite the whole repo to the Prisma 7 config style during bootstrap
  - Option B: pin Prisma to a stable 6.x version that matches the Phase 1 schema and migration flow
- Decision: Choose **Option B**
- Why: it preserves the agreed baseline and reduces churn while the repo is still being bootstrapped.
- Accepted trade-offs: the project is intentionally not on the latest Prisma major version yet
- Revisit if: the team later wants to upgrade the stack after the MVP is stable

### 2026-04-24 - Override Prisma pool size at runtime for long-lived pooled environments
- Context: the shared `.env` currently points Prisma at the Supabase pooler URL, and the existing query string carried `connection_limit=1` from the earlier serverless-friendly setup. That was appropriate for bursty short-lived functions, but it starved the long-lived local/staging Node process during Task 4.5 load checks.
- Options considered:
  - Option A: keep the pooled URL untouched and tune only the benchmark profiles
  - Option B: move the local no-Docker pilot path to a direct database URL
  - Option C: keep the pooled URL but add an explicit runtime override for long-lived app processes
- Decision: Choose **Option C**
- Why: it preserves the existing shared connection path while making the runtime intent explicit for local/staging app servers, and it removed the `P2024` / `P2028` failure mode without needing a separate secret or URL fork.
- Accepted trade-offs: the repo now needs a small runtime helper and one more documented env knob (`DATABASE_CONNECTION_LIMIT`) to keep launcher behavior predictable.
- Revisit if: the team later splits serverless/frontend and long-lived/backend database URLs or moves staging off the current Supabase-backed pilot path

### 2026-04-24 - Match the local/staging Prisma pool to the 20-client read benchmark
- Context: after query fan-out was reduced, the `20` concurrent Task 4.5 read profile still queued behind `DATABASE_CONNECTION_LIMIT=10`, keeping average dashboard/list latency above target even though lower-concurrency stages were healthy.
- Options considered:
  - Option A: keep the pool at `10` and accept queueing in the benchmark
  - Option B: raise the long-lived local/staging pool override to `20`
  - Option C: lower the acceptance concurrency profile
- Decision: Choose **Option B**
- Why: the benchmark explicitly tests `20` concurrent read clients, and the long-lived local/staging Node app can safely size its Prisma pool to that pilot profile. The final run with `DATABASE_CONNECTION_LIMIT=20` passed all targets with zero errors.
- Accepted trade-offs: local/staging consumes more pooled database connections during load checks.
- Revisit if: Supabase pooler limits change, staging moves to a smaller database tier, or a production deployment has a different concurrency budget.

### 2026-04-24 - Use primitive-cast raw SQL for the default handover list path
- Context: `EXPLAIN ANALYZE` showed the default handover list SQL executed in under `1ms`, but Prisma raw queries returning native Date/enum values still cost roughly `300ms+` on the Supabase-backed path.
- Options considered:
  - Option A: keep native Date/enum result types and accept the overhead
  - Option B: split list counts/users into more queries
  - Option C: keep one query but cast Date/enum fields to text/epoch primitives and preserve the API response shape in TypeScript
- Decision: Choose **Option C**
- Why: it reduced the list path to the target range without changing schema, API names, or frontend behavior.
- Accepted trade-offs: the fast path now has explicit timestamp conversion logic that tests should protect.
- Revisit if: Prisma native decode overhead improves materially or the list response shape changes.

### 2026-04-24 - Treat the no-Docker benchmark pass as Task 4.5 pilot evidence
- Context: this Windows host cannot run the canonical Linux Docker compose path because WSL is unavailable, but the local production-mode app exercises the real Supabase-backed backend/database path used for pilot validation.
- Options considered:
  - Option A: block Task 4.5 until Docker compose can run on this host
  - Option B: complete Task 4.5 for the verified no-Docker pilot path and keep Task 4.1's Linux compose run as the separate remaining staging acceptance item
- Decision: Choose **Option B**
- Why: Task 4.5 is about dashboard/list/create behavior under load, which the no-Docker path now measures directly and repeatedly. Docker compose live verification remains tracked under Task 4.1.
- Accepted trade-offs: the performance report is explicit that it certifies the no-Docker pilot fallback, not container networking performance.
- Revisit if: a Linux Docker host becomes available before go/no-go and the team wants a second containerized performance evidence pass.
- Superseded note: later on 2026-04-24, Docker was removed as a Task 4.1 acceptance gate, so the compose run is no longer a Phase 4 blocker.

### 2026-04-24 - Remove Docker as a Task 4.1 acceptance gate
- Context: the Windows host cannot run Docker Desktop's Linux engine without WSL, while the no-Docker production-mode staging path has already passed build, migration/startup, readiness, smoke, UAT verifier, and performance checks.
- Options considered:
  - Option A: keep Task 4.1 blocked on a Linux Docker compose run
  - Option B: accept the no-Docker local production-mode staging path for Phase 4 and keep Docker/compose artifacts as optional scaffolding
- Decision: Choose **Option B**
- Why: the user explicitly directed "bo docker di cho task 4.1", and the no-Docker path is the actual pilot path used for UAT and benchmark evidence.
- Accepted trade-offs: Phase 4 no longer certifies container startup or compose networking behavior.
- Revisit if: production deployment later requires Docker as a formal operational target.

### 2026-04-24 - Allocate UAT handover references through the production sequence
- Context: Task 4.6 found BUG-001 after a fresh `npm run db:seed:uat`: the UAT loader assigned `referenceId` values from `MAX(referenceId)` while the live app still generated new IDs from `handover_reference_seq`, allowing the next app-created handover to collide with a seeded reference.
- Options considered:
  - Option A: keep max-suffix allocation and run a separate manual sequence sync after reseeding
  - Option B: make the UAT loader synchronize and allocate through `handover_reference_seq`
  - Option C: switch the app away from the sequence for normal creation
- Decision: Choose **Option B**
- Why: it preserves the production monotonic ID mechanism and makes UAT reseeds safe to run repeatedly before human browser testing.
- Accepted trade-offs: the UAT seed script now has a slightly more complex SQL allocation query.
- Revisit if: the reference ID service moves into a shared helper used directly by both runtime creation and seed tooling.
