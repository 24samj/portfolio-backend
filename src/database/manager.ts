import { MongoClient } from 'mongodb';

class DatabaseManager {
  private static instance: DatabaseManager;
  private client: MongoClient | null = null;
  private isConnected = false;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async connect(): Promise<boolean> {
    try {
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        throw new Error('MONGODB_URI environment variable is not set');
      }
      
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.isConnected = true;
      console.log('Connected to MongoDB successfully');
      return true;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.isConnected = false;
      console.log('MongoDB connection closed');
    }
  }

  getClient(): MongoClient | null {
    return this.client;
  }

  isConnectedToDatabase(): boolean {
    return this.isConnected && this.client !== null;
  }
}

export const dbManager = DatabaseManager.getInstance();
