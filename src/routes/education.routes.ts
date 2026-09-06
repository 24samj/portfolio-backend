import { Hono } from "hono";
import { rateLimitMiddleware } from "@/middleware/rateLimit";
import { getEducation, listEducations } from "@/services/education.service";
import type { Env } from "@/types/env.type";
import {
  failureResponse,
  itemResponse,
  listResponse,
  notFoundResponse,
} from "@/utils/response.util";

export const educationRoutes = new Hono<{ Bindings: Env }>();

educationRoutes.get("/", rateLimitMiddleware("educations"), async (c) => {
  try {
    return listResponse(c, await listEducations(c.env.PORTFOLIO_DB));
  } catch (error) {
    return failureResponse(c, "educations", error);
  }
});

educationRoutes.get("/:id", rateLimitMiddleware("educations"), async (c) => {
  try {
    const education = await getEducation(c.env.PORTFOLIO_DB, c.req.param("id"));
    return education
      ? itemResponse(c, education)
      : notFoundResponse(c, "Education");
  } catch (error) {
    return failureResponse(c, "education", error);
  }
});
