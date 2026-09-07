import { count, eq, inArray } from "drizzle-orm";
import { getDb, type WorkRow, works } from "@/db";
import type { Work } from "@/types/work.type";

/** D1 row -> API shape (nested description, real booleans). */
export function toWork(row: WorkRow): Work {
  return {
    _id: row.id,
    name: row.name,
    description: { short: row.descriptionShort, long: row.descriptionLong },
    icon: row.icon,
    category: row.category,
    type: row.type,
    appStoreId: row.appStoreId,
    playStoreId: row.playStoreId,
    isInternal: row.isInternal === 1,
    featured: row.featured === 1,
    companyId: row.companyId,
    technologies: row.technologies,
    rating: row.rating,
    screenshots: row.screenshots,
    webUrls: row.webUrls,
    sourceCode: row.sourceCode,
    googleGroupUrl: row.googleGroupUrl,
  };
}

/** Featured works lead; otherwise seed order. Stable, so ties keep their place. */
function featuredFirst(rows: WorkRow[]): WorkRow[] {
  return rows.slice().sort((a, b) => b.featured - a.featured);
}

export async function listWorks(d1: D1Database): Promise<Work[]> {
  const rows = await getDb(d1).select().from(works);
  return featuredFirst(rows).map(toWork);
}

export async function listWorksByIds(
  d1: D1Database,
  ids: string[]
): Promise<Work[]> {
  if (ids.length === 0) {
    return [];
  }
  const rows = await getDb(d1)
    .select()
    .from(works)
    .where(inArray(works.id, ids));
  return featuredFirst(rows).map(toWork);
}

export async function getWork(
  d1: D1Database,
  id: string
): Promise<Work | null> {
  const row = await getDb(d1)
    .select()
    .from(works)
    .where(eq(works.id, id))
    .get();
  if (!row) {
    return null;
  }
  return toWork(row);
}

export async function countWorks(d1: D1Database): Promise<number> {
  const totals = await getDb(d1).select({ value: count() }).from(works);
  return totals[0]?.value ?? 0;
}
