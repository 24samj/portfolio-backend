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
apps.get('/play-store/:id', rateLimitMiddleware('appStore'), async (c) => {
  try {
    const id = c.req.param('id');
    const appData = await AppStoreService.getPlayStoreApp(id);
    
    return c.json({
      success: true,
      data: appData
    });
  } catch (error) {
    console.error('Error fetching Play Store data:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch Play Store data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default apps;
