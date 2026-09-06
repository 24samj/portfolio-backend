---
paths:
  - "src/db/schema.ts"
  - "migrations/**/*.sql"
  - "drizzle.config.ts"
---

# Schema & migrations

`src/db/schema.ts` (Drizzle tables) is the **single source of truth** for the D1
schema. Row types are inferred from it (`typeof table.$inferSelect`) — never
hand-write a row type. `drizzle-kit` turns the schema into versioned SQL under
`migrations/`, and `wrangler d1 migrations apply` runs it (tracked in the
`d1_migrations` table). Scripts land with the D1 step.

## The loop

```bash
# edit src/db/schema.ts
bun run db:generate   # emit a new migration
bun run db:local      # apply to the local D1
bun run test          # tests run against the real migrated schema
```

## Rules

- **Never hand-edit a generated migration.** To change the schema, edit
  `schema.ts` and generate a *new* migration. The applied set is immutable.
- **Migrations are forward-only and additive-safe.** A new nullable column or a
  new table is safe to apply to a live remote D1. A drop/rename/not-null
  backfill is not — split it across releases (add → backfill → switch → drop).
- **Rename a generated file deliberately.** If you rename a migration for
  clarity, update its `tag` in `migrations/meta/_journal.json` to match, or the
  apply step desyncs.
- **Booleans are `integer` 0/1.** SQLite has no boolean type. Convert at the
  mapper (`toXResponse`), never leak the 0/1 into an API response.
