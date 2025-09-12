import { Context, Next } from 'hono';
import { RATE_LIMITS } from '../constants';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = (type: keyof typeof RATE_LIMITS = 'default') => {
  return async (c: Context, next: Next) => {
    const clientIP = c.req.header('CF-Connecting-IP') || 
                     c.req.header('X-Forwarded-For') || 
                     'unknown';
    
    const config = RATE_LIMITS[type] || RATE_LIMITS.default;
    const now = Date.now();
    const key = `${clientIP}:${type}`;
    
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
        return c.json({
          success: false,
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${config.maxRequests} per minute`,
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        }, 429);
      }
    }
    
    await next();
  };
};
