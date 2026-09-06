import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { rateLimitMiddleware } from "@/middleware/rate-limit";
import { formattedDateSchema } from "@/schemas/stats.schema";
import { formatExpDate } from "@/services/stats.service";
import type { Env } from "@/types/env.type";
import { errorResponse, itemResponse as itemDoc } from "@/utils/openapi.util";
import { failureResponse, itemResponse } from "@/utils/response.util";

export const utilRoutes = new Hono<{ Bindings: Env }>();

utilRoutes.get(
  "/format-date/:date",
  describeRoute({
    tags: ["Utils"],
    summary: "Format an experience date",
    description:
      '`/format-date/2024-03-14` → "Mar 2024". The literal `null` → "Present".',
    responses: {
      200: itemDoc("The formatted date", formattedDateSchema),
      500: errorResponse("Unparseable date"),
    },
  }),
  rateLimitMiddleware("default"),
  (c) => {
    try {
      const date = c.req.param("date");
      return itemResponse(c, {
        formatted: formatExpDate(date === "null" ? null : date),
      });
    } catch (error) {
      return failureResponse(c, "formatted date", error);
    }
  }
);
