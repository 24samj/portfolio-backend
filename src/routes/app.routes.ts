import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { rateLimitMiddleware } from "@/middleware/rate-limit";
import { appStoreAppSchema } from "@/schemas/app-store.schema";
import { playStoreAppSchema } from "@/schemas/play-store.schema";
import { getAppStoreApp } from "@/services/app-store.service";
import { getPlayStoreApp } from "@/services/play-store.service";
import type { Env } from "@/types/env.type";
import { errorResponse, itemResponse as itemDoc } from "@/utils/openapi.util";
import { failureResponse, itemResponse } from "@/utils/response.util";

/** Live store listings, proxied so the browser never hits Apple/Google directly. */
export const appRoutes = new Hono<{ Bindings: Env }>();

appRoutes.get(
  "/app-store/:id",
  describeRoute({
    tags: ["Apps"],
    summary: "iOS App Store listing",
    description:
      "Live from the iTunes Lookup API. `id` is the numeric track id.",
    responses: {
      200: itemDoc("The listing", appStoreAppSchema),
      500: errorResponse("Unknown app, or the store timed out"),
    },
  }),
  rateLimitMiddleware("appStore"),
  async (c) => {
    try {
      return itemResponse(c, await getAppStoreApp(c.req.param("id")));
    } catch (error) {
      return failureResponse(c, "App Store data", error);
    }
  }
);

appRoutes.get(
  "/play-store/:id",
  describeRoute({
    tags: ["Apps"],
    summary: "Google Play listing",
    description:
      "Scraped from the store page. `id` is the package name; `lang` and `country` default to `en` / `us`.",
    parameters: [
      {
        in: "query",
        name: "lang",
        required: false,
        schema: { type: "string" },
      },
      {
        in: "query",
        name: "country",
        required: false,
        schema: { type: "string" },
      },
    ],
    responses: {
      200: itemDoc("The listing", playStoreAppSchema),
      500: errorResponse("Unknown app, or the store timed out"),
    },
  }),
  rateLimitMiddleware("appStore"),
  async (c) => {
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
  }
);
