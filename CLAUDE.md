# OCC Handover System - AI Session Rules

## Start of Every Session
Read these files first:
1. `memory-bank/activeContext.md` - current status and immediate next steps
2. `memory-bank/progress.md` - what is done, what is pending, and known gaps

After reading, confirm briefly:
"I have read the context. The project is currently at [X], and the next step is [Y]."

## Tech Stack
- Language: TypeScript
- Frontend: React 18 + Next.js 14 (App Router)
- Backend: Node.js + Express 5
- Database: PostgreSQL 15 via Prisma ORM
- Auth: NextAuth.js v5
- Validation: Zod
- Testing: Vitest + React Testing Library
- Export: react-pdf, csv-stringify
- CI: GitHub Actions

## Project Structure
```text
project-root/
|-- PLAN.md
|-- AGENTS.md
|-- CLAUDE.md
|-- memory-bank/
|-- shared/
|-- phases/
|-- frontend/
|-- backend/
|-- database/
`-- docs/
```

## Do
- Always read `memory-bank/activeContext.md` before making changes.
- Follow the phase order exactly: Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5.
- Treat `shared/DATA_MODEL.md`, `shared/API_SPEC.md`, and `shared/BUSINESS_RULES.md` as source of truth.
- Keep TypeScript strict mode enabled.
- Validate all inputs with Zod before database writes.
- Write audit trail entries for every mutation.
- Enforce role checks on every protected route.
- Update `memory-bank/activeContext.md` and `memory-bank/progress.md` at the end of each session.

## Do Not
- Do not start Phase 2 before `PHASE_1_COMPLETE`.
- Do not invent field names that differ from `shared/DATA_MODEL.md`.
- Do not accept `referenceId` from clients.
- Do not use `localStorage` in production code.
- Do not hard-delete handovers or items.
- Do not change the schema or add dependencies without updating the project memory and relevant docs.

## Important Commands
```bash
# Current repo state
# Documentation and planning only. No runnable app yet.

# Future Phase 2 commands (planned)
npm install
npm test
npm run build
npx prisma migrate dev
```

## End of Every Session
Update:
- `memory-bank/activeContext.md`
- `memory-bank/progress.md`

If context is getting large, also refresh:
- `memory-bank/decisions-log.md`
- `memory-bank/SESSION_HANDOFF.md`
