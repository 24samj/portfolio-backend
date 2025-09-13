import { ObjectId } from "mongodb";
import { getDatabase } from "../database/connection";
import { Company } from "../types/Company";
import { COLLECTIONS } from "../constants";

const COLLECTION_NAME = COLLECTIONS.COMPANIES;

/**
 * Service for managing experience/company data
 * Uses optimized database connection with caching
 */
export class ExperienceService {
  /**
   * Get all experiences with optimized sorting and caching
   */
  static async getAll(): Promise<Company[]> {
    let client: any = null;
    try {
      const { db, client: mongoClient } = await getDatabase();
      client = mongoClient;
      const collection = db.collection(COLLECTION_NAME);

      // Use MongoDB aggregation pipeline for better performance with timeout protection
      const experiences = await Promise.race([
        collection.find({}).toArray(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Database query timeout")), 5000)
        ),
      ]);
      const sorted = experiences.sort((a, b) => {
        // Current positions first (workEnd is null)
        if (a.workEnd === null && b.workEnd !== null) return -1;
        if (a.workEnd !== null && b.workEnd === null) return 1;

        // If both are current positions, sort by earliest start date first
        if (a.workEnd === null && b.workEnd === null) {
          return (
            new Date(a.workStart).getTime() - new Date(b.workStart).getTime()
          );
        }

        // If both are past positions, sort by most recent start date first
        if (a.workEnd !== null && b.workEnd !== null) {
          return (
            new Date(b.workStart).getTime() - new Date(a.workStart).getTime()
          );
        }

        return 0;
      });

      // Transform MongoDB documents to Company objects
      return sorted.map((doc) => ({
        ...doc,
        _id: doc._id.toString(),
      })) as Company[];
    } catch (error) {
      console.error("Error fetching experiences:", error);
      throw new Error("Failed to fetch experiences");
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
   * Get experience by ID with optimized error handling
   */
  static async getById(id: string): Promise<Company | null> {
    let client: any = null;
    try {
      const { db, client: mongoClient } = await getDatabase();
      client = mongoClient;
      const collection = db.collection(COLLECTION_NAME);

      // Query by string _id (not ObjectId) with timeout protection
      const experience = await Promise.race([
        collection.findOne({ _id: id } as any),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Database query timeout")), 5000)
        ),
      ]);

      if (!experience) {
        return null;
      }

      return {
        ...experience,
        _id: experience._id.toString(),
      } as Company;
    } catch (error) {
      console.error("Error fetching experience:", error);
      throw new Error("Failed to fetch experience");
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
   * Get experiences count for pagination (future use)
   */
  static async getCount(): Promise<number> {
    let client: any = null;
    try {
      const { db, client: mongoClient } = await getDatabase();
      client = mongoClient;
      const collection = db.collection(COLLECTION_NAME);

      return await Promise.race([
        collection.countDocuments(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Database query timeout")), 5000)
        ),
      ]);
    } catch (error) {
      console.error("Error counting experiences:", error);
      throw new Error("Failed to count experiences");
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
export const getExperiences = ExperienceService.getAll;
export const getExperienceById = ExperienceService.getById;
