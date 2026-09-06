/** An iOS app as `/api/apps/app-store/:id` returns it. */
export type AppStoreApp = {
  id: string;
  name: string;
  description: string;
  icon: string;
  screenshots: string[];
  appStoreUrl: string;
  version: string;
  rating: number;
  ratingCount: number;
  price: number;
  currency: string;
  developer: string;
  category: string;
  releaseDate: string;
  /** Bytes. iTunes sends it as a string; converted at the mapper. */
  size: string;
};

/** The subset of an iTunes Lookup API result that `getAppStoreApp` reads. */
export type ITunesLookupResult = {
  trackId: number;
  trackName: string;
  description: string;
  artworkUrl100: string;
  screenshotUrls?: string[];
  trackViewUrl: string;
  version: string;
  averageUserRating: number;
  userRatingCount: number;
  price: number;
  currency: string;
  artistName: string;
  primaryGenreName: string;
  releaseDate: string;
  fileSizeBytes: string;
};

export type ITunesLookupResponse = {
  results: ITunesLookupResult[];
};
