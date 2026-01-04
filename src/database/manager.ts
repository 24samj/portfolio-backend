import { MongoClient } from "mongodb";
import { EventEmitter } from "events";
import { MongoClientWithTopology } from "../types/MongoDB";

// Set default max listeners for all EventEmitters to prevent memory leak warnings
// MongoDB driver creates multiple internal EventEmitters (Topology, ServerSelection, etc.)
// In serverless environments, we create new clients per request, which is expected behavior
EventEmitter.defaultMaxListeners = 20;

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
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds between retries

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
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
        // Check if we're in a local environment (wrangler dev runs locally)
        const isLocalDev =
          process.env.NODE_ENV === "development" ||
          process.env.NODE_ENV === "local" ||
          process.env.WRANGLER_ENV === "local" ||
          (typeof process !== 'undefined' && process.env && !process.env.CF_PAGES);

        // For local dev, try SRV first (workerd might handle SRV better than direct DNS)
        // Only convert to direct if SRV fails
        let connectionUri = uri;
        let useDirectConnection = false;
        
        if (uri.includes("mongodb+srv://") && isLocalDev) {
          // In local dev, try SRV first - workerd's DNS might handle SRV records better
          // Only convert to direct if we're on a retry attempt (SRV failed)
          if (attempt > 1) {
            // Convert SRV to direct connection on retry
            const match = uri.match(
              /mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/
            );
            if (match) {
              const [, username, password, host, database] = match;
              const clusterName = host.split(".")[0];
              const directHost = `${clusterName}.mongodb.net`;
              connectionUri = `mongodb://${username}:${password}@${directHost}:27017/${database}?ssl=true&authSource=admin&retryWrites=false&retryReads=false`;
              useDirectConnection = true;
              console.log(
                `🔄 Attempt ${attempt}: Converting SRV to direct connection:`,
                connectionUri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")
              );
            }
          } else {
            // First attempt: use SRV connection string as-is
            console.log("🔄 Attempt 1: Using SRV connection string (workerd may handle SRV better)");
          }
        } else if (uri.includes("mongodb+srv://") && !isLocalDev) {
          // Production: use SRV as-is
          connectionUri = uri;
        }

        this.client = new MongoClient(connectionUri, {
          // Optimized timeouts for Cloudflare Workers
          serverSelectionTimeoutMS: 10000, // Increased to 10 seconds for DNS resolution
          connectTimeoutMS: 10000, // Increased to 10 seconds
          socketTimeoutMS: 15000, // 15 seconds max
          maxPoolSize: 1, // Single connection for serverless
          retryWrites: false,
          retryReads: false,
          // Only force direct connection if we converted SRV to direct
          directConnection: useDirectConnection,
          // Optimized for serverless - reduce heartbeat frequency
          heartbeatFrequencyMS: 30000, // 30 seconds
          // Add connection timeout
          maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        });

        // Note: maxListeners is set globally via EventEmitter.defaultMaxListeners
        // This applies to all EventEmitters including MongoDB's internal ones (Topology, ServerSelection, etc.)

        // Connect with timeout protection
        let connectTimeoutId: ReturnType<typeof setTimeout> | null = null;
        try {
          await Promise.race([
            this.client.connect(),
            new Promise<never>((_, reject) => {
              connectTimeoutId = setTimeout(() => {
                reject(new Error("Connection timeout"));
              }, 12000);
            }),
          ]);
          
          // Set maxListeners on internal MongoDB EventEmitters after connection
          // The topology and server selection EventEmitters are created during connect()
          const topology = (this.client as MongoClientWithTopology).topology;
          if (topology && typeof topology.setMaxListeners === 'function') {
            topology.setMaxListeners(25);
          }
          const serverSelection = (this.client as MongoClientWithTopology).topology?.s?.serverSelection;
          if (serverSelection && typeof serverSelection.setMaxListeners === 'function') {
            serverSelection.setMaxListeners(25);
          }
        } finally {
          if (connectTimeoutId) {
            clearTimeout(connectTimeoutId);
          }
        }

        // Test database access with timeout
        const db = this.client.db("portfolio");
        let pingTimeoutId: ReturnType<typeof setTimeout> | null = null;
        try {
          await Promise.race([
            db.admin().ping(),
            new Promise<never>((_, reject) => {
              pingTimeoutId = setTimeout(() => {
                reject(new Error("Ping timeout"));
              }, 3000);
            }),
          ]);
        } finally {
          if (pingTimeoutId) {
            clearTimeout(pingTimeoutId);
          }
        }

        this.isConnected = true;
        if (attempt > 1) {
          console.log(`✅ Connected to MongoDB successfully (after ${attempt} attempts)`);
        } else {
          console.log("✅ Connected to MongoDB successfully");
        }
        return true;
      } catch (error: unknown) {
        const isLastAttempt = attempt === maxRetries;
        const errorMessage = (error instanceof Error ? error.message : String(error)) || String(error);
        const isDnsError = errorMessage.includes("DNS lookup failed") || 
                          errorMessage.includes("Name or service not known") ||
                          errorMessage.includes("ENOTFOUND");
        
        if (isLastAttempt) {
          console.error("❌ Failed to connect to MongoDB after", maxRetries, "attempts:", error);
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

        // Log retry attempt for DNS errors
        if (isDnsError) {
          console.log(`⚠️  DNS resolution failed (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms...`);
        } else {
          console.log(`⚠️  Connection failed (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms...`);
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt)); // Exponential backoff
      }
    }

    return false;
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
