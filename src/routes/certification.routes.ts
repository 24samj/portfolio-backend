import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { rateLimitMiddleware } from "@/middleware/rate-limit";
import { certificationSchema } from "@/schemas/certification.schema";
import {
  getCertification,
  listCertifications,
} from "@/services/certification.service";
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

export const certificationRoutes = new Hono<{ Bindings: Env }>();

certificationRoutes.get(
  "/",
  describeRoute({
    tags: ["Certifications"],
    summary: "List certifications",
    description: "Newest first.",
    responses: {
      200: listDoc("All certifications", certificationSchema),
      500: errorResponse("Database error"),
    },
  }),
  rateLimitMiddleware("certifications"),
  async (c) => {
    try {
      return listResponse(c, await listCertifications(c.env.PORTFOLIO_DB));
    } catch (error) {
      return failureResponse(c, "certifications", error);
    }
  }
);

certificationRoutes.get(
  "/:id",
  describeRoute({
    tags: ["Certifications"],
    summary: "Get one certification",
    responses: {
      200: itemDoc("The certification", certificationSchema),
      404: errorResponse("Unknown id"),
      500: errorResponse("Database error"),
    },
  }),
  rateLimitMiddleware("certifications"),
  async (c) => {
    try {
      const certification = await getCertification(
        c.env.PORTFOLIO_DB,
        c.req.param("id")
      );
      return certification
        ? itemResponse(c, certification)
        : notFoundResponse(c, "Certification");
    } catch (error) {
      return failureResponse(c, "certification", error);
    }
  }
);
