import { Hono } from "hono";
import { rateLimitMiddleware } from "@/middleware/rateLimit";
import { getProfile } from "@/services/profile.service";
import type { Env } from "@/types/env.type";
import { failureResponse, itemResponse } from "@/utils/response.util";

/** Mounted at `/api/me`: the site owner's profile card. */
export const profileRoutes = new Hono<{ Bindings: Env }>();

profileRoutes.get("/", rateLimitMiddleware("default"), async (c) => {
  try {
    const profile = await getProfile(c.env.PORTFOLIO_DB);
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
    return itemResponse(c, profile);
  } catch (error) {
    return failureResponse(c, "profile", error);
  }
});
