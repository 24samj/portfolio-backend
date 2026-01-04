import { Hono } from "hono";
import { MongoClient } from "mongodb";
import { dbManager } from "../database/manager";

const health = new Hono();

// MongoDB connection reference
let mongoClient: MongoClient | null = null;

// Set MongoDB client reference
export const setMongoClient = (client: MongoClient | null) => {
  mongoClient = client;
};

// Health check endpoint
health.get("/", async (c) => {
  try {
    // Check current connection status without blocking
    const isCurrentlyConnected = dbManager.isConnectedToDatabase();
    
    // If not connected, try to connect but don't wait too long
    if (!isCurrentlyConnected) {
      console.log("MongoDB not connected, attempting to connect...");
      // Start connection attempt but don't block - use a shorter timeout
      // This allows the health check to return quickly even if DNS is slow
      const connectionPromise = dbManager.connect();
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 8000); // 8 second timeout for health check
      });
      
      // Race between connection and timeout
      const connectionResult = await Promise.race([
        connectionPromise,
        timeoutPromise,
      ]);

      // If connection succeeded, verify it with timeout
      if (connectionResult) {
        try {
          const healthCheckPromise = dbManager.healthCheck();
          const healthCheckTimeout = new Promise<boolean>((resolve) => {
            setTimeout(() => resolve(false), 3000); // 3 second timeout for health check
          });
          const isMongoConnected = await Promise.race([
            healthCheckPromise,
            healthCheckTimeout,
          ]);
          return c.json(
            {
              status: isMongoConnected ? "ok" : "degraded",
              timestamp: new Date().toISOString(),
              services: {
                mongodb: isMongoConnected ? "connected" : "disconnected",
              },
            },
            isMongoConnected ? 200 : 200 // Return 200 even if degraded - service is up
          );
        } catch (error) {
          // Health check failed, but service is still up
          return c.json(
            {
              status: "degraded",
              timestamp: new Date().toISOString(),
              services: {
                mongodb: "disconnected",
              },
              message: "MongoDB connection established but health check failed.",
            },
            200 // Service is up, just health check failed
          );
        }
      } else {
        // Connection is still in progress or failed - return degraded status
        // Return 200 with degraded status so monitoring knows the service is up
        return c.json(
          {
            status: "degraded",
            timestamp: new Date().toISOString(),
            services: {
              mongodb: "connecting",
            },
            message: "MongoDB connection in progress. The API may function normally once connected.",
          },
          200 // Return 200 even if degraded - service is up, just DB connecting
        );
      }
    }

    // If already connected, verify it's still active with timeout
    try {
      const healthCheckPromise = dbManager.healthCheck();
      const healthCheckTimeout = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 3000); // 3 second timeout for health check
      });
      const isMongoConnected = await Promise.race([
        healthCheckPromise,
        healthCheckTimeout,
      ]);

      const healthStatus = {
        status: isMongoConnected ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        services: {
          mongodb: isMongoConnected ? "connected" : "disconnected",
        },
      };

      return c.json(healthStatus, 200); // Always return 200 - service is up
    } catch (error) {
      // Health check failed, but service is still up
      return c.json(
        {
          status: "degraded",
          timestamp: new Date().toISOString(),
          services: {
            mongodb: "disconnected",
          },
          message: "MongoDB health check failed.",
        },
        200 // Service is up, just health check failed
      );
    }
  } catch (error) {
    console.error("Health check error:", error);
    // Return 200 with error status - service is up, just DB has issues
    return c.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        error: "Health check encountered an error",
        services: {
          mongodb: "error",
        },
        message: "The API service is running but MongoDB connection has issues.",
      },
      200 // Service is up, just DB has problems
    );
  }
});

export default health;
