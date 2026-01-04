// Rate limiting configurations
export const RATE_LIMITS = {
  contact: { windowMs: 60 * 1000, maxRequests: 1 }, // 1 request per minute
  appStore: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  experiences: { windowMs: 60 * 1000, maxRequests: 1000 }, // 1000 requests per minute
  stats: { windowMs: 60 * 1000, maxRequests: 500 }, // 500 requests per minute
  works: { windowMs: 60 * 1000, maxRequests: 1000 }, // 1000 requests per minute
  educations: { windowMs: 60 * 1000, maxRequests: 1000 }, // 1000 requests per minute
  certifications: { windowMs: 60 * 1000, maxRequests: 1000 }, // 1000 requests per minute
  skills: { windowMs: 60 * 1000, maxRequests: 1000 }, // 1000 requests per minute
  default: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
} as const;

// Environment-specific allowed origins
export const PRODUCTION_ORIGINS = [
  "https://sumit.codes",
] as const;

export const DEVELOPMENT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
] as const;

// Database collection names
export const COLLECTIONS = {
  COMPANIES: "companies",
  WORKS: "works",
  EDUCATIONS: "educations",
  CERTIFICATIONS: "certifications",
  SKILLS: "skills",
} as const;

// API response messages
export const MESSAGES = {
  SUCCESS: {
    EMAIL_SENT:
      "Your message has been sent successfully! I'll get back to you soon.",
    DATA_FETCHED: "Data fetched successfully",
  },
  ERROR: {
    DATABASE_CONNECTION: "Failed to connect to database",
    INVALID_ID: "Invalid ID provided",
    NOT_FOUND: "Resource not found",
    VALIDATION_FAILED: "Validation failed",
    RATE_LIMIT_EXCEEDED: "Rate limit exceeded",
    INTERNAL_SERVER_ERROR: "Internal server error",
  },
} as const;
