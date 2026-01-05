import { Hono } from "hono";
import { CertificationService } from "../services/CertificationService";
import { rateLimitMiddleware } from "../middleware/rateLimit";

const certifications = new Hono();

// Get all certifications
certifications.get("/", rateLimitMiddleware("certifications"), async (c) => {
  try {
    const certifications = await CertificationService.getAll();

    return c.json({
      success: true,
      count: certifications.length,
      data: certifications,
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

// Get certification by ID
certifications.get("/:id", rateLimitMiddleware("certifications"), async (c) => {
  try {
    const id = c.req.param("id");
    const certification = await CertificationService.getById(id);

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
