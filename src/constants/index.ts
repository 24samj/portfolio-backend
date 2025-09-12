// Rate limiting configurations
export const RATE_LIMITS = {
  contact: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 requests per minute
  appStore: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  experiences: { windowMs: 60 * 1000, maxRequests: 1000 }, // 1000 requests per minute
  closedTests: { windowMs: 60 * 1000, maxRequests: 200 }, // 200 requests per minute
  stats: { windowMs: 60 * 1000, maxRequests: 500 }, // 500 requests per minute
  default: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
} as const;

// CORS allowed origins
export const ALLOWED_ORIGINS = [
  'https://sumit.codes',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
] as const;

// Database collection names
export const COLLECTIONS = {
  COMPANIES: 'companies',
  CLOSED_TESTS: 'closed_tests',
} as const;

// API response messages
export const MESSAGES = {
  SUCCESS: {
    EMAIL_SENT: "Your message has been sent successfully! I'll get back to you soon.",
    DATA_FETCHED: 'Data fetched successfully',
  },
  ERROR: {
    DATABASE_CONNECTION: 'Failed to connect to database',
    INVALID_ID: 'Invalid ID provided',
    NOT_FOUND: 'Resource not found',
    VALIDATION_FAILED: 'Validation failed',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
    INTERNAL_SERVER_ERROR: 'Internal server error',
  },
} as const;
