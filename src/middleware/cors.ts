import { Context, Next } from "hono";
import { PRODUCTION_ORIGINS } from "../constants";
import { DEVELOPMENT_ORIGINS } from "../constants";

// Determine if we're in development or production
const isDevelopment = 
  process.env.NODE_ENV === "development" ||
  process.env.NODE_ENV === "local" ||
  process.env.WRANGLER_ENV === "local" ||
  (typeof process !== 'undefined' && process.env && !process.env.CF_PAGES);



// Get allowed origins based on environment
const getAllowedOrigins = (): readonly string[] => {
  return isDevelopment 
    ? [...PRODUCTION_ORIGINS, ...DEVELOPMENT_ORIGINS]
    : PRODUCTION_ORIGINS;
};

export const corsMiddleware = async (c: Context, next: Next) => {
  const origin = c.req.header("Origin");
  const allowedOrigins = getAllowedOrigins();

  // Set CORS headers for allowed origins
  if (
    origin &&
    allowedOrigins.includes(origin)
  ) {
    c.header("Access-Control-Allow-Origin", origin);
    c.header("Access-Control-Allow-Credentials", "true");
  }

  // Always set these headers (needed for preflight requests)
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  c.header("Access-Control-Max-Age", "86400");

  // Handle preflight OPTIONS requests
  if (c.req.method === "OPTIONS") {
    return c.text("", 200);
  }

  await next();
};
