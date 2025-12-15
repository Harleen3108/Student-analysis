import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { getIO } from '../socket/socketHandler.js';
import { notifyAttendanceMarked, notifyHighAbsenceRate } from '../utils/adminNotifications.js';

// Get attendance for a class on a specific date
export const getClassAttendance = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { className } = req.params;
    const { date } = req.query;
    
    const teacher = await User.findById(teacherId);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    // Check if teacher is assigned to this class
    if (!teacher.assignedClasses || !teacher.assignedClasses.includes(className)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not assigned to this class.'
      });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    
    logger.info(`Getting attendance for class ${className} on ${attendanceDate.toDateString()}`);
    
    // Get all students in the class
    const students = await Student.find({ 
      section: className,
      isActive: { $ne: false }
    }).select('firstName lastName rollNumber').sort({ rollNumber: 1 });

    logger.info(`Found ${students.length} students in class ${className}`);

    // Get existing attendance records for this date
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await Attendance.find({
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    }).populate('student', 'firstName lastName rollNumber');

    logger.info(`Found ${existingAttendance.length} existing attendance records for ${attendanceDate.toDateString()}`);

    // Create attendance map by student ID (more reliable than roll number)
    const attendanceMap = {};
    existingAttendance.forEach(record => {
      if (record.student && record.student._id) {
        attendanceMap[record.student._id.toString()] = {
          id: record._id,
          status: record.status,
          timeIn: record.timeIn,
          lateMinutes: record.lateMinutes,
          reason: record.reason,
          remarks: record.remarks
        };
      }
    });

    // Prepare student attendance data
    const studentAttendance = students.map(student => ({
      studentId: student._id,
      rollNumber: student.rollNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      attendance: attendanceMap[student._id.toString()] || {
        status: 'Present', // Default status
        timeIn: null,
        lateMinutes: 0,
        reason: '',
        remarks: ''
      }
    }));

    // Calculate summary
    const summary = {
      present: studentAttendance.filter(s => s.attendance.status === 'Present').length,
      absent: studentAttendance.filter(s => s.attendance.status === 'Absent').length,
      late: studentAttendance.filter(s => s.attendance.status === 'Late').length,
      excused: studentAttendance.filter(s => s.attendance.status === 'Excused').length
    };

    logger.info(`Attendance summary for ${className}:`, summary);

    res.json({
      success: true,
      data: {
        className,
        date: attendanceDate,
        students: studentAttendance,
        total: students.length,
        summary
      }
    });

  } catch (error) {
    logger.error('Error getting class attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load attendance data',
      error: error.message
    });
  }
};

