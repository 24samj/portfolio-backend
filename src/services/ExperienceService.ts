import { ObjectId } from "mongodb";
import { executeWithDatabaseTimeout } from "../database/connection";
import { Company } from "../types/Company";
import { COLLECTIONS } from "../constants";
import { MongoCompanyDocument } from "../types/MongoDB";

const COLLECTION_NAME = COLLECTIONS.COMPANIES;
const DATABASE_NAME = "portfolio2"; // companies collection is in portfolio database

/**
 * Service for managing experience/company data
 * Uses optimized database connection with caching
 */
export class ExperienceService {
  /**
   * Get all experiences with optimized sorting and caching
   */
  static async getAll(): Promise<Company[]> {
    return executeWithDatabaseTimeout(async (db) => {
      const collection = db.collection(COLLECTION_NAME);
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
    }, DATABASE_NAME);
  }

  /**
   * Get experience by ID with optimized error handling
   */
  static async getById(id: string): Promise<Company | null> {
    return executeWithDatabaseTimeout(async (db) => {
      const collection = db.collection<MongoCompanyDocument>(COLLECTION_NAME);
      let experience: MongoCompanyDocument | null;
      try {
        experience = await collection.findOne({ _id: new ObjectId(id) });
      } catch {
        // If ObjectId conversion fails, try as string
        experience = await collection.findOne({ _id: id as unknown as ObjectId });
      }

      if (!experience) {
        return null;
      }

      return {
        ...experience,
        _id: experience._id.toString(),
      } as Company;
    }, DATABASE_NAME);
  }

  /**
   * Get experiences count for pagination (future use)
   */
  static async getCount(): Promise<number> {
    return executeWithDatabaseTimeout(async (db) => {
      const collection = db.collection(COLLECTION_NAME);
      return await collection.countDocuments();
    }, DATABASE_NAME);
  }
}

// Backward compatibility exports
export const getExperiences = ExperienceService.getAll;
export const getExperienceById = ExperienceService.getById;
