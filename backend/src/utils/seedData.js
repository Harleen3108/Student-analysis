import Student from '../models/Student.js';
import Class from '../models/Class.js';
import logger from './logger.js';

// Seed initial data
export const seedInitialData = async () => {
  try {
    // Check if data already exists
    const existingStudents = await Student.countDocuments();
    const existingClasses = await Class.countDocuments();
    
    logger.info(`Existing students: ${existingStudents}, Existing classes: ${existingClasses}`);
    
    if (existingStudents > 0) {
      logger.info('Students already exist, skipping student seeding...');
    }
    
    if (existingClasses > 0) {
      logger.info('Classes already exist, skipping class seeding...');
    }

    // Create classes first
    const classes = [
      { name: '9A', section: 'A', grade: 9 },
      { name: '9B', section: 'B', grade: 9 },
      { name: '10A', section: 'A', grade: 10 },
      { name: '10B', section: 'B', grade: 10 },
      { name: '11A', section: 'A', grade: 11 },
      { name: '11B', section: 'B', grade: 11 },
    ];

    // Insert classes one by one to handle duplicates
    const createdClasses = [];
    if (existingClasses === 0) {
      for (const classData of classes) {
        try {
          const existingClass = await Class.findOne({ name: classData.name, section: classData.section });
          if (!existingClass) {
            const newClass = await Class.create(classData);
            createdClasses.push(newClass);
            logger.info(`Created class: ${classData.name}`);
          }
        } catch (error) {
          logger.warn(`Class ${classData.name} creation failed:`, error.message);
        }
      }
    }
    logger.info(`Created ${createdClasses.length} new classes`);

    // Create sample students
    const sampleStudents = [
      {
        firstName: 'John',
        lastName: 'Doe',
        rollNumber: 'ST001',
        admissionNumber: 'ADM001',
        section: '10A',
        dateOfBirth: new Date('2008-05-15'),
        gender: 'Male',
        email: 'john.doe@school.com',
        phone: '9876543210',
        address: {
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          fullAddress: '123 Main Street, Mumbai'
        },
        father: {
          name: 'Robert Doe',
          phone: '9876543210',
          email: 'robert.doe@email.com',
          occupation: 'Engineer',
          education: 'Graduate'
        },
        mother: {
          name: 'Mary Doe',
          phone: '9876543211',
          email: 'mary.doe@email.com',
          occupation: 'Teacher',
          education: 'Graduate'
        },
        familyIncomeLevel: 'Middle Income',
        distanceFromSchool: 3,
        transportationMode: 'School Bus',
        attendancePercentage: 85,
        overallPercentage: 78,
        riskScore: 45,
        riskLevel: 'Medium'
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        rollNumber: 'ST002',
        admissionNumber: 'ADM002',
        section: '10A',
        dateOfBirth: new Date('2008-08-22'),
        gender: 'Female',
        email: 'jane.smith@school.com',
        phone: '9876543211',
        address: {
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400002',
          fullAddress: '456 Oak Avenue, Mumbai'
        },
        father: {
          name: 'James Smith',
          phone: '9876543211',
          email: 'james.smith@email.com',
          occupation: 'Doctor',
          education: 'Post Graduate'
        },
        mother: {
          name: 'Lisa Smith',
          phone: '9876543212',
          email: 'lisa.smith@email.com',
          occupation: 'Nurse',
          education: 'Graduate'
        },
        familyIncomeLevel: 'High Income',
        distanceFromSchool: 2,
        transportationMode: 'Private Vehicle',
        attendancePercentage: 92,
        overallPercentage: 88,
        riskScore: 15,
        riskLevel: 'Low'
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        rollNumber: 'ST003',
        admissionNumber: 'ADM003',
        section: '10B',
        dateOfBirth: new Date('2008-03-10'),
        gender: 'Male',
        email: 'mike.johnson@school.com',
        phone: '9876543212',
        address: {
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400003',
          fullAddress: '789 Pine Street, Mumbai'
        },
        father: {
          name: 'Michael Johnson',
          phone: '9876543212',
          email: 'michael.johnson@email.com',
          occupation: 'Mechanic',
          education: 'Secondary'
        },
        mother: {
          name: 'Sarah Johnson',
          phone: '9876543213',
          email: 'sarah.johnson@email.com',
          occupation: 'Housewife',
          education: 'Primary'
        },
        familyIncomeLevel: 'Low Income',
        distanceFromSchool: 8,
        transportationMode: 'Public Transport',
        attendancePercentage: 65,
        overallPercentage: 55,
        riskScore: 75,
        riskLevel: 'High'
      },
      {
        firstName: 'Sarah',
        lastName: 'Wilson',
        rollNumber: 'ST004',
        admissionNumber: 'ADM004',
        section: '9B',
        dateOfBirth: new Date('2009-12-05'),
        gender: 'Female',
        email: 'sarah.wilson@school.com',
        phone: '9876543213',
        address: {
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400004',
          fullAddress: '321 Elm Road, Mumbai'
        },
        father: {
          name: 'David Wilson',
          phone: '9876543213',
          email: 'david.wilson@email.com',
          occupation: 'Farmer',
          education: 'Primary'
        },
        mother: {
          name: 'Emma Wilson',
          phone: '9876543214',
          email: 'emma.wilson@email.com',
          occupation: 'Housewife',
          education: 'Secondary'
        },
        familyIncomeLevel: 'Below Poverty Line',
        distanceFromSchool: 12,
        transportationMode: 'Walk',
        attendancePercentage: 70,
        overallPercentage: 60,
        riskScore: 72,
        riskLevel: 'High'
      },
      {
        firstName: 'Alex',
        lastName: 'Brown',
        rollNumber: 'ST005',
        admissionNumber: 'ADM005',
        section: '11A',
        dateOfBirth: new Date('2007-07-18'),
        gender: 'Male',
        email: 'alex.brown@school.com',
        phone: '9876543214',
        address: {
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400005',
          fullAddress: '654 Maple Lane, Mumbai'
        },
        father: {
          name: 'Andrew Brown',
          phone: '9876543214',
          email: 'andrew.brown@email.com',
          occupation: 'Business Owner',
          education: 'Graduate'
        },
        mother: {
          name: 'Jennifer Brown',
          phone: '9876543215',
          email: 'jennifer.brown@email.com',
          occupation: 'Accountant',
          education: 'Graduate'
        },
        familyIncomeLevel: 'High Income',
        distanceFromSchool: 4,
        transportationMode: 'Private Vehicle',
        attendancePercentage: 88,
        overallPercentage: 82,
        riskScore: 25,
        riskLevel: 'Low'
      }
    ];

    // Insert students one by one to handle duplicates
    const createdStudents = [];
    if (existingStudents === 0) {
      for (const studentData of sampleStudents) {
        try {
          const existingStudent = await Student.findOne({ rollNumber: studentData.rollNumber });
          if (!existingStudent) {
            const newStudent = await Student.create(studentData);
            createdStudents.push(newStudent);
            logger.info(`Created student: ${studentData.rollNumber} - ${studentData.firstName} ${studentData.lastName}`);
          }
        } catch (error) {
          logger.error(`Student ${studentData.rollNumber} creation failed:`, error);
        }
      }
    }
    logger.info(`Created ${createdStudents.length} new students`);

    logger.info('✅ Seed data created successfully!');
    return { classes: createdClasses, students: createdStudents };
  } catch (error) {
    logger.error('Error seeding data:', error);
    throw error;
  }
};