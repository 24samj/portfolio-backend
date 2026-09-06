import { fileURLToPath } from "node:url";
import {
  cloudflarePool,
  cloudflareTest,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers";
import { configDefaults, defineConfig } from "vitest/config";

/**
 * Tests run inside workerd (via @cloudflare/vitest-pool-workers) so service
 * tests can exercise a real (Miniflare) D1 binding, not a mock. The `@/*` path
 * alias is mirrored from tsconfig (Vitest doesn't read tsconfig paths). D1
 * migrations — schema and seed — are read on the Node side and applied per
 * worker in the setup file, so tests see the real portfolio content.
 */
export default defineConfig(async () => {
  const migrations = await readD1Migrations(
    fileURLToPath(new URL("./migrations", import.meta.url))
  );

  const poolOptions = {
    miniflare: {
      compatibilityDate: "2025-09-12",
      compatibilityFlags: ["nodejs_compat"],
      d1Databases: ["PORTFOLIO_DB"],
      bindings: {
        // Read on the Node side; consumed by the setup file via env.
        TEST_MIGRATIONS: migrations,
        CONTACT_FROM: "contact@sumit.codes",
        CONTACT_TO: "inbox@example.com",
      },
    },
  };

  return {
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    plugins: [cloudflareTest(poolOptions)],
    test: {
      pool: cloudflarePool(poolOptions),
      setupFiles: ["./test/apply-d1-migrations.ts"],
      // Sibling git worktrees under .claude/worktrees/ hold other streams'
      // in-progress work; without this, vitest's default glob runs their tests
      // too and a broken WIP tree fails this tree's pre-push hook.
      exclude: [...configDefaults.exclude, "**/.claude/worktrees/**"],
    },
  };
});
