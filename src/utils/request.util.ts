import type { Context } from "hono";
import type { z } from "zod";
import type { Env } from "@/types/env.type";

/**
 * Parse + validate a JSON request body at the route boundary. Returns either the
 * typed value or a ready-to-return 400, so a route stays a straight line:
 *
 *   const parsed = await parseBody(c, contactSchema);
 *   if (!parsed.ok) return parsed.response;
 *
 * Everything downstream can then trust the value.
 */
export async function parseBody<T extends z.ZodType>(
  c: Context<{ Bindings: Env }>,
  schema: T
): Promise<
  { ok: true; data: z.output<T> } | { ok: false; response: Response }
> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return {
      ok: false,
      response: c.json(
        { success: false, message: "Body must be valid JSON" },
        400
      ),
    };
  }

  const parsed = schema.safeParse(raw);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }

  // First issue only: the form shows one message, and it's enough to fix the
  // call without echoing the whole body back.
  const issue = parsed.error.issues[0];
  return {
    ok: false,
    response: c.json({ success: false, message: issue.message }, 400),
  };
}
