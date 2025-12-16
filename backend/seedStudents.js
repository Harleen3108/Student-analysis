import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedIndianStudents } from './src/utils/seedIndianStudents.js';
import logger from './src/utils/logger.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    logger.info('\n🌱 Starting to seed Indian students...\n');
    
    await seedIndianStudents();
    
    logger.info('\n✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
};

main();
