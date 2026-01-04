import { Hono } from "hono";
import { EducationService } from "../services/EducationService";
import { rateLimitMiddleware } from "../middleware/rateLimit";

const educations = new Hono();

// Get all educations
educations.get("/", rateLimitMiddleware("educations"), async (c) => {
  try {
    const educations = await EducationService.getAll();

    return c.json({
      success: true,
      count: educations.length,
      data: educations,
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

// Get education by ID
educations.get("/:id", rateLimitMiddleware("educations"), async (c) => {
  try {
    const id = c.req.param("id");
    const education = await EducationService.getById(id);

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
