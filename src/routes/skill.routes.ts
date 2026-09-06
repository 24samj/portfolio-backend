import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { rateLimitMiddleware } from "@/middleware/rate-limit";
import { skillCategorySchema, skillSchema } from "@/schemas/skill.schema";
import {
  getSkillCategory,
  listSkillCategories,
  listSkillsByCategory,
} from "@/services/skill.service";
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

export const skillRoutes = new Hono<{ Bindings: Env }>();

skillRoutes.get(
  "/",
  describeRoute({
    tags: ["Skills"],
    summary: "List skill categories",
    description:
      "Each category with its skills nested, strongest proficiency first. Category fields sit at the top level so one card component renders both shapes.",
    responses: {
      200: listDoc("All categories", skillCategorySchema),
      500: errorResponse("Database error"),
    },
  }),
  rateLimitMiddleware("skills"),
  async (c) => {
    try {
      return listResponse(c, await listSkillCategories(c.env.PORTFOLIO_DB));
    } catch (error) {
      return failureResponse(c, "skills", error);
    }
  }
);

// Registered before `/:id` so "category" isn't swallowed as an id.
skillRoutes.get(
  "/category/:category",
  describeRoute({
    tags: ["Skills"],
    summary: "List skills in one category",
    description: "Flat skills by category title. Empty for an unknown title.",
    responses: {
      200: listDoc("The category's skills", skillSchema),
      500: errorResponse("Database error"),
    },
  }),
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

skillRoutes.get(
  "/:id",
  describeRoute({
    tags: ["Skills"],
    summary: "Get one skill category",
    description:
      "The category shaped as a single skill: title for name/description, proficiency from its first skill.",
    responses: {
      200: itemDoc("The category", skillSchema),
      404: errorResponse("Unknown id, or a category with no skills"),
      500: errorResponse("Database error"),
    },
  }),
  rateLimitMiddleware("skills"),
  async (c) => {
    try {
      const skill = await getSkillCategory(
        c.env.PORTFOLIO_DB,
        c.req.param("id")
      );
      return skill ? itemResponse(c, skill) : notFoundResponse(c, "Skill");
    } catch (error) {
      return failureResponse(c, "skill", error);
    }
  }
);
