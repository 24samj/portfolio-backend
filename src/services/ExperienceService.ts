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
    try {
      const db = await getDatabase();
      const collection = db.collection(COLLECTION_NAME);

      // Use MongoDB aggregation pipeline for better performance
      const experiences = await collection.find({}).toArray();
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
    }
  }

  /**
   * Get experience by ID with optimized error handling
   */
  static async getById(id: string): Promise<Company | null> {
    try {
      const db = await getDatabase();
      const collection = db.collection(COLLECTION_NAME);

      // Query by string _id (not ObjectId)
      const experience = await collection.findOne({ _id: id } as any);

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
    }
  }

  /**
   * Get experiences count for pagination (future use)
   */
  static async getCount(): Promise<number> {
    try {
      const db = await getDatabase();
      const collection = db.collection(COLLECTION_NAME);

      return await collection.countDocuments();
    } catch (error) {
      console.error("Error counting experiences:", error);
      throw new Error("Failed to count experiences");
    }
  }
}

// Backward compatibility exports
export const getExperiences = ExperienceService.getAll;
export const getExperienceById = ExperienceService.getById;
