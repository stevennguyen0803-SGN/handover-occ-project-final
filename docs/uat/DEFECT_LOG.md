# Defect Log

Use this log for pilot UAT defects found while executing `docs/uat/UAT_SCENARIOS.md`.
Keep one row per defect and update the status after each fix or triage decision.

## Severity Guide

| Severity | Meaning | Target handling |
| --- | --- | --- |
| P1 Critical | Blocks pilot sign-off, data integrity, authentication, authorization, or core handover creation/acknowledgment/carry-forward flow | Fix immediately and retest before pilot sign-off |
| P2 High | Major workflow issue with a usable workaround, or a regression in an important UAT scenario | Fix within the current sprint and retest before pilot sign-off |
| P3 Medium | Usability, reporting, or edge-case issue that does not block pilot operation | Log for Phase 5 backlog unless quick and low risk |
| P4 Low | Cosmetic, copy, or minor polish issue | Log for Phase 5 backlog |

## Status Guide

| Status | Meaning |
| --- | --- |
| Open | Reported and not yet triaged or fixed |
| In Progress | Fix is underway |
| Fixed | Code or documentation fix is complete and regression coverage is recorded |
| Deferred | Accepted for Phase 5 backlog |
| Cannot Reproduce | Retested but not reproducible with current steps/data |

## Defects

| ID | Scenario | Step | Description | Severity | Status | Fixed In | Regression Test / Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BUG-001 | UAT data setup / Scenario 1 | After `npm run db:seed:uat`, create handover | UAT seed allocated handover `referenceId` values from `MAX(referenceId)` without advancing `handover_reference_seq`, so the next app-created handover could fail with `P2002` duplicate `referenceId`. | P1 Critical | Fixed | `database/prisma/uat-seed.ts`, `scripts/verify-uat-scenarios.mjs` | Failing evidence: `npm.cmd run test:smoke` returned `500` from `POST /api/v1/handovers` after UAT reseed. Regression evidence: patched `npm.cmd run db:seed:uat` created refs `HDO-2026-001371` through `HDO-2026-001375`, `npm.cmd run test:smoke` passed, and `npm.cmd run verify:uat` passed with `handover_reference_seq` next value `1378` greater than max reference suffix `1377`. |

## Pilot Sign-off Snapshot

| Metric | Current |
| --- | --- |
| Open P1 defects | 0 |
| Open P2 defects | 0 |
| Fixed defects with regression evidence | 1 |
