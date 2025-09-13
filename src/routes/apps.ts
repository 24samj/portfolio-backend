import { Hono } from 'hono';
import { AppStoreService } from '../services/AppStoreService';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const apps = new Hono();

// Get iOS App Store app data
apps.get('/app-store/:id', rateLimitMiddleware('appStore'), async (c) => {
  try {
    const id = c.req.param('id');
    const appData = await AppStoreService.getAppStoreApp(id);
    
    return c.json({
      success: true,
      data: appData
    });
  } catch (error) {
    console.error('Error fetching App Store data:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch App Store data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get Google Play Store app data
// @deprecated This endpoint is deprecated due to unreliable web scraping.
// Google Play Store HTML structure changes frequently, making scraping unreliable.
// Use the frontend implementation instead which handles this better.
apps.get('/play-store/:id', rateLimitMiddleware('appStore'), async (c) => {
  return c.json({
    success: false,
    error: 'Play Store scraping is deprecated',
    message: 'This endpoint is deprecated due to unreliable web scraping. Use the frontend implementation instead.'
  }, 410); // 410 Gone - indicates the resource is no longer available
});

export default apps;
