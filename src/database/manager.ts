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
    // If already connected, test the connection first to ensure it's actually alive
    if (this.isConnected && this.client) {
      try {
        // Test the connection with a quick ping and timeout
        await Promise.race([
          this.client.db("admin").admin().ping(),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Ping timeout")), 2000);
          }),
        ]);
        // Connection is alive
        return true;
      } catch (error) {
        console.log("Connection lost or stale, will reconnect...");
        // Mark as disconnected and clean up
        this.isConnected = false;
        if (this.client) {
          try {
            await this.client.close();
          } catch (e) {
            // Ignore close errors
          }
        }
        this.client = null;
        // Fall through to reconnect logic below
      }
    }

    // If connection is in progress, wait for it instead of starting a new one
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Rate limiting: don't attempt connection too frequently
    // But allow immediate reconnection if we just detected a dead connection
    const now = Date.now();
    const timeSinceLastAttempt = now - this.lastConnectionAttempt;
    if (timeSinceLastAttempt < this.CONNECTION_COOLDOWN && timeSinceLastAttempt > 0) {
      console.log(`Connection attempt too soon (${timeSinceLastAttempt}ms ago), waiting...`);
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          this.CONNECTION_COOLDOWN - timeSinceLastAttempt
        )
      );
    }

    console.log("Attempting to connect to MongoDB...");
    this.lastConnectionAttempt = Date.now();
    this.connectionPromise = this._connect();
    
    try {
      const result = await this.connectionPromise;
      this.connectionPromise = null;
      if (result) {
        console.log("✅ Successfully connected to MongoDB");
      } else {
        console.log("❌ Failed to connect to MongoDB");
      }
      return result;
    } catch (error) {
      this.connectionPromise = null;
      console.error("Connection attempt failed:", error);
      return false;
    }
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
          // Remove maxIdleTimeMS for serverless - let connections stay alive
          // In Cloudflare Workers, connections are ephemeral anyway, so we'll verify on each use
          // maxIdleTimeMS: removed - connections will be verified before use
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
    // This is a synchronous check - only returns the flag state
    // For actual verification, use healthCheck() which is async
    return this.isConnected && this.client !== null;
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }

      // Quick ping to test connection with timeout
      await Promise.race([
        this.client.db("admin").admin().ping(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Health check timeout")), 3000);
        }),
      ]);
      
      // Connection is alive - ensure flag is set
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error("Database health check failed, connection is dead:", error);
      // Connection is dead - update state and trigger reconnection
      this.isConnected = false;
      if (this.client) {
        try {
          await this.client.close();
        } catch (e) {
          // Ignore close errors
        }
        this.client = null;
      }
      
      // Try to reconnect immediately (don't wait for next connect() call)
      console.log("Attempting automatic reconnection after health check failure...");
      try {
        const reconnected = await this.connect();
        if (reconnected) {
          console.log("✅ Successfully reconnected after health check failure");
          return true;
        }
      } catch (reconnectError) {
        console.error("Automatic reconnection failed:", reconnectError);
      }
      
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
