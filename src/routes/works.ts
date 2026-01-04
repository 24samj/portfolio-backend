import { Hono } from "hono";
import { WorkService } from "../services/WorkService";
import { rateLimitMiddleware } from "../middleware/rateLimit";

const works = new Hono();

// Get all works or works by IDs
works.get("/", rateLimitMiddleware("works"), async (c) => {
  try {
    // Check if ids query parameter is provided
    const idsParam = c.req.query("ids");
    
    if (idsParam) {
      // Parse comma-separated IDs
      const ids = idsParam
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      if (ids.length === 0) {
        return c.json(
          {
            success: false,
            error: "Invalid IDs parameter",
            message: "At least one valid ID must be provided",
          },
          400
        );
      }

      const works = await WorkService.getByIds(ids);

      return c.json({
        success: true,
        count: works.length,
        data: works,
      });
    } else {
      // Get all works
      const works = await WorkService.getAll();

      return c.json({
        success: true,
        count: works.length,
        data: works,
      });
    }
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
