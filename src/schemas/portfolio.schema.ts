import { z } from "zod";
import { certificationSchema } from "@/schemas/certification.schema";
import { educationSchema } from "@/schemas/education.schema";
import { experienceSchema } from "@/schemas/experience.schema";
import { profileSchema } from "@/schemas/profile.schema";
import { skillCategorySchema } from "@/schemas/skill.schema";
import { statsSchema } from "@/schemas/stats.schema";
import { workSchema } from "@/schemas/work.schema";
import type { Portfolio } from "@/types/portfolio.type";

/** Documentation only (see `Portfolio`). Composed from the per-domain schemas. */
export const portfolioSchema = z.object({
  profile: profileSchema.nullable(),
  skills: z.array(skillCategorySchema),
  experiences: z.array(experienceSchema),
  educations: z.array(educationSchema),
  certifications: z.array(certificationSchema),
  works: z.array(workSchema),
  stats: statsSchema,
}) satisfies z.ZodType<Portfolio>;
