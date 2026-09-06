import { z } from "zod";
import type { Certification } from "@/types/certification.type";

/** Documentation only (see `Certification`). */
export const certificationSchema = z.object({
  _id: z.string(),
  name: z.string(),
  issuer: z.string(),
  date: z.string(),
  credentialID: z.string().nullable(),
  link: z.string().optional(),
}) satisfies z.ZodType<Certification>;
