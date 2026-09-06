import type { PlayStoreApp } from "@/types/play-store.type";

/**
 * Play Store page scraper on plain `fetch`, since the usual npm scrapers pull in
 * Node HTTP clients that don't run in Workers. Regex over the HTML plus the
 * page's JSON-LD block; fields it can't find stay undefined.
 */

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const OG_TITLE = /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i;
const H1 = /<h1[^>]*>([^<]+)<\/h1>/i;
const OG_DESCRIPTION =
  /<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i;
const OG_IMAGE = /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i;
const RATING_VALUE = /"ratingValue":\s*([\d.]+)/i;
const RATED_STARS = /Rated\s+([\d.]+)\s+stars/i;
const DEVELOPER_LINK = /<a[^>]*class="[^"]*Vbfug[^"]*"[^>]*>([^<]+)<\/a>/i;
const AUTHOR = /"author":\s*"([^"]+)"/i;
const SCREENSHOT_IMG = /<img[^>]*src="([^"]*googleusercontent[^"]*)"[^>]*>/gi;
const JSON_LD =
  /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i;

const MAX_SCREENSHOTS = 10;
const SUMMARY_LENGTH = 200;
/** Play Store prices are in micros. */
const MICROS = 1_000_000;

/** The JSON-LD fields the store page publishes for an app. */
type MobileApplicationLd = {
  "@type"?: string;
  name?: string;
  description?: string;
  image?: string;
  applicationCategory?: string;
  aggregateRating?: { ratingValue?: number; ratingCount?: number };
  offers?: { price?: number; priceCurrency?: string };
};

function first(html: string, ...patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return;
}

function screenshotsOf(html: string): string[] | undefined {
  const urls: string[] = [];
  for (const match of html.matchAll(SCREENSHOT_IMG)) {
    const url = match[1];
    if (url && !url.includes("icon") && urls.length < MAX_SCREENSHOTS) {
      urls.push(url);
    }
  }
  return urls.length > 0 ? urls : undefined;
}

/** Overlay the JSON-LD block where present — it's structured, the regexes aren't. */
function applyJsonLd(app: PlayStoreApp, html: string): PlayStoreApp {
  const block = html.match(JSON_LD)?.[1];
  if (!block) {
    return app;
  }
  let data: MobileApplicationLd;
  try {
    data = JSON.parse(block) as MobileApplicationLd;
  } catch {
    return app;
  }
  if (data["@type"] !== "MobileApplication") {
    return app;
  }

  const merged: PlayStoreApp = {
    ...app,
    title: data.name || app.title,
    description: data.description || app.description,
    icon: data.image || app.icon,
    genre: data.applicationCategory || app.genre,
  };
  if (data.aggregateRating) {
    merged.score = data.aggregateRating.ratingValue;
    merged.ratings = data.aggregateRating.ratingCount;
  }
  if (data.offers) {
    const micros = data.offers.price ?? 0;
    merged.price = micros === 0 ? 0 : micros / MICROS;
    merged.priceText = micros === 0 ? "Free" : `$${merged.price}`;
    merged.free = micros === 0;
    merged.currency = data.offers.priceCurrency || "USD";
  }
  return merged;
}

function parsePlayStoreHtml(
  html: string,
  appId: string,
  url: string
): PlayStoreApp {
  const description = first(html, OG_DESCRIPTION);
  const scoreText = first(html, RATING_VALUE, RATED_STARS);

  const app: PlayStoreApp = {
    appId,
    url,
    title: first(html, OG_TITLE, H1) ?? "Unknown App",
    description,
    summary: description?.slice(0, SUMMARY_LENGTH),
    icon: first(html, OG_IMAGE),
    score: scoreText === undefined ? undefined : Number.parseFloat(scoreText),
    scoreText,
    developer: first(html, DEVELOPER_LINK, AUTHOR),
    screenshots: screenshotsOf(html),
  };

  return applyJsonLd(app, html);
}

/** Fetch and parse one store listing. Throws on 404 or a store error page. */
export async function getPlayStoreApp(
  appId: string,
  lang = "en",
  country = "us",
  timeoutMs = 5000
): Promise<PlayStoreApp> {
  const url = `https://play.google.com/store/apps/details?id=${appId}&hl=${lang}&gl=${country}`;

  const response = await Promise.race([
    fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": `${lang}-${country.toUpperCase()},${lang};q=0.9`,
        Referer: "https://play.google.com/",
      },
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Play Store API timeout")), timeoutMs)
    ),
  ]);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`App not found (404) - App ID: ${appId}`);
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  if (
    html.includes("We're sorry, the requested URL was not found") ||
    html.includes("Item not found")
  ) {
    throw new Error(`App not found - App ID: ${appId}`);
  }

  return parsePlayStoreHtml(html, appId, url);
}
