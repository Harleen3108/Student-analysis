import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import AcademicPerformance from '../models/AcademicPerformance.js';
import TeacherObservation from '../models/TeacherObservation.js';
import Communication from '../models/Communication.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Get parent dashboard data
export const getParentDashboard = async (req, res) => {
  try {
    const parentId = req.user.id;
    const parentEmail = req.user.email;
    
    logger.info(`📊 Dashboard request from parent: ${parentEmail} (ID: ${parentId})`);
    
    const parent = await User.findById(parentId).select('children email role').lean();
    
    logger.info(`📊 Parent found: ${parent ? 'Yes' : 'No'}, Role: ${parent?.role}, Children: ${parent?.children?.length || 0}`);
    
    if (!parent || parent.role !== 'parent') {
      logger.error(`❌ Access denied for ${parentEmail}. Role: ${parent?.role}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Parent role required.'
      });
    }

    // Get linked students
    const linkedStudentIds = parent.children || [];
    
    logger.info(`📊 Linked student IDs: ${JSON.stringify(linkedStudentIds)}`);
    
    if (linkedStudentIds.length === 0) {
      logger.warn(`⚠️ No children linked to parent ${parentEmail}`);
      return res.json({
        success: true,
        data: {
          students: [],
          message: 'No students linked to this account'
        }
      });
    }

    // Fetch all linked students with their data
    const students = await Student.find({
      _id: { $in: linkedStudentIds },
      isActive: { $ne: false }
    })
    .select('firstName lastName rollNumber section attendancePercentage overallPercentage riskLevel riskScore photo')
    .lean();
    
    logger.info(`📊 Found ${students.length} students in database`);

    // Get today's attendance for each student
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const studentsWithData = await Promise.all(
      students.map(async (student) => {
        // Get today's attendance
        const todayAttendance = await Attendance.findOne({
          student: student._id,
          date: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        }).lean();

        // Get latest academic performance
        const latestPerformance = await AcademicPerformance.findOne({
          student: student._id
        })
        .sort({ examDate: -1 })
        .select('overallMarks examType examDate')
        .lean();

        // Get active interventions
        const { default: Intervention } = await import('../models/Intervention.js');
        const activeInterventions = await Intervention.countDocuments({
          student: student._id,
          status: { $in: ['Planned', 'In Progress'] }
        });

        return {
          id: student._id.toString(),
          firstName: student.firstName,
          lastName: student.lastName,
          rollNumber: student.rollNumber,
          section: student.section,
          photo: student.photo,
          riskLevel: student.riskLevel,
          riskScore: student.riskScore,
          attendancePercentage: student.attendancePercentage || 100,
          todayAttendance: todayAttendance ? todayAttendance.status : 'Unknown',
          latestAcademicScore: latestPerformance ? {
            percentage: latestPerformance.overallMarks?.percentage || 0,
            examType: latestPerformance.examType,
            date: latestPerformance.examDate
          } : null,
          activeInterventions: activeInterventions
        };
      })
    );

    logger.info(`✅ Dashboard loaded for ${studentsWithData.length} students`);

    res.json({
      success: true,
      data: {
        students: studentsWithData
      }
    });

  } catch (error) {
    logger.error('❌ Parent dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data'
    });
  }
};

// Get student attendance details
export const getStudentAttendance = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { studentId } = req.params;
    const { month, year } = req.query;

    logger.info(`📅 Getting attendance for student: ${studentId}`);

    // Verify parent has access to this student
    const parent = await User.findById(parentId);
    if (!parent || !parent.children?.some(id => id.toString() === studentId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student not linked to your account.'
      });
    }

    // Get attendance for the specified month
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    const attendanceRecords = await Attendance.find({
      student: studentId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .sort({ date: 1 })
    .lean();

    // Get monthly summary
    const summary = await Attendance.getStudentSummary(studentId, startDate, endDate);

    logger.info(`✅ Found ${attendanceRecords.length} attendance records`);

    res.json({
      success: true,
      data: {
        month: targetMonth,
        year: targetYear,
        records: attendanceRecords.map(record => ({
          date: record.date,
          status: record.status,
          remarks: record.remarks
        })),
        summary
      }
    });

  } catch (error) {
    logger.error('❌ Error getting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load attendance data'
    });
  }
};

// Get student academic performance
export const getStudentAcademicPerformance = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { studentId } = req.params;

    logger.info(`📚 Getting academic performance for student: ${studentId}`);

    // Verify parent has access
    const parent = await User.findById(parentId);
    if (!parent || !parent.children?.includes(studentId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    // Get academic performance records
    const performances = await AcademicPerformance.find({
      student: studentId
    })
    .sort({ examDate: -1 })
    .limit(10)
    .lean();

    // Get summary
    const summary = await AcademicPerformance.getStudentSummary(studentId, 6);

    // Get performance trends
    const trends = await AcademicPerformance.getPerformanceTrends(studentId, 6);

    logger.info(`✅ Found ${performances.length} performance records`);

    res.json({
      success: true,
      data: {
        performances: performances.map(perf => ({
          examType: perf.examType,
          examDate: perf.examDate,
          subjects: perf.subjects,
          overallMarks: perf.overallMarks,
          overallGrade: perf.overallGrade,
          isImprovement: perf.isImprovement
        })),
        summary,
        trends
      }
    });

  } catch (error) {
    logger.error('❌ Error getting academic performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load academic data'
    });
  }
};

// Get student risk status
export const getStudentRiskStatus = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { studentId } = req.params;

    logger.info(`⚠️ Getting risk status for student: ${studentId}`);

    // Verify parent has access
    const parent = await User.findById(parentId);
    if (!parent || !parent.children?.includes(studentId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    const student = await Student.findById(studentId)
      .select('firstName lastName riskLevel attendancePercentage overallPercentage')
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Determine risk reasons (simplified for parents)
    const reasons = [];
    if (student.attendancePercentage < 75) {
      reasons.push('Low attendance');
    }
    if (student.overallPercentage < 50) {
      reasons.push('Declining academic performance');
    }

    // Get recent observations for behavioral concerns
    const recentObservations = await TeacherObservation.find({
      student: studentId,
      observationType: 'Behavioral',
      severity: { $in: ['High', 'Critical'] },
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).limit(1);

    if (recentObservations.length > 0) {
      reasons.push('Behavioral concern');
    }

    res.json({
      success: true,
      data: {
        riskLevel: student.riskLevel,
        reasons: reasons.length > 0 ? reasons : ['No significant concerns'],
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    logger.error('❌ Error getting risk status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load risk status'
    });
  }
};

// Get student interventions
export const getStudentInterventions = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { studentId } = req.params;

    logger.info(`🎯 Getting interventions for student: ${studentId}`);

    // Verify parent has access
    const parent = await User.findById(parentId);
    if (!parent || !parent.children?.includes(studentId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    const { default: Intervention } = await import('../models/Intervention.js');
    
    const interventions = await Intervention.find({
      student: studentId
    })
    .sort({ createdAt: -1 })
    .lean();

    logger.info(`✅ Found ${interventions.length} interventions`);

    res.json({
      success: true,
      data: {
        interventions: interventions.map(int => ({
          id: int._id.toString(),
          type: int.type,
          title: int.title,
          description: int.description,
          status: int.status,
          priority: int.priority,
          startDate: int.startDate,
          endDate: int.endDate,
          progress: int.progress,
          progressNotes: int.progressNotes
        }))
      }
    });

  } catch (error) {
    logger.error('❌ Error getting interventions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load interventions'
    });
  }
};

// Get parent communications
export const getParentCommunications = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { studentId } = req.query;

    logger.info(`📧 Getting communications for parent: ${parentId}`);

    const parent = await User.findById(parentId);
    if (!parent) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    const query = {
      student: { $in: parent.children || [] },
      recipient: { $in: ['parent', 'both'] }
    };

    if (studentId) {
      query.student = studentId;
    }

    const communications = await Communication.find(query)
      .populate('student', 'firstName lastName rollNumber section')
      .populate('sender', 'firstName lastName role')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    logger.info(`✅ Found ${communications.length} communications`);

    res.json({
      success: true,
      data: {
        communications: communications.map(comm => ({
          id: comm._id.toString(),
          subject: comm.subject,
          message: comm.message,
          type: comm.type,
          priority: comm.priority,
          status: comm.status,
          sentAt: comm.sentAt,
          readAt: comm.readAt,
          student: comm.student,
          sender: comm.sender,
          parentResponse: comm.parentResponse
        }))
      }
    });

  } catch (error) {
    logger.error('❌ Error getting communications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load communications'
    });
  }
};

// Reply to communication
export const replyToCommunication = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { communicationId } = req.params;
    const { message } = req.body;

    logger.info(`📧 Parent replying to communication: ${communicationId}`);

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required'
      });
    }

    const communication = await Communication.findById(communicationId);
    if (!communication) {
      return res.status(404).json({
        success: false,
        message: 'Communication not found'
      });
    }

    // Verify parent has access
    const parent = await User.findById(parentId);
    if (!parent || !parent.children?.includes(communication.student.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    // Add parent response
    communication.parentResponse = {
      message,
      receivedAt: new Date()
    };
    communication.status = 'Replied';
    communication.repliedAt = new Date();

    await communication.save();

    logger.info(`✅ Parent reply added to communication: ${communicationId}`);

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: {
        communication: {
          id: communication._id.toString(),
          parentResponse: communication.parentResponse
        }
      }
    });

  } catch (error) {
    logger.error('❌ Error replying to communication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply'
    });
  }
};

// Mark communication as read
export const markCommunicationAsRead = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { communicationId } = req.params;

    const communication = await Communication.findById(communicationId);
    if (!communication) {
      return res.status(404).json({
        success: false,
        message: 'Communication not found'
      });
    }

    // Verify parent has access
    const parent = await User.findById(parentId);
    if (!parent || !parent.children?.includes(communication.student.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    if (communication.status === 'Sent' || communication.status === 'Delivered') {
      communication.status = 'Read';
      communication.readAt = new Date();
      await communication.save();
    }

    res.json({
      success: true,
      message: 'Communication marked as read'
    });

  } catch (error) {
    logger.error('❌ Error marking communication as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update communication'
    });
  }
};

// Update parent profile
export const updateParentProfile = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { phone, email, notificationPreferences } = req.body;

    logger.info(`👤 Updating parent profile: ${parentId}`);

    const updateData = {};
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (notificationPreferences) updateData.notificationPreferences = notificationPreferences;

    const parent = await User.findByIdAndUpdate(
      parentId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    logger.info(`✅ Parent profile updated: ${parentId}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: parent
      }
    });

  } catch (error) {
    logger.error('❌ Error updating parent profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Admin function to link students to parent (add to userController instead)
export const linkStudentsToParent = async (req, res) => {
  try {
    const { parentId, studentIds } = req.body;

    logger.info(`🔗 Linking students to parent: ${parentId}`);

    if (!parentId || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({
        success: false,
        message: 'Parent ID and student IDs array are required'
      });
    }

    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    // Verify all students exist
    const students = await Student.find({ _id: { $in: studentIds } });
    if (students.length !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some students not found'
      });
    }

    // Update parent's children array
    parent.children = [...new Set([...parent.children, ...studentIds])]; // Remove duplicates
    await parent.save();

    logger.info(`✅ Linked ${studentIds.length} students to parent ${parentId}`);

    res.json({
      success: true,
      message: `Successfully linked ${studentIds.length} students to parent`,
      data: {
        parent: {
          id: parent._id,
          name: `${parent.firstName} ${parent.lastName}`,
          children: parent.children
        }
      }
    });

  } catch (error) {
    logger.error('❌ Error linking students to parent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link students'
    });
  }
};

export default {
  getParentDashboard,
  getStudentAttendance,
  getStudentAcademicPerformance,
  getStudentRiskStatus,
  getStudentInterventions,
  getParentCommunications,
  replyToCommunication,
  markCommunicationAsRead,
  updateParentProfile
};
