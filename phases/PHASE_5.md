# Phase 5 — Controlled Production Rollout

> **Agent instruction:** This phase moves the system from pilot to live production.
> `PHASE_4_COMPLETE` and a GO recommendation in `docs/pilot-assessment.md` are required.
> Focus on security hardening, monitoring, and zero-downtime deployment.

**Phase goal:** Deploy to production. Train users. Retire manual processes. Stabilize.

---

## Task 5.1 — Production Environment Hardening

**Files:** `.env.production.example`, `infrastructure/production/`

Apply production security settings:

1. **Environment variables audit** — ensure no development values leak to production:
```bash
# All required production variables
DATABASE_URL=                    # PostgreSQL connection string (SSL required: ?sslmode=require)
NEXTAUTH_SECRET=                 # Minimum 32 chars, generated with: openssl rand -base64 32
NEXTAUTH_URL=                    # Full production URL e.g. https://occ-handover.internal
NODE_ENV=production
LOG_LEVEL=info                   # info | warn | error (never debug in production)
DB_POOL_MAX=10                   # Prisma connection pool size
DB_CONNECT_TIMEOUT=5000          # ms
SESSION_MAX_AGE=28800            # 8 hours in seconds (one shift duration)
```

2. **Security headers** — add to `next.config.js`:
```javascript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  }
]

module.exports = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  }
}
```

3. **Database SSL enforcement:**
```typescript
// lib/prisma.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.NODE_ENV === 'production' ? '?sslmode=require' : '')
    }
  },
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error']
})
```

4. **Rate limiting** — add to API routes:
```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window per IP
  message: { error: 'TOO_MANY_REQUESTS' }
})

app.use('/api/v1', limiter)
```

**Acceptance criteria:**
- [ ] Security headers present on all responses (verify with curl)
- [ ] Database connection uses SSL in production
- [ ] SESSION_MAX_AGE = 8 hours (matches shift duration)
- [ ] Rate limiter active on all API routes
- [ ] No `console.log` in production code (`grep -r "console.log" --include="*.ts" frontend/ backend/` returns zero results)
- [ ] `NODE_ENV=production npm run build` succeeds

---

## Task 5.2 — Production Database Migration

**File:** `database/migration-checklist.md`

Create migration runbook for production database:

```markdown
# Production Migration Checklist

## Pre-migration
- [ ] Take full database backup: `pg_dump occ_handover_staging > backup-$(date +%Y%m%d).sql`
- [ ] Verify backup is restorable
- [ ] Confirm maintenance window with OCC operations team
- [ ] Announce to users: system down for migration 02:00–03:00 (Night shift low activity)

## Migration steps (run in order)
1. `npx prisma migrate deploy` — applies all pending migrations
2. `npx prisma db seed` — if initial production seed required
3. `npx prisma generate` — regenerate client

## Post-migration verification
- [ ] `npx prisma studio` — spot check 5 tables for correct schema
- [ ] Run smoke tests against production: `STAGING_URL=https://occ.internal npm run test:smoke`
- [ ] Verify audit log table is empty (fresh start)
- [ ] Verify user table has correct initial users

## Rollback procedure (if migration fails)
1. Stop the application
2. Restore from backup: `psql occ_handover < backup-YYYYMMDD.sql`
3. Deploy previous application version
4. Notify users of delay
```

**Acceptance criteria:**
- [ ] Migration checklist reviewed by a human before execution
- [ ] Rollback procedure documented and tested on staging
- [ ] Migration completes in < 30 minutes

---

## Task 5.3 — Monitoring & Alerting

**File:** `infrastructure/monitoring.md`, `backend/src/lib/logger.ts`

Set up structured logging and error monitoring:

1. **Structured logging:**
```typescript
// backend/src/lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  base: { service: 'occ-handover-api', env: process.env.NODE_ENV }
})

// Usage in services:
logger.info({ handoverId, userId, action: 'CREATED' }, 'Handover created')
logger.error({ err, handoverId }, 'Failed to create handover')
```

2. **Health check endpoint:**
```typescript
// GET /api/health
router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() })
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected' })
  }
})
```

3. **Key metrics to monitor** (document in `infrastructure/monitoring.md`):
   - `GET /api/health` — check every 60 seconds. Alert if not `200 OK` for > 2 minutes
   - Database connection pool exhaustion — alert if pool usage > 80%
   - `POST /api/v1/handovers` error rate — alert if > 5% error rate in any 5-minute window
   - Session failures — alert on spike in `401` responses

4. **Error tracking** — wrap unhandled errors:
```typescript
// Express global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error')
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' })
  // Never expose stack trace or err.message to client in production
})
```

**Acceptance criteria:**
- [ ] `/api/health` returns `200 ok` when DB connected
- [ ] `/api/health` returns `503` when DB unreachable
- [ ] All service functions use structured logger (no `console.log`)
- [ ] Global error handler catches and logs all unhandled errors
- [ ] Health check monitored externally (document the monitoring tool/URL)

---

## Task 5.4 — CI/CD Pipeline

**File:** `.github/workflows/production.yml`

```yaml
name: Production Deploy

