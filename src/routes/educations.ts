import { Hono } from "hono";
import { rateLimitMiddleware } from "../middleware/rateLimit";
import { EducationService } from "../services/EducationService";
import type { Env } from "../types/env.type";

const educations = new Hono<{ Bindings: Env }>();

educations.get("/", rateLimitMiddleware("educations"), async (c) => {
  try {
    const data = await EducationService.getAll(c.env.MONGODB_URI);

    return c.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching educations:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch educations",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

educations.get("/:id", rateLimitMiddleware("educations"), async (c) => {
  try {
    const id = c.req.param("id");
    const education = await EducationService.getById(c.env.MONGODB_URI, id);

    if (!education) {
      return c.json(
        {
          success: false,
          error: "Education not found",
          message: "No education found with the provided ID",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: education,
    });
  } catch (error) {
    console.error("Error fetching education:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch education",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default educations;
