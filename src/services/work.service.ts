import { count, eq, inArray } from "drizzle-orm";
import { getDb, type WorkRow, works } from "@/db";
import type { Work } from "@/types/work.type";
import { AppStoreService } from "./AppStoreService";
import { PlayStoreService } from "./PlayStoreService";

/** Per external store call, so a slow store can't stall the whole list. */
const STORE_TIMEOUT_MS = 3000;

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

/** Append store screenshots to the seeded ones, dropping blanks and dupes. */
function mergeScreenshots(existing: string[], incoming: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const url of [...existing, ...incoming]) {
    const trimmed = url?.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      merged.push(trimmed);
    }
  }
  return merged;
}

const STORE_NOT_FOUND = /not found|404|Failed to fetch App Store data/i;

function logStoreMiss(store: string, id: string, error: unknown): void {
  const message = error instanceof Error ? error.message : "Unknown error";
  if (STORE_NOT_FOUND.test(message)) {
    console.warn(`${store} app not found for ID "${id}"`);
  } else {
    console.warn(`Failed to fetch ${store} data for ${id}:`, message);
  }
}

/** Play Store fills gaps only: rating when 0, category when empty. */
async function applyPlayStore(work: Work, playStoreId: string): Promise<Work> {
  try {
    const app = await PlayStoreService.getApp(
      playStoreId,
      "en",
      "us",
      STORE_TIMEOUT_MS
    );
    return {
      ...work,
      screenshots: mergeScreenshots(work.screenshots, app.screenshots ?? []),
      rating: work.rating || (app.score ?? 0),
      category: work.category || app.genre || "",
    };
  } catch (error) {
    logStoreMiss("Play Store", playStoreId, error);
    return work;
  }
}

/** App Store fills gaps, and its rating replaces a lower one. */
async function applyAppStore(work: Work, appStoreId: string): Promise<Work> {
  try {
    const app = await AppStoreService.getAppStoreApp(
      appStoreId,
      STORE_TIMEOUT_MS
    );
    return {
      ...work,
      screenshots: mergeScreenshots(work.screenshots, app.screenshots ?? []),
      rating: Math.max(work.rating, app.rating || 0),
      category: work.category || app.category || "",
    };
  } catch (error) {
    logStoreMiss("App Store", appStoreId, error);
    return work;
  }
}

/**
 * Fill in what the seed can't know: live screenshots, rating and store genre.
 * Never throws: a store outage degrades to the seeded work.
 */
async function enrichWithStoreData(work: Work): Promise<Work> {
  let enriched = work;
  const playStoreId = work.playStoreId?.trim();
  if (playStoreId) {
    enriched = await applyPlayStore(enriched, playStoreId);
  }
  const appStoreId = work.appStoreId?.trim();
  if (appStoreId) {
    enriched = await applyAppStore(enriched, appStoreId);
  }
  return enriched;
}

/** Enrich in parallel; a rejected enrichment falls back to the seeded work. */
async function enrichAll(rows: WorkRow[]): Promise<Work[]> {
  const base = rows.map(toWork);
  const settled = await Promise.allSettled(base.map(enrichWithStoreData));
  return settled.map((result, i) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    console.warn(`Failed to enrich work ${base[i]._id}:`, result.reason);
    return base[i];
  });
}

export async function listWorks(d1: D1Database): Promise<Work[]> {
  const rows = await getDb(d1).select().from(works);
  return enrichAll(rows);
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
  return enrichAll(rows);
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
  const [enriched] = await enrichAll([row]);
  return enriched;
}

export async function countWorks(d1: D1Database): Promise<number> {
  const totals = await getDb(d1).select({ value: count() }).from(works);
  return totals[0]?.value ?? 0;
}
