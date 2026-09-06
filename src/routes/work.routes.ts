import { Hono } from "hono";
import { rateLimitMiddleware } from "@/middleware/rateLimit";
import { getWork, listWorks, listWorksByIds } from "@/services/work.service";
import type { Env } from "@/types/env.type";
import {
  failureResponse,
  itemResponse,
  listResponse,
  notFoundResponse,
} from "@/utils/response.util";

export const workRoutes = new Hono<{ Bindings: Env }>();

// `?ids=a,b,c` narrows the list; the experience card uses it to load its works.
workRoutes.get("/", rateLimitMiddleware("works"), async (c) => {
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
});

workRoutes.get("/:id", rateLimitMiddleware("works"), async (c) => {
  try {
    const work = await getWork(c.env.PORTFOLIO_DB, c.req.param("id"));
    return work ? itemResponse(c, work) : notFoundResponse(c, "Work");
  } catch (error) {
    return failureResponse(c, "work", error);
  }
});
