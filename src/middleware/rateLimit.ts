import { Context, Next } from 'hono';
import { RATE_LIMITS } from '../constants';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Cleanup old entries periodically to prevent memory leaks
// In Cloudflare Workers, memory resets between requests, but cleanup is still good practice
const cleanupRateLimitMap = () => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
};

export const rateLimitMiddleware = (type: keyof typeof RATE_LIMITS = 'default') => {
  return async (c: Context, next: Next) => {
    const clientIP = c.req.header('CF-Connecting-IP') || 
                     c.req.header('X-Forwarded-For') || 
                     c.req.header('X-Real-IP') ||
                     'unknown';
    
    const config = RATE_LIMITS[type] || RATE_LIMITS.default;
    const now = Date.now();
    const key = `${clientIP}:${type}`;
    
    // Cleanup old entries periodically (every 100 requests or so)
    if (Math.random() < 0.01) {
      cleanupRateLimitMap();
    }
    
    const current = rateLimitMap.get(key);
    
    if (!current || now > current.resetTime) {
      // Reset or create new entry
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
    } else {
      // Increment count
      current.count++;
      
      if (current.count > config.maxRequests) {
        // Add rate limit headers
        c.header('X-RateLimit-Limit', config.maxRequests.toString());
        c.header('X-RateLimit-Remaining', '0');
        c.header('X-RateLimit-Reset', Math.ceil(current.resetTime / 1000).toString());
        c.header('Retry-After', Math.ceil((current.resetTime - now) / 1000).toString());
        
        return c.json({
          success: false,
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${config.maxRequests} per minute`,
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        }, 429);
      }
    }
    
    // Add rate limit headers to successful requests
    const remaining = current 
      ? Math.max(0, config.maxRequests - current.count)
      : config.maxRequests - 1;
    c.header('X-RateLimit-Limit', config.maxRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', Math.ceil((current?.resetTime || now + config.windowMs) / 1000).toString());
    
    await next();
  };
};
