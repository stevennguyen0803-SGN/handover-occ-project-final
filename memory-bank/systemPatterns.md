# System Patterns - OCC Handover System

## High-Level Architecture
```text
Next.js frontend -> Express API -> Prisma ORM -> PostgreSQL
        |                |
        |                -> Audit logging service
        |
        -> Shared Zod schemas and enum definitions
```

## Main Design Patterns
| Pattern | Applied In | Reason |
| --- | --- | --- |
| Schema-first design | Shared docs and Zod schemas | Keeps API, validation, and UI aligned |
| Service layer | Backend business logic | Enforces business rules outside controllers |
| Middleware | Auth, roles, soft delete, error handling | Consistent cross-cutting behavior |
| Audit snapshot diff | Mutation tracking | Stores changed fields only in `AuditLog` |
| Carry-forward service | Shift-to-shift continuity | Recreates open and monitoring items for next handover |

## Main Data Flows
1. Create handover: frontend form -> Zod validation -> service layer -> Prisma create -> audit log write -> response
2. Update item status: API request -> transition validation -> mutation -> status audit log -> dashboard refresh
3. Acknowledge handover: auth user -> ownership check -> acknowledgment create -> set first `acknowledgedAt` -> audit log
4. Carry forward: source handover query -> filter open and monitoring items -> clone items into target handover -> mark target linkage -> audit log

## Planned Modules
| Module | Responsibility | Planned Location |
| --- | --- | --- |
| Shared schemas | Zod schemas and enums used by frontend and backend | `shared/` then implementation in app packages |
| Handover service | Create, update, acknowledge, carry forward | `backend/` |
| Role middleware | Role and ownership authorization | `backend/` |
| Dashboard queries | Aggregations and summary endpoints | `backend/` |
| UI forms and tables | Create, detail, dashboard, exports | `frontend/` |
| Prisma schema and migrations | Database structure and seeds | `database/` |

## Coding Conventions
- Naming: TypeScript conventions with camelCase for variables and functions
- Validation: Zod at the boundary before any persistence
- Error handling: structured API errors only, never silent failures
- Mutations: every create, update, status change, acknowledge, carry-forward, and delete must log audit data
- Access control: protected routes must use role middleware and ownership checks where needed

Last updated: 2026-04-21
