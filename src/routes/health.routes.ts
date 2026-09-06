import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { healthSchema } from "@/schemas/health.schema";
import type { Env } from "@/types/env.type";
import { jsonResponse } from "@/utils/openapi.util";

export const healthRoutes = new Hono<{ Bindings: Env }>();

// Always 200: `status` says whether the database answered, so an uptime probe
// sees the worker is up even when D1 isn't.
healthRoutes.get(
  "/",
  describeRoute({
    tags: ["System"],
    summary: "Liveness + database check",
    responses: {
      200: jsonResponse("Worker is up; `status` reports D1", healthSchema),
    },
  }),
  async (c) => {
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
  }
);
