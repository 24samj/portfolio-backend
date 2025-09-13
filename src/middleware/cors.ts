import { Context, Next } from "hono";
import { ALLOWED_ORIGINS } from "../constants";

export const corsMiddleware = async (c: Context, next: Next) => {
  const origin = c.req.header("Origin");

  if (
    origin &&
    ALLOWED_ORIGINS.includes(origin as (typeof ALLOWED_ORIGINS)[number])
  ) {
    c.header("Access-Control-Allow-Origin", origin);
  }

  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  c.header("Access-Control-Allow-Credentials", "true");
  c.header("Access-Control-Max-Age", "86400");

  if (c.req.method === "OPTIONS") {
    return c.text("", 200);
  }

  await next();
};
