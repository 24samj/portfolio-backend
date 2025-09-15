import { ObjectId } from "mongodb";
import { getDatabase } from "../database/connection";
import { ClosedTest } from "../types/ClosedTest";
import { COLLECTIONS } from "../constants";

const COLLECTION_NAME = COLLECTIONS.CLOSED_TESTS;

export class ClosedTestService {
  /**
   * Get all active closed tests
   */
  static async getAll(): Promise<ClosedTest[]> {
    let client: any = null;
    try {
      const { db, client: mongoClient } = await getDatabase();
      client = mongoClient;
      const collection = db.collection(COLLECTION_NAME);

      // Get all tests and filter for active ones with timeout
      const tests = await Promise.race([
        collection.find({}).toArray(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Database query timeout")), 5000)
        ),
      ]);

      const normalizeDate = (value: any): string => {
        if (!value) return new Date().toISOString();
        if (typeof value === "string") return new Date(value).toISOString();
        if (value instanceof Date) return value.toISOString();
        if (typeof value === "object" && value.$date)
          return new Date(value.$date).toISOString();
        if (typeof value === "object" && value.$timestamp)
          return new Date(value.$timestamp).toISOString();
        try {
          return new Date(value).toISOString();
        } catch {
          return new Date().toISOString();
        }
      };

      return tests
        .filter((doc) => {
          // Treat as active unless explicitly false or "false"
          const isActive = doc.isActive;
          return !(isActive === false || isActive === "false");
        })
        .map((doc) => ({
          ...doc,
          _id: doc._id.toString(),
          createdAt: normalizeDate(doc.createdAt),
          updatedAt: normalizeDate(doc.updatedAt),
          isActive: !(doc.isActive === false || doc.isActive === "false"),
        })) as ClosedTest[];
    } catch (error) {
      console.error("Error fetching closed tests:", error);
      throw new Error("Failed to fetch closed tests");
    } finally {
      if (client) {
        try {
          await client.close();
        } catch {}
      }
    }
  }

  /**
   * Get closed test by ID
   */
  static async getById(id: string): Promise<ClosedTest | null> {
    let client: any = null;
    try {
      const { db, client: mongoClient } = await getDatabase();
      client = mongoClient;
      const collection = db.collection(COLLECTION_NAME);

      // Try to find by ObjectId first, then by string ID with timeout
      let test;
      if (ObjectId.isValid(id)) {
        test = await Promise.race([
          collection.findOne({ _id: new ObjectId(id) }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Database query timeout")), 5000)
          ),
        ]);
      } else {
        test = await Promise.race([
          collection.findOne({ _id: id } as any),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Database query timeout")), 5000)
          ),
        ]);
      }

      if (!test) {
        return null;
      }

      const normalizeDate = (value: any): string => {
        if (!value) return new Date().toISOString();
        if (typeof value === "string") return new Date(value).toISOString();
        if (value instanceof Date) return value.toISOString();
        if (typeof value === "object" && value.$date)
          return new Date(value.$date).toISOString();
        if (typeof value === "object" && value.$timestamp)
          return new Date(value.$timestamp).toISOString();
        try {
          return new Date(value).toISOString();
        } catch {
          return new Date().toISOString();
        }
      };

      return {
        ...test,
        _id: test._id.toString(),
        createdAt: normalizeDate(test.createdAt),
        updatedAt: normalizeDate(test.updatedAt),
        isActive: !(test.isActive === false || test.isActive === "false"),
      } as ClosedTest;
    } catch (error) {
      console.error("Error fetching closed test:", error);
      throw new Error("Failed to fetch closed test");
    } finally {
      if (client) {
        try {
          await client.close();
        } catch {}
      }
    }
  }

  /**
   * Get closed test by package name
   */
  static async getByPackageName(
    packageName: string
  ): Promise<ClosedTest | null> {
    let client: any = null;
    try {
      const { db, client: mongoClient } = await getDatabase();
      client = mongoClient;
      const collection = db.collection(COLLECTION_NAME);

      const test = await Promise.race([
        collection.findOne({ packageName }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Database query timeout")), 5000)
        ),
      ]);

      if (!test) {
        return null;
      }

      const normalizeDate = (value: any): string => {
        if (!value) return new Date().toISOString();
        if (typeof value === "string") return new Date(value).toISOString();
        if (value instanceof Date) return value.toISOString();
        if (typeof value === "object" && value.$date)
          return new Date(value.$date).toISOString();
        if (typeof value === "object" && value.$timestamp)
          return new Date(value.$timestamp).toISOString();
        try {
          return new Date(value).toISOString();
        } catch {
          return new Date().toISOString();
        }
      };

      return {
        ...test,
        _id: test._id.toString(),
        createdAt: normalizeDate(test.createdAt),
        updatedAt: normalizeDate(test.updatedAt),
        isActive: !(test.isActive === false || test.isActive === "false"),
      } as ClosedTest;
    } catch (error) {
      console.error("Error fetching closed test by package name:", error);
      throw new Error("Failed to fetch closed test");
    } finally {
      if (client) {
        try {
          await client.close();
        } catch {}
      }
    }
  }

  /**
   * Check if app is in closed testing by attempting to fetch from Play Store
   */
  static async checkTestingStatus(packageName: string): Promise<{
    isInClosedTesting: boolean;
    appData: any;
  }> {
    try {
      // This will be implemented when we add the Play Store scraper
      // For now, return a placeholder
      return {
        isInClosedTesting: true,
        appData: {
          name: "Unknown App",
          packageName,
          isAvailable: false,
          error: "App not found or in closed testing",
        },
      };
    } catch (error) {
      console.error("Error checking testing status:", error);
      throw new Error("Failed to check testing status");
    }
  }

  /**
   * Get count of active closed tests
   */
  static async getCount(): Promise<number> {
    let client: any = null;
    try {
      const { db, client: mongoClient } = await getDatabase();
      client = mongoClient;
      const collection = db.collection(COLLECTION_NAME);

      return await Promise.race([
        // Count only explicitly active or missing flag (treat missing as active)
        collection.countDocuments({
          $or: [{ isActive: true }, { isActive: { $exists: false } }],
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Database query timeout")), 5000)
        ),
      ]);
    } catch (error) {
      console.error("Error counting closed tests:", error);
      throw new Error("Failed to count closed tests");
    } finally {
      if (client) {
        try {
          await client.close();
        } catch {}
      }
    }
  }
}
