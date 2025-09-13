import app from "./app";
import { dbManager } from "./database/manager";
import { setMongoClient } from "./routes/health";

// Initialize MongoDB connection on startup
async function initializeApp() {
  try {
    const connected = await dbManager.connect();
    if (connected) {
      setMongoClient(dbManager.getClient());
    }
  } catch (error) {
    console.error("Failed to initialize app:", error);
  }
}

// Initialize the application
initializeApp();

export default app;
