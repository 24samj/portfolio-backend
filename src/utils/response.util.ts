import type { Context } from "hono";

/**
 * The response envelopes the frontend already parses. Lists carry `count`;
 * failures carry `error` (a stable label) and `message` (the detail).
 */

export function listResponse<T>(c: Context, data: T[]): Response {
  return c.json({ success: true, count: data.length, data });
}

export function itemResponse<T>(c: Context, data: T): Response {
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
