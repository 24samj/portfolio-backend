import { ObjectId } from "mongodb";
import { executeWithDatabaseTimeout } from "../database/connection";
import { Education } from "../types/Education";
import { COLLECTIONS } from "../constants";
import { MongoEducationDocument } from "../types/MongoDB";

const COLLECTION_NAME = COLLECTIONS.EDUCATIONS;
const DATABASE_NAME = "portfolio2";

/**
 * Service for managing education data
 * Uses optimized database connection with caching
 */
export class EducationService {
  /**
   * Get all educations with optimized sorting
   */
  static async getAll(): Promise<Education[]> {
    return executeWithDatabaseTimeout(async (db) => {
      const collection = db.collection<MongoEducationDocument>(COLLECTION_NAME);
      const educations = await collection.find({}).toArray() as MongoEducationDocument[];

      // Sort by end date (most recent first), then by start date
      const sorted = educations.sort((a, b) => {
        // If one has no end date (ongoing), prioritize it
        if (!a.endDate && b.endDate) return -1;
        if (a.endDate && !b.endDate) return 1;

        // If both have end dates, sort by most recent first
        if (a.endDate && b.endDate) {
          return (
            new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
          );
        }

        // If both are ongoing, sort by start date (most recent first)
        if (!a.endDate && !b.endDate) {
          return (
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
        }

        return 0;
      });

      // Return MongoDB documents directly (just convert _id to string)
      return sorted.map((doc): Education => ({
        ...doc,
        _id: doc._id.toString(),
      }));
    }, DATABASE_NAME);
  }

  /**
   * Get education by ID with optimized error handling
   */
  static async getById(id: string): Promise<Education | null> {
    return executeWithDatabaseTimeout(async (db) => {
      const collection = db.collection<MongoEducationDocument>(COLLECTION_NAME);
      let education: MongoEducationDocument | null;
      try {
        education = await collection.findOne({ _id: new ObjectId(id) });
      } catch {
        // If ObjectId conversion fails, try as string
        education = await collection.findOne({ _id: id as unknown as ObjectId });
      }

      if (!education) {
        return null;
      }

      // Return MongoDB document directly (just convert _id to string)
      return {
        ...education,
        _id: education._id.toString(),
      };
    }, DATABASE_NAME);
  }

  /**
   * Get educations count for pagination (future use)
   */
  static async getCount(): Promise<number> {
    return executeWithDatabaseTimeout(async (db) => {
      const collection = db.collection(COLLECTION_NAME);
      return await collection.countDocuments();
    }, DATABASE_NAME);
  }
}

// Backward compatibility exports
export const getEducations = EducationService.getAll;
export const getEducationById = EducationService.getById;
