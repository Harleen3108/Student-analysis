import mongoose from 'mongoose';
import User from '../models/User.js';
import Student from '../models/Student.js';
import logger from './logger.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Quick diagnostic script to check a specific parent account
 * Usage: node src/utils/checkParentAccount.js yukeshu74@gmail.com
 */

const checkParentAccount = async (email) => {
  try {
    if (!email) {
      console.log('❌ Please provide parent email as argument');
      console.log('Usage: node src/utils/checkParentAccount.js parent@email.com');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('✅ Connected to MongoDB');

    // Find parent account
    const parent = await User.findOne({ 
      email: email.toLowerCase() 
    }).lean();

    if (!parent) {
      console.log(`\n❌ No account found for email: ${email}`);
      console.log('\nSearching for similar emails...');
      
      const similarUsers = await User.find({
        email: { $regex: email.split('@')[0], $options: 'i' }
      }).select('email role').lean();
      
      if (similarUsers.length > 0) {
        console.log('\n📧 Similar accounts found:');
        similarUsers.forEach(u => {
          console.log(`  - ${u.email} (${u.role})`);
        });
      }
      
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('\n👤 Parent Account Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${parent.email}`);
    console.log(`Name: ${parent.firstName} ${parent.lastName}`);
    console.log(`Role: ${parent.role}`);
    console.log(`Active: ${parent.isActive}`);
    console.log(`Children Count: ${parent.children?.length || 0}`);
    
    if (parent.children && parent.children.length > 0) {
      console.log(`\n👶 Linked Children (${parent.children.length}):`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      for (const childId of parent.children) {
        const student = await Student.findById(childId)
          .select('firstName lastName rollNumber section isActive')
          .lean();
        
        if (student) {
          console.log(`  ✅ ${student.firstName} ${student.lastName}`);
          console.log(`     Roll: ${student.rollNumber} | Class: ${student.section}`);
          console.log(`     Active: ${student.isActive !== false ? 'Yes' : 'No'}`);
          console.log(`     ID: ${student._id}`);
        } else {
          console.log(`  ❌ Student not found (ID: ${childId})`);
        }
      }
    } else {
      console.log('\n❌ No children linked to this parent account!');
      console.log('\n🔍 Searching for students with this parent email...');
      
      const students = await Student.find({
        $or: [
          { 'father.email': email.toLowerCase() },
          { 'mother.email': email.toLowerCase() }
        ],
        isActive: { $ne: false }
      }).select('firstName lastName rollNumber section father mother').lean();
      
      if (students.length > 0) {
        console.log(`\n📚 Found ${students.length} student(s) with this parent email:`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        students.forEach(student => {
          console.log(`  📖 ${student.firstName} ${student.lastName}`);
          console.log(`     Roll: ${student.rollNumber} | Class: ${student.section}`);
          console.log(`     ID: ${student._id}`);
          console.log(`     Father Email: ${student.father?.email || 'N/A'}`);
          console.log(`     Mother Email: ${student.mother?.email || 'N/A'}`);
        });
        
        console.log('\n💡 FIX: Run this command to link students to parent:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('node src/utils/linkParentsToStudents.js');
        console.log('\nOR manually in MongoDB:');
        students.forEach(student => {
          console.log(`db.users.updateOne({ email: "${email.toLowerCase()}" }, { $addToSet: { children: ObjectId("${student._id}") } })`);
        });
      } else {
        console.log('\n❌ No students found with this parent email');
        console.log('\n💡 Make sure students have parent email in their records:');
        console.log('   - father.email or mother.email should match parent account email');
      }
    }

    await mongoose.connection.close();
    logger.info('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    logger.error('❌ Script error:', error);
    process.exit(1);
  }
};

// Get email from command line argument
const email = process.argv[2];
checkParentAccount(email);
