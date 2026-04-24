# Memory Bank - OCC Handover System

This folder is the project memory used to carry context across sessions.

## Files and Purpose

| File | Purpose | Update Frequency |
| --- | --- | --- |
| `projectbrief.md` | Project goal, scope, and milestones | Rarely |
| `productContext.md` | User problem, workflow, business context | When product logic changes |
| `systemPatterns.md` | Architecture and design patterns | After architecture decisions |
| `techContext.md` | Stack, dependencies, env vars, setup notes | When tech changes |
| `activeContext.md` | Current status and next actions | Every session |
| `progress.md` | Append-only progress log and backlog | Every session |
| `decisions-log.md` | Key decisions and rationale | When decisions are made |
| `SESSION_HANDOFF.md` | Summary for next session | When handing off |

## Session Workflow

### Start of Session
1. Read `memory-bank/activeContext.md`
2. Read `memory-bank/progress.md`
3. If needed, read `memory-bank/decisions-log.md` and `memory-bank/SESSION_HANDOFF.md`

### End of Session
Update:
- `memory-bank/activeContext.md`
- `memory-bank/progress.md`

Update these as needed:
- `memory-bank/decisions-log.md`
- `memory-bank/SESSION_HANDOFF.md`

## Core Principle
Short, current, and explicit beats long but stale.
