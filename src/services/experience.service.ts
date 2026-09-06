import { eq } from "drizzle-orm";
import { type ExperienceRow, experiences, getDb } from "@/db";
import type { Experience } from "@/types/experience.type";

/** D1 row -> API shape. `_id` is what the frontend keys on. */
export function toExperience(row: ExperienceRow): Experience {
  return {
    _id: row.id,
    name: row.name,
    role: row.role,
    workStart: row.workStart,
    workEnd: row.workEnd,
    location: row.location,
    description: row.description,
    type: row.type,
    works: row.works,
    gradient: row.gradient,
  };
}

const startOf = (row: ExperienceRow): number =>
  new Date(row.workStart).getTime();

/**
 * Current positions first (oldest start first, so the longest-held leads), then
 * past positions newest-first. Done here, not in SQL: the null-partition rule
 * reads clearer as a comparator than as a CASE in an ORDER BY.
 */
export function sortExperiences(rows: ExperienceRow[]): ExperienceRow[] {
  return rows.slice().sort((a, b) => {
    const aCurrent = a.workEnd === null;
    const bCurrent = b.workEnd === null;
    if (aCurrent !== bCurrent) {
      return aCurrent ? -1 : 1;
    }
    return aCurrent ? startOf(a) - startOf(b) : startOf(b) - startOf(a);
  });
}

export async function listExperiences(d1: D1Database): Promise<Experience[]> {
  const rows = await getDb(d1).select().from(experiences);
  return sortExperiences(rows).map(toExperience);
}

export async function getExperience(
  d1: D1Database,
  id: string
): Promise<Experience | null> {
  const row = await getDb(d1)
    .select()
    .from(experiences)
    .where(eq(experiences.id, id))
    .get();
  return row ? toExperience(row) : null;
}

/** Raw rows for the stats calculation, which needs dates not the API shape. */
export function listExperienceRows(d1: D1Database): Promise<ExperienceRow[]> {
  return getDb(d1).select().from(experiences);
}