// Mark attendance for multiple students
export const markBulkAttendance = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { className, date, attendanceData } = req.body;
    
    logger.info(`Bulk attendance request from teacher ${teacherId} for class ${className} on ${date}`);
    
    const teacher = await User.findById(teacherId);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    // Check if teacher is assigned to this class
    if (!teacher.assignedClasses || !teacher.assignedClasses.includes(className)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not assigned to this class.'
      });
    }

    const attendanceDate = new Date(date);
    
    // Validate attendance data
    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance data provided'
      });
    }

    logger.info(`Processing attendance for ${attendanceData.length} students`);

    // Prepare bulk operations
    const bulkOps = [];
    const results = {
      success: 0,
      errors: [],
      absentStudentIds: []
    };

    // Set up date range for the day
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    for (const record of attendanceData) {
      try {
        const { studentId, status, timeIn, lateMinutes, reason, remarks } = record;
        
        // Validate student exists and belongs to the class
        const student = await Student.findById(studentId);
        if (!student || student.section !== className) {
          results.errors.push({
            studentId,
            error: 'Student not found or not in specified class'
          });
          continue;
        }

        // Create attendance record data
        const attendanceRecord = {
          student: studentId,
          date: attendanceDate,
          status: status || 'Present',
          timeIn: timeIn ? new Date(timeIn) : (status === 'Present' || status === 'Late' ? new Date() : null),
          lateMinutes: parseInt(lateMinutes) || 0,
          reason: reason || '',
          remarks: remarks || '',
          markedBy: teacherId,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        bulkOps.push({
          updateOne: {
            filter: {
              student: studentId,
              date: {
                $gte: startOfDay,
                $lt: endOfDay
              }
            },
            update: {
              $set: attendanceRecord
            },
            upsert: true
          }
        });

        results.success++;
        
        // Track absent students for notification
        if (status === 'Absent') {
          results.absentStudentIds.push(studentId);
        }
        
        logger.info(`Prepared attendance record for student ${studentId}: ${status}`);
        
      } catch (error) {
        logger.error(`Error processing attendance for student ${record.studentId}:`, error);
        results.errors.push({
          studentId: record.studentId,
          error: error.message
        });
      }
    }

    // Execute bulk operations
    if (bulkOps.length > 0) {
      const bulkResult = await Attendance.bulkWrite(bulkOps);
      logger.info(`Bulk write result:`, {
        insertedCount: bulkResult.insertedCount,
        modifiedCount: bulkResult.modifiedCount,
        upsertedCount: bulkResult.upsertedCount
      });
    }

    // Update student attendance percentages and recalculate risk scores
    try {
      const { calculateRiskScore } = await import('../services/riskCalculator.js');
      
      for (const record of attendanceData) {
        const student = await Student.findById(record.studentId);
        if (student) {
          // Get total attendance records for this student
          const totalRecords = await Attendance.countDocuments({ student: record.studentId });
          const presentRecords = await Attendance.countDocuments({ 
            student: record.studentId, 
            status: { $in: ['Present', 'Late'] }
          });
          const absentRecords = await Attendance.countDocuments({ 
            student: record.studentId, 
            status: 'Absent'
          });
          
          const attendancePercentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 100;
          
          // Update student record
          await Student.findByIdAndUpdate(record.studentId, {
            attendancePercentage: attendancePercentage,
            totalDaysPresent: presentRecords,
            totalDaysAbsent: absentRecords
          });
          
          // Recalculate risk score
          try {
            const riskData = await calculateRiskScore(record.studentId);
            await Student.findByIdAndUpdate(record.studentId, {
              riskScore: riskData.totalRiskScore,
              riskFactors: riskData.factors,
              riskLevel: riskData.riskLevel
            });
            logger.info(`Updated risk score for student ${record.studentId}: ${riskData.totalRiskScore}`);
          } catch (riskError) {
            logger.error(`Error calculating risk for student ${record.studentId}:`, riskError);
          }
        }
      }
    } catch (updateError) {
      logger.error('Error updating student attendance percentages:', updateError);
    }

    // Emit socket event for real-time updates
    try {
      const io = getIO();
      if (io) {
        io.emit('attendance:updated', {
          className,
          date: attendanceDate,
          teacherId,
          summary: results
        });
        logger.info('Socket event emitted for attendance update');
      }
    } catch (socketError) {
      logger.error('Socket emission error:', socketError);
    }

    // Send notification to admins
    try {
      const summary = {
        present: results.present || 0,
        absent: results.absent || 0,
        late: results.late || 0,
        excused: results.excused || 0
      };
      
      await notifyAttendanceMarked(className, attendanceDate, summary, teacher);
      
      // If high absence rate, send additional alert
      if (summary.absent >= 5) {
        const absentStudents = await Student.find({
          _id: { $in: results.absentStudentIds || [] }
        }).select('firstName lastName rollNumber').lean();
        
        await notifyHighAbsenceRate(className, attendanceDate, absentStudents, teacher);
      }
    } catch (notifError) {
      logger.error('Error sending attendance notification:', notifError);
    }

    res.json({
      success: true,
      message: `Attendance marked for ${results.success} students`,
      data: results
    });

  } catch (error) {
    logger.error('Error marking bulk attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
};

// Get attendance summary for a class
export const getClassAttendanceSummary = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { className } = req.params;
    const { startDate, endDate } = req.query;
    
    const teacher = await User.findById(teacherId);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    // Check if teacher is assigned to this class
    if (!teacher.assignedClasses || !teacher.assignedClasses.includes(className)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not assigned to this class.'
      });
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const end = endDate ? new Date(endDate) : new Date();

    // Get students in the class
    const students = await Student.find({ 
      section: className,
      isActive: { $ne: false }
    }).select('firstName lastName rollNumber');

    // Get attendance summary for each student
    const studentSummaries = await Promise.all(
      students.map(async (student) => {
        const summary = await Attendance.getStudentSummary(student._id, start, end);
        return {
          studentId: student._id,
          rollNumber: student.rollNumber,
          firstName: student.firstName,
          lastName: student.lastName,
          ...summary
        };
      })
    );

    // Calculate class statistics
    const classStats = {
      totalStudents: students.length,
      averageAttendance: studentSummaries.length > 0
        ? Math.round(studentSummaries.reduce((sum, s) => sum + parseFloat(s.percentage), 0) / studentSummaries.length)
        : 100,
      perfectAttendance: studentSummaries.filter(s => parseFloat(s.percentage) === 100).length,
      belowThreshold: studentSummaries.filter(s => parseFloat(s.percentage) < 75).length
    };

    res.json({
      success: true,
      data: {
        className,
        period: { startDate: start, endDate: end },
        classStats,
        studentSummaries: studentSummaries.sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
      }
    });

  } catch (error) {
    logger.error('Error getting attendance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load attendance summary',
      error: error.message
    });
  }
};

