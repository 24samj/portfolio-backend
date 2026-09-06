import { Hono } from "hono";
import { rateLimitMiddleware } from "../middleware/rateLimit";
import { WorkService } from "../services/WorkService";
import type { Env } from "../types/env.type";

const works = new Hono<{ Bindings: Env }>();

works.get("/", rateLimitMiddleware("works"), async (c) => {
  try {
    const idsParam = c.req.query("ids");

    if (idsParam) {
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

      const data = await WorkService.getByIds(c.env.MONGODB_URI, ids);

      return c.json({
        success: true,
        count: data.length,
        data,
      });
    }

    const data = await WorkService.getAll(c.env.MONGODB_URI);

    return c.json({
      success: true,
      count: data.length,
      data,
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

works.get("/:id", rateLimitMiddleware("works"), async (c) => {
  try {
    const id = c.req.param("id");
    const work = await WorkService.getById(c.env.MONGODB_URI, id);

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
