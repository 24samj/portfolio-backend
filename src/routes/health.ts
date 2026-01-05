import { Hono } from "hono";
import { getDatabase } from "../database/connection";

const health = new Hono();

// Health check endpoint
// Creates a fresh connection per request (Cloudflare Workers best practice)
// This avoids cross-request promise resolution errors
health.get("/", async (c) => {
  let client = null;
  try {
    // Create a fresh connection for this request
    // In Cloudflare Workers, each request is isolated - we cannot maintain
    // connections across requests due to execution context isolation
    const healthCheckPromise = (async () => {
      try {
        const { db, client: mongoClient } = await getDatabase();
        client = mongoClient;
        // Quick ping to verify connection
        await db.admin().ping();
        return true;
      } catch (error) {
        console.error("Health check connection failed:", error);
        return false;
      }
    })();

    const healthCheckTimeout = new Promise<boolean>((resolve) => {
      setTimeout(() => {
        console.log("Health check timed out after 5 seconds");
        resolve(false);
      }, 5000); // 5 second timeout for health check
    });

    const isMongoConnected = await Promise.race([
      healthCheckPromise,
      healthCheckTimeout,
    ]);

    // Return health status based on MongoDB connection state
    return c.json(
      {
        status: isMongoConnected ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        services: {
          mongodb: isMongoConnected ? "connected" : "disconnected",
        },
      },
      200 // Always return 200 - service is up, just DB may be disconnected
    );
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
  } finally {
    // Always close the connection within the same request context
    // This prevents cross-request promise resolution errors
    if (client) {
      try {
        await client.close();
      } catch (e) {
        // Ignore close errors - connection might already be closed
      }
    }
  }
});

export default health;
