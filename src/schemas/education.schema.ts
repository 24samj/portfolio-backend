import { z } from "zod";
import type { Education } from "@/types/education.type";

/** Documentation only (see `Education`). */
export const educationSchema = z.object({
  _id: z.string(),
  schoolName: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  degreeName: z.string(),
  notes: z.string(),
  activities: z.string(),
}) satisfies z.ZodType<Education>;
