import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Attendance from '../models/Attendance.js';
import Grade from '../models/Grade.js';
import logger from './logger.js';

// Seed 15 Indian students with varied data
export const seedIndianStudents = async () => {
  try {
    logger.info('Starting to seed Indian students...');

    // Ensure classes exist
    const classes = await Class.find();
    if (classes.length === 0) {
      logger.error('No classes found. Please seed classes first.');
      return;
    }

    const indianStudents = [
      {
        firstName: 'Aarav',
        lastName: 'Sharma',
        rollNumber: 'ST101',
        admissionNumber: 'ADM101',
        section: '9A',
        dateOfBirth: new Date('2009-01-15'),
        gender: 'Male',
        email: 'aarav.sharma@school.com',
        phone: '9876501234',
        address: {
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
          fullAddress: '45 Connaught Place, Delhi'
        },
        father: {
          name: 'Rajesh Sharma',
          phone: '9876501234',
          email: 'rajesh.sharma@email.com',
          occupation: 'Software Engineer',
          education: 'Post Graduate'
        },
        mother: {
          name: 'Priya Sharma',
          phone: '9876501235',
          email: 'priya.sharma@email.com',
          occupation: 'Teacher',
          education: 'Graduate'
        },
        familyIncomeLevel: 'High Income',
        distanceFromSchool: 3,
        transportationMode: 'School Bus',
        attendancePercentage: 95,
        overallPercentage: 92,
        riskScore: 10,
        riskLevel: 'Low'
      },
      {
        firstName: 'Diya',
        lastName: 'Patel',
        rollNumber: 'ST102',
        admissionNumber: 'ADM102',
        section: '9A',
        dateOfBirth: new Date('2009-03-22'),
        gender: 'Female',
        email: 'diya.patel@school.com',
        phone: '9876502234',
        address: {
          city: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380001',
          fullAddress: '12 Ashram Road, Ahmedabad'
        },
        father: {
          name: 'Kiran Patel',
          phone: '9876502234',
          email: 'kiran.patel@email.com',
          occupation: 'Business Owner',
          education: 'Graduate'
        },
        mother: {
          name: 'Meera Patel',
          phone: '9876502235',
          email: 'meera.patel@email.com',
          occupation: 'Doctor',
          education: 'Post Graduate'
        },
        familyIncomeLevel: 'High Income',
        distanceFromSchool: 2,
        transportationMode: 'Private Vehicle',
        attendancePercentage: 88,
        overallPercentage: 85,
        riskScore: 20,
        riskLevel: 'Low'
      },
      {
        firstName: 'Arjun',
        lastName: 'Kumar',
        rollNumber: 'ST103',
        admissionNumber: 'ADM103',
        section: '9B',
        dateOfBirth: new Date('2009-05-10'),
        gender: 'Male',
        email: 'arjun.kumar@school.com',
        phone: '9876503234',
        address: {
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
          fullAddress: '78 MG Road, Bangalore'
        },
        father: {
          name: 'Suresh Kumar',
          phone: '9876503234',
          email: 'suresh.kumar@email.com',
          occupation: 'Mechanic',
          education: 'Secondary'
        },
        mother: {
          name: 'Lakshmi Kumar',
          phone: '9876503235',
          email: 'lakshmi.kumar@email.com',
          occupation: 'Housewife',
          education: 'Primary'
        },
        familyIncomeLevel: 'Low Income',
        distanceFromSchool: 7,
        transportationMode: 'Public Transport',
        attendancePercentage: 72,
        overallPercentage: 68,
        riskScore: 55,
        riskLevel: 'Medium'
      },
      {
        firstName: 'Ananya',
        lastName: 'Singh',
        rollNumber: 'ST104',
        admissionNumber: 'ADM104',
        section: '10A',
        dateOfBirth: new Date('2008-07-18'),
        gender: 'Female',
        email: 'ananya.singh@school.com',
        phone: '9876504234',
        address: {
          city: 'Lucknow',
          state: 'Uttar Pradesh',
          pincode: '226001',
          fullAddress: '23 Hazratganj, Lucknow'
        },
        father: {
          name: 'Vikram Singh',
          phone: '9876504234',
          email: 'vikram.singh@email.com',
          occupation: 'Government Officer',
          education: 'Graduate'
        },
        mother: {
          name: 'Kavita Singh',
          phone: '9876504235',
          email: 'kavita.singh@email.com',
          occupation: 'Nurse',
          education: 'Graduate'
        },
        familyIncomeLevel: 'Middle Income',
        distanceFromSchool: 4,
        transportationMode: 'School Bus',
        attendancePercentage: 90,
        overallPercentage: 87,
        riskScore: 18,
        riskLevel: 'Low'
      },
      {
        firstName: 'Rohan',
        lastName: 'Verma',
        rollNumber: 'ST105',
        admissionNumber: 'ADM105',
        section: '10A',
        dateOfBirth: new Date('2008-09-25'),
        gender: 'Male',
        email: 'rohan.verma@school.com',
        phone: '9876505234',
        address: {
          city: 'Jaipur',
          state: 'Rajasthan',
          pincode: '302001',
          fullAddress: '56 MI Road, Jaipur'
        },
        father: {
          name: 'Anil Verma',
          phone: '9876505234',
          email: 'anil.verma@email.com',
          occupation: 'Shopkeeper',
          education: 'Secondary'
        },
        mother: {
          name: 'Sunita Verma',
          phone: '9876505235',
          email: 'sunita.verma@email.com',
          occupation: 'Tailor',
          education: 'Primary'
        },
        familyIncomeLevel: 'Low Income',
        distanceFromSchool: 9,
        transportationMode: 'Bicycle',
        attendancePercentage: 65,
        overallPercentage: 58,
        riskScore: 78,
        riskLevel: 'High'
      },
      {
        firstName: 'Ishita',
        lastName: 'Reddy',
        rollNumber: 'ST106',
        admissionNumber: 'ADM106',
        section: '10B',
        dateOfBirth: new Date('2008-11-12'),
        gender: 'Female',
        email: 'ishita.reddy@school.com',
        phone: '9876506234',
        address: {
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500001',
          fullAddress: '89 Banjara Hills, Hyderabad'
        },
        father: {
          name: 'Ramesh Reddy',
          phone: '9876506234',
          email: 'ramesh.reddy@email.com',
          occupation: 'IT Manager',
          education: 'Post Graduate'
        },
        mother: {
          name: 'Swathi Reddy',
          phone: '9876506235',
          email: 'swathi.reddy@email.com',
          occupation: 'Architect',
          education: 'Post Graduate'
        },
        familyIncomeLevel: 'High Income',
        distanceFromSchool: 5,
        transportationMode: 'Private Vehicle',
        attendancePercentage: 93,
        overallPercentage: 90,
        riskScore: 12,
        riskLevel: 'Low'
      },
      {
        firstName: 'Kabir',
        lastName: 'Joshi',
        rollNumber: 'ST107',
        admissionNumber: 'ADM107',
        section: '10B',
        dateOfBirth: new Date('2008-02-08'),
        gender: 'Male',
        email: 'kabir.joshi@school.com',
        phone: '9876507234',
        address: {
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          fullAddress: '34 FC Road, Pune'
        },
        father: {
          name: 'Prakash Joshi',
          phone: '9876507234',
          email: 'prakash.joshi@email.com',
          occupation: 'Farmer',
          education: 'Primary'
        },
        mother: {
          name: 'Asha Joshi',
          phone: '9876507235',
          email: 'asha.joshi@email.com',
          occupation: 'Housewife',
          education: 'Primary'
        },
        familyIncomeLevel: 'Below Poverty Line',
        distanceFromSchool: 15,
        transportationMode: 'Walk',
        attendancePercentage: 58,
        overallPercentage: 52,
        riskScore: 85,
        riskLevel: 'High'
      },
      {
        firstName: 'Saanvi',
        lastName: 'Nair',
        rollNumber: 'ST108',
        admissionNumber: 'ADM108',
        section: '11A',
        dateOfBirth: new Date('2007-04-20'),
        gender: 'Female',
        email: 'saanvi.nair@school.com',
        phone: '9876508234',
        address: {
          city: 'Kochi',
          state: 'Kerala',
          pincode: '682001',
          fullAddress: '67 Marine Drive, Kochi'
        },
        father: {
          name: 'Krishnan Nair',
          phone: '9876508234',
          email: 'krishnan.nair@email.com',
          occupation: 'Bank Manager',
          education: 'Graduate'
        },
        mother: {
          name: 'Radha Nair',
          phone: '9876508235',
          email: 'radha.nair@email.com',
          occupation: 'Professor',
          education: 'Post Graduate'
        },
        familyIncomeLevel: 'Middle Income',
        distanceFromSchool: 6,
        transportationMode: 'School Bus',
        attendancePercentage: 86,
        overallPercentage: 83,
        riskScore: 28,
        riskLevel: 'Low'
      },
      {
        firstName: 'Vihaan',
        lastName: 'Gupta',
        rollNumber: 'ST109',
        admissionNumber: 'ADM109',
        section: '11A',
        dateOfBirth: new Date('2007-06-14'),
        gender: 'Male',
        email: 'vihaan.gupta@school.com',
        phone: '9876509234',
        address: {
          city: 'Kolkata',
          state: 'West Bengal',
          pincode: '700001',
          fullAddress: '91 Park Street, Kolkata'
        },
        father: {
          name: 'Manoj Gupta',
          phone: '9876509234',
          email: 'manoj.gupta@email.com',
          occupation: 'Electrician',
          education: 'Secondary'
        },
        mother: {
          name: 'Pooja Gupta',
          phone: '9876509235',
          email: 'pooja.gupta@email.com',
          occupation: 'Cook',
          education: 'Primary'
        },
        familyIncomeLevel: 'Low Income',
        distanceFromSchool: 10,
        transportationMode: 'Public Transport',
        attendancePercentage: 68,
        overallPercentage: 62,
        riskScore: 68,
        riskLevel: 'High'
      },
      {
        firstName: 'Aisha',
        lastName: 'Khan',
        rollNumber: 'ST110',
        admissionNumber: 'ADM110',
        section: '11B',
        dateOfBirth: new Date('2007-08-30'),
        gender: 'Female',
        email: 'aisha.khan@school.com',
        phone: '9876510234',
        address: {
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          fullAddress: '12 Colaba Causeway, Mumbai'
        },
        father: {
          name: 'Salman Khan',
          phone: '9876510234',
          email: 'salman.khan@email.com',
          occupation: 'Lawyer',
          education: 'Post Graduate'
        },
        mother: {
          name: 'Fatima Khan',
          phone: '9876510235',
          email: 'fatima.khan@email.com',
          occupation: 'Journalist',
          education: 'Graduate'
        },
        familyIncomeLevel: 'High Income',
        distanceFromSchool: 3,
        transportationMode: 'Private Vehicle',
        attendancePercentage: 91,
        overallPercentage: 88,
        riskScore: 15,
        riskLevel: 'Low'
      },
      {
        firstName: 'Advait',
        lastName: 'Desai',
        rollNumber: 'ST111',
        admissionNumber: 'ADM111',
        section: '11B',
        dateOfBirth: new Date('2007-10-05'),
        gender: 'Male',
        email: 'advait.desai@school.com',
        phone: '9876511234',
        address: {
          city: 'Surat',
          state: 'Gujarat',
          pincode: '395001',
          fullAddress: '45 Ring Road, Surat'
        },
        father: {
          name: 'Jayesh Desai',
          phone: '9876511234',
          email: 'jayesh.desai@email.com',
          occupation: 'Textile Merchant',
          education: 'Graduate'
        },
        mother: {
          name: 'Nisha Desai',
          phone: '9876511235',
          email: 'nisha.desai@email.com',
          occupation: 'Designer',
          education: 'Graduate'
        },
        familyIncomeLevel: 'Middle Income',
        distanceFromSchool: 5,
        transportationMode: 'School Bus',
        attendancePercentage: 80,
        overallPercentage: 75,
        riskScore: 42,
        riskLevel: 'Medium'
      },
      {
        firstName: 'Myra',
        lastName: 'Iyer',
        rollNumber: 'ST112',
        admissionNumber: 'ADM112',
        section: '9A',
        dateOfBirth: new Date('2009-12-01'),
        gender: 'Female',
        email: 'myra.iyer@school.com',
        phone: '9876512234',
        address: {
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001',
          fullAddress: '23 T Nagar, Chennai'
        },
        father: {
          name: 'Venkat Iyer',
          phone: '9876512234',
          email: 'venkat.iyer@email.com',
          occupation: 'Accountant',
          education: 'Graduate'
        },
        mother: {
          name: 'Divya Iyer',
          phone: '9876512235',
          email: 'divya.iyer@email.com',
          occupation: 'Music Teacher',
          education: 'Graduate'
        },
        familyIncomeLevel: 'Middle Income',
        distanceFromSchool: 4,
        transportationMode: 'School Bus',
        attendancePercentage: 84,
        overallPercentage: 80,
        riskScore: 35,
        riskLevel: 'Medium'
      },
      {
        firstName: 'Reyansh',
        lastName: 'Malhotra',
        rollNumber: 'ST113',
        admissionNumber: 'ADM113',
        section: '9B',
        dateOfBirth: new Date('2009-02-17'),
        gender: 'Male',
        email: 'reyansh.malhotra@school.com',
        phone: '9876513234',
        address: {
          city: 'Chandigarh',
          state: 'Chandigarh',
          pincode: '160001',
          fullAddress: '78 Sector 17, Chandigarh'
        },
        father: {
          name: 'Rohit Malhotra',
          phone: '9876513234',
          email: 'rohit.malhotra@email.com',
          occupation: 'Businessman',
          education: 'Graduate'
        },
        mother: {
          name: 'Anjali Malhotra',
          phone: '9876513235',
          email: 'anjali.malhotra@email.com',
          occupation: 'Fashion Designer',
          education: 'Graduate'
        },
        familyIncomeLevel: 'High Income',
        distanceFromSchool: 2,
        transportationMode: 'Private Vehicle',
        attendancePercentage: 89,
        overallPercentage: 86,
        riskScore: 22,
        riskLevel: 'Low'
      },
      {
        firstName: 'Kiara',
        lastName: 'Rao',
        rollNumber: 'ST114',
        admissionNumber: 'ADM114',
        section: '10A',
        dateOfBirth: new Date('2008-04-28'),
        gender: 'Female',
        email: 'kiara.rao@school.com',
        phone: '9876514234',
        address: {
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          pincode: '530001',
          fullAddress: '56 Beach Road, Visakhapatnam'
        },
        father: {
          name: 'Srinivas Rao',
          phone: '9876514234',
          email: 'srinivas.rao@email.com',
          occupation: 'Fisherman',
          education: 'Primary'
        },
        mother: {
          name: 'Padma Rao',
          phone: '9876514235',
          email: 'padma.rao@email.com',
          occupation: 'Housewife',
          education: 'Primary'
        },
        familyIncomeLevel: 'Below Poverty Line',
        distanceFromSchool: 12,
        transportationMode: 'Walk',
        attendancePercentage: 62,
        overallPercentage: 55,
        riskScore: 82,
        riskLevel: 'High'
      },
      {
        firstName: 'Ayaan',
        lastName: 'Mehta',
        rollNumber: 'ST115',
        admissionNumber: 'ADM115',
        section: '10B',
        dateOfBirth: new Date('2008-06-09'),
        gender: 'Male',
        email: 'ayaan.mehta@school.com',
        phone: '9876515234',
        address: {
          city: 'Indore',
          state: 'Madhya Pradesh',
          pincode: '452001',
          fullAddress: '34 Rajwada, Indore'
        },
        father: {
          name: 'Nitin Mehta',
          phone: '9876515234',
          email: 'nitin.mehta@email.com',
          occupation: 'Pharmacist',
          education: 'Graduate'
        },
        mother: {
          name: 'Ritu Mehta',
          phone: '9876515235',
          email: 'ritu.mehta@email.com',
          occupation: 'Librarian',
          education: 'Graduate'
        },
        familyIncomeLevel: 'Middle Income',
        distanceFromSchool: 6,
        transportationMode: 'School Bus',
        attendancePercentage: 78,
        overallPercentage: 72,
        riskScore: 48,
        riskLevel: 'Medium'
      }
    ];

    // Insert students
    const createdStudents = [];
    for (const studentData of indianStudents) {
      try {
        const existingStudent = await Student.findOne({ rollNumber: studentData.rollNumber });
        if (!existingStudent) {
          const newStudent = await Student.create(studentData);
          createdStudents.push(newStudent);
          logger.info(`✅ Created student: ${studentData.rollNumber} - ${studentData.firstName} ${studentData.lastName}`);
        } else {
          logger.info(`⚠️  Student ${studentData.rollNumber} already exists, skipping...`);
        }
      } catch (error) {
        logger.error(`❌ Failed to create student ${studentData.rollNumber}:`, error.message);
      }
    }

    logger.info(`\n🎉 Successfully created ${createdStudents.length} Indian students!`);
    logger.info(`\nRisk Level Distribution:`);
    logger.info(`- Low Risk: ${createdStudents.filter(s => s.riskLevel === 'Low').length}`);
    logger.info(`- Medium Risk: ${createdStudents.filter(s => s.riskLevel === 'Medium').length}`);
    logger.info(`- High Risk: ${createdStudents.filter(s => s.riskLevel === 'High').length}`);

    return createdStudents;
  } catch (error) {
    logger.error('❌ Error seeding Indian students:', error);
    throw error;
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  import('../config/database.js').then(async () => {
    await seedIndianStudents();
    process.exit(0);
  });
}
