import { Hono } from "hono";
import { InfoService } from "../services/InfoService";
import { rateLimitMiddleware } from "../middleware/rateLimit";
import type { Env } from "../types/Env";

const me = new Hono<{ Bindings: Env }>();

me.get("/", rateLimitMiddleware("default"), async (c) => {
  try {
    const profile = await InfoService.getProfile(c.env.MONGODB_URI);

    if (!profile) {
      return c.json(
        {
          success: false,
          error: "Profile not found",
          message: "No profile information available",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch profile",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default me;
