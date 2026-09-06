import { Hono } from "hono";
import { rateLimitMiddleware } from "@/middleware/rate-limit";
import { formatExpDate } from "@/services/stats.service";
import type { Env } from "@/types/env.type";
import { failureResponse, itemResponse } from "@/utils/response.util";

export const utilRoutes = new Hono<{ Bindings: Env }>();

// `/format-date/2024-03-14` -> "Mar 2024"; the literal "null" -> "Present".
utilRoutes.get("/format-date/:date", rateLimitMiddleware("default"), (c) => {
  try {
    const date = c.req.param("date");
    return itemResponse(c, {
      formatted: formatExpDate(date === "null" ? null : date),
    });
  } catch (error) {
    return failureResponse(c, "formatted date", error);
  }
});
