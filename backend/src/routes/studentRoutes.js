import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import logger from '../utils/logger.js';
import { getIO } from '../socket/socketHandler.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    logger.info(`File filter check: ${file.originalname}, mimetype: ${file.mimetype}`);
    
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      logger.error(`Invalid file type: ${file.mimetype}`);
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    logger.error('Multer error:', error);
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`
    });
  } else if (error) {
    logger.error('File upload error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  next();
};

// Bulk upload students
router.post('/bulk-upload', upload.single('file'), handleMulterError, async (req, res) => {
  try {
    logger.info('Bulk upload request received');
    
    if (!req.file) {
      logger.error('No file uploaded in request');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    logger.info(`File uploaded: ${req.file.originalname}, size: ${req.file.size}, mimetype: ${req.file.mimetype}`);

    const filePath = req.file.path;
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    
    logger.info(`Processing bulk upload: ${req.file.originalname}`);

    let studentsData = [];

    // Parse file based on type
    if (fileExtension === 'csv') {
      // Parse CSV
      studentsData = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', reject);
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Parse Excel
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      studentsData = xlsx.utils.sheet_to_json(worksheet);
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    if (!studentsData || studentsData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid data found in file'
      });
    }

    const results = {
      totalRecords: studentsData.length,
      successCount: 0,
      errorCount: 0,
      errors: []
    };

    // Process each student record
    for (let i = 0; i < studentsData.length; i++) {
      const row = studentsData[i];
      
      try {
        // Validate required fields
        if (!row.firstName || !row.lastName || !row.rollNumber) {
          throw new Error('Missing required fields: firstName, lastName, rollNumber');
        }

        // Check for duplicate roll number
        const existingStudent = await Student.findOne({ 
          rollNumber: row.rollNumber.toString().toUpperCase() 
        });
        
        if (existingStudent) {
          throw new Error(`Roll number ${row.rollNumber} already exists`);
        }

        // Get attendance and academic data from CSV
        const attendancePercentage = row.attendance !== undefined ? Number(row.attendance) : 100;
        const overallPercentage = row.academicScore !== undefined ? Number(row.academicScore) : 0;
        
        // Calculate risk level based on attendance and academic performance
        let riskScore = 0;
        let riskLevel = 'Low';
        
        if (attendancePercentage < 70 || overallPercentage < 50) {
          riskScore = Math.max(100 - attendancePercentage, 100 - overallPercentage);
          if (riskScore >= 80) riskLevel = 'Critical';
          else if (riskScore >= 60) riskLevel = 'High';
          else if (riskScore >= 40) riskLevel = 'Medium';
          else riskLevel = 'Low';
        }

        // Create student data
        const studentData = {
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          rollNumber: row.rollNumber.toString().toUpperCase().trim(),
          admissionNumber: row.admissionNumber || `ADM${Date.now()}_${i}`,
          section: row.class || row.section || '10A',
          email: row.email?.toLowerCase().trim(),
          phone: row.phone?.toString().trim(),
          dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : new Date('2010-01-01'),
          gender: row.gender || 'Male',
          address: {
            street: row.address || 'Unknown',
            city: 'Unknown',
            state: 'Unknown',
            pincode: '000000'
          },
          father: {
            name: row.parentName || row.fatherName || 'Father Name',
            phone: row.parentPhone || row.fatherPhone || row.phone || '0000000000',
            email: row.parentEmail || row.fatherEmail || row.email
          },
          mother: {
            name: row.motherName || 'Mother Name',
            phone: row.motherPhone || row.phone || '0000000000'
          },
          familyIncomeLevel: 'Middle Income',
          distanceFromSchool: 5,
          transportationMode: 'School Bus',
          attendancePercentage: attendancePercentage,
          overallPercentage: overallPercentage,
          riskScore: riskScore,
          riskLevel: riskLevel,
          status: 'Active',
          isActive: true
        };

        // Save student
        const newStudent = new Student(studentData);
        await newStudent.save();
        
        results.successCount++;
        logger.info(`✅ Bulk upload - Student created: ${studentData.rollNumber}`);

      } catch (error) {
        results.errorCount++;
        results.errors.push({
          row: i + 1,
          rollNumber: row.rollNumber,
          error: error.message
        });
        logger.error(`❌ Bulk upload error for row ${i + 1}:`, error.message);
      }
    }

    // Emit socket event for bulk update
    try {
      const io = getIO();
      if (io) {
        io.emit('students:bulk-updated', {
          successCount: results.successCount,
          errorCount: results.errorCount
        });
        logger.info(`📡 Socket event emitted: students:bulk-updated`);
      }
    } catch (socketError) {
      logger.error('Socket emission error:', socketError);
    }

    res.json({
      success: true,
      message: `Bulk upload completed. ${results.successCount} students added successfully.`,
      data: results
    });

  } catch (error) {
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    logger.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk upload failed',
      error: error.message
    });
  }
});

// Get all students with dynamic MongoDB queries
router.get('/', async (req, res) => {
  try {
    const { search, class: classFilter, riskLevel, page = 1, limit = 50 } = req.query;
    
    // Build dynamic query
    let query = { isActive: { $ne: false } }; // Include documents where isActive is true or undefined
    
    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { admissionNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Class filter
    if (classFilter && classFilter !== 'All') {
      query.section = classFilter; // Using section field for class filtering
    }
    
    // Risk level filter
    if (riskLevel && riskLevel !== 'All Risks') {
      query.riskLevel = riskLevel;
    }

    // Debug logging
    logger.info(`Query: ${JSON.stringify(query)}`);

    // Execute query with pagination
    const students = await Student.find(query)
      .select('firstName lastName rollNumber section attendancePercentage overallPercentage riskLevel riskScore email phone status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const total = await Student.countDocuments(query);
    
    logger.info(`Found ${students.length} students matching query, total: ${total}`);

    // Transform data to match frontend expectations
    const transformedStudents = students.map(student => ({
      id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      rollNumber: student.rollNumber,
      class: student.section,
      attendance: student.attendancePercentage || 100,
      academicScore: student.overallPercentage || 0,
      riskLevel: student.riskLevel,
      riskScore: student.riskScore || 0,
      email: student.email,
      phone: student.phone,
      status: student.status
    }));

    res.json({
      success: true,
      data: {
        students: transformedStudents,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).lean();
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Transform data to match frontend expectations
    const transformedStudent = {
      id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      rollNumber: student.rollNumber,
      class: student.section,
      attendance: student.attendancePercentage || 100,
      academicScore: student.overallPercentage || 0,
      riskLevel: student.riskLevel,
      riskScore: student.riskScore || 0,
      email: student.email,
      phone: student.phone,
      status: student.status,
      // Include additional details for detailed view
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      address: student.address,
      father: student.father,
      mother: student.mother
    };

    res.json({
      success: true,
      data: transformedStudent
    });
  } catch (error) {
    logger.error('Error fetching student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student',
      error: error.message
    });
  }
});

// Create new student with MongoDB
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, rollNumber, class: studentClass, section, email, phone, dateOfBirth, gender, address, father, mother, attendance, academicScore, createParentAccount, photo } = req.body;
    
    logger.info(`Creating student: ${firstName} ${lastName} (${rollNumber})`);
    
    // Check if roll number already exists
    const existingStudent = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });
    if (existingStudent) {
      logger.warn(`Duplicate roll number: ${rollNumber}`);
      return res.status(400).json({
        success: false,
        message: 'Roll number already exists'
      });
    }

    // Create new student with comprehensive data
    const sectionName = section || studentClass || '10A'; // Default section
    const attendancePercentage = attendance !== undefined ? Number(attendance) : 100;
    const overallPercentage = academicScore !== undefined ? Number(academicScore) : 0;
    
    // Calculate risk level based on attendance and academic score
    let riskScore = 0;
    let riskLevel = 'Low';
    
    if (attendancePercentage < 70 || overallPercentage < 50) {
      riskScore = Math.max(100 - attendancePercentage, 100 - overallPercentage);
      if (riskScore >= 80) riskLevel = 'Critical';
      else if (riskScore >= 60) riskLevel = 'High';
      else if (riskScore >= 40) riskLevel = 'Medium';
      else riskLevel = 'Low';
    }
    
    const studentData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      rollNumber: rollNumber.toUpperCase().trim(),
      admissionNumber: `ADM${Date.now()}`, // Auto-generate admission number
      section: sectionName,
      email: email?.toLowerCase().trim(),
      phone: phone?.trim(),
      dateOfBirth: dateOfBirth || new Date('2010-01-01'), // Default DOB
      gender: gender || 'Male',
      address: address || {
        city: 'Unknown',
        state: 'Unknown',
        pincode: '000000'
      },
      father: father || {
        name: 'Father Name',
        phone: phone || '0000000000'
      },
      mother: mother || {
        name: 'Mother Name',
        phone: phone || '0000000000'
      },
      familyIncomeLevel: 'Middle Income',
      distanceFromSchool: 5,
      transportationMode: 'School Bus',
      // Photo handling - support both string (base64) and object formats
      photo: photo ? (typeof photo === 'string' ? { url: photo } : photo) : undefined,
      // Academic values with risk calculation
      attendancePercentage: attendancePercentage,
      overallPercentage: overallPercentage,
      riskScore: riskScore,
      riskLevel: riskLevel,
      status: 'Active',
      isActive: true
    };

    const newStudent = new Student(studentData);
    const savedStudent = await newStudent.save();

    logger.info(`✅ Student saved to database: ${savedStudent.rollNumber}`);

    // *** AUTO-CREATE PARENT ACCOUNT ***
    let parentAccount = null;
    if (createParentAccount !== false && father && father.email) {
      try {
        // Check if parent account already exists
        const existingParent = await User.findOne({ email: father.email.toLowerCase() });
        
        if (existingParent) {
          // Link student to existing parent
          if (!existingParent.children.includes(savedStudent._id)) {
            existingParent.children.push(savedStudent._id);
            await existingParent.save();
            logger.info(`✅ Student linked to existing parent: ${father.email}`);
          }
          parentAccount = {
            email: existingParent.email,
            existed: true
          };
        } else {
          // Create new parent account
          // Password: FirstName2025 (e.g., John2025)
          const parentPassword = `${firstName}2025`;
          
          const parentData = {
            firstName: father.name.split(' ')[0] || 'Parent',
            lastName: father.name.split(' ').slice(1).join(' ') || lastName,
            email: father.email.toLowerCase(),
            phone: father.phone || phone || '0000000000',
            password: parentPassword,
            role: 'parent',
            children: [savedStudent._id],
            isActive: true,
            notificationPreferences: {
              email: true,
              sms: true,
              inApp: true
            }
          };

          const newParent = new User(parentData);
          await newParent.save();
          
          logger.info(`✅ Parent account created: ${father.email} with password: ${parentPassword}`);
          
          parentAccount = {
            email: father.email,
            password: parentPassword,
            existed: false
          };

          // Send welcome email to parent
          try {
            const { sendEmail } = await import('../services/emailService.js');
            await sendEmail({
              to: father.email,
              subject: 'Parent Account Created - Student Dropout Prevention System',
              html: `
                <h2>Welcome to Student Dropout Prevention System</h2>
                <p>Dear ${father.name},</p>
                <p>A parent account has been created for you to monitor your child's progress.</p>
                <p><strong>Login Credentials:</strong></p>
                <p>Email: ${father.email}</p>
                <p>Password: ${parentPassword}</p>
                <p><strong>Student:</strong> ${firstName} ${lastName} (${rollNumber})</p>
                <p>Please login at: <a href="${process.env.FRONTEND_URL}/login">${process.env.FRONTEND_URL}/login</a></p>
                <p>We recommend changing your password after first login.</p>
              `,
              text: `Welcome! Your login: ${father.email} / ${parentPassword}`
            });
            logger.info(`✅ Welcome email sent to parent: ${father.email}`);
          } catch (emailError) {
            logger.error('❌ Failed to send welcome email:', emailError);
          }
        }
      } catch (parentError) {
        logger.error('❌ Error creating parent account:', parentError);
        // Don't fail student creation if parent creation fails
      }
    }

    // Transform response to match frontend expectations
    const transformedStudent = {
      id: savedStudent._id,
      firstName: savedStudent.firstName,
      lastName: savedStudent.lastName,
      rollNumber: savedStudent.rollNumber,
      class: savedStudent.section,
      attendance: savedStudent.attendancePercentage,
      academicScore: savedStudent.overallPercentage,
      riskLevel: savedStudent.riskLevel,
      riskScore: savedStudent.riskScore,
      email: savedStudent.email,
      phone: savedStudent.phone,
      status: savedStudent.status
    };

    // *** CRITICAL: Emit socket event for real-time updates ***
    try {
      const io = getIO();
      if (io) {
        logger.info(`📡 Emitting socket event: student:created for ${savedStudent.rollNumber}`);
        io.emit('student:created', transformedStudent);
        logger.info(`✅ Socket event emitted successfully`);
      } else {
        logger.warn('⚠️ Socket.io instance not available - real-time update skipped');
      }
    } catch (socketError) {
      logger.error('❌ Socket emission error:', socketError);
      // Don't fail the request if socket fails
    }

    // Send response
    res.status(201).json({
      success: true,
      message: parentAccount ? 
        `Student created successfully. Parent account ${parentAccount.existed ? 'linked' : 'created'} with email: ${parentAccount.email}` :
        'Student created successfully',
      data: transformedStudent,
      parentAccount: parentAccount
    });

    logger.info(`✅ Response sent for student: ${savedStudent.rollNumber}`);
    
  } catch (error) {
    logger.error('❌ Error creating student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create student',
      error: error.message
    });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const updateData = { ...req.body };
    
    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData._id;
    
    // Handle class/section mapping - use class value for section field
    if (updateData.class !== undefined) {
      updateData.section = updateData.class;
      delete updateData.class; // Remove class field as it's an ObjectId reference in the model
    }
    
    // Handle attendance and academic score updates with risk recalculation
    if (updateData.attendance !== undefined) {
      updateData.attendancePercentage = Number(updateData.attendance);
      delete updateData.attendance;
    }
    if (updateData.academicScore !== undefined) {
      updateData.overallPercentage = Number(updateData.academicScore);
      delete updateData.academicScore;
    }
    
    // Always recalculate risk when updating student data
    const currentStudent = await Student.findById(studentId);
    if (!currentStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Get current or updated values
    const attendance = updateData.attendancePercentage !== undefined ? updateData.attendancePercentage : (currentStudent.attendancePercentage || 100);
    const academic = updateData.overallPercentage !== undefined ? updateData.overallPercentage : (currentStudent.overallPercentage || 0);
    
    // Always recalculate risk score and level
    let riskScore = 0;
    let riskLevel = 'Low';
    
    if (attendance < 70 || academic < 50) {
      riskScore = Math.max(100 - attendance, 100 - academic);
      if (riskScore >= 80) riskLevel = 'Critical';
      else if (riskScore >= 60) riskLevel = 'High';
      else if (riskScore >= 40) riskLevel = 'Medium';
      else riskLevel = 'Low';
    }
    
    // Always update risk data
    updateData.riskScore = riskScore;
    updateData.riskLevel = riskLevel;
    
    logger.info(`Updating student: ${studentId} with data:`, updateData);
    
    // Update student in MongoDB
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { ...updateData, lastUpdatedBy: req.user?.id },
      { new: true, runValidators: true }
    ).lean();
    
    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Transform response
    const transformedStudent = {
      id: updatedStudent._id,
      firstName: updatedStudent.firstName,
      lastName: updatedStudent.lastName,
      rollNumber: updatedStudent.rollNumber,
      class: updatedStudent.section,
      attendance: updatedStudent.attendancePercentage,
      academicScore: updatedStudent.overallPercentage,
      riskLevel: updatedStudent.riskLevel,
      riskScore: updatedStudent.riskScore,
      email: updatedStudent.email,
      phone: updatedStudent.phone,
      status: updatedStudent.status
    };

    logger.info(`Student updated: ${updatedStudent.rollNumber}`);

    // Emit socket event for real-time updates
    try {
      const io = getIO();
      if (io) {
        io.emit('student:updated', transformedStudent);
        logger.info(`Socket event emitted: student:updated for ${updatedStudent.rollNumber}`);
      }
    } catch (socketError) {
      logger.error('Socket emission error:', socketError);
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: transformedStudent
    });
  } catch (error) {
    logger.error('Error updating student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student',
      error: error.message
    });
  }
});

// Delete student (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    
    logger.info(`Deleting student: ${studentId}`);
    
    // Soft delete by setting isActive to false
    const deletedStudent = await Student.findByIdAndUpdate(
      studentId,
      { 
        isActive: false, 
        status: 'Transferred',
        lastUpdatedBy: req.user?.id 
      },
      { new: true }
    ).lean();
    
    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    logger.info(`Student soft deleted: ${deletedStudent.rollNumber}`);

    // Emit socket event for real-time updates
    try {
      const io = getIO();
      if (io) {
        const deletedData = {
          id: deletedStudent._id,
          rollNumber: deletedStudent.rollNumber,
          name: `${deletedStudent.firstName} ${deletedStudent.lastName}`
        };
        io.emit('student:deleted', deletedData);
        logger.info(`Socket event emitted: student:deleted for ${deletedStudent.rollNumber}`);
      }
    } catch (socketError) {
      logger.error('Socket emission error:', socketError);
    }

    res.json({
      success: true,
      message: 'Student deleted successfully',
      data: {
        id: deletedStudent._id,
        rollNumber: deletedStudent.rollNumber,
        name: `${deletedStudent.firstName} ${deletedStudent.lastName}`
      }
    });
  } catch (error) {
    logger.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student',
      error: error.message
    });
  }
});

export default router;