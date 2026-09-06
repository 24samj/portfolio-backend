import type { Context, Next } from "hono";
import { DEVELOPMENT_ORIGINS, PRODUCTION_ORIGINS } from "@/constants";

// One list for every environment. The old NODE_ENV check never worked in
// Workers (no `process.env`), so dev origins were always allowed anyway — and a
// localhost origin can't impersonate anyone, so there's nothing to gate.
const ALLOWED_ORIGINS: ReadonlySet<string> = new Set([
  ...PRODUCTION_ORIGINS,
  ...DEVELOPMENT_ORIGINS,
]);

export const corsMiddleware = async (c: Context, next: Next) => {
  const origin = c.req.header("Origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    c.header("Access-Control-Allow-Origin", origin);
    c.header("Access-Control-Allow-Credentials", "true");
  }

  // Always set, so a preflight from any origin gets a well-formed answer.
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  c.header("Access-Control-Max-Age", "86400");

  if (c.req.method === "OPTIONS") {
    return c.text("", 200);
  }

  await next();
};
