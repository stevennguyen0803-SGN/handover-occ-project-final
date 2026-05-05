# Frontend Stubs — Friendly-Redesign Components

React + Tailwind component stubs distilled from the
[`prototype/`](../prototype/) folder. Drop into your **Next.js 14 (App Router)
+ TypeScript strict + Tailwind** project to get the redesigned UX (shift-aware
theming, critical banner, KPI deep-links, 3-step wizard, status timeline,
keyboard shortcuts, EN/VI toggle) without rebuilding from scratch.

These are **stubs** — they ship with no runtime dependencies on your project,
no data fetching, no auth wiring. You bring the data; they handle the look,
feel, and interaction patterns.

---

## What's included

```
frontend-stubs/
├── README.md                       ← you are here
├── tailwind.config.example.ts      ← extend your tailwind config
├── styles.global.example.css       ← copy into your globals.css
├── lib/
│   ├── types.ts                    ← matches shared/DATA_MODEL.md (no invented fields)
│   ├── i18n.ts                     ← VI / EN dictionaries + translate()
│   ├── format.ts                   ← formatDate / formatTime / shiftForTime / dayDiff
│   ├── permissions.ts              ← BR-12 capability matrix
│   ├── constants.ts                ← CATEGORIES, PRIORITY_ORDER, SHIFT_ORDER
│   └── cn.ts                       ← lightweight clsx
├── hooks/
│   ├── useTheme.ts                 ← light/dark, persists in cookie (NOT localStorage)
│   ├── useShiftTheme.ts            ← morning/afternoon/night accent
│   ├── useI18n.ts                  ← locale provider + t()
│   └── useKeyboardShortcuts.ts     ← N / D / L / A / T / / / ? / Esc
├── components/
│   ├── ui/
│   │   ├── Badge.tsx
│   │   ├── PriorityBadge.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── AckBadge.tsx
│   │   ├── StatusTimeline.tsx      ← Open → Monitoring → Resolved (BR-05)
│   │   ├── FilterChip.tsx
│   │   ├── KpiCard.tsx
│   │   ├── EmptyState.tsx
│   │   └── Toast.tsx               ← ToastProvider + useToast
│   ├── layout/
│   │   ├── AppShell.tsx            ← topbar + sidebar + banner + content
│   │   ├── TopBar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── CriticalBanner.tsx      ← BR-08 / BR-10
│   │   └── FloatingActionButton.tsx
│   ├── dashboard/
│   │   └── DashboardKpis.tsx       ← KPI grid with deep-links to /log?…
│   ├── handover/
│   │   ├── HandoverRow.tsx
│   │   ├── HandoverTable.tsx
│   │   ├── HandoverHeader.tsx
│   │   ├── HandoverFilters.tsx     ← chips + selects (Today / Last 7d / High+ / …)
│   │   ├── CategorySection.tsx     ← per-category items + toItemView() helper
│   │   ├── AcknowledgeButton.tsx   ← BR-10
│   │   ├── AuditTrail.tsx          ← BR-09
│   │   └── CarryForwardLink.tsx    ← BR-07
│   ├── admin/                      ← ADMIN-only console (BR-12)
│   │   ├── UsersTable.tsx          ← list + activity counters
│   │   ├── UserFilters.tsx         ← search + role chips + status select
│   │   ├── UserFormDialog.tsx      ← create + edit (no `passwordHash` on client)
│   │   └── UserDeactivateDialog.tsx← confirm soft-delete (`isActive=false`)
│   ├── reports/                    ← Reports & Export
│   │   ├── ReportFilters.tsx       ← date range, shift, priority, category
│   │   ├── ReportPreview.tsx       ← print-ready dataset (`@media print` aware)
│   │   └── ExportButton.tsx        ← CSV via API, browser print pipe
│   └── wizard/
│       ├── HandoverWizard.tsx      ← 3-step orchestrator
│       ├── WizardStepper.tsx
│       ├── StepHeader.tsx
│       ├── StepCategories.tsx
│       └── StepReview.tsx
└── examples/
    ├── dashboard/page.tsx
    ├── log/page.tsx
    ├── handover/page.tsx           ← detail
    ├── handover-new/page.tsx       ← wizard
    ├── admin/page.tsx               ← ADMIN users console
    └── reports/page.tsx             ← Reports & Export
```

---

## Quick start (4 steps)

