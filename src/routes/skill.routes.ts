import { Hono } from "hono";
import { rateLimitMiddleware } from "@/middleware/rateLimit";
import {
  getSkillCategory,
  listSkillCategories,
  listSkillsByCategory,
} from "@/services/skill.service";
import type { Env } from "@/types/env.type";
import {
  failureResponse,
  itemResponse,
  listResponse,
  notFoundResponse,
} from "@/utils/response.util";

export const skillRoutes = new Hono<{ Bindings: Env }>();

skillRoutes.get("/", rateLimitMiddleware("skills"), async (c) => {
  try {
    return listResponse(c, await listSkillCategories(c.env.PORTFOLIO_DB));
  } catch (error) {
    return failureResponse(c, "skills", error);
  }
});

// Registered before `/:id` so "category" isn't swallowed as an id.
skillRoutes.get(
  "/category/:category",
  rateLimitMiddleware("skills"),
  async (c) => {
    try {
      const skills = await listSkillsByCategory(
        c.env.PORTFOLIO_DB,
        c.req.param("category")
      );
      return listResponse(c, skills);
    } catch (error) {
      return failureResponse(c, "skills by category", error);
    }
  }
);

skillRoutes.get("/:id", rateLimitMiddleware("skills"), async (c) => {
  try {
    const skill = await getSkillCategory(c.env.PORTFOLIO_DB, c.req.param("id"));
    return skill ? itemResponse(c, skill) : notFoundResponse(c, "Skill");
  } catch (error) {
    return failureResponse(c, "skill", error);
  }
});
