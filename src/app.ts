import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";
import { corsMiddleware } from "@/middleware/cors";
import { appRoutes } from "@/routes/app.routes";
import { certificationRoutes } from "@/routes/certification.routes";
import { contactRoutes } from "@/routes/contact.routes";
import { educationRoutes } from "@/routes/education.routes";
import { experienceRoutes } from "@/routes/experience.routes";
import { healthRoutes } from "@/routes/health.routes";
import { profileRoutes } from "@/routes/profile.routes";
import { skillRoutes } from "@/routes/skill.routes";
import { statsRoutes } from "@/routes/stats.routes";
import { utilRoutes } from "@/routes/util.routes";
import { workRoutes } from "@/routes/work.routes";
import type { Env } from "@/types/env.type";

/**
 * portfolio-backend: the API behind sumit.codes. Read-only portfolio content
 * from D1, live store listings, and one write — the contact form. This file
 * only wires things together; routes live in `src/routes/`.
 */
const app = new Hono<{ Bindings: Env }>();

// Global error handler to prevent 1101 errors
app.onError((err, c) => {
  console.error("Unhandled error in Worker:", err);
  return c.json(
    {
      success: false,
      error: "Internal server error",
      message: "An unexpected error occurred",
    },
    500
  );
});

app.use("*", corsMiddleware);

app.route("/api/health", healthRoutes);
app.route("/api/experiences", experienceRoutes);
app.route("/api/apps", appRoutes);
app.route("/api/contact", contactRoutes);
app.route("/api/stats", statsRoutes);
app.route("/api/utils", utilRoutes);
app.route("/api/works", workRoutes);
app.route("/api/educations", educationRoutes);
app.route("/api/certifications", certificationRoutes);
app.route("/api/skills", skillRoutes);
app.route("/api/me", profileRoutes);

// Legacy paths kept for backward compatibility. Hidden from the spec below.
app.route("/health", healthRoutes);
app.route("/works", workRoutes);

// OpenAPI spec, served from the live route definitions (describeRoute metadata).
// Documents only the canonical /api surface: one negative rule hides the legacy
// aliases, the root banner, and the /docs UI itself.
app.get(
  "/openapi.json",
  openAPIRouteHandler(app, {
    exclude: [/^\/(?!api\b)/],
    documentation: {
      openapi: "3.1.0",
      info: {
        title: "portfolio-backend",
        version: "2.0.0",
        description:
          "The API behind sumit.codes: portfolio content, live store listings, and the contact form.",
      },
      servers: [
        { url: "https://api.sumit.codes", description: "Production" },
        { url: "http://localhost:8787", description: "Local dev" },
      ],
      tags: [
        { name: "System", description: "Liveness" },
        { name: "Profile", description: "The site owner" },
        { name: "Experiences", description: "Employers and roles" },
        { name: "Works", description: "Projects" },
        { name: "Skills", description: "Skill categories" },
        { name: "Educations" },
        { name: "Certifications" },
        { name: "Stats", description: "Headline numbers" },
        { name: "Apps", description: "Live App Store / Play Store listings" },
        { name: "Contact", description: "The contact form" },
        { name: "Utils" },
      ],
    },
  })
);

// Interactive API reference (Scalar): an HTML shell that loads Scalar client-side
// and points it at /openapi.json above.
app.get(
  "/docs",
  Scalar({
    url: "/openapi.json",
    pageTitle: "sumit.codes API",
    theme: "saturn",
    layout: "modern",
    defaultOpenAllTags: true,
  })
);

app.get("/", (c) =>
  c.text("Portfolio Backend API - see /docs for the API reference")
);

app.notFound((c) =>
  c.json(
    {
      success: false,
      error: "Not found",
      message: "The requested endpoint does not exist",
    },
    404
  )
);

export default app;
