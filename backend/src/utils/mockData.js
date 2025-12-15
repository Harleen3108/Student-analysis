// Mock data for when MongoDB is not available
export const mockUsers = [
  {
    _id: '693d41a452614fcbe272ac48',
    firstName: 'John',
    lastName: 'Teacher',
    email: 'teacher@school.com',
    role: 'teacher',
    assignedClasses: ['10A', '10B'],
    subjects: ['Mathematics', 'Physics'],
    isActive: true
  },
  {
    _id: '693d41a452614fcbe272ac49',
    firstName: 'Harleen',
    lastName: 'Kaur',
    email: 'harleen@gmail.com',
    role: 'teacher',
    assignedClasses: ['11A', '11B'],
    subjects: ['Chemistry', 'Biology'],
    isActive: true
  },
  {
    _id: '693d41a452614fcbe272ac50',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@school.com',
    role: 'admin',
    isActive: true
  }
];

export const mockStudents = [
  // Class 10A students
  {
    _id: '693d1965221a9c946b0a4e48',
    firstName: 'Alice',
    lastName: 'Johnson',
    rollNumber: 'ST10A001',
    admissionNumber: 'ADM10A001',
    section: '10A',
    attendancePercentage: 85,
    overallPercentage: 75,
    riskLevel: 'Medium',
    riskScore: 25,
    email: 'alice@school.com',
    phone: '9876543210',
    status: 'Active',
    isActive: true
  },
  {
    _id: '693d1965221a9c946b0a4e49',
    firstName: 'Bob',
    lastName: 'Smith',
    rollNumber: 'ST10A002',
    admissionNumber: 'ADM10A002',
    section: '10A',
    attendancePercentage: 60,
    overallPercentage: 45,
    riskLevel: 'High',
    riskScore: 55,
    email: 'bob@school.com',
    phone: '9876543211',
    status: 'Active',
    isActive: true
  },
  {
    _id: '693d1965221a9c946b0a4e50',
    firstName: 'Charlie',
    lastName: 'Brown',
    rollNumber: 'ST10A003',
    admissionNumber: 'ADM10A003',
    section: '10A',
    attendancePercentage: 95,
    overallPercentage: 88,
    riskLevel: 'Low',
    riskScore: 5,
    email: 'charlie@school.com',
    phone: '9876543212',
    status: 'Active',
    isActive: true
  },
  // Class 10B students
  {
    _id: '693d1965221a9c946b0a4e51',
    firstName: 'David',
    lastName: 'Wilson',
    rollNumber: 'ST10B001',
    admissionNumber: 'ADM10B001',
    section: '10B',
    attendancePercentage: 50,
    overallPercentage: 35,
    riskLevel: 'Critical',
    riskScore: 65,
    email: 'david@school.com',
    phone: '9876543213',
    status: 'Active',
    isActive: true
  },
  {
    _id: '693d1965221a9c946b0a4e52',
    firstName: 'Emma',
    lastName: 'Davis',
    rollNumber: 'ST10B002',
    admissionNumber: 'ADM10B002',
    section: '10B',
    attendancePercentage: 78,
    overallPercentage: 82,
    riskLevel: 'Low',
    riskScore: 18,
    email: 'emma@school.com',
    phone: '9876543214',
    status: 'Active',
    isActive: true
  },
  // Class 11A students
  {
    _id: '693d1965221a9c946b0a4e53',
    firstName: 'Sarah',
    lastName: 'Wilson',
    rollNumber: 'ST11A001',
    admissionNumber: 'ADM11A001',
    section: '11A',
    attendancePercentage: 92,
    overallPercentage: 85,
    riskLevel: 'Low',
    riskScore: 8,
    email: 'sarah@school.com',
    phone: '9876543215',
    status: 'Active',
    isActive: true
  },
  {
    _id: '693d1965221a9c946b0a4e54',
    firstName: 'Michael',
    lastName: 'Brown',
    rollNumber: 'ST11A002',
    admissionNumber: 'ADM11A002',
    section: '11A',
    attendancePercentage: 65,
    overallPercentage: 55,
    riskLevel: 'High',
    riskScore: 45,
    email: 'michael@school.com',
    phone: '9876543216',
    status: 'Active',
    isActive: true
  },
  // Class 11B students
  {
    _id: '693d1965221a9c946b0a4e55',
    firstName: 'Emma',
    lastName: 'Davis',
    rollNumber: 'ST11B001',
    admissionNumber: 'ADM11B001',
    section: '11B',
    attendancePercentage: 88,
    overallPercentage: 78,
    riskLevel: 'Medium',
    riskScore: 22,
    email: 'emma2@school.com',
    phone: '9876543217',
    status: 'Active',
    isActive: true
  },
  {
    _id: '693d1965221a9c946b0a4e56',
    firstName: 'James',
    lastName: 'Miller',
    rollNumber: 'ST11B002',
    admissionNumber: 'ADM11B002',
    section: '11B',
    attendancePercentage: 45,
    overallPercentage: 30,
    riskLevel: 'Critical',
    riskScore: 70,
    email: 'james@school.com',
    phone: '9876543218',
    status: 'Active',
    isActive: true
  }
];

export const mockInterventions = [
  {
    id: 1,
    title: 'Academic Support Program',
    student: 'Bob Smith',
    studentId: '693d1965221a9c946b0a4e49',
    type: 'Academic Support',
    priority: 'High',
    status: 'In Progress',
    startDate: '2024-12-01',
    endDate: '2024-12-31',
    progress: 65,
    assignedTo: 'Ms. Sarah Wilson',
    description: 'Providing additional tutoring and study materials to improve academic performance.',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Family Counseling Session',
    student: 'David Wilson',
    studentId: '693d1965221a9c946b0a4e51',
    type: 'Counseling',
    priority: 'Critical',
    status: 'Scheduled',
    startDate: '2024-12-15',
    endDate: '2024-12-22',
    progress: 25,
    assignedTo: 'Dr. John Smith',
    description: 'Family counseling to address behavioral issues and improve home environment.',
    createdAt: new Date().toISOString()
  }
];

// Helper function to check if MongoDB is connected
export const isMongoConnected = () => {
  try {
    const mongoose = require('mongoose');
    return mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
};

// Helper function to find user by email (with fallback)
export const findUserByEmail = (email) => {
  return mockUsers.find(user => user.email === email);
};

// Helper function to find students by class (with fallback)
export const findStudentsByClass = (className) => {
  return mockStudents.filter(student => student.section === className && student.isActive);
};

// Helper function to find students by classes (with fallback)
export const findStudentsByClasses = (classNames) => {
  return mockStudents.filter(student => 
    classNames.includes(student.section) && student.isActive
  );
};

// Helper function to get at-risk students by classes
export const getAtRiskStudentsByClasses = (classNames) => {
  return mockStudents.filter(student => 
    classNames.includes(student.section) && 
    student.isActive &&
    ['Medium', 'High', 'Critical'].includes(student.riskLevel)
  );
};