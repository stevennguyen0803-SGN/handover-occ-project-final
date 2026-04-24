# UAT Scenarios

These scripts are written against the current Phase 4 UAT dataset from
`npm run db:seed:uat`.

## Test Data Setup

1. Refresh the UAT dataset with `npm run db:seed:uat`.
   Expected: The script completes successfully and prints the seeded users plus 5 scenarios.
2. Open the application in a browser.
   Expected: The login page shows the `Sign in` form with `Email` and `Password` fields.

## Environment Notes

These UAT scripts do not require Docker.

1. If you are running locally on this Windows host, use `npm run build` and then `npm run verify:staging:local`.
   Expected: Frontend and backend start in production mode without Docker.
2. If a shared staging URL is available, use that URL instead.
   Expected: Testers can complete the same browser steps without needing local infrastructure parity.
3. Docker is not required for Task 4.1 acceptance or human UAT.
   Expected: Functional UAT uses the verified production-mode local staging path unless a shared staging URL is provided.

## UAT Credentials

| Role | Email | Password | Main use |
| --- | --- | --- | --- |
| OCC Staff | `staff@occ.test` | `Pilot2025!` | Standard handover viewing and preparation |
| Supervisor | `supervisor@occ.test` | `Pilot2025!` | Acknowledgment, carry-forward verification, operational review |
| Management Viewer | `viewer@occ.test` | `Pilot2025!` | Read-only validation of log and detail views |
| Admin | `admin@occ.test` | `Pilot2025!` | Validation that includes new-handover creation without role limits |

## Seed Reference Guide

Reference IDs increase on every reseed. Use the search keywords first, and use the
reference IDs below as the last verified examples from the Task 4.6 refresh on
`2026-04-24`.

| Scenario | Search keywords | Last verified ref on 2026-04-24 |
| --- | --- | --- |
| Scenario 1 - AOG Aircraft | `9M-MXA`, `SCENARIO 1`, `AOG` | `HDO-2026-001371` |
| Scenario 2 - Weather Disruption Chain | `SCENARIO 2`, `WMKK`, `AXA100-AXA120` | `HDO-2026-001372` |
| Scenario 3 - Crew Positioning Issue | `SCENARIO 3`, `Captain Iskandar`, `AXA310` | `HDO-2026-001373` |
| Scenario 4 - System Degradation | `SCENARIO 4`, `ACARS` | `HDO-2026-001374` |
| Scenario 5 - Multi-category Normal Shift | `SCENARIO 5`, `WSSS`, `Crew Portal` | `HDO-2026-001375` |

## UAT Scenario 1 - AOG Aircraft Handover

**Tester role:** OCC Supervisor
**Test data:** Run `npm run db:seed:uat`
**Pre-condition:** Sign in as `supervisor@occ.test` with password `Pilot2025!`. Use a fresh UAT seed so the seed-day Afternoon slot is still empty for carry-forward creation.

## Steps

1. Navigate to the Dashboard.
   Expected: KPI cards include `Critical Items` with a value of `1` or more and `Unacknowledged High Priority` with a value of `1` or more.
2. Open `Handover Log`, search for `9M-MXA` or `SCENARIO 1`, and open the matching Morning handover for the seed day.
   Expected: The handover detail shows the aircraft item for `9M-MXA`, an AOG abnormal event, and Critical priority treatment.
3. Click `Acknowledge Handover`, optionally enter a short note, and confirm.
   Expected: The acknowledge button disappears after refresh and the detail page shows an `Acknowledgments` section with `UAT Shift Supervisor` and a timestamp.
4. Navigate to `New Handover` and create an `Afternoon` handover for the same seed day, filling only the required header fields plus `General remarks` and `Next shift actions`.
   Expected: The form submits successfully and redirects to a new handover detail page with a new `HDO-YYYY-NNNNNN` reference.
5. Review the newly created Afternoon handover.
   Expected: The page shows `Contains carried-forward items`, the handover or copied items show `Carried Forward`, and the AOG work from the Morning handover is present.

## Pass / Fail Criteria

PASS: The supervisor can acknowledge the Morning AOG handover and the Afternoon handover automatically receives the carried-forward AOG work.
FAIL: The acknowledgment does not persist, the Afternoon handover cannot be created on the open slot, or the carried-forward AOG items do not appear.

## UAT Scenario 2 - Weather Disruption Chain

**Tester role:** OCC Supervisor
**Test data:** Run `npm run db:seed:uat`
**Pre-condition:** Sign in as `supervisor@occ.test` with password `Pilot2025!`.

## Steps

1. Navigate to `Handover Log`, search for `SCENARIO 2` or `WMKK`.
   Expected: A Night handover for the day before the seed day appears. The last verified row on `2026-04-24` used reference `HDO-2026-001372`.
2. Turn on the `Show carried-forward only` filter.
   Expected: The Scenario 2 handover remains visible in the filtered list.
3. Open the Scenario 2 row from the log.
   Expected: The detail page shows a `Carried Forward` badge or carried-forward banner, a weather item for `WMKK`, and a flight schedule item for `AXA100-AXA120`.
