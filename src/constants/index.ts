/** Per-route request budgets, per client IP, per minute. */
export const RATE_LIMITS = {
  contact: { windowMs: 60 * 1000, maxRequests: 1 },
  appStore: { windowMs: 60 * 1000, maxRequests: 100 },
  experiences: { windowMs: 60 * 1000, maxRequests: 1000 },
  stats: { windowMs: 60 * 1000, maxRequests: 500 },
  works: { windowMs: 60 * 1000, maxRequests: 1000 },
  educations: { windowMs: 60 * 1000, maxRequests: 1000 },
  certifications: { windowMs: 60 * 1000, maxRequests: 1000 },
  skills: { windowMs: 60 * 1000, maxRequests: 1000 },
  default: { windowMs: 60 * 1000, maxRequests: 100 },
} as const;

export const PRODUCTION_ORIGINS = ["https://sumit.codes"] as const;

export const DEVELOPMENT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
] as const;
