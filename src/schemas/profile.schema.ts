import { z } from "zod";
import type { Profile } from "@/types/profile.type";

/** Documentation only (see `Profile`). */
export const profileSchema = z.object({
  _id: z.string(),
  type: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  headline: z.string(),
  summary: z.string(),
  industry: z.string().nullable(),
  location: z.string().nullable(),
  birthDate: z.string().nullable(),
  website: z.string().nullable(),
  twitterHandles: z.array(z.string()),
}) satisfies z.ZodType<Profile>;
