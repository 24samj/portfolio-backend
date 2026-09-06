import { Hono } from "hono";
import { rateLimitMiddleware } from "../middleware/rateLimit";
import { SkillService } from "../services/SkillService";
import type { Env } from "../types/env.type";

const skills = new Hono<{ Bindings: Env }>();

skills.get("/", rateLimitMiddleware("skills"), async (c) => {
  try {
    const data = await SkillService.getAll(c.env.MONGODB_URI);

    return c.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch skills",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

skills.get("/category/:category", rateLimitMiddleware("skills"), async (c) => {
  try {
    const category = c.req.param("category");
    const data = await SkillService.getByCategory(c.env.MONGODB_URI, category);

    return c.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching skills by category:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch skills by category",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

skills.get("/:id", rateLimitMiddleware("skills"), async (c) => {
  try {
    const id = c.req.param("id");
    const skill = await SkillService.getById(c.env.MONGODB_URI, id);

    if (!skill) {
      return c.json(
        {
          success: false,
          error: "Skill not found",
          message: "No skill found with the provided ID",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: skill,
    });
  } catch (error) {
    console.error("Error fetching skill:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch skill",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default skills;
