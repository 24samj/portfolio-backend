import type { AppStoreApp, ITunesLookupResponse } from "@/types/app-store.type";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function lookup(id: string, timeoutMs: number): Promise<AppStoreApp> {
  const response = await Promise.race([
    fetch(`https://itunes.apple.com/lookup?id=${id}&country=us`, {
      headers: { "User-Agent": USER_AGENT },
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("App Store API timeout")), timeoutMs)
    ),
  ]);

  if (!response.ok) {
    throw new Error(`iTunes API error: ${response.status}`);
  }

  // Workers types return `unknown` from json(); the lookup API's shape is stable.
  const data = (await response.json()) as ITunesLookupResponse;
  const app = data.results?.[0];
  if (!app) {
    throw new Error("App not found");
  }

  return {
    id: app.trackId.toString(),
    name: app.trackName,
    description: app.description,
    icon: app.artworkUrl100,
    screenshots: app.screenshotUrls ?? [],
    appStoreUrl: app.trackViewUrl,
    version: app.version,
    rating: app.averageUserRating,
    ratingCount: app.userRatingCount,
    price: app.price,
    currency: app.currency,
    developer: app.artistName,
    category: app.primaryGenreName,
    releaseDate: app.releaseDate,
    // iTunes returns bytes as a string; passed through untouched.
    size: app.fileSizeBytes,
  };
}

/**
 * One iOS app via the public iTunes Lookup API. The real cause is logged; the
 * caller always sees the same generic error (that's what the API has always
 * returned, and the works enrichment matches on it).
 */
export async function getAppStoreApp(
  id: string,
  timeoutMs = 5000
): Promise<AppStoreApp> {
  try {
    return await lookup(id, timeoutMs);
  } catch (error) {
    console.error("Error fetching App Store data:", error);
    throw new Error("Failed to fetch App Store data");
  }
}
