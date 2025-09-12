import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let database: Db | null = null;

/**
 * Get database connection with caching
 * Reuses existing connection if available
 */
export async function getDatabase(): Promise<Db> {
  if (database) {
    return database;
  }

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Create new client if none exists
    if (!client) {
      client = new MongoClient(uri);
      await client.connect();
      console.log('Connected to MongoDB successfully');
    }

    // Get database (you can change 'portfolio' to your actual database name)
    database = client.db('portfolio');
    return database;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw new Error('Database connection failed');
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    database = null;
    console.log('MongoDB connection closed');
  }
}
