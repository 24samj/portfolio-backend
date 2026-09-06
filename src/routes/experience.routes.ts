import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { rateLimitMiddleware } from "@/middleware/rate-limit";
import { experienceSchema } from "@/schemas/experience.schema";
import { getExperience, listExperiences } from "@/services/experience.service";
import type { Env } from "@/types/env.type";
import {
  errorResponse,
  itemResponse as itemDoc,
  listResponse as listDoc,
} from "@/utils/openapi.util";
import {
  failureResponse,
  itemResponse,
  listResponse,
  notFoundResponse,
} from "@/utils/response.util";

export const experienceRoutes = new Hono<{ Bindings: Env }>();

experienceRoutes.get(
  "/",
  describeRoute({
    tags: ["Experiences"],
    summary: "List experiences",
    description:
      "Every employer/role. Current positions first (longest-held leading), then past positions newest-first.",
    responses: {
      200: listDoc("All experiences", experienceSchema),
      500: errorResponse("Database error"),
    },
  }),
  rateLimitMiddleware("experiences"),
  async (c) => {
    try {
      return listResponse(c, await listExperiences(c.env.PORTFOLIO_DB));
    } catch (error) {
      return failureResponse(c, "experiences", error);
    }
  }
);

experienceRoutes.get(
  "/:id",
  describeRoute({
    tags: ["Experiences"],
    summary: "Get one experience",
    responses: {
      200: itemDoc("The experience", experienceSchema),
      404: errorResponse("Unknown id"),
      500: errorResponse("Database error"),
    },
  }),
  rateLimitMiddleware("experiences"),
  async (c) => {
    try {
      const experience = await getExperience(
        c.env.PORTFOLIO_DB,
        c.req.param("id")
      );
      return experience
        ? itemResponse(c, experience)
        : notFoundResponse(c, "Experience");
    } catch (error) {
      return failureResponse(c, "experience", error);
    }
  }
);
