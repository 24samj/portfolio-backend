import { ObjectId } from "mongodb";
import { executeWithDatabaseTimeout } from "../database/connection";
import { Certification } from "../types/Certification";
import { COLLECTIONS } from "../constants";
import { MongoCertificationDocument } from "../types/MongoDB";

const COLLECTION_NAME = COLLECTIONS.CERTIFICATIONS;
const DATABASE_NAME = "portfolio2";

/**
 * Service for managing certification data
 * Uses optimized database connection with caching
 */
export class CertificationService {
  /**
   * Get all certifications with optimized sorting
   */
  static async getAll(): Promise<Certification[]> {
    return executeWithDatabaseTimeout(async (db) => {
      const collection = db.collection<MongoCertificationDocument>(COLLECTION_NAME);
      const certifications = await collection.find({}).toArray() as MongoCertificationDocument[];

      // Sort by date (most recent first)
      const sorted = certifications.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      // Transform MongoDB documents to Certification objects (database fields match API fields)
      return sorted.map((doc): Certification => ({
        _id: doc._id.toString(),
        name: doc.name,
        issuer: doc.issuer,
        date: doc.date,
        credentialID: doc.credentialID || null,
        link: doc.link || undefined,
      }));
    }, DATABASE_NAME);
  }

  /**
   * Get certification by ID with optimized error handling
   */
  static async getById(id: string): Promise<Certification | null> {
    return executeWithDatabaseTimeout(async (db) => {
      const collection = db.collection<MongoCertificationDocument>(COLLECTION_NAME);
      let certification: MongoCertificationDocument | null;
      try {
        certification = await collection.findOne({ _id: new ObjectId(id) });
      } catch {
        // If ObjectId conversion fails, try as string
        certification = await collection.findOne({ _id: id as unknown as ObjectId });
      }

      if (!certification) {
        return null;
      }

      // Map database fields to API response fields
      return {
        _id: certification._id.toString(),
        name: certification.name,
        issuer: certification.issuer,
        date: certification.date,
        credentialID: certification.credentialID || null,
        link: certification.link || undefined,
      };
    }, DATABASE_NAME);
  }

  /**
   * Get certifications count for pagination (future use)
   */
  static async getCount(): Promise<number> {
    return executeWithDatabaseTimeout(async (db) => {
      const collection = db.collection(COLLECTION_NAME);
      return await collection.countDocuments();
    }, DATABASE_NAME);
  }
}

// Backward compatibility exports
export const getCertifications = CertificationService.getAll;
export const getCertificationById = CertificationService.getById;
