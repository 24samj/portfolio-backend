/** What the Play Store page scrape yields. Everything past `url` is best-effort. */
export type PlayStoreApp = {
  appId: string;
  title: string;
  url: string;
  description?: string;
  summary?: string;
  icon?: string;
  screenshots?: string[];
  score?: number;
  scoreText?: string;
  ratings?: number;
  developer?: string;
  genre?: string;
  price?: number;
  priceText?: string;
  free?: boolean;
  currency?: string;
};
