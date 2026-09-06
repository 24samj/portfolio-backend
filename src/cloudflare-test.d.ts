// The `cloudflare:test` module is declared by the package's /types subpath, not
// its main entry — referencing the bare package name resolves the pool's Node
// API instead and leaves the module undeclared.
/// <reference types="@cloudflare/vitest-pool-workers/types" />
import type { Env } from "./types/env.type";

/**
 * Types the `env` that `cloudflare:test` hands to tests. Without this, `env` is
 * an empty record and every binding access is a type error.
 */
declare module "cloudflare:test" {
  interface ProvidedEnv extends Env {}
}
