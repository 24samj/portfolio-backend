import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { rateLimitMiddleware } from "@/middleware/rate-limit";
import { educationSchema } from "@/schemas/education.schema";
import { getEducation, listEducations } from "@/services/education.service";
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

export const educationRoutes = new Hono<{ Bindings: Env }>();

educationRoutes.get(
  "/",
  describeRoute({
    tags: ["Educations"],
    summary: "List educations",
    description: "Newest first by end date.",
    responses: {
      200: listDoc("All educations", educationSchema),
      500: errorResponse("Database error"),
    },
  }),
  rateLimitMiddleware("educations"),
  async (c) => {
    try {
      return listResponse(c, await listEducations(c.env.PORTFOLIO_DB));
    } catch (error) {
      return failureResponse(c, "educations", error);
    }
  }
);

educationRoutes.get(
  "/:id",
  describeRoute({
    tags: ["Educations"],
    summary: "Get one education",
    responses: {
      200: itemDoc("The education", educationSchema),
      404: errorResponse("Unknown id"),
      500: errorResponse("Database error"),
    },
  }),
  rateLimitMiddleware("educations"),
  async (c) => {
    try {
      const education = await getEducation(
        c.env.PORTFOLIO_DB,
        c.req.param("id")
      );
      return education
        ? itemResponse(c, education)
        : notFoundResponse(c, "Education");
    } catch (error) {
      return failureResponse(c, "education", error);
    }
  }
);
