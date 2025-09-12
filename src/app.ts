import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors';
import health from './routes/health';
import experiences from './routes/experiences';
import apps from './routes/apps';
import closedTests from './routes/closed-tests';
import contact from './routes/contact';
import stats from './routes/stats';
import utils from './routes/utils';

const app = new Hono();

// Apply CORS middleware to all routes
app.use('*', corsMiddleware);

// Mount route handlers
app.route('/health', health);
app.route('/experiences', experiences);
app.route('/apps', apps);
app.route('/closed-tests', closedTests);
app.route('/contact', contact);
app.route('/stats', stats);
app.route('/utils', utils);

// Root endpoint
app.get('/', (c) => {
  return c.text('Portfolio Backend API - Use /health for health check');
});

export default app;
