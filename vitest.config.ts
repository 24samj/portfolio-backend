import { fileURLToPath } from "node:url";
import {
  cloudflarePool,
  cloudflareTest,
} from "@cloudflare/vitest-pool-workers";
import { configDefaults, defineConfig } from "vitest/config";

/**
 * Tests run inside workerd (via @cloudflare/vitest-pool-workers) so they hit the
 * real runtime, not a Node shim. The `@/*` path alias is mirrored from tsconfig
 * (Vitest doesn't read tsconfig paths). D1 bindings + migrations are added here
 * once the schema exists.
 */
export default defineConfig(() => {
  const poolOptions = {
    miniflare: {
      compatibilityDate: "2025-09-12",
      compatibilityFlags: ["nodejs_compat"],
    },
  };

  return {
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    plugins: [cloudflareTest(poolOptions)],
    test: {
      pool: cloudflarePool(poolOptions),
      // Sibling git worktrees under .claude/worktrees/ hold other streams'
      // in-progress work; without this, vitest's default glob runs their tests
      // too and a broken WIP tree fails this tree's pre-push hook.
      exclude: [...configDefaults.exclude, "**/.claude/worktrees/**"],
    },
  };
});
