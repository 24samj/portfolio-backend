import { Db } from "mongodb";
import { dbManager } from "./manager";

/**
 * Get database connection using the centralized DatabaseManager
 * This ensures we use the same connection pool across all services
 */
export async function getDatabase(): Promise<Db> {
  try {
    // Ensure we're connected
    if (!dbManager.isConnectedToDatabase()) {
      const connected = await dbManager.connect();
      if (!connected) {
        throw new Error("Failed to connect to database");
      }
    }

    const client = dbManager.getClient();
    if (!client) {
      throw new Error("Database client is not available");
    }

    return client.db("portfolio");
  } catch (error) {
    console.error("Failed to get database connection:", error);
    throw new Error("Database connection failed");
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  await dbManager.disconnect();
}