on:
  push:
    tags:
      - 'v*'  # Deploy only on version tags: git tag v1.0.0 && git push --tags

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - name: Fail if coverage < 80%
        run: npx vitest --coverage --coverage.thresholds.lines=80

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - name: Build Docker image
        run: docker build -t occ-handover:${{ github.ref_name }} .

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Run migrations
        run: npx prisma migrate deploy
      - name: Deploy new container
        run: |
          docker pull occ-handover:${{ github.ref_name }}
          docker stop occ-handover-prod || true
          docker run -d --name occ-handover-prod \
            --env-file /etc/occ-handover/.env \
            -p 3000:3000 \
            occ-handover:${{ github.ref_name }}
      - name: Smoke test production
        run: STAGING_URL=${{ secrets.PROD_URL }} npm run test:smoke
```

**Acceptance criteria:**
- [ ] Pipeline runs on version tag push
- [ ] Pipeline blocks deploy if tests fail
- [ ] Pipeline blocks deploy if coverage < 80%
- [ ] Smoke tests run against production after deploy
- [ ] Pipeline fails and alerts if smoke tests fail post-deploy

---

## Task 5.5 — User Documentation

**Files:** `docs/user-guides/`

Create three user guides as markdown files:

### `docs/user-guides/occ-staff-guide.md`
Topics:
1. How to log in
2. Reading the dashboard (what each KPI means)
3. Creating a new handover (step by step with screenshots)
4. Adding multiple items to a category
5. Updating an item status during your shift
6. Acknowledging an incoming handover
7. Exporting / printing a handover
8. What "Carried Forward" means

### `docs/user-guides/supervisor-guide.md`
Topics (extends staff guide, plus):
1. Viewing all shifts' handovers (not just own)
2. Manually triggering carry-forward
3. Closing and resolving items
4. Viewing the audit trail
5. User management (if ADMIN role)

### `docs/user-guides/management-viewer-guide.md`
Topics:
1. Viewing the dashboard (read-only)
2. Filtering the handover log
3. Exporting reports

**Acceptance criteria:**
- [ ] Each guide covers all features available to that role
- [ ] No guide describes features unavailable to that role
- [ ] Guides use actual UI label names (match exactly what appears in the app)

---

## Task 5.6 — Manual Retirement Plan

**File:** `docs/retirement-plan.md`

Document the plan to retire the old manual handover process:

```markdown
# Manual Process Retirement Plan

## Current manual processes to retire
1. WhatsApp/Teams shift handover messages
2. Excel handover log (shared drive: OCC/Handovers/2025/)
3. Email summaries sent to management
4. Verbal handover only (no written record)

## Retirement criteria (per process)
Each process is retired when:
- [ ] Digital system has been used for 2 consecutive weeks without issues
- [ ] All active users trained on digital system
- [ ] Management confirms reporting needs met by dashboard

## Transition period (2 weeks)
Week 1: Run digital system IN PARALLEL with existing manual process
Week 2: Digital system PRIMARY, manual process as backup only
Week 3+: Manual process fully retired

## Rollback trigger
If a P1 production defect is found during weeks 1-2:
- Immediately fall back to manual process
- Do not retire until defect is resolved and re-tested
```

**Acceptance criteria:**
- [ ] All existing manual processes listed
- [ ] Retirement criteria defined (measurable)
- [ ] Rollback trigger defined clearly

---

## Task 5.7 — Stabilization Monitoring (First 30 Days)

**File:** `docs/stabilization-report-template.md`

Create a weekly monitoring report template:

```markdown
# Stabilization Report — Week [N]

**Period:** [date] to [date]
**Prepared by:** [agent or human]

## System Health
- Uptime: [%]
- Average dashboard response time: [ms]
- Error rate (5xx): [%]
- Health check failures: [count]

## Usage
- Total handovers created: [count]
- Active users: [count]
- Handovers per shift: Morning=[n] Afternoon=[n] Night=[n]
- Items carried forward: [count]
- Items resolved: [count]

## Issues This Week
| Issue | Severity | Resolved | Notes |
|---|---|---|---|

## Manual Process Status
- WhatsApp handover: Still in use / Retired
- Excel log: Still in use / Retired

## Recommendation
Continue / Escalate / Rollback
```

**Agent task for each week of stabilization:**
1. Query production database for usage stats
2. Check monitoring alerts log
3. Fill in template and save as `docs/stabilization-report-week-N.md`
4. If any metric outside acceptable range: raise alert before next report

---

## Phase 5 Completion Checklist

- [ ] Task 5.1 — Production hardening (security headers, SSL, rate limiting, no console.log)
- [ ] Task 5.2 — Database migration runbook prepared and executed
- [ ] Task 5.3 — Health check + structured logging + monitoring configured
- [ ] Task 5.4 — CI/CD pipeline deploying on version tags
- [ ] Task 5.5 — User guides for all 3 roles
- [ ] Task 5.6 — Manual retirement plan with rollback trigger
- [ ] Task 5.7 — 4 weekly stabilization reports generated

**Final production gate:**
- [ ] `GET /api/health` returns `200 ok` in production
- [ ] Zero P1/P2 defects open
- [ ] Smoke tests pass against production
- [ ] All manual processes either retired or on retirement schedule
- [ ] Coverage ≥ 80% confirmed in CI

**Gate:** Agent outputs `PROJECT_COMPLETE` when all 5 phase gates are confirmed.
