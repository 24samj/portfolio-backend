import { z } from "zod";
import { WORK_TYPES } from "@/db/schema";
import type { Work } from "@/types/work.type";

/** Documentation only (see `Work`). */
export const workSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.object({ short: z.string(), long: z.string() }),
  icon: z.string(),
  category: z.string(),
  type: z.enum(WORK_TYPES),
  appStoreId: z.string().nullable(),
  playStoreId: z.string().nullable(),
  isInternal: z.boolean(),
  featured: z.boolean(),
  companyId: z.string().nullable(),
  technologies: z.array(z.string()),
  rating: z.number(),
  screenshots: z.array(z.string()),
  webUrls: z.array(z.string()).nullable(),
  sourceCode: z.string().nullable(),
  googleGroupUrl: z.string().nullable(),
}) satisfies z.ZodType<Work>;
