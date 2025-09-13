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
   * Extract text content from HTML element
   */
  private static extractTextFromHTML(html: string, selector: string): string | null {
    try {
      // Simple regex-based extraction since we can't use cheerio in Workers
      const regex = new RegExp(`<[^>]*${selector}[^>]*>([^<]+)</`, 'i');
      const match = html.match(regex);
      return match ? match[1].trim() : null;
    } catch {
      return null;
    }
  }

  /**
   * Extract content between specific markers
   */
  private static extractBetween(html: string, start: string, end: string): string | null {
    try {
      const startIndex = html.indexOf(start);
      if (startIndex === -1) return null;
      
      const contentStart = startIndex + start.length;
      const endIndex = html.indexOf(end, contentStart);
      if (endIndex === -1) return null;
      
      return html.substring(contentStart, endIndex).trim();
    } catch {
      return null;
    }
  }

  /**
   * Parse JSON-LD data from Play Store page
   */
  private static parseStructuredData(html: string): any {
    try {
      // Look for JSON-LD structured data
      const jsonLdRegex = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
      let match;
      
      while ((match = jsonLdRegex.exec(html)) !== null) {
        try {
          const jsonData = JSON.parse(match[1]);
          if (jsonData['@type'] === 'MobileApplication' || jsonData.applicationCategory) {
            return jsonData;
          }
        } catch {
          continue;
        }
      }
      
      // Look for AF_initDataCallback data
      const initDataRegex = /AF_initDataCallback\({[^}]*?data:(\[[\s\S]*?\])\s*}\);/g;
      while ((match = initDataRegex.exec(html)) !== null) {
        try {
          const data = JSON.parse(match[1]);
          if (Array.isArray(data) && data.length > 0) {
            return this.parsePlayStoreInitData(data);
          }
        } catch {
          continue;
        }
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Parse Play Store init data structure
   */
  private static parsePlayStoreInitData(data: any[]): any {
    try {
      // Play Store data is nested in a complex array structure
      // This is a simplified parser based on common patterns
      const findInNestedArray = (arr: any[], key: string): any => {
        for (const item of arr) {
          if (Array.isArray(item)) {
            const result = findInNestedArray(item, key);
            if (result) return result;
          } else if (typeof item === 'string' && item.includes(key)) {
            return item;
          } else if (typeof item === 'object' && item !== null) {
            for (const [k, v] of Object.entries(item)) {
              if (k.includes(key) || (typeof v === 'string' && v.includes(key))) {
                return v;
              }
            }
          }
        }
        return null;
      };

      return {
        title: findInNestedArray(data, 'title') || findInNestedArray(data, 'name'),
        developer: findInNestedArray(data, 'developer') || findInNestedArray(data, 'author'),
        rating: findInNestedArray(data, 'rating') || findInNestedArray(data, 'ratingValue'),
        installs: findInNestedArray(data, 'installs') || findInNestedArray(data, 'downloads'),
      };
    } catch {
      return null;
    }
  }

  /**
   * Get Google Play Store app data using web scraping
   * 
   * @deprecated DEPRECATED - This method has been commented out due to the following issues:
   * 
   * 1. **Fragile HTML Structure**: Google Play Store frequently changes their HTML structure,
   *    class names, and DOM elements, making regex-based scraping extremely unreliable.
   * 
   * 2. **Anti-Bot Measures**: Google implements various anti-scraping measures including:
   *    - Rate limiting and IP blocking
   *    - Dynamic class names that change frequently
   *    - JavaScript-rendered content that's not available in raw HTML
   *    - CAPTCHA challenges and bot detection
   * 
   * 3. **Inconsistent Data Extraction**: Even when scraping "works", the extracted data
   *    was often incorrect, incomplete, or contained "Unknown" values due to:
   *    - Outdated regex patterns
   *    - Regional differences in HTML structure
   *    - Different layouts for different app types
   * 
   * 4. **Maintenance Overhead**: Required constant updates to regex patterns and
   *    extraction logic, making it unsustainable for production use.
   * 
   * 5. **Better Alternatives Available**: The frontend implementation using the
   *    google-play-scraper library is more reliable and maintainable.
   * 
   * **Solution**: Use the frontend API at `/api/play-store/[id]` instead.
   * This provides better error handling, more reliable data extraction,
   * and is easier to maintain and update.
   */
  // static async getPlayStoreApp(packageName: string): Promise<PlayStoreApp> {
  //   try {
  //     console.log(`=== PLAY STORE WEB SCRAPING START ===`);
  //     console.log(`Package: ${packageName}`);
      
  //     // Build the Play Store URL
  //     const playStoreUrl = `https://play.google.com/store/apps/details?id=${packageName}&hl=en&gl=us`;
  //     console.log(`Fetching URL: ${playStoreUrl}`);
      
  //     const response = await fetch(playStoreUrl, {
  //       headers: {
  //         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  //         'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  //         'Accept-Language': 'en-US,en;q=0.5',
  //         'Accept-Encoding': 'gzip, deflate, br',
  //         'Cache-Control': 'no-cache',
  //         'Pragma': 'no-cache'
  //       },
  //     });

  //     console.log(`Response status: ${response.status}`);
      
  //     if (!response.ok) {
  //       if (response.status === 404) {
  //         throw new Error('App not found (404) - likely in closed testing or doesn\'t exist');
  //       }
  //       throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  //     }

  //     const html = await response.text();
  //     console.log(`HTML length: ${html.length} characters`);

  //     // Check for common error indicators
  //     if (html.includes('We\'re sorry, the requested URL was not found') || 
  //         html.includes('Item not found')) {
  //       throw new Error('App not found on Play Store');
  //     }

  //     // Try to extract structured data first
  //     const structuredData = this.parseStructuredData(html);
  //     console.log('Structured data found:', !!structuredData);

  //     // Extract app details using multiple methods
  //     let appName = 'Unknown App';
  //     let developer = 'Unknown Developer';
  //     let rating = 0;
  //     let ratingCount = 0;
  //     let installs = 'Unknown';
  //     let description = '';
  //     let icon = '';
  //     let screenshots: string[] = [];
  //     let category = 'Unknown';
  //     let version = 'Unknown';

  //     // Method 1: Try structured data
  //     if (structuredData) {
  //       appName = structuredData.name || structuredData.title || appName;
  //       developer = structuredData.author?.name || structuredData.developer || developer;
  //       rating = parseFloat(structuredData.aggregateRating?.ratingValue || structuredData.rating || '0');
  //       ratingCount = parseInt(structuredData.aggregateRating?.ratingCount || '0');
  //     }

  //     // Method 2: Updated regex patterns for current Play Store structure
  //     const patterns = {
  //       // App title - multiple patterns to try
  //       title: /<h1[^>]*class="[^"]*F9s7V[^"]*"[^>]*>([^<]+)</i,
  //       titleAlt: /<h1[^>]*class="[^"]*F9s7V[^"]*"[^>]*>([^<]+)</i,
  //       titleMeta: /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i,
        
  //       // Developer - multiple patterns
  //       developer: /<div[^>]*class="[^"]*Vbfug[^"]*"[^>]*>([^<]+)</i,
  //       developerAlt: /<a[^>]*class="[^"]*Vbfug[^"]*"[^>]*>([^<]+)</i,
  //       developerMeta: /<meta[^>]*property="og:site_name"[^>]*content="([^"]+)"/i,
        
  //       // Rating - look for rating value
  //       rating: /<div[^>]*class="[^"]*TT9eCd[^"]*"[^>]*>([0-9.]+)</i,
  //       ratingAlt: /<div[^>]*class="[^"]*w2kbF[^"]*"[^>]*>([0-9.]+)</i,
        
  //       // Rating count
  //       ratingCount: /<div[^>]*class="[^"]*g1rdde[^"]*"[^>]*>([^<]+)</i,
  //       ratingCountAlt: /<div[^>]*class="[^"]*w2kbF[^"]*"[^>]*>([^<]+)</i,
        
  //       // Installs
  //       installs: /<div[^>]*>([0-9,]+\+?\s*downloads?)</i,
  //       installsAlt: /<div[^>]*class="[^"]*wMUdtb[^"]*"[^>]*>([^<]+)</i,
        
  //       // Description
  //       description: /<div[^>]*data-g-id="description"[^>]*>([^<]+)</i,
  //       descriptionAlt: /<div[^>]*class="[^"]*bARER[^"]*"[^>]*>([^<]+)</i,
        
  //       // Icon
  //       icon: /<img[^>]*class="[^"]*T75of[^"]*"[^>]*src="([^"]+)"/i,
  //       iconAlt: /<img[^>]*class="[^"]*T75of[^"]*"[^>]*src="([^"]+)"/i,
        
  //       // Category
  //       category: /<a[^>]*itemprop="genre"[^>]*>([^<]+)</i,
  //       categoryAlt: /<a[^>]*class="[^"]*Vbfug[^"]*"[^>]*>([^<]+)</i,
        
  //       // Version
  //       version: /<div[^>]*class="[^"]*wMUdtb[^"]*"[^>]*>([^<]+)</i,
  //       versionAlt: /<div[^>]*class="[^"]*wMUdtb[^"]*"[^>]*>([^<]+)</i,
  //     };

  //     // Apply regex patterns
  //     for (const [key, pattern] of Object.entries(patterns)) {
  //       const match = html.match(pattern);
  //       if (match) {
  //         switch (key) {
  //           case 'title':
  //           case 'titleAlt':
  //             if (appName === 'Unknown App') appName = match[1].trim();
  //             break;
  //           case 'developer':
  //           case 'developerAlt':
  //             if (developer === 'Unknown Developer') developer = match[1].trim();
  //             break;
  //           case 'rating':
  //             if (rating === 0) rating = parseFloat(match[1]);
  //             break;
  //           case 'ratingCount':
  //             if (ratingCount === 0) {
  //               const countStr = match[1].replace(/[^\d]/g, '');
  //               ratingCount = parseInt(countStr) || 0;
  //             }
  //             break;
  //           case 'installs':
  //             if (installs === 'Unknown') installs = match[1].trim();
  //             break;
  //           case 'description':
  //             if (!description) description = match[1].trim();
  //             break;
  //           case 'icon':
  //             if (!icon) icon = match[1];
  //             break;
  //           case 'category':
  //             if (category === 'Unknown') category = match[1].trim();
  //             break;
  //         }
  //       }
  //     }

  //     // Extract screenshots (improved patterns)
  //     const screenshotRegex = /<img[^>]*src="([^"]*screenshot[^"]*)"[^>]*>/gi;
  //     const screenshotRegex2 = /<img[^>]*class="[^"]*T75of[^"]*"[^>]*src="([^"]*googleusercontent[^"]*)"[^>]*>/gi;
      
  //     let screenshotMatch;
  //     while ((screenshotMatch = screenshotRegex.exec(html)) !== null && screenshots.length < 5) {
  //       screenshots.push(screenshotMatch[1]);
  //     }
      
  //     // Try second pattern if first didn't work
  //     if (screenshots.length === 0) {
  //       while ((screenshotMatch = screenshotRegex2.exec(html)) !== null && screenshots.length < 5) {
  //         screenshots.push(screenshotMatch[1]);
  //       }
  //     }

  //     // Additional extraction for missing fields
  //     if (!icon) {
  //       // Try more generic patterns for app icon
  //       const genericIconPatterns = [
  //         /<img[^>]*src="([^"]*googleusercontent[^"]*w\d+-h\d+[^"]*)"[^>]*>/i,
  //         /<img[^>]*src="([^"]*ggpht[^"]*)"[^>]*>/i,
  //       ];
        
  //       for (const pattern of genericIconPatterns) {
  //         const match = html.match(pattern);
  //         if (match) {
  //           icon = match[1];
  //           break;
  //         }
  //       }
  //     }

  //     // Try to extract installs from different patterns
  //     if (installs === 'Unknown') {
  //       const installPatterns = [
  //         />([0-9,.]+[BM]?\+?\s*downloads?)</gi,
  //         />([0-9,.]+\+?\s*installs?)</gi,
  //         /Downloads[^>]*>([0-9,.]+[BM]?\+?)</gi,
  //       ];
        
  //       for (const pattern of installPatterns) {
  //         const match = html.match(pattern);
  //         if (match) {
  //           installs = match[1];
  //           break;
  //         }
  //       }
  //     }

  //     console.log('Extracted data:', {
  //       appName,
  //       developer,
  //       rating,
  //       ratingCount,
  //       installs,
  //       category
  //     });

  //     // Validate we got meaningful data
  //     if (appName === 'Unknown App' && developer === 'Unknown Developer') {
  //       throw new Error('Could not extract app data - may be in closed testing or region locked');
  //     }

  //     const result: PlayStoreApp = {
  //       id: packageName,
  //       name: appName,
  //       description: description || `${appName} by ${developer}`,
  //       summary: description || `${appName} mobile app`,
  //       icon: icon || '',
  //       screenshots: screenshots,
  //       playStoreUrl: playStoreUrl,
  //       version: version,
  //       rating: rating,
  //       ratingCount: ratingCount,
  //       installs: installs,
  //       price: 0, // Assume free unless found otherwise
  //       free: true,
  //       developer: developer,
  //       category: category,
  //       releaseDate: new Date().toISOString(), // Placeholder
  //       size: 'Unknown',
  //       androidVersion: 'Varies',
  //       contentRating: 'Unknown',
  //     };

  //     console.log(`=== PLAY STORE WEB SCRAPING SUCCESS ===`);
  //     return result;

  //   } catch (error) {
  //     console.error("=== PLAY STORE WEB SCRAPING ERROR ===");
  //     console.error("Package name:", packageName);
  //     console.error("Error:", error);

  //     // Re-throw with more context
  //     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  //     throw new Error(`Failed to scrape Play Store data for ${packageName}: ${errorMessage}`);
  //   }
  // }

  /**
   * Check if Play Store app is in closed testing
   * 
   * @deprecated DEPRECATED - This method relied on the deprecated getPlayStoreApp method.
   * Use the frontend implementation instead for reliable Play Store data.
   */
  // static async checkPlayStoreTestingStatus(packageName: string): Promise<{
  //   isInClosedTesting: boolean;
  //   appData: any;
  // }> {
  //   try {
  //     const app = await this.getPlayStoreApp(packageName);
  //     return {
  //       isInClosedTesting: false,
  //       appData: app,
  //     };
  //   } catch (error) {
  //     console.log("Checking if error indicates closed testing...");
      
  //     const errorMessage = error instanceof Error ? error.message : '';
  //     const is404 = errorMessage.includes('404') || errorMessage.includes('Not Found');
  //     const isNotAvailable = errorMessage.includes('not available') || 
  //                           errorMessage.includes('not found') ||
  //                           errorMessage.includes('closed testing') ||
  //                           errorMessage.includes('Could not extract app data');
      
  //     return {
  //       isInClosedTesting: is404 || isNotAvailable,
  //       appData: {
  //         name: "Unknown App",
  //         packageName,
  //         isAvailable: false,
  //         error: errorMessage || "App not found or in closed testing",
  //       },
  //     };
  //   }
  // }

  /**
   * Test Google Play Store connection and scraping
   * 
   * @deprecated DEPRECATED - This method was used for testing the deprecated scraping functionality.
   * No longer needed since Play Store scraping has been removed from the backend.
   */
  // static async testPlayStoreConnection(): Promise<void> {
  //   console.log("=== TESTING PLAY STORE WEB SCRAPING ===");
    
  //   try {
  //     // Test with known popular apps
  //     const testPackages = [
  //       'com.whatsapp', // WhatsApp
  //       'com.google.android.gm', // Gmail
  //       'com.facebook.katana', // Facebook
  //     ];
      
  //     for (const pkg of testPackages) {
  //       console.log(`Testing with package: ${pkg}`);
  //       try {
  //         const result = await this.getPlayStoreApp(pkg);
  //         console.log(`✅ Success with ${pkg}: ${result.name}`);
  //         break; // If one works, the scraping is working
  //       } catch (error) {
  //         console.log(`❌ Failed with ${pkg}:`, error instanceof Error ? error.message : 'Unknown error');
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Connection test failed:", error);
  //   }
    
  //   console.log("=== END SCRAPING TEST ===");
  // }
}