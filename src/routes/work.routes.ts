import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { rateLimitMiddleware } from "@/middleware/rate-limit";
import { workSchema } from "@/schemas/work.schema";
import { getWork, listWorks, listWorksByIds } from "@/services/work.service";
import type { Env } from "@/types/env.type";
import {
  errorResponse,
  itemResponse as itemDoc,
  listResponse as listDoc,
} from "@/utils/openapi.util";
import {
  failureResponse,
  itemResponse,
  listResponse,
  notFoundResponse,
} from "@/utils/response.util";

export const workRoutes = new Hono<{ Bindings: Env }>();

workRoutes.get(
  "/",
  describeRoute({
    tags: ["Works"],
    summary: "List works",
    description:
      "Every project, with live store data (screenshots, rating, category) merged in where an App Store or Play Store id is set. `?ids=a,b` narrows the list — the experience card uses it to load its works.",
    parameters: [
      {
        in: "query",
        name: "ids",
        required: false,
        schema: { type: "string" },
        description: "Comma-separated work ids",
      },
    ],
    responses: {
      200: listDoc("Matching works", workSchema),
      400: errorResponse("`ids` given but empty"),
      500: errorResponse("Database error"),
    },
  }),
  rateLimitMiddleware("works"),
  async (c) => {
    try {
      const idsParam = c.req.query("ids");
      if (idsParam === undefined) {
        return listResponse(c, await listWorks(c.env.PORTFOLIO_DB));
      }

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

      return listResponse(c, await listWorksByIds(c.env.PORTFOLIO_DB, ids));
    } catch (error) {
      return failureResponse(c, "works", error);
    }
  }
);

workRoutes.get(
  "/:id",
  describeRoute({
    tags: ["Works"],
    summary: "Get one work",
    responses: {
      200: itemDoc("The work", workSchema),
      404: errorResponse("Unknown id"),
      500: errorResponse("Database error"),
    },
  }),
  rateLimitMiddleware("works"),
  async (c) => {
    try {
      const work = await getWork(c.env.PORTFOLIO_DB, c.req.param("id"));
      return work ? itemResponse(c, work) : notFoundResponse(c, "Work");
    } catch (error) {
      return failureResponse(c, "work", error);
    }
  }
);
