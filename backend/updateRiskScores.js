import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './src/models/Student.js';
import { calculateRiskScore } from './src/services/riskCalculator.js';
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

// Update risk scores for all students
const updateAllRiskScores = async () => {
  try {
    const students = await Student.find({ isActive: true });
    logger.info(`\n📊 Found ${students.length} active students\n`);

    let updated = 0;
    let failed = 0;

    for (const student of students) {
      try {
        logger.info(`Processing: ${student.rollNumber} - ${student.firstName} ${student.lastName}`);
        
        // Calculate risk score
        const riskData = await calculateRiskScore(student._id);
        
        // Determine risk level based on score
        let riskLevel = 'Low';
        if (riskData.totalRiskScore >= 70) {
          riskLevel = 'High';
        } else if (riskData.totalRiskScore >= 40) {
          riskLevel = 'Medium';
        }

        // Update student
        student.riskScore = riskData.totalRiskScore;
        student.riskLevel = riskLevel;
        student.riskFactors = riskData.factors;
        await student.save();

        logger.info(`✅ Updated: Risk Score = ${riskData.totalRiskScore}, Level = ${riskLevel}`);
        updated++;
      } catch (error) {
        logger.error(`❌ Failed to update ${student.rollNumber}:`, error.message);
        failed++;
      }
    }

    logger.info(`\n🎉 Update Complete!`);
    logger.info(`✅ Successfully updated: ${updated}`);
    logger.info(`❌ Failed: ${failed}`);
    
    // Show distribution
    const distribution = await Student.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    logger.info(`\n📊 Risk Level Distribution:`);
    distribution.forEach(item => {
      logger.info(`   ${item._id}: ${item.count} students`);
    });

  } catch (error) {
    logger.error('❌ Error updating risk scores:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    logger.info('\n🔄 Starting risk score update for all students...\n');
    
    await updateAllRiskScores();
    
    logger.info('\n✅ All risk scores updated successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('\n❌ Update failed:', error);
    process.exit(1);
  }
};

main();
