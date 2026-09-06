import type { Proficiency } from "@/db/schema";

/** One skill, flattened with its category, as `/api/skills/category/:title` returns. */
export type Skill = {
  /** `<categoryId>-<name>` — synthetic, since skills live inside a category row. */
  _id: string;
  name: string;
  proficiency: Proficiency;
  description: string;
  category: string;
  icon: string;
};

/**
 * A category with its skills nested, as `/api/skills` returns. Carries the same
 * top-level keys as `Skill` (the frontend renders both with one card), with
 * the category's title standing in for name/description.
 */
export type SkillCategory = Skill & {
  skills: Skill[];
};
