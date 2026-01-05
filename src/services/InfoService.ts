import { executeWithDatabaseTimeout } from "../database/connection";
import { Info } from "../types/Info";

const COLLECTION_NAME = "info";
const DATABASE_NAME = "portfolio2";

/**
 * Service for managing profile/info data
 * Uses optimized database connection
 */
export class InfoService {
  /**
   * Get profile information
   * Returns the first document with type "profile" or the first document if no type filter
   */
  static async getProfile(): Promise<Info | null> {
    return executeWithDatabaseTimeout(async (db) => {
      const collection = db.collection(COLLECTION_NAME);

      // Try to find profile type first, then fallback to any document
      const profile = await collection.findOne({ type: "profile" });
      const info = profile || await collection.findOne({});

      if (!info) {
        return null;
      }

      return {
        ...info,
        _id: info._id.toString(),
      } as Info;
    }, DATABASE_NAME);
  }
}
