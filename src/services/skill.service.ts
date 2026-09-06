import { eq } from "drizzle-orm";
import {
  getDb,
  type Proficiency,
  type SkillCategoryRow,
  type SkillJson,
  skillCategories,
} from "@/db";
import type { Skill, SkillCategory } from "@/types/skill.type";

const PROFICIENCY_RANK: Record<Proficiency, number> = {
  Expert: 4,
  Advanced: 3,
  Intermediate: 2,
  Beginner: 1,
};

/** Strongest first, then alphabetical. */
export function sortSkills(skills: SkillJson[]): SkillJson[] {
  return skills.slice().sort((a, b) => {
    const diff =
      PROFICIENCY_RANK[b.proficiency] - PROFICIENCY_RANK[a.proficiency];
    return diff === 0 ? a.name.localeCompare(b.name) : diff;
  });
}

function toSkill(category: SkillCategoryRow, skill: SkillJson): Skill {
  return {
    _id: `${category.id}-${skill.name}`,
    name: skill.name,
    proficiency: skill.proficiency,
    description: skill.description,
    category: category.title,
    icon: category.icon,
  };
}

/**
 * A category as the `/api/skills` list returns it: category fields at the top
 * level (title doubling as name and description, proficiency pinned to Expert)
 * with its sorted skills nested.
 */
export function toSkillCategory(row: SkillCategoryRow): SkillCategory {
  return {
    _id: row.id,
    name: row.title,
    description: row.title,
    category: row.title,
    icon: row.icon,
    proficiency: "Expert",
    skills: sortSkills(row.skills).map((skill) => toSkill(row, skill)),
  };
}

export async function listSkillCategories(
  d1: D1Database
): Promise<SkillCategory[]> {
  const rows = await getDb(d1).select().from(skillCategories);
  return rows.map(toSkillCategory);
}

/** Flat skills of one category by title. Empty for an unknown title. */
export async function listSkillsByCategory(
  d1: D1Database,
  title: string
): Promise<Skill[]> {
  const row = await getDb(d1)
    .select()
    .from(skillCategories)
    .where(eq(skillCategories.title, title))
    .get();
  if (!row) {
    return [];
  }
  return sortSkills(row.skills).map((skill) => toSkill(row, skill));
}

/**
 * One category by id, shaped as a single skill: title for name/description,
 * proficiency from its first skill. Null when unknown or empty.
 */
export async function getSkillCategory(
  d1: D1Database,
  id: string
): Promise<Skill | null> {
  const row = await getDb(d1)
    .select()
    .from(skillCategories)
    .where(eq(skillCategories.id, id))
    .get();
  const first = row?.skills[0];
  if (!(row && first)) {
    return null;
  }
  return {
    _id: row.id,
    name: row.title,
    description: row.title,
    category: row.title,
    icon: row.icon,
    proficiency: first.proficiency,
  };
}

/** Raw rows for the stats calculation. */
export function listSkillCategoryRows(
  d1: D1Database
): Promise<SkillCategoryRow[]> {
  return getDb(d1).select().from(skillCategories);
}