// Get attendance trends for a student
export const getStudentAttendanceTrends = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { studentId } = req.params;
    const { months = 6 } = req.query;
    
    const teacher = await User.findById(teacherId);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if teacher has access to this student
    if (!teacher.assignedClasses || !teacher.assignedClasses.includes(student.section)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student not in your assigned classes.'
      });
    }

    const trends = await Attendance.getAttendanceTrends(studentId, parseInt(months));

    res.json({
      success: true,
      data: {
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        trends
      }
    });

  } catch (error) {
    logger.error('Error getting attendance trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load attendance trends',
      error: error.message
    });
  }
};


// Get attendance history for a class (for teachers)
export const getAttendanceHistory = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { className } = req.params;
    const { startDate, endDate, page = 1, limit = 30 } = req.query;
    
    const teacher = await User.findById(teacherId);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    // Check if teacher is assigned to this class
    if (!teacher.assignedClasses || !teacher.assignedClasses.includes(className)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not assigned to this class.'
      });
    }

    // Set date range (default to last 30 days)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    logger.info(`Getting attendance history for class ${className} from ${start.toDateString()} to ${end.toDateString()}`);

    // Get all students in the class
    const students = await Student.find({ 
      section: className,
      isActive: { $ne: false }
    }).select('firstName lastName rollNumber').sort({ rollNumber: 1 });

    // Get attendance records for the date range
    const attendanceRecords = await Attendance.find({
      date: { $gte: start, $lte: end }
    })
    .populate('student', 'firstName lastName rollNumber section')
    .sort({ date: -1 })
    .lean();

    // Filter records for students in this class
    const classAttendance = attendanceRecords.filter(record => 
      record.student && record.student.section === className
    );

    // Group by date
    const attendanceByDate = {};
    classAttendance.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!attendanceByDate[dateKey]) {
        attendanceByDate[dateKey] = {
          date: record.date,
          records: [],
          summary: { present: 0, absent: 0, late: 0, excused: 0 }
        };
      }
      attendanceByDate[dateKey].records.push({
        studentId: record.student._id,
        rollNumber: record.student.rollNumber,
        name: `${record.student.firstName} ${record.student.lastName}`,
        status: record.status,
        timeIn: record.timeIn,
        lateMinutes: record.lateMinutes
      });
      attendanceByDate[dateKey].summary[record.status.toLowerCase()]++;
    });

    // Convert to array and sort by date
    const history = Object.values(attendanceByDate).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedHistory = history.slice(skip, skip + parseInt(limit));

    // Calculate overall statistics
    const overallStats = {
      totalDays: history.length,
      totalRecords: classAttendance.length,
      averagePresent: history.length > 0 
        ? Math.round(history.reduce((sum, day) => sum + day.summary.present, 0) / history.length)
        : 0,
      averageAbsent: history.length > 0
        ? Math.round(history.reduce((sum, day) => sum + day.summary.absent, 0) / history.length)
        : 0
    };

    res.json({
      success: true,
      data: {
        className,
        period: { startDate: start, endDate: end },
        totalStudents: students.length,
        overallStats,
        history: paginatedHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: history.length,
          pages: Math.ceil(history.length / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error getting attendance history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load attendance history',
      error: error.message
    });
  }
};
