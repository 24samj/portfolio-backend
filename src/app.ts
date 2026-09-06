import { Hono } from "hono";
import { corsMiddleware } from "@/middleware/cors";
import apps from "@/routes/apps";
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
app.route("/api/apps", apps);
app.route("/api/contact", contactRoutes);
app.route("/api/stats", statsRoutes);
app.route("/api/utils", utilRoutes);
app.route("/api/works", workRoutes);
app.route("/api/educations", educationRoutes);
app.route("/api/certifications", certificationRoutes);
app.route("/api/skills", skillRoutes);
app.route("/api/me", profileRoutes);

app.get("/", (c) =>
  c.text("Portfolio Backend API - Use /api/health for health check")
);

// Legacy paths kept for backward compatibility.
app.route("/health", healthRoutes);
app.route("/works", workRoutes);

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
