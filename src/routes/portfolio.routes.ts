import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { rateLimitMiddleware } from "@/middleware/rate-limit";
import { portfolioSchema } from "@/schemas/portfolio.schema";
import { getPortfolio } from "@/services/portfolio.service";
import type { Env } from "@/types/env.type";
import { errorResponse, itemResponse as itemDoc } from "@/utils/openapi.util";
import { failureResponse, itemResponse } from "@/utils/response.util";

export const portfolioRoutes = new Hono<{ Bindings: Env }>();

portfolioRoutes.get(
  "/",
  describeRoute({
    tags: ["Portfolio"],
    summary: "Everything, in one response",
    description:
      "Profile, skills, experiences, educations, certifications, works and stats together, so a screen does not fan out across the per-resource routes. `profile` is null rather than a 404 when it is missing.",
    responses: {
      200: itemDoc("The portfolio", portfolioSchema),
      500: errorResponse("Database error"),
    },
  }),
  rateLimitMiddleware("portfolio"),
  async (c) => {
    try {
      return itemResponse(c, await getPortfolio(c.env.PORTFOLIO_DB));
    } catch (error) {
      return failureResponse(c, "portfolio", error);
    }
  }
);
