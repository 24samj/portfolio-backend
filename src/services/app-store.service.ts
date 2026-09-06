import type { AppStoreApp, ITunesLookupResponse } from "@/types/app-store.type";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

/** One iOS app via the public iTunes Lookup API. Throws when unknown or slow. */
export async function getAppStoreApp(
  id: string,
  timeoutMs = 5000
): Promise<AppStoreApp> {
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
    size: Number(app.fileSizeBytes),
  };
}
