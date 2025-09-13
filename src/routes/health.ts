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
    // Try to connect if not already connected
    if (!dbManager.isConnectedToDatabase()) {
      console.log("MongoDB not connected, attempting to connect...");
      await dbManager.connect();
    }

    const isMongoConnected = dbManager.isConnectedToDatabase();

    const healthStatus = {
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        mongodb: isMongoConnected ? "connected" : "disconnected",
      },
    };

    return c.json(healthStatus, isMongoConnected ? 200 : 503);
  } catch (error) {
    console.error("Health check error:", error);
    return c.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
        services: {
          mongodb: "error",
        },
      },
      503
    );
  }
});

export default health;
