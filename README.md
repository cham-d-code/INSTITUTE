# TIMS — Teaching Institute Management System

Student records, QR attendance at the classroom door, fee collection, and an
audit trail that can settle a dispute. Built to the requirements in
`TIMS_Requirements_v1.0.pdf` (v1.0, July 2026).

```
DEV TUTION/
├── frontend/     React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui
├── backend/      Node + Express + PostgreSQL   (structure only so far)
└── docs/         requirements traceability
```

## Current state

| Area | Status |
|---|---|
| Frontend foundation | Built — design system, routing, RBAC, layout, dashboard |
| Frontend feature screens | **Built** — every screen is implemented and interactive |
| Mock API layer | In-memory, seeded, behind a single swap point (`lib/api/endpoints.ts`) |
| Backend | Folder structure and conventions only |

`npm run build` and `npm run lint` both pass in `frontend/`. Every screen works
against a seeded in-memory dataset, so the whole app is clickable end to end —
register a student, scan a card, take a payment, void it, watch the audit log
and arrears update. When the Express API is ready, only `lib/api/endpoints.ts`
is repointed; the screens don't change.

### What's wired

- **Students** — list with search/filters, profile (guardians, enrolments,
  attendance, fee history), register/edit with duplicate warning and one-step
  class enrolment.
- **Teachers** — list, profile with weekly timetable, overlap detection, and
  payment arrangement.
- **Classes** — list, roster with live per-student payment status, session
  history.
- **Scanner** (PWA, full-screen) — auto-suggested session, live camera QR read,
  full-bleed paid/unpaid/not-enrolled result with distinct sounds and haptics,
  duplicate and revoked-card handling, offline queue in IndexedDB with
  auto-sync, and a demo "simulate scan" panel for camera-less review.
- **Attendance** — today's sessions, class attendance-rate view, session
  register with manual marking (reason required) and Super-Admin void.
- **Payments** — record against outstanding dues (partial supported),
  printable receipt, reprint logging, list, Super-Admin void that re-opens the
  dues; daily collection reconciliation split cash vs transfer, per assistant.
- **Fees** — arrears with filters and CSV/PDF export; fee policy; discount
  approvals.
- **ID cards** — generate, batch-select, print CR80 cards on an A4 sheet;
  reissue (revokes the old token) from the profile.
- **Corrections, Reports, Audit, Users, Settings** — all implemented, gated by
  role.

### Reviewing the RBAC

The top-right identity chip has a **"View as (demo)"** switcher. Switch to
*Ashen Fernando (Assistant)* to see the assistant-limited experience — no audit
log, no financial reports, no voids, lands on the scanner. This switcher exists
only in the mock build.

## Running the frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev          # http://localhost:5173
```

The app currently signs you in automatically as a Super Admin so every screen
is reachable for review. That stub lives in `src/App.tsx` and is marked
`SCAFFOLD ONLY` — it is an authentication bypass and must be replaced with the
real `GET /api/auth/me` probe before anything is deployed.

## Design language

Taken from the reference dashboard supplied with the brief: a soft grey page,
pure-white cards with generous rounding and hairline borders instead of heavy
shadows, near-black pill buttons, and a floating black navigation rail.

- **Typeface** — Satoshi (Fontshare, free for commercial use), self-hosted in
  `src/assets/fonts/`. Self-hosted rather than CDN-linked because the scanner
  has to render correctly at the door with no connectivity.
- **Colour** — deliberately monochrome. Colour is reserved almost entirely for
  operational state, and **every status is a colour _plus_ an icon _plus_ a
  word**. Assistants read these to decide whether to let a student into a
  class; roughly one man in twelve cannot reliably separate the green from the
  amber, so colour never carries that meaning alone.
- **Charts** — one graphite series by default. The categorical slots
  (`--chart-1..5`) are a validated set: the hues and their order pass
  colour-blind separation and contrast checks against this app's own surfaces.
  They are deliberately distinct from the status hues so a series can never
  impersonate a status. Re-run the palette validator if you change one.

## Architecture notes worth knowing before you contribute

**Money is integer cents everywhere.** `Rs. 2,500.00` is `250000`. It becomes a
string only in `lib/format.ts`, at the display boundary. No floats.

**The frontend permission matrix is not a security boundary.**
`lib/auth/permissions.ts` and the route guards hide what staff cannot use. The
API enforces the same matrix on every request (NFR-04). Anything gated in the
browser must be gated again on the server.

**The access token is held in memory, not `localStorage`.** This system stores
personal data of minors; an XSS bug should not also hand over a durable
credential. A page reload re-mints the token from an httpOnly refresh cookie.

**Mutations are never auto-retried.** A timed-out payment request does not mean
the server rejected it, and a blind retry risks a duplicate receipt. Retrying
is the user's decision.

**Nothing is destroyed.** Students go Inactive or Left; attendance and payments
are voided with a reason and remain visible. That is what makes the audit trail
worth having.

## Where things live in the frontend

```
src/
├── app/            router, providers, query client, navigation model
├── components/
│   ├── ui/         shadcn primitives
│   ├── layout/     app shell, sidebar, topbar
│   ├── data/       status pills, stat tiles
│   ├── charts/     trend chart
│   └── common/     page header, spinner, scaffold placeholder
├── features/       one folder per domain area (students, attendance, fees, …)
├── lib/
│   ├── api/        axios client, auth refresh, device id
│   ├── auth/       permission matrix, auth store
│   ├── offline/    IndexedDB scan queue  (to build)
│   └── export/     PDF card layouts      (to build)
├── hooks/
├── types/          domain types mirroring §7 of the requirements
└── styles/         font faces
```

## Next steps

1. Scanner module — camera, session selection, scan result, offline queue
   (FR-050..058, MA-002..004). The highest-risk screen; build it first.
2. Students, classes and enrollment CRUD.
3. Payments and receipts, then arrears.
4. Backend: schema and migrations, auth, then the modules in the same order.

`docs/requirements-traceability.md` tracks which requirement is covered where.
