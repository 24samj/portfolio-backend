import { MongoClient } from "mongodb";

class DatabaseManager {
  private static instance: DatabaseManager;
  private client: MongoClient | null = null;
  private isConnected = false;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async connect(): Promise<boolean> {
    try {
      // If already connected, verify the connection is still alive
      if (this.isConnected && this.client) {
        try {
          const db = this.client.db("portfolio");
          await db.admin().ping();
          return true; // Connection is still alive
        } catch (pingError) {
          console.log("Connection stale, reconnecting...");
          this.isConnected = false;
          this.client = null;
        }
      }

      const uri = process.env.MONGODB_URI;

      if (!uri) {
        throw new Error("MONGODB_URI environment variable is not set");
      }

      this.client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        connectTimeoutMS: 5000,
        maxPoolSize: 10, // Increase pool size for better concurrency
        minPoolSize: 1, // Keep at least 1 connection
        maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
        retryWrites: true,
        retryReads: true,
        // Cloudflare Workers specific optimizations
        directConnection: false,
        maxConnecting: 2, // Limit concurrent connection attempts
      });

      await this.client.connect();

      // Test database access
      const db = this.client.db("portfolio");
      await db.admin().ping();

      this.isConnected = true;
      console.log("✅ Connected to MongoDB successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      this.isConnected = false;
      this.client = null;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.isConnected = false;
      console.log("MongoDB connection closed");
    }
  }

  getClient(): MongoClient | null {
    return this.client;
  }

  isConnectedToDatabase(): boolean {
    return this.isConnected && this.client !== null;
  }
}

export const dbManager = DatabaseManager.getInstance();
