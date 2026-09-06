import { Hono } from "hono";
import { rateLimitMiddleware } from "@/middleware/rateLimit";
import {
  getCertification,
  listCertifications,
} from "@/services/certification.service";
import type { Env } from "@/types/env.type";
import {
  failureResponse,
  itemResponse,
  listResponse,
  notFoundResponse,
} from "@/utils/response.util";

export const certificationRoutes = new Hono<{ Bindings: Env }>();

certificationRoutes.get(
  "/",
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
