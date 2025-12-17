import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      logger.error("❌ MongoDB connection failed: MONGODB_URI is not set");
      logger.warn("⚠️ Please add MONGODB_URI to your environment (.env)");
      return null;
    }

    const conn = await mongoose.connect(uri, {
      // No need for useNewUrlParser and useUnifiedTopology in mongoose 6+
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.info(`📦 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    logger.error(`❌ MongoDB connection failed: ${error.message}`);
    logger.warn(`⚠️ Server will continue running without database connection`);
    logger.warn(`🔧 Please check your MongoDB Atlas IP whitelist or connection string`);
    // Don't exit the process, let the server run for frontend testing
    return null;
  }
};

export default connectDB;
