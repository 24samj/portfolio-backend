import { Db, MongoClient } from "mongodb";
import { dbManager } from "./manager";

/**
 * Get database connection - create new connection for each request in Cloudflare Workers
 * This prevents cross-request promise resolution errors
 * Returns both db and client so we can close the connection
 */
export async function getDatabase(): Promise<{ db: Db; client: MongoClient }> {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    // For local development, use direct connection to avoid SRV record issues
    const isLocalDev =
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "local" ||
      process.env.WRANGLER_ENV === "local";

    // Try to convert SRV connection string to direct connection for local dev
    let connectionUri = uri;
    if (isLocalDev && uri.includes("mongodb+srv://")) {
      console.log(
        "🔄 Converting SRV connection string to direct connection for local development"
      );
      const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/);
      if (match) {
        const [, username, password, host, database] = match;
        const directHost = host.split(".")[0] + ".mongodb.net";
        connectionUri = `mongodb://${username}:${password}@${directHost}:27017/${database}?ssl=true&authSource=admin&retryWrites=false&retryReads=false`;
        console.log(
          "🔄 Using direct connection:",
          connectionUri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")
        );
      }
    }

    // Create new client for each request
    const client = new MongoClient(connectionUri, {
      // Optimized timeouts for Cloudflare Workers
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      maxPoolSize: 1,
      retryWrites: false,
      retryReads: false,
      directConnection: isLocalDev,
      heartbeatFrequencyMS: 30000,
      maxIdleTimeMS: 30000,
    });

    // Connect with timeout
    await Promise.race([
      client.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout")), 5000)
      ),
    ]);

    // Test connection with timeout
    const db = client.db("portfolio");
    await Promise.race([
      db.admin().ping(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Ping timeout")), 2000)
      ),
    ]);

    console.log("✅ Connected to MongoDB successfully");
    return { db, client };
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
