import { z } from "zod";

/**
 * The response envelopes every route uses (see `response.util.ts`), as zod for
 * the OpenAPI document. Documentation only — responses aren't validated.
 */

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string(),
});

export function itemResponseSchema<T extends z.ZodType>(item: T) {
  return z.object({ success: z.literal(true), data: item });
}

export function listResponseSchema<T extends z.ZodType>(item: T) {
  return z.object({
    success: z.literal(true),
    count: z.number().int(),
    data: z.array(item),
  });
}
