import { Hono } from "hono";
import { rateLimitMiddleware } from "@/middleware/rateLimit";
import { getStats } from "@/services/stats.service";
import type { Env } from "@/types/env.type";
import { failureResponse, itemResponse } from "@/utils/response.util";

export const statsRoutes = new Hono<{ Bindings: Env }>();

statsRoutes.get("/", rateLimitMiddleware("stats"), async (c) => {
  try {
    return itemResponse(c, await getStats(c.env.PORTFOLIO_DB));
  } catch (error) {
    return failureResponse(c, "statistics", error);
  }
});
