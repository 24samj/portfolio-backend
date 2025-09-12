import { Hono } from 'hono';
import { EmailService } from '../services/EmailService';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const contact = new Hono();

// Send contact email
contact.post('/', rateLimitMiddleware('contact'), async (c) => {
  try {
    const body = await c.req.json();
    const result = await EmailService.sendContactEmail(body);
    
    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('Error sending contact email:', error);
    return c.json({
      success: false,
      message: 'Failed to send email. Please try again later.'
    }, 500);
  }
});

export default contact;
