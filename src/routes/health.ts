import { Hono } from "hono";
import { withMongo } from "../database/withMongo";
import type { Env } from "../types/Env";

const health = new Hono<{ Bindings: Env }>();

health.get("/", async (c) => {
  try {
    await withMongo(c.env.MONGODB_URI, "portfolio", async (db) => {
      await db.admin().ping();
    });
    return c.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        services: { mongodb: "connected" },
      },
      200
    );
  } catch {
    return c.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        services: { mongodb: "disconnected" },
      },
      200
    );
  }
});

export default health;
