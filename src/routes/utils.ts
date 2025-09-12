import { Hono } from 'hono';
import { StatsService } from '../services/StatsService';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const utils = new Hono();

// Format experience date
utils.get('/format-date/:date', rateLimitMiddleware('default'), async (c) => {
  try {
    const date = c.req.param('date');
    const formatted = StatsService.formatExpDate(date === 'null' ? null : date);
    
    return c.json({
      success: true,
      data: { formatted }
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return c.json({
      success: false,
      error: 'Failed to format date',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default utils;
