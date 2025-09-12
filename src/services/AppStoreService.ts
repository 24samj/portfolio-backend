import * as gplay from "google-play-scraper";
import { AppStoreApp, PlayStoreApp } from "../types/ClosedTest";

export class AppStoreService {
  /**
   * Get iOS App Store app data
   */
  static async getAppStoreApp(id: string): Promise<AppStoreApp> {
    try {
      const response = await fetch(
        `https://itunes.apple.com/lookup?id=${id}&country=us`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`iTunes API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        throw new Error("App not found");
      }

      const app = data.results[0];

      return {
        id: app.trackId.toString(),
        name: app.trackName,
        description: app.description,
        icon: app.artworkUrl100,
        screenshots: app.screenshotUrls || [],
        appStoreUrl: app.trackViewUrl,
        version: app.version,
        rating: app.averageUserRating,
        ratingCount: app.userRatingCount,
        price: app.price,
        currency: app.currency,
        developer: app.artistName,
        category: app.primaryGenreName,
        releaseDate: app.releaseDate,
        size: app.fileSizeBytes,
      };
    } catch (error) {
      console.error("Error fetching App Store data:", error);
      throw new Error("Failed to fetch App Store data");
    }
  }

  /**
   * Get Google Play Store app data
   */
  static async getPlayStoreApp(packageName: string): Promise<PlayStoreApp> {
    try {
      // @ts-expect-error - google-play-scraper types don't match actual module structure
      const app = await gplay.default.app({
        appId: packageName,
        country: "in",
      });

      return {
        id: app.appId,
        name: app.title,
        description: app.description,
        summary: app.summary,
        icon: app.icon,
        screenshots: app.screenshots || [],
        playStoreUrl: app.url,
        version: app.version,
        rating: app.score,
        ratingCount: app.reviews,
        installs: app.installs,
        price: app.price,
        free: app.free,
        developer: app.developer,
        category: app.genre,
        releaseDate: app.released,
        size: app.size,
        androidVersion: app.androidVersion,
        contentRating: app.contentRating,
      };
    } catch (error) {
      console.error("Error fetching Play Store data:", error);
      throw new Error("Failed to fetch Play Store data");
    }
  }

  /**
   * Check if Play Store app is in closed testing
   */
  static async checkPlayStoreTestingStatus(packageName: string): Promise<{
    isInClosedTesting: boolean;
    appData: any;
  }> {
    try {
      const app = await this.getPlayStoreApp(packageName);
      return {
        isInClosedTesting: false,
        appData: app,
      };
    } catch (error) {
      // If we can't fetch the app, it's likely in closed testing
      return {
        isInClosedTesting: true,
        appData: {
          name: "Unknown App",
          packageName,
          isAvailable: false,
          error: "App not found or in closed testing",
        },
      };
    }
  }
}
