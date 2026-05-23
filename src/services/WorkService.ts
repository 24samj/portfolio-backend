import { ObjectId } from "mongodb";
import { withMongo } from "../database/withMongo";
import { COLLECTIONS } from "../constants";
import { PlayStoreService } from "./PlayStoreService";
import { AppStoreService } from "./AppStoreService";
import { MongoWorkDocument } from "../types/MongoDB";

const COLLECTION_NAME = COLLECTIONS.WORKS;
const DATABASE_NAME = "portfolio2";

/**
 * Service for managing work/project data
 * Uses portfolio2 database with optimized database connection
 */
export class WorkService {
  /**
   * Enrich work object with store data (screenshots, rating, category)
   * Fetches from Play Store or App Store if IDs are available
   */
  private static async enrichWorkWithStoreData(work: MongoWorkDocument): Promise<MongoWorkDocument> {
    try {
      // Check for Play Store ID - validate it's not empty/null/whitespace
      if (work.playStoreId && typeof work.playStoreId === 'string' && work.playStoreId.trim().length > 0) {
        try {
          const playStoreData = await PlayStoreService.getApp(
            work.playStoreId.trim(),
            "en",
            "us",
            3000 // 3 second timeout per external API call
          );

          // Append screenshots if available (preserve existing ones from MongoDB)
          if (playStoreData.screenshots && playStoreData.screenshots.length > 0) {
            // Initialize screenshots array if it doesn't exist
            if (!work.screenshots || !Array.isArray(work.screenshots)) {
              work.screenshots = [];
            }
            
            // Filter out empty strings and null values from existing screenshots
            work.screenshots = work.screenshots?.filter((s: string) => s && typeof s === 'string' && s.trim().length > 0) || [];
            
            // Append new screenshots, avoiding duplicates
            const existingUrls = new Set(work.screenshots);
            for (const screenshot of playStoreData.screenshots) {
              if (screenshot && typeof screenshot === 'string' && screenshot.trim().length > 0 && !existingUrls.has(screenshot)) {
                work.screenshots.push(screenshot);
                existingUrls.add(screenshot);
              }
            }
          }

          // Update rating if available (Play Store uses 'score')
          // Only update if current rating is missing or 0, or if new score is better
          if (
            playStoreData.score !== undefined &&
            playStoreData.score !== null &&
            playStoreData.score > 0 &&
            (!work.rating || work.rating === 0)
          ) {
            work.rating = playStoreData.score;
          }

          // Update category if available (Play Store uses 'genre')
          // Only update if current category is missing or empty
          if (playStoreData.genre && (!work.category || work.category === "")) {
            work.category = playStoreData.genre;
          }
        } catch (error) {
          // Handle specific error types
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          const isNotFound = errorMessage.includes("not found") || 
                           errorMessage.includes("404") ||
                           errorMessage.includes("App not found");
          
          if (isNotFound) {
            console.warn(
              `Play Store app not found for ID "${work.playStoreId}" - app may not exist or be unavailable`
            );
          } else {
            console.warn(
              `Failed to fetch Play Store data for ${work.playStoreId}:`,
              errorMessage
            );
          }
          // Continue without failing - just log the warning
        }
      }

      // Check for App Store ID - validate it's not empty/null/whitespace
      if (work.appStoreId && (typeof work.appStoreId === 'string' || typeof work.appStoreId === 'number')) {
        try {
          // Convert to string and trim if it's a string
          const appStoreId = typeof work.appStoreId === 'string' 
            ? work.appStoreId.trim() 
            : String(work.appStoreId);
          
          // Validate it's not empty after conversion
          if (appStoreId.length === 0) {
            console.warn(`App Store ID is empty for work ${work._id || work.name}`);
          } else {
            const appStoreData = await AppStoreService.getAppStoreApp(appStoreId, 3000); // 3 second timeout per external API call

            // Append screenshots if available (preserve existing ones from MongoDB)
            if (
              appStoreData.screenshots &&
              appStoreData.screenshots.length > 0
            ) {
              // Initialize screenshots array if it doesn't exist
              if (!work.screenshots || !Array.isArray(work.screenshots)) {
                work.screenshots = [];
              }
              
              // Filter out empty strings and null values from existing screenshots
              work.screenshots = work.screenshots.filter((s: string) => s && typeof s === 'string' && s.trim().length > 0);
              
              // Append new screenshots, avoiding duplicates
              const existingUrls = new Set(work.screenshots);
              for (const screenshot of appStoreData.screenshots) {
                if (screenshot && typeof screenshot === 'string' && screenshot.trim().length > 0 && !existingUrls.has(screenshot)) {
                  work.screenshots.push(screenshot);
                  existingUrls.add(screenshot);
                }
              }
            }

            // Update rating if available
            // Only update if current rating is missing/0, or if App Store rating is better
            if (
              appStoreData.rating !== undefined &&
              appStoreData.rating !== null &&
              appStoreData.rating > 0
            ) {
              // Use App Store rating if we don't have one, or if App Store rating is higher
              if (!work.rating || work.rating === 0 || appStoreData.rating > work.rating) {
                work.rating = appStoreData.rating;
              }
            }

            // Update category if available
            // Only update if current category is missing or empty
            if (
              appStoreData.category &&
              (!work.category || work.category === "")
            ) {
              work.category = appStoreData.category;
            }
          }
        } catch (error) {
          // Handle specific error types
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          const isNotFound = errorMessage.includes("not found") || 
                           errorMessage.includes("404") ||
                           errorMessage.includes("App not found") ||
                           errorMessage.includes("Failed to fetch App Store data");
          
          if (isNotFound) {
            console.warn(
              `App Store app not found for ID "${work.appStoreId}" - app may not exist or be unavailable`
            );
          } else {
            console.warn(
              `Failed to fetch App Store data for ${work.appStoreId}:`,
              errorMessage
            );
          }
          // Continue without failing - just log the warning
        }
      }

      return work;
    } catch (error) {
      console.error("Error enriching work with store data:", error);
      // Return original work if enrichment fails
      return work;
    }
  }
  /**
   * Get all works with optimized query
   */
  static async getAll(uri: string): Promise<MongoWorkDocument[]> {
    try {
      const works = await withMongo(uri, DATABASE_NAME, async (db) => {
        const collection = db.collection(COLLECTION_NAME);
        return await collection.find({}).toArray() as unknown as MongoWorkDocument[];
      });

      // Enrich each work with store data (screenshots, rating, category)
      // Use Promise.allSettled to prevent one failure from blocking all
      const enrichedWorks = await Promise.allSettled(
        works.map((work) => this.enrichWorkWithStoreData(work))
      );

      // Return successfully enriched works, or original if enrichment failed
      return enrichedWorks.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.warn(`Failed to enrich work ${works[index]._id}:`, result.reason);
          return works[index]; // Return original work if enrichment fails
        }
      });
    } catch (error) {
      console.error("Error fetching works:", error);
      throw new Error("Failed to fetch works");
    }
  }

  /**
   * Get work by ID with optimized error handling
   */
  static async getById(uri: string, id: string): Promise<MongoWorkDocument | null> {
    try {
      const work = await withMongo(uri, DATABASE_NAME, async (db) => {
        const collection = db.collection<MongoWorkDocument>(COLLECTION_NAME);
        return await collection.findOne({ _id: id }) as MongoWorkDocument | null;
      });

      if (!work) {
        return null;
      }

      // Enrich work with store data (screenshots, rating, category)
      try {
        return await this.enrichWorkWithStoreData(work);
      } catch (error) {
        console.warn(`Failed to enrich work ${id}:`, error);
        return work; // Return original work if enrichment fails
      }
    } catch (error) {
      console.error("Error fetching work:", error);
      throw new Error("Failed to fetch work");
    }
  }

  /**
   * Get multiple works by IDs
   */
  static async getByIds(uri: string, ids: string[]): Promise<MongoWorkDocument[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    try {
      const works = await withMongo(uri, DATABASE_NAME, async (db) => {
        const collection = db.collection<MongoWorkDocument>(COLLECTION_NAME);
        return await collection.find({ _id: { $in: ids } }).toArray() as MongoWorkDocument[];
      });

      // Enrich each work with store data (screenshots, rating, category)
      // Use Promise.allSettled to prevent one failure from blocking all
      const enrichedWorks = await Promise.allSettled(
        works.map((work) => this.enrichWorkWithStoreData(work))
      );

      // Return successfully enriched works, or original if enrichment failed
      return enrichedWorks.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.warn(`Failed to enrich work ${works[index]._id}:`, result.reason);
          return works[index]; // Return original work if enrichment fails
        }
      });
    } catch (error) {
      console.error("Error fetching works by IDs:", error);
      throw new Error("Failed to fetch works by IDs");
    }
  }

  /**
   * Get works count for pagination (future use)
   */
  static async getCount(uri: string): Promise<number> {
    try {
      return await withMongo(uri, DATABASE_NAME, async (db) => {
        const collection = db.collection(COLLECTION_NAME);
        return collection.countDocuments();
      });
    } catch (error) {
      console.error("Error counting works:", error);
      throw new Error("Failed to count works");
    }
  }
}
