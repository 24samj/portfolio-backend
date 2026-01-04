import { Hono } from "hono";
import { WorkService } from "../services/WorkService";
import { rateLimitMiddleware } from "../middleware/rateLimit";

const works = new Hono();

// Get all works
works.get("/", rateLimitMiddleware("works"), async (c) => {
  try {
    const works = await WorkService.getAll();

    return c.json({
      success: true,
      count: works.length,
      data: works,
    });
  } catch (error) {
    console.error("Error fetching works:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch works",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Get work by ID
works.get("/:id", rateLimitMiddleware("works"), async (c) => {
  try {
    const id = c.req.param("id");
    const work = await WorkService.getById(id);

    if (!work) {
      return c.json(
        {
          success: false,
          error: "Work not found",
          message: "No work found with the provided ID",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: work,
    });
  } catch (error) {
    console.error("Error fetching work:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch work",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default works;
