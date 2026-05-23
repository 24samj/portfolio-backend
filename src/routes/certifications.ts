import { Hono } from "hono";
import { CertificationService } from "../services/CertificationService";
import { rateLimitMiddleware } from "../middleware/rateLimit";
import type { Env } from "../types/Env";

const certifications = new Hono<{ Bindings: Env }>();

certifications.get("/", rateLimitMiddleware("certifications"), async (c) => {
  try {
    const data = await CertificationService.getAll(c.env.MONGODB_URI);

    return c.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching certifications:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch certifications",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

certifications.get("/:id", rateLimitMiddleware("certifications"), async (c) => {
  try {
    const id = c.req.param("id");
    const certification = await CertificationService.getById(c.env.MONGODB_URI, id);

    if (!certification) {
      return c.json(
        {
          success: false,
          error: "Certification not found",
          message: "No certification found with the provided ID",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: certification,
    });
  } catch (error) {
    console.error("Error fetching certification:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch certification",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default certifications;
