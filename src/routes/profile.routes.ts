import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { rateLimitMiddleware } from "@/middleware/rate-limit";
import { profileSchema } from "@/schemas/profile.schema";
import { getProfile } from "@/services/profile.service";
import type { Env } from "@/types/env.type";
import { errorResponse, itemResponse as itemDoc } from "@/utils/openapi.util";
import { failureResponse, itemResponse } from "@/utils/response.util";

/** Mounted at `/api/me`: the site owner's profile card. */
export const profileRoutes = new Hono<{ Bindings: Env }>();

profileRoutes.get(
  "/",
  describeRoute({
    tags: ["Profile"],
    summary: "The site owner's profile",
    responses: {
      200: itemDoc("The profile", profileSchema),
      404: errorResponse("No profile row"),
      500: errorResponse("Database error"),
    },
  }),
  rateLimitMiddleware("default"),
  async (c) => {
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
  }
);
