import app from "./app";

// Note: MongoDB connection is established lazily on first request
// Cloudflare Workers don't allow async operations in global scope
// Connection will be handled by request handlers when needed

export default app;
