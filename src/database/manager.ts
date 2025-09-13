import { MongoClient } from "mongodb";

class DatabaseManager {
  private static instance: DatabaseManager;
  private client: MongoClient | null = null;
  private isConnected = false;
  private connectionPromise: Promise<boolean> | null = null;
  private lastConnectionAttempt: number = 0;
  private readonly CONNECTION_COOLDOWN = 1000; // 1 second cooldown between connection attempts

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async connect(): Promise<boolean> {
    // If already connected, test the connection first
    if (this.isConnected && this.client) {
      try {
        // Test the connection with a quick ping
        await this.client.db("admin").admin().ping();
        return true;
      } catch (error) {
        console.log("Connection lost, reconnecting...");
        this.isConnected = false;
        this.client = null;
      }
    }

    // If connection is in progress, wait for it instead of starting a new one
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Rate limiting: don't attempt connection too frequently
    const now = Date.now();
    if (now - this.lastConnectionAttempt < this.CONNECTION_COOLDOWN) {
      console.log("Connection attempt too soon, waiting...");
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          this.CONNECTION_COOLDOWN - (now - this.lastConnectionAttempt)
        )
      );
    }

    this.lastConnectionAttempt = now;
    this.connectionPromise = this._connect();
    const result = await this.connectionPromise;
    this.connectionPromise = null;
    return result;
  }

  private async _connect(): Promise<boolean> {
    try {
      const uri = process.env.MONGODB_URI;

      if (!uri) {
        console.error("MONGODB_URI environment variable is not set");
        return false;
      }

      // Close existing client if any
      if (this.client) {
        try {
          await this.client.close();
        } catch (e) {
          // Ignore close errors
        }
        this.client = null;
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
        // Extract the connection details and convert to direct connection
        const match = uri.match(
          /mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/
        );
        if (match) {
          const [, username, password, host, database] = match;
          // Use the first host from the cluster for direct connection
          const directHost = host.split(".")[0] + ".mongodb.net";
          connectionUri = `mongodb://${username}:${password}@${directHost}:27017/${database}?ssl=true&authSource=admin&retryWrites=false&retryReads=false`;
          console.log(
            "🔄 Using direct connection:",
            connectionUri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")
          );
        }
      }

      this.client = new MongoClient(connectionUri, {
        // Optimized timeouts for Cloudflare Workers
        serverSelectionTimeoutMS: 5000, // 5 seconds max
        connectTimeoutMS: 5000, // 5 seconds max
        socketTimeoutMS: 10000, // 10 seconds max
        maxPoolSize: 1, // Single connection for serverless
        retryWrites: false,
        retryReads: false,
        // Force direct connection in local development to avoid SRV record issues
        directConnection: isLocalDev,
        // Additional options for local development
        ...(isLocalDev && {
          // Use direct connection string format for local dev
          useUnifiedTopology: true,
          useNewUrlParser: true,
        }),
        // Optimized for serverless - reduce heartbeat frequency
        heartbeatFrequencyMS: 30000, // 30 seconds
        // Add connection timeout
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      });

      await this.client.connect();

      // Test database access with timeout
      const db = this.client.db("portfolio");
      await Promise.race([
        db.admin().ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Ping timeout")), 2000)
        ),
      ]);

      this.isConnected = true;
      console.log("✅ Connected to MongoDB successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      this.isConnected = false;
      if (this.client) {
        try {
          await this.client.close();
        } catch (e) {
          // Ignore close errors
        }
        this.client = null;
      }
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
      } catch (e) {
        // Ignore close errors
      }
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

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }

      // Quick ping to test connection
      await this.client.db("admin").admin().ping();
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Force close connection - useful for Cloudflare Workers
   */
  async forceClose(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
      } catch (e) {
        // Ignore close errors
      }
      this.client = null;
      this.isConnected = false;
      console.log("MongoDB connection force closed");
    }
  }
}

export const dbManager = DatabaseManager.getInstance();
