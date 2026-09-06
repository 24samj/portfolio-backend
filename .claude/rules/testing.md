---
paths:
  - "src/**/__tests__/**"
  - "test/**"
  - "vitest.config.ts"
---

# Test convention

Tests live next to what they test, in a `__tests__/` folder, named
`<file>.test.ts`. `test/` at the repo root holds harness setup only, not tests.

## Real D1, not a mock

Tests run inside workerd via
[`@cloudflare/vitest-pool-workers`](https://developers.cloudflare.com/workers/testing/vitest-integration/),
so service tests exercise a **real (Miniflare) D1** instead of stubbing the
binding. Migrations are applied automatically before the run:

- `vitest.config.ts` reads the migrations on the Node side and passes them as a
  binding.
- `test/apply-d1-migrations.ts` (a setup file) applies them per worker.

Prefer a real-D1 service test over a mock when the thing under test **is** the
SQL (upserts, coalesce guards, owner-scoping). Wipe state in a `beforeEach` —
the database persists across tests in a file.

## Path alias

Vitest doesn't read `tsconfig` paths — the `@/*` alias is mirrored in
`vitest.config.ts` (`resolve.alias`). Keep the two in sync.
