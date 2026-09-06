import { eq } from "drizzle-orm";
import { getDb, type ProfileRow, profile } from "@/db";
import type { Profile } from "@/types/profile.type";

export function toProfile(row: ProfileRow): Profile {
  return {
    _id: row.id,
    type: row.type,
    firstName: row.firstName,
    lastName: row.lastName,
    headline: row.headline,
    summary: row.summary,
    industry: row.industry,
    location: row.location,
    birthDate: row.birthDate,
    website: row.website,
    twitterHandles: row.twitterHandles,
  };
}

/** The `profile`-typed row, else whatever row exists. Null on an empty table. */
export async function getProfile(d1: D1Database): Promise<Profile | null> {
  const db = getDb(d1);
  const typed = await db
    .select()
    .from(profile)
    .where(eq(profile.type, "profile"))
    .get();
  const row = typed ?? (await db.select().from(profile).get());
  return row ? toProfile(row) : null;
}
