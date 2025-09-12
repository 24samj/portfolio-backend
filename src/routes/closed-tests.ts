import { Hono } from 'hono';
import { ClosedTestService } from '../services/ClosedTestService';
import { AppStoreService } from '../services/AppStoreService';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const closedTests = new Hono();

// Get all closed tests
closedTests.get('/', rateLimitMiddleware('closedTests'), async (c) => {
  try {
    const tests = await ClosedTestService.getAll();
    
    return c.json({
      success: true,
      count: tests.length,
      data: tests
    });
  } catch (error) {
    console.error('Error fetching closed tests:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch closed tests',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get closed test by ID
closedTests.get('/:id', rateLimitMiddleware('closedTests'), async (c) => {
  try {
    const id = c.req.param('id');
    const test = await ClosedTestService.getById(id);
    
    if (!test) {
      return c.json({
        success: false,
        error: 'Closed test not found',
        message: 'No closed test found with the provided ID'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: test
    });
  } catch (error) {
    console.error('Error fetching closed test:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch closed test',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Check app testing status
closedTests.get('/check/:packageName', rateLimitMiddleware('closedTests'), async (c) => {
  try {
    const packageName = c.req.param('packageName');
    const result = await AppStoreService.checkPlayStoreTestingStatus(packageName);
    
    return c.json({
      success: true,
      isInClosedTesting: result.isInClosedTesting,
      appData: result.appData
    });
  } catch (error) {
    console.error('Error checking testing status:', error);
    return c.json({
      success: false,
      error: 'Failed to check testing status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default closedTests;