### 1. Copy the design tokens
- Append the contents of `styles.global.example.css` to your `app/globals.css`.
- Replace your `tailwind.config.ts` with `tailwind.config.example.ts` (or merge
  the `theme.extend` block into yours).

You should now see Tailwind utilities like
`bg-priority-critical-bg`, `text-priority-critical-fg`,
`border-shift`, `bg-accent-soft` resolve.

### 2. Copy the source folders into your frontend
```bash
# from your frontend repo root
cp -R /path/to/Handover-OCC-Project/frontend-stubs/lib            src/lib/handover-ui
cp -R /path/to/Handover-OCC-Project/frontend-stubs/hooks          src/hooks
cp -R /path/to/Handover-OCC-Project/frontend-stubs/components     src/components
```

(Or pick a subset — every component has explicit imports, so any subtree
can be copied independently as long as `lib/` and `hooks/` come along.)

### 3. Wrap your app with the providers
```tsx
// app/layout.tsx
import { I18nProvider } from '@/hooks/useI18n';
import { ToastProvider } from '@/components/ui/Toast';
import { cookies } from 'next/headers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const themeCookie = cookies().get('occ_theme')?.value === 'dark' ? 'dark' : 'light';
  return (
    <html lang="vi" data-theme={themeCookie}>
      <body>
        <I18nProvider initialLocale="vi">
          <ToastProvider>{children}</ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
```

### 4. Drop in the example pages
The four files in `examples/` correspond directly to App Router routes:

| Stub                              | Place at                                      |
| --------------------------------- | --------------------------------------------- |
| `examples/dashboard/page.tsx`     | `app/(app)/dashboard/page.tsx`                |
| `examples/log/page.tsx`           | `app/(app)/log/page.tsx`                      |
| `examples/handover/page.tsx`      | `app/(app)/handover/[id]/page.tsx`            |
| `examples/handover-new/page.tsx`  | `app/(app)/handover/new/page.tsx`             |
| `examples/admin/page.tsx`         | `app/(admin)/users/page.tsx`                  |
| `examples/reports/page.tsx`       | `app/(app)/reports/page.tsx`                  |

> Gate `app/(admin)/**` in your `middleware.ts` (or a layout-level
> auth guard) by checking `can(currentUser.role, 'manageUsers')` —
> the page itself defends in depth but server-side enforcement is the
> real gate (BR-12).

Each page has a comment block at the top showing exactly what to swap out
for real data fetching.

---

## Mapping: prototype feature → component

| Prototype feature                                   | React/Tailwind stub                                 |
| --------------------------------------------------- | --------------------------------------------------- |
| Shift-aware accent (morning/afternoon/night)        | `useShiftTheme` + `bg-shift` / `text-shift-fg`      |
| Light/dark toggle (T)                               | `useTheme` + `data-theme="dark"` selector           |
| EN/VI toggle                                        | `useI18n` + `<I18nProvider>`                        |
| Critical-unack banner                               | `<CriticalBanner count={…}>`                        |
| KPI cards w/ deep-link to log                       | `<DashboardKpis summary={…}>`                       |
| Smart filter chips                                  | `<FilterChip>` + `<HandoverFilters>`                |
| Carry-forward visual (left border + back-link card) | `border-l-shift` row + `<CarryForwardLink>`         |
| 3-step new-handover wizard                          | `<HandoverWizard>` + Step components                |
| Status timeline (Open → Monitoring → Resolved)      | `<StatusTimeline status={…}>`                       |
| Keyboard shortcuts (N / D / L / A / T / / / ? )     | `useKeyboardShortcuts(map)`                         |
| Audit trail                                         | `<AuditTrail entries={…}>`                          |
| Acknowledge with toast                              | `<AcknowledgeButton acknowledge={…}>` + `useToast`  |
| Admin user CRUD                                     | `<UsersTable>` + `<UserFormDialog>` + `<UserDeactivateDialog>` |
| Soft-delete user (BR-12, no hard delete)            | `<UserDeactivateDialog>` → `PATCH /api/v1/users/:id { isActive: false }` |
| Filtered reports + export                           | `<ReportFilters>` + `<ReportPreview>` + `<ExportButton>` |
| Print preview (CSS-driven)                          | `@media print` rules in `styles.global.example.css` + `print:hidden` |

---

## Admin Users page (BR-12 / ADMIN only)

Backed by `GET|POST /api/v1/users`, `PATCH /api/v1/users/:id`, and
`DELETE /api/v1/users/:id` (the DELETE endpoint sets `isActive=false`
— never hard-delete). The example page (`examples/admin/page.tsx`)
demonstrates:

