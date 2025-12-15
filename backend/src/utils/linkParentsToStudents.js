import mongoose from 'mongoose';
import Student from '../models/Student.js';
import User from '../models/User.js';
import logger from './logger.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Script to link existing students to their parent accounts
 * Run this to fix parent accounts that don't have children linked
 */

const linkParentsToStudents = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('✅ Connected to MongoDB');

    // Get all students
    const students = await Student.find({ isActive: { $ne: false } })
      .select('firstName lastName rollNumber father mother')
      .lean();

    logger.info(`📊 Found ${students.length} active students`);

    let linkedCount = 0;
    let createdCount = 0;
    let errorCount = 0;

    for (const student of students) {
      try {
        // Check if student has parent email
        const parentEmail = student.father?.email || student.mother?.email;
        
        if (!parentEmail) {
          logger.warn(`⚠️ Student ${student.rollNumber} has no parent email`);
          continue;
        }

        // Find parent account
        let parent = await User.findOne({ 
          email: parentEmail.toLowerCase(),
          role: 'parent'
        });

        if (parent) {
          // Check if student is already linked
          if (!parent.children.some(id => id.toString() === student._id.toString())) {
            parent.children.push(student._id);
            await parent.save();
            linkedCount++;
            logger.info(`✅ Linked student ${student.rollNumber} to existing parent ${parentEmail}`);
          } else {
            logger.info(`ℹ️ Student ${student.rollNumber} already linked to parent ${parentEmail}`);
          }
        } else {
          // Create parent account if it doesn't exist
          const parentPassword = `${student.firstName}2025`;
          
          const parentData = {
            firstName: student.father?.name?.split(' ')[0] || 'Parent',
            lastName: student.father?.name?.split(' ').slice(1).join(' ') || student.lastName,
            email: parentEmail.toLowerCase(),
            phone: student.father?.phone || student.mother?.phone || '0000000000',
            password: parentPassword,
            role: 'parent',
            children: [student._id],
            isActive: true,
            notificationPreferences: {
              email: true,
              sms: true,
              inApp: true
            }
          };

          parent = new User(parentData);
          await parent.save();
          createdCount++;
          logger.info(`✅ Created parent account for ${parentEmail} with password: ${parentPassword}`);
        }
      } catch (error) {
        errorCount++;
        logger.error(`❌ Error processing student ${student.rollNumber}:`, error.message);
      }
    }

    logger.info('\n📊 Summary:');
    logger.info(`✅ Students linked to existing parents: ${linkedCount}`);
    logger.info(`✅ New parent accounts created: ${createdCount}`);
    logger.info(`❌ Errors: ${errorCount}`);
    logger.info(`📝 Total students processed: ${students.length}`);

    // Verify results
    const parentsWithChildren = await User.countDocuments({
      role: 'parent',
      children: { $exists: true, $not: { $size: 0 } }
    });
    logger.info(`\n👨‍👩‍👧‍👦 Total parents with children: ${parentsWithChildren}`);

    await mongoose.connection.close();
    logger.info('✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    logger.error('❌ Script error:', error);
    process.exit(1);
  }
};

// Run the script
linkParentsToStudents();
