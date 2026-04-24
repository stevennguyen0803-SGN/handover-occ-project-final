# Tech Context - OCC Handover System

## Detailed Stack
| Layer | Technology | Version | Notes |
| --- | --- | --- | --- |
| Language | TypeScript | Strict mode | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` required |
| Frontend | React + Next.js | 18 + 14 | App Router, Tailwind CSS |
| Backend | Node.js + Express | Express 5 | Separate API layer |
| Database | PostgreSQL | 15 | Main operational database |
| ORM | Prisma | Latest planned | Schema generated from `shared/DATA_MODEL.md` |
| Auth | NextAuth.js | v5 beta/planned | Credentials and optional SSO |
| Validation | Zod | Latest planned | Shared between frontend and backend |
| Testing | Vitest + RTL | Latest planned | Jest-compatible approach |
| Export | react-pdf, csv-stringify | Latest planned | PDF and CSV output |
| CI/CD | GitHub Actions | Planned | Lint -> test -> build on PR |

## Planned Dependencies
```text
prisma
@prisma/client
next-auth
zod
@hookform/resolvers
react-hook-form
clsx
tailwind-merge
lucide-react
recharts
@react-pdf/renderer
csv-stringify
vitest
@vitest/coverage-v8
@testing-library/react
```

## Local Setup Status
- Current repo state: documentation only
- Frontend app: not scaffolded yet
- Backend app: not scaffolded yet
- Database migrations: not initialized yet
- Setup guide: to be authored in Phase 1 Task 1.5

## Environment Variables
```text
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
NODE_ENV=
```

## External Services
| Service | Purpose | Auth Method |
| --- | --- | --- |
| PostgreSQL | Main database | Connection string |
| NextAuth providers | User authentication | Credentials and optional SSO |
| GitHub Actions | CI pipeline | Repository secrets |

## Known Technical Gotchas
- The seed documents originally lived at repo root; Phase 1 alignment moved them into `shared/` and `phases/`.
- `shared/DATA_MODEL.md` now includes `deletedAt` fields and sequence-backed reference ID guidance; future schema changes must stay aligned with those decisions.
- `shared/API_SPEC.md` now includes a handover soft-delete route and treats `/carry-forward` as the manual recovery path on top of the automatic BR-07 flow.
- `shared/setup-guide.md` is now partially executed; bootstrap is real, but PostgreSQL is still missing locally.
- The current scaffold uses Prisma `6.16.2` because Prisma 7 broke compatibility with the agreed schema style.
- The current `frontend/` scaffold is on Next 16 / React 19 and should be reconciled with the planned Next 14 / React 18 baseline.

Last updated: 2026-04-21
