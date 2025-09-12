import { Hono } from 'hono'
import { MongoClient } from 'mongodb'

const app = new Hono()

// MongoDB connection
let mongoClient: MongoClient | null = null

// Initialize MongoDB connection
async function connectToMongoDB() {
  try {
    const uri = process.env.MONGODB_URI
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set')
    }
    
    mongoClient = new MongoClient(uri)
    await mongoClient.connect()
    console.log('Connected to MongoDB successfully')
    return true
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error)
    return false
  }
}

// Health check endpoint
app.get('/health', async (c) => {
  try {
    const isMongoConnected = mongoClient ? await mongoClient.db().admin().ping() : false
    
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: isMongoConnected ? 'connected' : 'disconnected'
      }
    }
    
    return c.json(healthStatus, isMongoConnected ? 200 : 503)
  } catch (error) {
    return c.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      services: {
        mongodb: 'error'
      }
    }, 503)
  }
})

// Root endpoint
app.get('/', (c) => {
  return c.text('Portfolio Backend API - Use /health for health check')
})

// Initialize MongoDB connection on startup
connectToMongoDB()

export default app
