import { MongoClient, Db } from "mongodb";

export async function withMongo<T>(
  uri: string,
  dbName: string,
  fn: (db: Db) => Promise<T>
): Promise<T> {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 10000,
    maxPoolSize: 1,
    minPoolSize: 0,
    retryWrites: false,
    retryReads: false,
  });
  try {
    await client.connect();
    return await fn(client.db(dbName));
  } finally {
    await client.close();
  }
}
