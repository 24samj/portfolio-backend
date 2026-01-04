import { Db, MongoClient } from "mongodb";
import { EventEmitter } from "events";
import { dbManager } from "./manager";
import { MongoClientWithTopology } from "../types/MongoDB";

// Set default max listeners for all EventEmitters to prevent memory leak warnings
// MongoDB driver creates multiple internal EventEmitters (Topology, ServerSelection, etc.)
// In serverless environments, we create new clients per request, which is expected behavior
EventEmitter.defaultMaxListeners = 25;

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

    // Note: maxListeners is set globally via EventEmitter.defaultMaxListeners
    // This applies to all EventEmitters including MongoDB's internal ones (Topology, ServerSelection, etc.)

    // Connect with timeout - using simple Promise.race with proper cleanup
    let connectTimeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      await Promise.race([
        client.connect(),
        new Promise<never>((_, reject) => {
          connectTimeoutId = setTimeout(() => {
            reject(new Error("Connection timeout"));
          }, 5000);
        }),
      ]);
      
      // Set maxListeners on internal MongoDB EventEmitters after connection
      // The topology and server selection EventEmitters are created during connect()
      const topology = (client as MongoClientWithTopology).topology;
      if (topology && typeof topology.setMaxListeners === 'function') {
        topology.setMaxListeners(25);
      }
      const serverSelection = (client as MongoClientWithTopology).topology?.s?.serverSelection;
      if (serverSelection && typeof serverSelection.setMaxListeners === 'function') {
        serverSelection.setMaxListeners(25);
      }
    } finally {
      if (connectTimeoutId) {
        clearTimeout(connectTimeoutId);
      }
    }

    // Test connection with timeout
    const db = client.db("portfolio");
    let pingTimeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      await Promise.race([
        db.admin().ping(),
        new Promise<never>((_, reject) => {
          pingTimeoutId = setTimeout(() => {
            reject(new Error("Ping timeout"));
          }, 2000);
        }),
      ]);
    } finally {
      if (pingTimeoutId) {
        clearTimeout(pingTimeoutId);
      }
    }

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

/**
 * Execute a database operation with automatic connection management
 * This helper ensures proper connection handling, cleanup, and error management
 * 
 * @param operation - Function that receives the database instance and performs operations
 * @param dbName - Database name to use (default: "portfolio2")
 * @returns The result of the operation
 */
export async function executeWithDatabase<T>(
  operation: (db: Db) => Promise<T>,
  dbName: string = "portfolio2"
): Promise<T> {
  let client: MongoClient | null = null;
  try {
    const { client: mongoClient } = await getDatabase();
    client = mongoClient;
    const db = mongoClient.db(dbName);
    return await operation(db);
  } catch (error) {
    console.error(`Database operation failed (${dbName}):`, error);
    throw error;
  } finally {
    // Always close the connection after the operation
    if (client) {
      try {
        await client.close();
      } catch (e) {
        // Ignore close errors - connection might already be closed
      }
    }
  }
}

/**
 * Execute a database operation with timeout protection
 * Wraps executeWithDatabase with timeout handling
 * 
 * @param operation - Function that receives the database instance and performs operations
 * @param dbName - Database name to use (default: "portfolio2")
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns The result of the operation
 */
export async function executeWithDatabaseTimeout<T>(
  operation: (db: Db) => Promise<T>,
  dbName: string = "portfolio2",
  timeoutMs: number = 5000
): Promise<T> {
  return Promise.race([
    executeWithDatabase(operation, dbName),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Database operation timeout")), timeoutMs)
    ),
  ]);
}
