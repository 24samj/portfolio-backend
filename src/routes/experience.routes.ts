import { Hono } from "hono";
import { rateLimitMiddleware } from "@/middleware/rateLimit";
import { getExperience, listExperiences } from "@/services/experience.service";
import type { Env } from "@/types/env.type";
import {
  failureResponse,
  itemResponse,
  listResponse,
  notFoundResponse,
} from "@/utils/response.util";

export const experienceRoutes = new Hono<{ Bindings: Env }>();

experienceRoutes.get("/", rateLimitMiddleware("experiences"), async (c) => {
  try {
    return listResponse(c, await listExperiences(c.env.PORTFOLIO_DB));
  } catch (error) {
    return failureResponse(c, "experiences", error);
  }
});

experienceRoutes.get("/:id", rateLimitMiddleware("experiences"), async (c) => {
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
});
