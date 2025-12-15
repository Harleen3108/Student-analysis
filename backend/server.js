import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./src/app.js";
import connectDB from "./src/config/database.js";
import { initializeSocket } from "./src/socket/socketHandler.js";
import { startScheduledJobs } from "./src/jobs/scheduledJobs.js";
import { seedInitialData } from "./src/utils/seedData.js";
import logger from "./src/utils/logger.js";

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io (temporarily commented out)
initializeSocket(server);

// Connect to MongoDB and seed data
connectDB().then(async (connection) => {
  if (connection) {
    try {
      await seedInitialData();
    } catch (error) {
      logger.error('Failed to seed initial data:', error);
      // Don't crash the server, just log the error
    }
  } else {
    logger.warn('⚠️ Skipping data seeding due to database connection failure');
  }
}).catch((error) => {
  logger.error('Database connection error:', error);
  logger.warn('⚠️ Server continuing without database connection');
  // Don't crash the server
});

// Start scheduled jobs if enabled
if (process.env.ENABLE_CRON_JOBS === "true") {
  startScheduledJobs();
  logger.info("Scheduled jobs initialized");
}

// Start server
server.listen(PORT, () => {
  logger.info(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
  logger.info(
    `📊 API: http://localhost:${PORT}/api/${process.env.API_VERSION}`
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error("Error:", err);
  console.error("Error name:", err?.name || 'Unknown');
  console.error("Error message:", err?.message || 'No message');
  console.error("Stack trace:", err?.stack || 'No stack trace');
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("👋 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    logger.info("💥 Process terminated!");
  });
});
