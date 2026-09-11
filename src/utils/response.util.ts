import type { Context } from "hono";

/**
 * The response envelopes the frontend already parses. Lists carry `count`;
 * failures carry `error` (a stable label) and `message` (the detail).
 */

/**
 * The content is read-only and seeded, so a success can be held. A short
 * browser TTL, a longer shared one, and a day of stale-while-revalidate so a
 * cold cache serves the last answer rather than waiting on D1. Only successes:
 * a 404 or a 500 must never be held.
 */
const CACHE_CONTROL =
  "public, max-age=60, s-maxage=300, stale-while-revalidate=86400";

export function listResponse<T>(c: Context, data: T[]): Response {
  c.header("Cache-Control", CACHE_CONTROL);
  return c.json({ success: true, count: data.length, data });
}

export function itemResponse<T>(c: Context, data: T): Response {
  c.header("Cache-Control", CACHE_CONTROL);
  return c.json({ success: true, data });
}

export function notFoundResponse(c: Context, what: string): Response {
  return c.json(
    {
      success: false,
      error: `${what} not found`,
      message: `No ${what.toLowerCase()} found with the provided ID`,
    },
    404
  );
}

export function failureResponse(
  c: Context,
  what: string,
  error: unknown
): Response {
  console.error(`Error fetching ${what}:`, error);
  return c.json(
    {
      success: false,
      error: `Failed to fetch ${what}`,
      message: error instanceof Error ? error.message : "Unknown error",
    },
    500
  );
}
