import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll } from "vitest";

// Apply the real migrations (schema + seed) to the Miniflare D1 once per worker,
// so tests run against the actual portfolio content. The migration list is
// injected as a binding by vitest.config.ts (read on the Node side).
beforeAll(async () => {
  await applyD1Migrations(env.PORTFOLIO_DB, env.TEST_MIGRATIONS);
});
