import { Hono } from 'hono';
import { StatsService } from '../services/StatsService';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const stats = new Hono();

// Get portfolio statistics
stats.get('/', rateLimitMiddleware('stats'), async (c) => {
  try {
    const stats = await StatsService.getStats();
    
    return c.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default stats;
