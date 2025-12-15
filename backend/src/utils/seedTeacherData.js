// backend/src/utils/seedTeacherData.js
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import AcademicPerformance from '../models/AcademicPerformance.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Seed teacher data
const seedTeacherData = async () => {
  try {
    console.log('🌱 Starting teacher data seed...\n');

    // 1. Create or Update Teacher User
    console.log('👨‍🏫 Checking/creating teacher user...');
    const hashedPassword = await bcrypt.hash('teacher123', 10);
    
    // First, try to find existing teacher
    let teacher = await User.findOne({ email: 'teacher@school.com' });
    
    if (teacher) {
      console.log('⚠️  Teacher already exists. Updating...');
      // Update existing teacher
      teacher.firstName = 'John';
      teacher.lastName = 'Teacher';
      teacher.phone = '9876543210';
      teacher.password = hashedPassword;
      teacher.role = 'teacher';
      teacher.assignedClasses = ['10A', '10B'];
      teacher.subjects = ['Mathematics', 'Physics'];
      teacher.isActive = true;
      teacher.isEmailVerified = true;
      await teacher.save();
    } else {
      console.log('📝 Creating new teacher...');
      // Create new teacher
      teacher = await User.create({
        firstName: 'John',
        lastName: 'Teacher',
        email: 'teacher@school.com',
        phone: '9876543210',
        password: hashedPassword,
        role: 'teacher',
        assignedClasses: ['10A', '10B'],
        subjects: ['Mathematics', 'Physics'],
        notificationPreferences: {
          email: true,
          sms: true,
          inApp: true,
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          }
        },
        isActive: true,
        isEmailVerified: true
      });
    }
    
    console.log('✅ Teacher ready:', teacher.email);
    console.log('   Password: teacher123');
    console.log('   Assigned Classes:', teacher.assignedClasses);

    // 2. Create Students
    console.log('\n👨‍🎓 Creating students...');
    
    const studentsData = [
      // Class 10A Students
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        rollNumber: 'ST10A001',
        admissionNumber: 'ADM10A001',
        section: '10A',
        dateOfBirth: new Date('2008-05-15'),
        gender: 'Female',
        dateOfAdmission: new Date('2024-01-01'),
        address: {
          street: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          fullAddress: '123 Main St, Mumbai, Maharashtra - 400001'
        },
        email: 'alice@school.com',
        phone: '9876543210',
        father: {
          name: 'Mr. Johnson',
          phone: '9876543211',
          email: 'johnson@email.com',
          occupation: 'Business',
          education: 'Graduate',
          income: 50000
        },
        mother: {
          name: 'Mrs. Johnson',
          phone: '9876543212',
          email: 'mrsjohnson@email.com',
          occupation: 'Teacher',
          education: 'Post Graduate',
          income: 30000
        },
        siblings: { count: 1, inSchool: 1 },
        familyIncomeLevel: 'Middle Income',
        distanceFromSchool: 5,
        transportationMode: 'School Bus',
        attendancePercentage: 85,
        totalDaysPresent: 170,
        totalDaysAbsent: 30,
        consecutiveAbsences: 0,
        lateComingCount: 5,
        overallPercentage: 75,
        failedSubjectsCount: 0,
        academicTrend: 'Stable',
        riskScore: 35,
        riskLevel: 'Medium',
        riskFactors: {
          attendance: 15,
          academic: 10,
          financial: 5,
          behavioral: 5,
          health: 0,
          distance: 0,
          family: 0
        },
        status: 'Active',
        isActive: true,
        hasHealthIssues: false,
        hasBehavioralIssues: false,
        hasFamilyProblems: false,
        hasEconomicDistress: false,
        previousDropoutAttempts: 0
      },
      {
        firstName: 'Bob',
        lastName: 'Smith',
        rollNumber: 'ST10A002',
        admissionNumber: 'ADM10A002',
        section: '10A',
        dateOfBirth: new Date('2008-08-20'),
        gender: 'Male',
        dateOfAdmission: new Date('2024-01-01'),
        address: {
          street: '456 Oak Ave',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400002',
          fullAddress: '456 Oak Ave, Mumbai, Maharashtra - 400002'
        },
        email: 'bob@school.com',
        phone: '9876543220',
        father: {
          name: 'Mr. Smith',
          phone: '9876543221',
          email: 'smith@email.com',
          occupation: 'Driver',
          education: 'Secondary',
          income: 25000
        },
        mother: {
          name: 'Mrs. Smith',
          phone: '9876543222',
          email: 'mrssmith@email.com',
          occupation: 'Housewife',
          education: 'Primary',
          income: 0
        },
        siblings: { count: 2, inSchool: 2 },
        familyIncomeLevel: 'Low Income',
        distanceFromSchool: 8,
        transportationMode: 'Public Transport',
        attendancePercentage: 60,
        totalDaysPresent: 120,
        totalDaysAbsent: 80,
        consecutiveAbsences: 3,
        lateComingCount: 15,
        overallPercentage: 45,
        failedSubjectsCount: 2,
        academicTrend: 'Declining',
        riskScore: 65,
        riskLevel: 'High',
        riskFactors: {
          attendance: 25,
          academic: 20,
          financial: 10,
          behavioral: 5,
          health: 0,
          distance: 5,
          family: 0
        },
        status: 'At Risk',
        isActive: true,
        hasActiveIntervention: true,
        interventionCount: 2,
        hasHealthIssues: false,
        hasBehavioralIssues: true,
        hasFamilyProblems: false,
        hasEconomicDistress: true,
        previousDropoutAttempts: 0
      },
      {
        firstName: 'Charlie',
        lastName: 'Brown',
        rollNumber: 'ST10A003',
        admissionNumber: 'ADM10A003',
        section: '10A',
        dateOfBirth: new Date('2008-03-10'),
        gender: 'Male',
        dateOfAdmission: new Date('2024-01-01'),
        address: {
          street: '789 Pine Rd',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400003',
          fullAddress: '789 Pine Rd, Mumbai, Maharashtra - 400003'
        },
        email: 'charlie@school.com',
        phone: '9876543230',
        father: {
          name: 'Mr. Brown',
          phone: '9876543231',
          email: 'brown@email.com',
          occupation: 'Engineer',
          education: 'Post Graduate',
          income: 80000
        },
        mother: {
          name: 'Mrs. Brown',
          phone: '9876543232',
          email: 'mrsbrown@email.com',
          occupation: 'Doctor',
          education: 'Doctorate',
          income: 100000
        },
        siblings: { count: 0, inSchool: 0 },
        familyIncomeLevel: 'High Income',
        distanceFromSchool: 3,
        transportationMode: 'Private Vehicle',
        attendancePercentage: 95,
        totalDaysPresent: 190,
        totalDaysAbsent: 10,
        consecutiveAbsences: 0,
        lateComingCount: 2,
        overallPercentage: 88,
        failedSubjectsCount: 0,
        academicTrend: 'Improving',
        riskScore: 8,
        riskLevel: 'Low',
        riskFactors: {
          attendance: 2,
          academic: 3,
          financial: 0,
          behavioral: 3,
          health: 0,
          distance: 0,
          family: 0
        },
        status: 'Active',
        isActive: true,
        hasHealthIssues: false,
        hasBehavioralIssues: false,
        hasFamilyProblems: false,
        hasEconomicDistress: false,
        previousDropoutAttempts: 0
      },
      // Class 10B Students
      {
        firstName: 'David',
        lastName: 'Wilson',
        rollNumber: 'ST10B001',
        admissionNumber: 'ADM10B001',
        section: '10B',
        dateOfBirth: new Date('2008-11-25'),
        gender: 'Male',
        dateOfAdmission: new Date('2024-01-01'),
        address: {
          street: '321 Elm St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400004',
          fullAddress: '321 Elm St, Mumbai, Maharashtra - 400004'
        },
        email: 'david@school.com',
        phone: '9876543240',
        father: {
          name: 'Mr. Wilson',
          phone: '9876543241',
          email: 'wilson@email.com',
          occupation: 'Laborer',
          education: 'Primary',
          income: 15000
        },
        mother: {
          name: 'Mrs. Wilson',
          phone: '9876543242',
          email: 'mrswilson@email.com',
          occupation: 'Housewife',
          education: 'None',
          income: 0
        },
        siblings: { count: 3, inSchool: 1 },
        familyIncomeLevel: 'Below Poverty Line',
        distanceFromSchool: 12,
        transportationMode: 'Walk',
        attendancePercentage: 50,
        totalDaysPresent: 100,
        totalDaysAbsent: 100,
        consecutiveAbsences: 5,
        lateComingCount: 20,
        overallPercentage: 35,
        failedSubjectsCount: 4,
        academicTrend: 'Declining',
        riskScore: 85,
        riskLevel: 'Critical',
        riskFactors: {
          attendance: 30,
          academic: 25,
          financial: 15,
          behavioral: 5,
          health: 0,
          distance: 10,
          family: 0
        },
        status: 'At Risk',
        isActive: true,
        hasActiveIntervention: true,
        interventionCount: 3,
        hasHealthIssues: false,
        hasBehavioralIssues: true,
        hasFamilyProblems: true,
        hasEconomicDistress: true,
        previousDropoutAttempts: 1
      },
      {
        firstName: 'Emma',
        lastName: 'Davis',
        rollNumber: 'ST10B002',
        admissionNumber: 'ADM10B002',
        section: '10B',
        dateOfBirth: new Date('2008-07-18'),
        gender: 'Female',
        dateOfAdmission: new Date('2024-01-01'),
        address: {
          street: '654 Maple Dr',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400005',
          fullAddress: '654 Maple Dr, Mumbai, Maharashtra - 400005'
        },
        email: 'emma@school.com',
        phone: '9876543250',
        father: {
          name: 'Mr. Davis',
          phone: '9876543251',
          email: 'davis@email.com',
          occupation: 'Accountant',
          education: 'Graduate',
          income: 60000
        },
        mother: {
          name: 'Mrs. Davis',
          phone: '9876543252',
          email: 'mrsdavis@email.com',
          occupation: 'Nurse',
          education: 'Graduate',
          income: 40000
        },
        siblings: { count: 1, inSchool: 0 },
        familyIncomeLevel: 'Middle Income',
        distanceFromSchool: 6,
        transportationMode: 'School Bus',
        attendancePercentage: 78,
        totalDaysPresent: 156,
        totalDaysAbsent: 44,
        consecutiveAbsences: 1,
        lateComingCount: 8,
        overallPercentage: 82,
        failedSubjectsCount: 0,
        academicTrend: 'Stable',
        riskScore: 22,
        riskLevel: 'Low',
        riskFactors: {
          attendance: 8,
          academic: 5,
          financial: 4,
          behavioral: 3,
          health: 0,
          distance: 2,
          family: 0
        },
        status: 'Active',
        isActive: true,
        hasHealthIssues: false,
        hasBehavioralIssues: false,
        hasFamilyProblems: false,
        hasEconomicDistress: false,
        previousDropoutAttempts: 0
      }
    ];

    // Insert students with error handling
    const createdStudents = [];
    for (const studentData of studentsData) {
      try {
        const student = await Student.findOneAndUpdate(
          { rollNumber: studentData.rollNumber },
          studentData,
          { upsert: true, new: true }
        );
        createdStudents.push(student);
        console.log(`✅ Student ready: ${student.firstName} ${student.lastName} (${student.rollNumber})`);
      } catch (error) {
        console.log(`⚠️  Student ${studentData.rollNumber} already exists or error:`, error.message);
        // Try to find existing student
        const existing = await Student.findOne({ rollNumber: studentData.rollNumber });
        if (existing) {
          createdStudents.push(existing);
        }
      }
    }

    console.log(`\n✅ Total students ready: ${createdStudents.length}`);
    console.log('   Class 10A:', createdStudents.filter(s => s.section === '10A').length);
    console.log('   Class 10B:', createdStudents.filter(s => s.section === '10B').length);

    // 3. Create sample attendance records (last 30 days)
    console.log('\n📅 Creating attendance records...');
    const today = new Date();
    let attendanceCount = 0;

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const student of createdStudents) {
        try {
          // Check if attendance already exists
          const existing = await Attendance.findOne({ 
            student: student._id, 
            date: {
              $gte: date,
              $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
            }
          });

          if (!existing) {
            // Randomly mark attendance based on student's attendance percentage
            const randomValue = Math.random() * 100;
            let status = 'Present';
            
            if (randomValue > student.attendancePercentage) {
              status = randomValue > student.attendancePercentage + 10 ? 'Absent' : 'Late';
            }

            await Attendance.create({
              student: student._id,
              date,
              status,
              timeIn: status !== 'Absent' ? date : null,
              lateMinutes: status === 'Late' ? Math.floor(Math.random() * 30) + 10 : 0,
              markedBy: teacher._id
            });
            attendanceCount++;
          }
        } catch (error) {
          // Skip if duplicate
          if (error.code !== 11000) {
            console.log(`⚠️  Error creating attendance for ${student.rollNumber}:`, error.message);
          }
        }
      }
    }
    console.log(`✅ Attendance records created/verified: ${attendanceCount}`);

    // 4. Create sample academic performance records
    console.log('\n📚 Creating academic performance records...');
    let performanceCount = 0;

    const examTypes = ['Monthly Test', 'Unit Test', 'Mid Term'];
    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'English', 'Hindi'];

    for (const student of createdStudents) {
      for (let i = 0; i < 3; i++) {
        try {
          const examDate = new Date(today);
          examDate.setMonth(examDate.getMonth() - i - 1);
          
          // Check if performance record already exists
          const existing = await AcademicPerformance.findOne({
            student: student._id,
            examType: examTypes[i],
            examDate: {
              $gte: new Date(examDate.getFullYear(), examDate.getMonth(), 1),
              $lt: new Date(examDate.getFullYear(), examDate.getMonth() + 1, 1)
            }
          });

          if (!existing) {
            const subjectScores = subjects.map(subject => {
              const baseMarks = student.overallPercentage;
              const variance = (Math.random() - 0.5) * 20;
              const obtainedMarks = Math.max(0, Math.min(100, baseMarks + variance));
              
              return {
                name: subject,
                maxMarks: 100,
                obtainedMarks: Math.round(obtainedMarks),
                percentage: Math.round(obtainedMarks),
                isPassing: obtainedMarks >= 40
              };
            });

            const totalObtained = subjectScores.reduce((sum, s) => sum + s.obtainedMarks, 0);
            const totalMax = subjectScores.length * 100;

            await AcademicPerformance.create({
              student: student._id,
              teacher: teacher._id,
              class: student.section,
              examType: examTypes[i],
              examDate,
              subjects: subjectScores,
              overallMarks: {
                total: totalMax,
                obtained: totalObtained,
                percentage: Math.round((totalObtained / totalMax) * 100)
              }
            });
            performanceCount++;
          }
        } catch (error) {
          // Skip if duplicate or error
          console.log(`⚠️  Performance record may already exist for ${student.rollNumber}`);
        }
      }
    }
    console.log(`✅ Academic performance records created/verified: ${performanceCount}`);

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Teacher: ${teacher.email} (Password: teacher123)`);
    console.log(`   Students: ${createdStudents.length}`);
    console.log(`   Attendance Records: ${attendanceCount} new`);
    console.log(`   Performance Records: ${performanceCount} new`);
    console.log('\n✅ You can now login and use the teacher panel!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
};

// Run the seed
const run = async () => {
  try {
    await connectDB();
    await seedTeacherData();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
};

run();