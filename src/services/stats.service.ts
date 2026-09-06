import type { ExperienceRow } from "@/db";
import type { PortfolioStats } from "@/types/stats.type";
import { listExperienceRows } from "./experience.service";
import { listSkillCategoryRows } from "./skill.service";
import { countWorks } from "./work.service";

/**
 * Total experience in decimal years, one decimal place. Each calendar month
 * worked counts once, so overlapping positions don't inflate the total.
 */
export function calculateTotalExperience(
  positions: Pick<ExperienceRow, "workStart" | "workEnd">[]
): number {
  if (positions.length === 0) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const months = new Set<string>();
  for (const position of positions) {
    const start = new Date(position.workStart);
    start.setHours(0, 0, 0, 0);
    const end = position.workEnd ? new Date(position.workEnd) : today;
    end.setHours(0, 0, 0, 0);

    const cursor = new Date(start);
    while (cursor <= end) {
      const month = String(cursor.getMonth() + 1).padStart(2, "0");
      months.add(`${cursor.getFullYear()}-${month}`);
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return Math.round((months.size / 12) * 10) / 10;
}

export async function getStats(d1: D1Database): Promise<PortfolioStats> {
  const [positions, totalProjects, categories] = await Promise.all([
    listExperienceRows(d1),
    countWorks(d1),
    listSkillCategoryRows(d1),
  ]);

  const technologies = new Set<string>();
  for (const category of categories) {
    for (const skill of category.skills) {
      const name = skill.name.trim();
      if (name) {
        technologies.add(name);
      }
    }
  }

  return {
    totalExperience: calculateTotalExperience(positions),
    totalCompanies: positions.length,
    totalProjects,
    totalTechnologies: technologies.size,
    currentPosition: positions.some((p) => !p.workEnd),
    lastUpdated: new Date().toISOString(),
  };
}

/** "2024-03-14" -> "Mar 2024"; null or the literal "null" -> "Present". */
export function formatExpDate(date: string | null): string {
  if (!date || date === "null") {
    return "Present";
  }
  const parsed = new Date(date);
  const month = parsed.toLocaleString("default", { month: "short" });
  return `${month} ${parsed.getFullYear()}`;
}
