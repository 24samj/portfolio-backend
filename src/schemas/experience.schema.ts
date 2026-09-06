import { z } from "zod";
import { EXPERIENCE_TYPES } from "@/db/schema";
import type { Experience } from "@/types/experience.type";

/** Documentation only (see `Experience`). */
export const experienceSchema = z.object({
  _id: z.string(),
  name: z.string(),
  role: z.string(),
  workStart: z.string(),
  workEnd: z.string().nullable(),
  location: z.string(),
  description: z.string(),
  type: z.enum(EXPERIENCE_TYPES),
  works: z.array(z.string()),
  gradient: z.object({ from: z.string(), to: z.string() }),
}) satisfies z.ZodType<Experience>;
