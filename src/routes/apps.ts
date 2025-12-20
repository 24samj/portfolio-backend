import { Hono } from 'hono';
import { AppStoreService } from '../services/AppStoreService';
import { PlayStoreService } from '../services/PlayStoreService';
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
    const lang = c.req.query('lang') || 'en';
    const country = c.req.query('country') || 'us';
    
    console.log('Fetching Play Store data for appId:', id);
    
    // Use custom PlayStoreService that works with Cloudflare Workers (uses fetch instead of got)
    const appData = await PlayStoreService.getApp(id, lang, country);
    
    console.log('Successfully fetched Play Store data:', appData?.title);

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
