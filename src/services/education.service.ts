import { eq } from "drizzle-orm";
import { type EducationRow, educations, getDb } from "@/db";
import type { Education } from "@/types/education.type";

export function toEducation(row: EducationRow): Education {
  return {
    _id: row.id,
    schoolName: row.schoolName,
    startDate: row.startDate,
    endDate: row.endDate,
    degreeName: row.degreeName,
    notes: row.notes,
    activities: row.activities,
  };
}

const time = (value: string): number => new Date(value).getTime();

/** Newest first: by end date, falling back to start date for ongoing entries. */
export function sortEducations(rows: EducationRow[]): EducationRow[] {
  return rows.slice().sort((a, b) => {
    if (a.endDate && b.endDate) {
      return time(b.endDate) - time(a.endDate);
    }
    if (!(a.endDate || b.endDate)) {
      return time(b.startDate) - time(a.startDate);
    }
    return a.endDate ? 1 : -1;
  });
}

export async function listEducations(d1: D1Database): Promise<Education[]> {
  const rows = await getDb(d1).select().from(educations);
  return sortEducations(rows).map(toEducation);
}

export async function getEducation(
  d1: D1Database,
  id: string
): Promise<Education | null> {
  const row = await getDb(d1)
    .select()
    .from(educations)
    .where(eq(educations.id, id))
    .get();
  return row ? toEducation(row) : null;
}
