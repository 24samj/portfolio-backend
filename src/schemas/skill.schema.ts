import { z } from "zod";
import { PROFICIENCIES } from "@/db/schema";
import type { Skill, SkillCategory } from "@/types/skill.type";

/** Documentation only (see `Skill`). */
export const skillSchema = z.object({
  _id: z.string(),
  name: z.string(),
  proficiency: z.enum(PROFICIENCIES),
  description: z.string(),
  category: z.string(),
  icon: z.string(),
}) satisfies z.ZodType<Skill>;

/** Documentation only (see `SkillCategory`). */
export const skillCategorySchema = skillSchema.extend({
  skills: z.array(skillSchema),
}) satisfies z.ZodType<SkillCategory>;
