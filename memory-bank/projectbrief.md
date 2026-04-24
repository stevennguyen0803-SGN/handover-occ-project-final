# Project Brief - OCC Handover System

This project builds a centralized web application for Operations Control Centre shift handover management. It replaces spreadsheets, emails, and verbal updates with a structured digital workflow backed by authentication, database persistence, audit logging, and role-based access control.

The current repository is in a planning and specification phase. Phase 1 is focused on freezing the data model, business rules, API contracts, roles, and setup guidance before any runnable implementation begins.

## Target Users
- OCC staff: prepare handovers, update operational items, acknowledge incoming work
- Supervisors: oversee all handovers, carry forward items, review audit trail, delete via soft delete
- Management viewers: read-only access to operational status and audit history
- Admins: full access including user management

## Core Requirements
1. Structured handover records with seven operational categories and nested items
2. System-generated reference IDs, audit trail, acknowledgment, and carry-forward support
3. Strict validation, role checks, and soft delete behavior across all records
4. Dashboard and export support for PDF and CSV outputs

## Out of Scope
- Production implementation during Phase 1
- Browser-only storage such as `localStorage`
- Native mobile application
- Unspecified endpoints or schema changes outside the shared docs

## Timeline
- Start: 2026-04-21
- Deadline: Ongoing
- Milestones:
  - 2026-04-21: Phase 1 design freeze and project memory setup started
  - TBD: Phase 2 MVP starts after Phase 1 is complete
  - TBD: Pilot and production phases after MVP and workflow enhancements

## Related Documents
- `PLAN.md`
- `shared/DATA_MODEL.md`
- `shared/API_SPEC.md`
- `shared/BUSINESS_RULES.md`
- `phases/PHASE_1.md`

Last updated: 2026-04-21
