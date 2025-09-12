import { Hono } from 'hono';
import { MongoClient } from 'mongodb';

const health = new Hono();

// MongoDB connection reference
let mongoClient: MongoClient | null = null;

// Set MongoDB client reference
export const setMongoClient = (client: MongoClient | null) => {
  mongoClient = client;
};

// Health check endpoint
health.get('/', async (c) => {
  try {
    const isMongoConnected = mongoClient ? await mongoClient.db().admin().ping() : false;
    
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: isMongoConnected ? 'connected' : 'disconnected'
      }
    };
    
    return c.json(healthStatus, isMongoConnected ? 200 : 503);
  } catch (error) {
    return c.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      services: {
        mongodb: 'error'
      }
    }, 503);
  }
});

export default health;
