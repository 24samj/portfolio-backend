/**
 * Custom Play Store scraper using fetch (compatible with Cloudflare Workers)
 * This replaces google-play-scraper which uses 'got' library that doesn't work in Workers
 */

export interface PlayStoreApp {
  appId: string;
  title: string;
  description?: string;
  summary?: string;
  icon?: string;
  screenshots?: string[];
  url: string;
  version?: string;
  score?: number;
  scoreText?: string;
  ratings?: number;
  reviews?: number;
  installs?: string;
  minInstalls?: number;
  maxInstalls?: number;
  price?: number;
  priceText?: string;
  free?: boolean;
  currency?: string;
  developer?: string;
  developerId?: string;
  genre?: string;
  genreId?: string;
  contentRating?: string;
  androidVersion?: string;
  updated?: number;
  released?: string;
}

/**
 * Extract data from Play Store page HTML using regex patterns
 * This is a simplified version that works in Cloudflare Workers
 */
export class PlayStoreService {
  /**
   * Get Play Store app data by package ID with timeout protection
   */
  static async getApp(appId: string, lang: string = 'en', country: string = 'us', timeoutMs: number = 5000): Promise<PlayStoreApp> {
    const url = `https://play.google.com/store/apps/details?id=${appId}&hl=${lang}&gl=${country}`;
    
    try {
      const fetchPromise = fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': `${lang}-${country.toUpperCase()},${lang};q=0.9`,
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://play.google.com/',
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Play Store API timeout")), timeoutMs)
      );

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`App not found (404) - App ID: ${appId}`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Check for error pages
      if (html.includes("We're sorry, the requested URL was not found") || 
          html.includes("Item not found")) {
        throw new Error(`App not found - App ID: ${appId}`);
      }

      // Extract data from HTML
      const appData = this.parsePlayStoreHTML(html, appId, url);
      
      return appData;
    } catch (error) {
      console.error('Error fetching Play Store data:', error);
      throw error;
    }
  }

  /**
   * Parse Play Store HTML to extract app data
   */
  private static parsePlayStoreHTML(html: string, appId: string, url: string): PlayStoreApp {
    const app: PlayStoreApp = {
      appId,
      url,
      title: 'Unknown App',
    };

    // Extract title from meta tags or h1
    const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i) ||
                       html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (titleMatch) {
      app.title = titleMatch[1].trim();
    }

    // Extract description
    const descMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
    if (descMatch) {
      app.description = descMatch[1].trim();
      app.summary = app.description.substring(0, 200);
    }

    // Extract icon
    const iconMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
    if (iconMatch) {
      app.icon = iconMatch[1];
    }

    // Extract rating (simplified - look for common patterns)
    const ratingMatch = html.match(/"ratingValue":\s*([\d.]+)/i) ||
                       html.match(/Rated\s+([\d.]+)\s+stars/i);
    if (ratingMatch) {
      app.score = parseFloat(ratingMatch[1]);
      app.scoreText = ratingMatch[1];
    }

    // Extract developer
    const devMatch = html.match(/<a[^>]*class="[^"]*Vbfug[^"]*"[^>]*>([^<]+)<\/a>/i) ||
                     html.match(/"author":\s*"([^"]+)"/i);
    if (devMatch) {
      app.developer = devMatch[1].trim();
    }

    // Extract screenshots (simplified)
    const screenshotMatches = html.matchAll(/<img[^>]*src="([^"]*googleusercontent[^"]*)"[^>]*>/gi);
    const screenshots: string[] = [];
    for (const match of screenshotMatches) {
      if (match[1] && !match[1].includes('icon') && screenshots.length < 10) {
        screenshots.push(match[1]);
      }
    }
    if (screenshots.length > 0) {
      app.screenshots = screenshots;
    }

    // Try to extract from JSON-LD structured data
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        if (jsonData['@type'] === 'MobileApplication') {
          app.title = jsonData.name || app.title;
          app.description = jsonData.description || app.description;
          app.icon = jsonData.image || app.icon;
          if (jsonData.aggregateRating) {
            app.score = jsonData.aggregateRating.ratingValue;
            app.ratings = jsonData.aggregateRating.ratingCount;
          }
          if (jsonData.applicationCategory) {
            app.genre = jsonData.applicationCategory;
          }
          if (jsonData.offers) {
            app.price = jsonData.offers.price === 0 ? 0 : jsonData.offers.price / 1000000;
            app.priceText = jsonData.offers.price === 0 ? 'Free' : `$${app.price}`;
            app.free = jsonData.offers.price === 0;
            app.currency = jsonData.offers.priceCurrency || 'USD';
          }
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    return app;
  }
}


