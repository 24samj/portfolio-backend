import { Hono } from "hono";
import { rateLimitMiddleware } from "../middleware/rateLimit";
import { StatsService } from "../services/StatsService";
import type { Env } from "../types/env.type";

const stats = new Hono<{ Bindings: Env }>();

stats.get("/", rateLimitMiddleware("stats"), async (c) => {
  try {
    const data = await StatsService.getStats(c.env.MONGODB_URI);

    return c.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch statistics",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default stats;
