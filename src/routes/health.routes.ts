import { Hono } from "hono";
import type { Env } from "@/types/env.type";

export const healthRoutes = new Hono<{ Bindings: Env }>();

// Always 200: `status` says whether the database answered, so an uptime probe
// sees the worker is up even when D1 isn't.
healthRoutes.get("/", async (c) => {
  let database: "connected" | "disconnected";
  try {
    await c.env.PORTFOLIO_DB.prepare("SELECT 1").first();
    database = "connected";
  } catch (error) {
    console.error("Health check: D1 unreachable", error);
    database = "disconnected";
  }

  return c.json({
    status: database === "connected" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    services: { database },
  });
});
