import { Hono } from "hono";
import { corsMiddleware } from "./middleware/cors";
import health from "./routes/health";
import experiences from "./routes/experiences";
import apps from "./routes/apps";
import contact from "./routes/contact";
import stats from "./routes/stats";
import utils from "./routes/utils";
import works from "./routes/works";
import educations from "./routes/educations";
import certifications from "./routes/certifications";
import skills from "./routes/skills";
import me from "./routes/me";

const app = new Hono();

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

// Apply CORS middleware to all routes
app.use("*", corsMiddleware);

// Mount route handlers with /api prefix
app.route("/api/health", health);
app.route("/api/experiences", experiences);
app.route("/api/apps", apps);
app.route("/api/contact", contact);
app.route("/api/stats", stats);
app.route("/api/utils", utils);
app.route("/api/works", works);
app.route("/api/educations", educations);
app.route("/api/certifications", certifications);
app.route("/api/skills", skills);
app.route("/api/me", me);

// Root endpoint
app.get("/", (c) => {
  return c.text("Portfolio Backend API - Use /api/health for health check");
});

// Legacy health endpoint for backward compatibility
app.route("/health", health);

// Legacy works endpoint for backward compatibility
app.route("/works", works);

// 404 handler for unmatched routes
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: "Not found",
      message: "The requested endpoint does not exist",
    },
    404
  );
});

export default app;
