import type { Context, Next } from "hono";
import { RATE_LIMITS } from "@/constants";

type Bucket = { count: number; resetTime: number };

// Per-isolate, in memory. Good enough for a portfolio: it stops a runaway
// client from hammering one instance, and the cost of being exact (KV or a
// Durable Object) isn't worth it at this traffic.
const buckets = new Map<string, Bucket>();

/** Roughly one sweep per hundred requests, so the map can't grow unbounded. */
const SWEEP_PROBABILITY = 0.01;

function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetTime) {
      buckets.delete(key);
    }
  }
}

function clientIp(c: Context): string {
  return (
    c.req.header("CF-Connecting-IP") ||
    c.req.header("X-Forwarded-For") ||
    c.req.header("X-Real-IP") ||
    "unknown"
  );
}

export const rateLimitMiddleware = (
  type: keyof typeof RATE_LIMITS = "default"
) => {
  const config = RATE_LIMITS[type];

  return async (c: Context, next: Next) => {
    const now = Date.now();
    if (Math.random() < SWEEP_PROBABILITY) {
      sweep(now);
    }

    const key = `${clientIp(c)}:${type}`;
    let bucket = buckets.get(key);
    if (!bucket || now > bucket.resetTime) {
      bucket = { count: 1, resetTime: now + config.windowMs };
      buckets.set(key, bucket);
    } else {
      bucket.count += 1;
    }

    const resetSeconds = Math.ceil(bucket.resetTime / 1000).toString();
    c.header("X-RateLimit-Limit", config.maxRequests.toString());
    c.header("X-RateLimit-Reset", resetSeconds);

    if (bucket.count > config.maxRequests) {
      const retryAfter = Math.ceil((bucket.resetTime - now) / 1000);
      c.header("X-RateLimit-Remaining", "0");
      c.header("Retry-After", retryAfter.toString());
      return c.json(
        {
          success: false,
          error: "Rate limit exceeded",
          message: `Too many requests. Limit: ${config.maxRequests} per minute`,
          retryAfter,
        },
        429
      );
    }

    c.header(
      "X-RateLimit-Remaining",
      Math.max(0, config.maxRequests - bucket.count).toString()
    );
    await next();
  };
};
