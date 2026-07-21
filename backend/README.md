# TIMS Backend

Express + PostgreSQL API for the Teaching Institute Management System.

**Status:** folder structure only. No code yet — the frontend is being built
first, against the contracts described in `frontend/src/types/domain.ts`.

## Layout

```
src/
├── server.ts          # process entry: listen, graceful shutdown
├── app.ts             # express app: middleware chain, route mounting
├── config/            # env parsing and validation (fail fast on a missing secret)
├── db/
│   ├── migrations/    # forward-only SQL migrations
│   ├── seeds/         # subjects, grades, the initial Super Admin
│   ├── pool.ts        # pg Pool + transaction helper
│   └── migrate.ts     # migration runner
├── middleware/
│   ├── authenticate.ts    # verifies the access token, loads the user
│   ├── authorise.ts       # the §2 permission matrix, server-side
│   ├── audit.ts           # writes the append-only log (FR-090)
│   ├── rate-limit.ts      # login throttling
│   └── error-handler.ts   # single place that shapes error responses
├── modules/           # one folder per domain area; each holds
│                      #   *.routes.ts | *.controller.ts | *.service.ts | *.repository.ts | *.schema.ts
├── services/          # cross-module concerns: qr tokens, receipts, pdf, excel, backups
├── utils/
└── types/
```

## Rules that are not negotiable

These map to specific requirements and to the fraud mitigations in §8. They are
easy to break accidentally and expensive to discover late.

1. **The permission matrix is enforced here, not in the browser.** The
   frontend's `lib/auth/permissions.ts` hides buttons; this API decides what is
   allowed (NFR-04). Every route declares its permission.

2. **Money is `BIGINT` cents.** Never `FLOAT`, never `MONEY`. The frontend
   already treats amounts as integer cents end to end.

3. **The audit log is append-only at the grant level** (NFR-10). The
   application's database role holds `INSERT` on audit tables and nothing else
   — no `UPDATE`, no `DELETE`. This is what makes FR-093 true rather than
   merely intended, and it must survive a compromised application.

4. **Nothing is hard-deleted.** Students go Inactive/Left (FR-016), payments
   and attendance are voided with a reason and stay visible (FR-057, FR-077).
   A `DELETE` statement outside a data-retention job is almost certainly a bug.

5. **Scan time is server-validated** (FR-050). Trust the device's clock only
   for the `captured_at` column on an offline scan that synced late (FR-058),
   and never for deciding whether an arrival was Late.

6. **Receipt numbers are sequential and gapless**, allocated inside the
   payment transaction from a database sequence. Gaps are how cash goes
   missing unnoticed.

7. **QR tokens are opaque and revocable** (FR-041, FR-043). One active token
   per student; a reissue revokes the previous one in the same transaction
   that mints the new one.

## Getting started (once the code lands)

```bash
cp .env.example .env      # then fill in the secrets
npm install
npm run migrate
npm run seed
npm run dev
```
