import { Hono } from "hono";
import { SkillService } from "../services/SkillService";
import { rateLimitMiddleware } from "../middleware/rateLimit";

const skills = new Hono();

// Get all skills
skills.get("/", rateLimitMiddleware("skills"), async (c) => {
  try {
    const skills = await SkillService.getAll();

    return c.json({
      success: true,
      count: skills.length,
      data: skills,
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

// Get skills by category
skills.get("/category/:category", rateLimitMiddleware("skills"), async (c) => {
  try {
    const category = c.req.param("category");
    const skills = await SkillService.getByCategory(category);

    return c.json({
      success: true,
      count: skills.length,
      data: skills,
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

// Get skill by ID
skills.get("/:id", rateLimitMiddleware("skills"), async (c) => {
  try {
    const id = c.req.param("id");
    const skill = await SkillService.getById(id);

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
