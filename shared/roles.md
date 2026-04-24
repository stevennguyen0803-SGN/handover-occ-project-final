# Roles and Permission Matrix - OCC Handover System

This document expands BR-12 into route-level permissions for every endpoint in `shared/API_SPEC.md`.

## Route Matrix

| Route | Purpose | OCC_STAFF | SUPERVISOR | MANAGEMENT_VIEWER | ADMIN | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `POST /api/auth/[...nextauth]` | Sign in / session bootstrap | Public | Public | Public | Public | NextAuth-managed route |
| `GET /api/v1/handovers` | List handovers | Own only | Yes | Yes | Yes | OCC staff sees only their own handovers |
| `POST /api/v1/handovers` | Create handover | Yes | Yes | No | Yes | Authenticated create only |
| `GET /api/v1/handovers/:id` | View handover detail | Own only | Yes | Yes | Yes | OCC staff gets `403` on others' handovers |
| `PATCH /api/v1/handovers/:id` | Update handover header | Own only | Yes | No | Yes | OCC staff limited to their own handovers |
| `DELETE /api/v1/handovers/:id` | Soft-delete handover | No | Yes | No | Yes | Soft delete only |
| `POST /api/v1/handovers/:id/acknowledge` | Acknowledge incoming handover | Yes | Yes | No | No | Caller cannot acknowledge own handover |
| `POST /api/v1/handovers/:id/carry-forward` | Manual carry-forward trigger | No | Yes | No | Yes | Automatic carry-forward is still service-driven |
| `POST /api/v1/handovers/:id/items/:category` | Add item to category | Own only | Yes | No | Yes | OCC staff limited to own handovers |
| `PATCH /api/v1/handovers/:id/items/:category/:itemId` | Update item or item status | Own only | Yes | No | Yes | OCC staff limited to own handovers/items |
| `DELETE /api/v1/handovers/:id/items/:category/:itemId` | Soft-delete item | No | Yes | No | Yes | Soft delete only |
| `GET /api/v1/dashboard/summary` | Dashboard KPIs | Yes | Yes | Yes | Yes | Read-only dashboard access |
| `GET /api/v1/handovers/:id/export/pdf` | Export handover PDF | Yes | Yes | Yes | Yes | OCC staff must still pass ownership check on the handover |
| `GET /api/v1/handovers/export/csv` | Export filtered CSV | Yes | Yes | Yes | Yes | OCC staff export is limited to records they are allowed to list |
| `GET /api/v1/users` | List users | No | No | No | Yes | Admin only |
| `POST /api/v1/users` | Create user | No | No | No | Yes | Admin only |
| `PATCH /api/v1/users/:id` | Update user role or active status | No | No | No | Yes | Admin only |
| `DELETE /api/v1/users/:id` | Deactivate user | No | No | No | Yes | Admin only, sets `isActive = false` |
| `GET /api/v1/handovers/:id/audit` | View audit log | No | Yes | Yes | Yes | OCC staff excluded |

## Middleware Design

```typescript
function requireRole(allowedRoles: UserRole[]): RequestHandler
function requireOwnership(resourceType: 'handover' | 'item'): RequestHandler
```

## Middleware Behavior

`requireRole(allowedRoles)`:
- Returns `401` when the request has no valid session.
- Returns `403` when the user is authenticated but their role is not in `allowedRoles`.
- Attaches the authenticated user to the request context for downstream handlers.

`requireOwnership(resourceType)`:
- Runs after `requireRole`.
- For `resourceType = 'handover'`, loads the target handover and checks `preparedById === session.user.id` unless the caller is `SUPERVISOR` or `ADMIN`.
- For `resourceType = 'item'`, loads the parent handover and checks ownership through that handover unless the caller is `SUPERVISOR` or `ADMIN`.
- Returns `404` if the resource does not exist or is soft-deleted.
- Returns `403` if the user is authenticated but does not own the resource.

## Edge Cases and Expected Status Codes

| Scenario | Expected Status | Reason |
| --- | --- | --- |
| OCC_STAFF requests another user's handover | `403` | Fails ownership check |
| OCC_STAFF acknowledges a handover they prepared | `403` | Violates BR-10 self-acknowledgment rule |
| MANAGEMENT_VIEWER attempts any POST/PATCH/DELETE route | `403` | Read-only role |
| Unauthenticated request to any protected route | `401` | No valid session |

## Route Guarding Order

1. Authenticate session
2. Apply `requireRole`
3. Apply `requireOwnership` where the route is marked "Own only"
4. Run request validation
5. Execute service-layer business rules
