import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { rateLimitMiddleware } from "@/middleware/rate-limit";
import { statsSchema } from "@/schemas/stats.schema";
import { getStats } from "@/services/stats.service";
import type { Env } from "@/types/env.type";
import { errorResponse, itemResponse as itemDoc } from "@/utils/openapi.util";
import { failureResponse, itemResponse } from "@/utils/response.util";

export const statsRoutes = new Hono<{ Bindings: Env }>();

statsRoutes.get(
  "/",
  describeRoute({
    tags: ["Stats"],
    summary: "Headline numbers",
    description:
      "Years of experience (overlapping months counted once), companies, projects, distinct technologies, and whether a position is current.",
    responses: {
      200: itemDoc("The stats", statsSchema),
      500: errorResponse("Database error"),
    },
  }),
  rateLimitMiddleware("stats"),
  async (c) => {
    try {
      return itemResponse(c, await getStats(c.env.PORTFOLIO_DB));
    } catch (error) {
      return failureResponse(c, "statistics", error);
    }
  }
);
