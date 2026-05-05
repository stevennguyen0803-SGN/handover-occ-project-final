# OCC Handover · Friendly Redesign Prototype

> A standalone, browser-only HTML/CSS/JS prototype that demonstrates a **more
> user-friendly UI/UX** for the OCC Handover System described in `PLAN.md`,
> `shared/`, and `phases/`. It is intended as a **design proposal** to feed back
> into the production Next.js frontend later.

This prototype is **frontend-only** and uses `localStorage` for state, matching
the phrasing in `PLAN.md`:

> "Prototype already exists as a browser-only HTML demo using `localStorage`."

It does **not** call any backend. No build step, no dependencies installed
locally — just open `index.html` in a modern browser.

---

## How to run

```bash
# from repo root
cd prototype
python3 -m http.server 8000      # or `npx serve .` or any static server
# then visit http://localhost:8000/
```

You can also just **double-click `index.html`** to open it via `file://` —
Chart.js loads from a CDN. If you are offline, the page still renders, only
charts will fail silently.

To reset all state (handovers, audit, prefs):

```js
localStorage.removeItem("occ_handover_proto_v1");
localStorage.removeItem("occ_handover_proto_pref_v1");
location.reload();
```

---

## Demo accounts (role switcher)

The login screen lets you pick a role. Permissions follow `shared/roles.md`:

| Role                | Sees                       | Can do                                  |
| ------------------- | -------------------------- | --------------------------------------- |
| `OCC_STAFF`         | Lê Thu                     | View, create, update, acknowledge       |
| `SUPERVISOR`        | Nguyễn Hậu                 | + carry-forward, soft-delete            |
| `MANAGEMENT_VIEWER` | Trần Minh                  | Read-only (log, dashboard, audit, exp.) |
| `ADMIN`             | Phạm Quân                  | Everything                              |

You can switch role any time via the user-menu on the top-right.

---

## Views included

1. **Login (role selector)** — non-technical role picker with descriptions.
2. **Dashboard** — KPI cards, charts (category / priority / shift activity /
   abnormal events), quick filter chips, recent handover table.
3. **Handover Log** — filterable table with search, shift, priority, status,
   carry-forward, and acknowledgement filters; matches the columns from
   `phases/PHASE_2.md` Task 2.10.
4. **Handover Detail** — header summary, category cards, item rows with status
   timeline, acknowledgment, audit trail, carry-forward back-link.
5. **New Handover** — 3-step flow (`Header → Categories → Review`) with
   inline help and a category picker that mirrors the schema.
6. **Audit Trail** — chronological ledger of mutations, glyph per
   `AuditAction` enum value.
7. **Help** — design rationale + design tokens swatches + keyboard shortcuts.

---

## What's "more friendly" vs the current prototype

The two screenshots used as the briefing input show the current OCC Handover
prototype (light cream + teal, dark cockpit blue + neon). This redesign keeps
the same visual DNA but improves the experience in 12 concrete ways:

| #   | Improvement                                  | Where it shows up                                                     |
| --- | -------------------------------------------- | --------------------------------------------------------------------- |
| 1   | **Shift-aware theming**                      | Topbar accent gradient + clock chip changes per Morning/Afternoon/Night |
| 2   | **Critical-not-yet-ack banner**              | Persistent alert above content when any Critical handover is unack'd (BR-08) |
| 3   | **Contextual KPIs**                          | Each KPI has a coloured kind chip (Active/Alert/Issues/Ops Impact) and is clickable to filter the log |
| 4   | **Smart filter chips with counts**           | Dashboard has Today / 7d / High+ / Open / Carry-forward / Awaiting-ack chips |
| 5   | **Carry-forward visual**                     | Side stripe on table rows + back-link card on the detail page         |
| 6   | **3-step New Handover form**                 | Stepper splits Header → Categories → Review to reduce form fatigue    |
| 7   | **Status timeline pill**                     | Every item shows Open › Monitoring › Resolved with the current step highlighted |
| 8   | **Helpful empty states**                     | Log empty state suggests removing filters; new-handover step 2 explains what each category is for |
| 9   | **Mobile-first responsive layout**           | Sidebar collapses behind a hamburger; FAB + button always reachable on mobile/tablet |
| 10  | **OCC-friendly keyboard shortcuts**          | `N` new, `/` search, `D` dashboard, `L` log, `A` ack, `T` theme, `?` help |
| 11  | **Vietnamese ↔ English toggle**              | One click in the topbar; persists in localStorage                     |
| 12  | **Print-ready CSS**                          | `@media print` hides the chrome and expands sections so Print/PDF is clean |

In addition, the prototype enforces the same **business rules** from
`shared/BUSINESS_RULES.md` visually:

- **BR-02**: New handover preview shows `HDO-YYYY-NNNNNN` is **auto-generated**
  by the system; the field is read-only in the review step.
- **BR-04**: Critical / High rows get a coloured side-stripe and float to the
  top in the dashboard recent table.
- **BR-05**: Status transitions are visualised as a pill timeline on every
  item.
- **BR-08**: Critical handovers without an acknowledgment show a persistent
  banner and an inline `Acknowledge` action on the detail page.
- **BR-09**: Every demo mutation pushes an entry into the in-memory audit log
  and is shown on the Audit Trail page and on each handover's side panel.

---

## File layout

```
prototype/
├── README.md     ← you are here
├── index.html    ← markup + per-view templates
├── styles.css    ← design tokens + components + views (light + dark)
├── seed.js       ← mock data (5 UAT scenarios + 1 normal shift)
└── app.js        ← router + state + render helpers + i18n
```

No build tooling. No backend. ~1 800 lines of code total. Designed to be a
one-screen-at-a-time reviewable artifact that the user can flip through and
critique before any of it is reproduced in the real Next.js frontend.

---

## Where this maps to the production stack

The prototype is intentionally **not** wired to Express / Prisma — but every
view here has a counterpart task in `phases/PHASE_2.md`:

| Prototype view  | Production task                                                |
| --------------- | -------------------------------------------------------------- |
| Login           | Task 2.2 — NextAuth credentials provider                       |
| Layout / nav    | Task 2.7 — `(dashboard)/layout.tsx` + Sidebar + TopNav         |
| Dashboard       | Task 2.8 — KPI cards + trend chart + category breakdown        |
| New Handover    | Task 2.9 — RHF + Zod multi-step form                           |
| Handover Log    | Task 2.10 — server-side fetch + URL-synced filters             |
| Handover Detail | Task 2.11 — header summary + category cards + audit + ack      |
| Export          | Task 2.12 — CSV / PDF export                                   |

When applying this redesign to the real frontend:

1. Lift `prototype/styles.css` design tokens into a shared theme module
   (`frontend/styles/tokens.css` or Tailwind config).
2. Reuse the **shift-aware theming** by reading the user's local time on the
   server-rendered `(dashboard)/layout.tsx` and setting `data-shift` on
   `<html>`.
3. Port the **3-step New Handover** stepper to the existing `HandoverForm.tsx`
   client component without changing its Zod schema.
4. Port the **status-timeline pill** to a `<ItemStatusTrack>` component used
   wherever an item is rendered.
5. Use the same **filter-chip** pattern in the URL-synced filter bar of the
   handover log.
