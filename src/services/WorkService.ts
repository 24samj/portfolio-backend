import { ObjectId, MongoClient } from "mongodb";
import { getDatabase } from "../database/connection";
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
            "us"
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
            const appStoreData = await AppStoreService.getAppStoreApp(appStoreId);

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
  static async getAll(): Promise<MongoWorkDocument[]> {
    let client: MongoClient | null = null;
    try {
      const { client: mongoClient } = await getDatabase();
      client = mongoClient;
      
      // Use portfolio2 database
      const portfolio2Db = mongoClient.db(DATABASE_NAME);
      const collection = portfolio2Db.collection(COLLECTION_NAME);

      // Use MongoDB query with timeout protection
      const works = await Promise.race([
        collection.find({}).toArray(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Database query timeout")), 5000)
        ),
      ]) as unknown as MongoWorkDocument[];

      // Works already have _id as string, no transformation needed
      const transformedWorks = works;

      // Enrich each work with store data (screenshots, rating, category)
      const enrichedWorks = await Promise.all(
        transformedWorks.map((work) => this.enrichWorkWithStoreData(work))
      );

      return enrichedWorks;
    } catch (error) {
      console.error("Error fetching works:", error);
      throw new Error("Failed to fetch works");
    } finally {
      // Close connection after request
      if (client) {
        try {
          await client.close();
        } catch (e) {
          // Ignore close errors
        }
      }
    }
  }

  /**
   * Get work by ID with optimized error handling
   */
  static async getById(id: string): Promise<MongoWorkDocument | null> {
    let client: MongoClient | null = null;
    try {
      const { client: mongoClient } = await getDatabase();
      client = mongoClient;
      
      // Use portfolio2 database
      const portfolio2Db = mongoClient.db(DATABASE_NAME);
      const collection = portfolio2Db.collection<MongoWorkDocument>(COLLECTION_NAME);

      // Works use string IDs, not ObjectId
      const work = await Promise.race([
        collection.findOne({ _id: id }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Database query timeout")), 5000)
        ),
      ]) as MongoWorkDocument | null;

      if (!work) {
        return null;
      }

      // Works already have _id as string, no transformation needed
      // Enrich work with store data (screenshots, rating, category)
      const enrichedWork = work ? await this.enrichWorkWithStoreData(work) : null;

      return enrichedWork;
    } catch (error) {
      console.error("Error fetching work:", error);
      throw new Error("Failed to fetch work");
    } finally {
      // Close connection after request
      if (client) {
        try {
          await client.close();
        } catch (e) {
          // Ignore close errors
        }
      }
    }
  }

  /**
   * Get works count for pagination (future use)
   */
  static async getCount(): Promise<number> {
    let client: MongoClient | null = null;
    try {
      const { client: mongoClient } = await getDatabase();
      client = mongoClient;
      
      // Use portfolio2 database
      const portfolio2Db = mongoClient.db(DATABASE_NAME);
      const collection = portfolio2Db.collection(COLLECTION_NAME);

      return await Promise.race([
        collection.countDocuments(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Database query timeout")), 5000)
        ),
      ]);
    } catch (error) {
      console.error("Error counting works:", error);
      throw new Error("Failed to count works");
    } finally {
      // Close connection after request
      if (client) {
        try {
          await client.close();
        } catch (e) {
          // Ignore close errors
        }
      }
    }
  }
}

// Backward compatibility exports
export const getWorks = WorkService.getAll;
export const getWorkById = WorkService.getById;
