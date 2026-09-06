export interface AppStoreApp {
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
  size: number;
}

export interface PlayStoreApp {
  id: string;
  name: string;
  description: string;
  summary: string;
  icon: string;
  screenshots: string[];
  playStoreUrl: string;
  version: string;
  rating: number;
  ratingCount: number;
  installs: string;
  price: number;
  free: boolean;
  developer: string;
  category: string;
  releaseDate: string;
  size: string;
  androidVersion: string;
  contentRating: string;
}

/** The subset of an iTunes Lookup API result that `getAppStoreApp` reads. */
export interface ITunesLookupResult {
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
}

export interface ITunesLookupResponse {
  results: ITunesLookupResult[];
}
