import { Hono } from "hono";
import { rateLimitMiddleware } from "@/middleware/rate-limit";
import { getAppStoreApp } from "@/services/app-store.service";
import { getPlayStoreApp } from "@/services/play-store.service";
import type { Env } from "@/types/env.type";
import { failureResponse, itemResponse } from "@/utils/response.util";

/** Live store listings, proxied so the browser never hits Apple/Google directly. */
export const appRoutes = new Hono<{ Bindings: Env }>();

appRoutes.get("/app-store/:id", rateLimitMiddleware("appStore"), async (c) => {
  try {
    return itemResponse(c, await getAppStoreApp(c.req.param("id")));
  } catch (error) {
    return failureResponse(c, "App Store data", error);
  }
});

appRoutes.get("/play-store/:id", rateLimitMiddleware("appStore"), async (c) => {
  try {
    const app = await getPlayStoreApp(
      c.req.param("id"),
      c.req.query("lang") || "en",
      c.req.query("country") || "us"
    );
    return itemResponse(c, app);
  } catch (error) {
    return failureResponse(c, "Play Store data", error);
  }
});
