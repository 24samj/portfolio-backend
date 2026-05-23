import { Hono } from "hono";
import { ExperienceService } from "../services/ExperienceService";
import { rateLimitMiddleware } from "../middleware/rateLimit";
import type { Env } from "../types/Env";

const experiences = new Hono<{ Bindings: Env }>();

experiences.get("/", rateLimitMiddleware("experiences"), async (c) => {
  try {
    const data = await ExperienceService.getAll(c.env.MONGODB_URI);

    return c.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching experiences:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch experiences",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

experiences.get("/:id", rateLimitMiddleware("experiences"), async (c) => {
  try {
    const id = c.req.param("id");
    const experience = await ExperienceService.getById(c.env.MONGODB_URI, id);

    if (!experience) {
      return c.json(
        {
          success: false,
          error: "Experience not found",
          message: "No experience found with the provided ID",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: experience,
    });
  } catch (error) {
    console.error("Error fetching experience:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch experience",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default experiences;