4. Verify the `Acknowledge Handover` button is available, then acknowledge the handover with an optional note.
   Expected: The handover shows an `Acknowledgments` section with `UAT Shift Supervisor`, the saved note if entered, and the button is no longer shown to the same user.
5. Reopen the same handover from the log.
   Expected: The carried-forward indicators remain visible and the acknowledgment record is still present.

## Pass / Fail Criteria

PASS: The carried-forward handover can be found through the log filter, the weather-delay chain is visible, and acknowledgment persists after refresh.
FAIL: The row disappears under the carried-forward filter, the carried-forward indicators are missing, or acknowledgment is not saved.

## UAT Scenario 3 - Crew Positioning Issue And Owner Validation

**Tester role:** Admin
**Test data:** Run `npm run db:seed:uat`
**Pre-condition:** Sign in as `admin@occ.test` with password `Pilot2025!`.

## Steps

1. Navigate to `Handover Log`, search for `SCENARIO 3` or `Captain Iskandar`, and open the matching handover.
   Expected: The detail page shows a Crew section with 2 items: one Critical open captain issue and one High monitoring cabin crew issue.
2. Return to `Handover Log` and identify a date/shift combination inside the allowed window that is not already used.
   Expected: You can choose a free slot for a new validation handover. On a fresh `2026-04-24` seed, `Night` on the seed day is the recommended first attempt.
3. Navigate to `New Handover`, fill the header for that free slot, and set `Overall priority` to `Critical`.
   Expected: The form opens with `Prepared by` locked to the signed-in admin user.
4. Activate the `Crew` section, click `Add item`, and enter a Critical open crew issue such as `Captain missing for KUL-PMI route`, but leave `Owner` empty.
   Expected: The Crew item remains on the form with `Status = Open` and `Priority = Critical`.
5. Click `Create handover`.
   Expected: The form stays on the same page and shows the validation message `ownerId is required for open High/Critical items`.
6. Set `Owner` to an active user such as `UAT Shift Supervisor (SUPERVISOR)` and submit again.
   Expected: The handover is created successfully and the detail page shows the new Crew item.

## Pass / Fail Criteria

PASS: The seeded Crew scenario displays two items, and a fresh Critical open Crew item cannot be submitted until an owner is selected.
FAIL: The seeded Crew scenario is incomplete, or the new handover submits successfully without an owner on the Critical open Crew item.

## UAT Scenario 4 - System Degradation Resolved Record

**Tester role:** Management Viewer
**Test data:** Run `npm run db:seed:uat`
**Pre-condition:** Sign in as `viewer@occ.test` with password `Pilot2025!`.

## Steps

1. Navigate to `Handover Log`, search for `ACARS`, and turn on the `Resolved` status filter.
   Expected: A resolved Morning handover appears for the day before the seed day. The last verified reference on `2026-04-24` was `HDO-2026-001374`.
2. Open the resolved handover.
   Expected: The detail page shows a `System` item for `ACARS` with `Resolved` status and recovery remarks.
3. Return to the Dashboard.
   Expected: The active KPI cards continue to reflect only Open and Monitoring work; this resolved ACARS issue does not surface as active carried work.
4. Return to `Handover Log` and search `ACARS` again without changing the account.
   Expected: The same record remains available for historical traceability even though it is resolved.

## Pass / Fail Criteria

PASS: A read-only user can find the ACARS record in the log, open it, and confirm that resolved work stays visible in history without becoming active dashboard work.
FAIL: The resolved record is missing from the log, inaccessible to the viewer role, or presented as active unresolved work.

## UAT Scenario 5 - Multi-category Normal Shift

**Tester role:** OCC Staff
**Test data:** Run `npm run db:seed:uat`
**Pre-condition:** Sign in as `staff@occ.test` with password `Pilot2025!`.

## Steps

1. Navigate to `Handover Log`, search for `SCENARIO 5` or `WSSS`.
   Expected: A Low-priority Night handover appears. The last verified reference on `2026-04-24` was `HDO-2026-001375`.
2. Open the matching handover.
   Expected: The detail page shows Airport, Weather, and System categories populated with routine low-priority items.
3. Review the handover header and item cards.
   Expected: The handover priority is `Low`, there is no Critical or High priority emphasis, and no `Carried Forward` banner is shown.
4. Return to `Handover Log`, turn on the `Low` priority filter, and search for `Crew Portal`.
   Expected: The same handover remains visible under the low-priority filter and can be reopened from the log.
5. Reopen the handover and review the status chips.
   Expected: Monitoring items may still use the standard monitoring status color, but the overall scenario remains a low-priority baseline shift with no High or Critical work.

## Pass / Fail Criteria

PASS: The handover behaves like a normal low-priority shift across three categories and stays easy to locate with the low-priority filter.
FAIL: The record is missing, carries unexpected High or Critical priority treatment, or shows carried-forward or escalation-only behavior that should not exist in this scenario.
