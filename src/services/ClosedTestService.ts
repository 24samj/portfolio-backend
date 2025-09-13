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
    try {
      const db = await getDatabase();
      const collection = db.collection(COLLECTION_NAME);

      // Get all tests and filter for active ones with timeout
      const tests = await Promise.race([
        collection.find({}).toArray(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Database query timeout")), 3000)
        ),
      ]);

      return tests
        .filter((doc) => {
          // Consider active if isActive is true, "true", or if the field doesn't exist (default to active)
          const isActive = doc.isActive;
          return (
            isActive === true ||
            isActive === "true" ||
            isActive === "" ||
            isActive === undefined
          );
        })
        .map((doc) => ({
          ...doc,
          _id: doc._id.toString(),
          // Convert MongoDB timestamps to ISO strings
          createdAt: doc.createdAt?.$timestamp
            ? new Date(doc.createdAt.$timestamp).toISOString()
            : new Date().toISOString(),
          updatedAt: doc.updatedAt?.$timestamp
            ? new Date(doc.updatedAt.$timestamp).toISOString()
            : new Date().toISOString(),
          // Ensure isActive is a boolean
          isActive:
            doc.isActive === true ||
            doc.isActive === "true" ||
            doc.isActive === "" ||
            doc.isActive === undefined,
        })) as ClosedTest[];
    } catch (error) {
      console.error("Error fetching closed tests:", error);
      throw new Error("Failed to fetch closed tests");
    }
  }

  /**
   * Get closed test by ID
   */
  static async getById(id: string): Promise<ClosedTest | null> {
    try {
      const db = await getDatabase();
      const collection = db.collection(COLLECTION_NAME);

      // Try to find by ObjectId first, then by string ID with timeout
      let test;
      if (ObjectId.isValid(id)) {
        test = await Promise.race([
          collection.findOne({ _id: new ObjectId(id) }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Database query timeout")), 3000)
          ),
        ]);
      } else {
        test = await Promise.race([
          collection.findOne({ _id: id } as any),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Database query timeout")), 3000)
          ),
        ]);
      }

      if (!test) {
        return null;
      }

      return {
        ...test,
        _id: test._id.toString(),
        // Convert MongoDB timestamps to ISO strings
        createdAt: test.createdAt?.$timestamp
          ? new Date(test.createdAt.$timestamp).toISOString()
          : new Date().toISOString(),
        updatedAt: test.updatedAt?.$timestamp
          ? new Date(test.updatedAt.$timestamp).toISOString()
          : new Date().toISOString(),
        // Ensure isActive is a boolean
        isActive:
          test.isActive === true ||
          test.isActive === "true" ||
          test.isActive === "" ||
          test.isActive === undefined,
      } as ClosedTest;
    } catch (error) {
      console.error("Error fetching closed test:", error);
      throw new Error("Failed to fetch closed test");
    }
  }

  /**
   * Get closed test by package name
   */
  static async getByPackageName(
    packageName: string
  ): Promise<ClosedTest | null> {
    try {
      const db = await getDatabase();
      const collection = db.collection(COLLECTION_NAME);

      const test = await Promise.race([
        collection.findOne({ packageName }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Database query timeout")), 3000)
        ),
      ]);

      if (!test) {
        return null;
      }

      return {
        ...test,
        _id: test._id.toString(),
        // Convert MongoDB timestamps to ISO strings
        createdAt: test.createdAt?.$timestamp
          ? new Date(test.createdAt.$timestamp).toISOString()
          : new Date().toISOString(),
        updatedAt: test.updatedAt?.$timestamp
          ? new Date(test.updatedAt.$timestamp).toISOString()
          : new Date().toISOString(),
        // Ensure isActive is a boolean
        isActive:
          test.isActive === true ||
          test.isActive === "true" ||
          test.isActive === "" ||
          test.isActive === undefined,
      } as ClosedTest;
    } catch (error) {
      console.error("Error fetching closed test by package name:", error);
      throw new Error("Failed to fetch closed test");
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
    try {
      const db = await getDatabase();
      const collection = db.collection(COLLECTION_NAME);

      return await Promise.race([
        collection.countDocuments({ isActive: true }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Database query timeout")), 3000)
        ),
      ]);
    } catch (error) {
      console.error("Error counting closed tests:", error);
      throw new Error("Failed to count closed tests");
    }
  }
}