- **List** with role chips, status select, full-text search.
- **Activity counters** (`handoversPreparedCount`, `handoversReceivedCount`)
  if your list endpoint returns them; the column is hidden otherwise.
- **Create / edit** via `<UserFormDialog>`. The dialog never asks for or
  echoes `passwordHash` — a fresh `password` field is sent to the server,
  which hashes it. Leaving it blank keeps the existing hash (or remains
  `null` for SSO-only users, per `shared/DATA_MODEL.md`).
- **Soft-delete** (`isActive=false`) via `<UserDeactivateDialog>`, which
  doubles as the reactivate dialog when the user is already inactive.
- **Permission guard** — `can(role, 'manageUsers')` returns true only for
  `ADMIN`, matching `shared/roles.md` and BR-12.

## Reports & Export page

Backed by `GET /api/v1/handovers/export/csv` (filtered list export) and,
for per-handover PDF, `GET /api/v1/handovers/:id/export/pdf` from the
detail page. The example page (`examples/reports/page.tsx`) demonstrates:

- **Filter form** — date range, shift, priority, category, and a couple
  of toggles. Round-trip to URL search params for shareable reports.
- **Preview** — `<ReportPreview>` renders a print-ready summary card +
  totals breakdown + flat handover table, all wrapped in
  `<div className="print-region">`.
- **Export** — `<ExportButton>` calls your `exportTo(format, filters)`
  callback; the easiest implementation is
  `window.location.href = '/api/v1/handovers/export/csv?…'` so the
  browser handles the download via `Content-Disposition`.
- **Print** — `window.print()` triggers the `@media print` rules in
  `styles.global.example.css`, which hide chrome (sidebar, top bar,
  toasts, FAB) and force the report to a clean white-on-black layout.

> ⚠️ **Per-handover PDF** lives on the **detail page**, not on Reports.
> Add an `<ExportButton allowPdf onPrint />` near the
> `<HandoverHeader>` and call `/api/v1/handovers/:id/export/pdf` from
> there. Reports = filtered list (CSV); Detail = single handover (PDF).

---

## Field-name fidelity (BR sanity-check)

- Every type in `lib/types.ts` mirrors `shared/DATA_MODEL.md` 1:1. **Do not
  add fields here** without first updating the canonical data model.
- The wizard never sets `referenceId` — it's generated server-side
  (BR-02). The example shows a placeholder until the API responds.
- `useTheme` writes to a cookie, **not** `localStorage` — production code
  in this repo is forbidden from touching `localStorage` (AGENTS.md "Do
  Not"). The prototype uses `localStorage` because it's a demo.
- `<AcknowledgeButton disabled>` should be set when
  `handover.preparedBy.id === currentUser.id` (BR-10 — cannot ack own
  handover). The example wires this up.
- `<CategorySection>` only renders fields that exist on `DATA_MODEL.md`.
  Use `toItemView(item, category)` to convert API shapes safely.
- `permissions.ts` mirrors the BR-12 / `shared/roles.md` matrix. Use
  `can(role, 'createHandover')` etc. for client-side hint-rendering, but
  always re-enforce in your route handlers.

---

## What's intentionally NOT included

- **No data fetching layer.** Use whatever you already have (server
  components calling `fetch`, React Query, SWR, …). The example pages
  show the seam.
- **No auth wiring.** NextAuth.js v5 already lives in your project; pull
  the user from `auth()` and pass to `<AppShell user={…}>`.
- **No charting library.** The prototype uses Chart.js via a CDN — for a
  TypeScript-strict app, install `chart.js` + `react-chartjs-2` (or
  `recharts`) and feed it `summary.byCategory` / `summary.byPriority` /
  `summary.byShift`.
- **No localStorage.** Cookies for theme; use real APIs for everything
  else.

---

## TypeScript strict notes

- All components are typed against `lib/types.ts`. There is no `any`
  anywhere; the discriminated union helper `toItemView()` keeps category
  items type-safe.
- Hooks that need DOM (`useTheme`, `useShiftTheme`, `useKeyboardShortcuts`)
  carry the `'use client'` directive. Server components can still
  consume layout/UI primitives that don't.
- The `Toast` and `I18n` providers use `createContext` + `createElement`
  to avoid JSX in `.ts` files; you can refactor to JSX in `.tsx` if you
  prefer.
