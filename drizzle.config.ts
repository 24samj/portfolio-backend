import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit *generates* SQL migrations from `src/db/schema.ts` into
 * `./migrations`. Application to D1 is wrangler's job (`bun run db:local` /
 * `db:remote`), so no `driver`/credentials are needed here; this config is
 * generate-only.
 */
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./migrations",
});
