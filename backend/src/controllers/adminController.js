import Student from '../models/Student.js';
import TeacherObservation from '../models/TeacherObservation.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Create admin observation/note for a student
export const createAdminObservation = async (req, res) => {
  try {
    const adminId = req.user.id;
    const {
      studentId,
      observationType,
      severity,
      title,
      description,
      actionTaken,
      followUpRequired,
      followUpDate,
      tags,
      isPrivate
    } = req.body;

    logger.info(`📝 Admin creating observation for student: ${studentId}`);

    // Validate required fields
    if (!studentId || !observationType || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Create observation (using teacher field for admin ID since admins can also create observations)
    const observation = await TeacherObservation.create({
      student: studentId,
      teacher: adminId, // Admin ID stored in teacher field
      class: student.section,
      observationType,
      severity: severity || 'Medium',
      title,
      description,
      actionTaken,
      followUpRequired: followUpRequired || false,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      tags: tags || [],
      isPrivate: isPrivate || false,
      status: 'Active'
    });

    const populatedObservation = await TeacherObservation.findById(observation._id)
      .populate('student', 'firstName lastName rollNumber section')
      .populate('teacher', 'firstName lastName email role')
      .lean();

    logger.info(`✅ Admin observation created: ${observation._id}`);

    res.status(201).json({
      success: true,
      message: 'Note added successfully',
      data: {
        observation: {
          ...populatedObservation,
          id: populatedObservation._id.toString(),
          _id: undefined
        }
      }
    });

  } catch (error) {
    logger.error('❌ Error creating admin observation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all observations for a student (admin view - includes all observations from all teachers)
export const getStudentObservations = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { studentId } = req.params;

    logger.info(`📝 Admin getting observations for student: ${studentId}`);

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get all observations for this student (from all teachers and admin)
    const observations = await TeacherObservation.find({
      student: studentId
    })
      .populate('teacher', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .lean();

    logger.info(`✅ Found ${observations.length} observations for student`);

    res.json({
      success: true,
      data: {
        observations: observations.map(obs => ({
          ...obs,
          id: obs._id.toString(),
          _id: undefined,
          createdBy: obs.teacher ? {
            name: `${obs.teacher.firstName || ''} ${obs.teacher.lastName || ''}`.trim(),
            email: obs.teacher.email,
            role: obs.teacher.role
          } : null
        })),
        total: observations.length
      }
    });

  } catch (error) {
    logger.error('❌ Error getting student observations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load observations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};


// Send communication to parent (admin)
export const sendCommunicationToParent = async (req, res) => {
  try {
    const adminId = req.user.id;
    const {
      studentId,
      recipient,
      subject,
      message,
      type,
      priority,
      method,
      tags
    } = req.body;

    logger.info(`📧 Admin sending communication for student: ${studentId}`);

    // Validate required fields
    if (!studentId || !recipient || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Find parent of this student
    const parent = await User.findOne({
      role: 'parent',
      children: studentId,
      isActive: { $ne: false }
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'No parent found for this student'
      });
    }

    // Import Communication model
    const { default: Communication } = await import('../models/Communication.js');

    // Create communication record
    const communication = await Communication.create({
      sender: adminId,
      senderRole: 'admin',
      recipient,
      student: studentId,
      subject,
      message,
      type: type || 'General',
      priority: priority || 'Normal',
      method: method || 'App',
      status: 'Sent',
      sentAt: new Date(),
      tags: tags || []
    });

    const populatedCommunication = await Communication.findById(communication._id)
      .populate('student', 'firstName lastName rollNumber section')
      .populate('sender', 'firstName lastName email role')
      .lean();

    logger.info(`✅ Communication sent to parent: ${parent._id}`);

    // Send real-time notification via socket
    try {
      const { emitToUser } = await import('../socket/socketHandler.js');
      emitToUser(parent._id.toString(), 'notification:new', {
        type: 'communication',
        title: 'New Message from School',
        message: `Regarding ${student.firstName} ${student.lastName}: ${subject}`,
        priority: priority || 'Normal',
        data: {
          communicationId: communication._id.toString(),
          studentName: `${student.firstName} ${student.lastName}`,
          subject,
          type
        },
        createdAt: new Date()
      });
      logger.info(`✅ Real-time notification sent to parent: ${parent._id}`);
    } catch (socketError) {
      logger.error('❌ Failed to send socket notification:', socketError);
      // Don't fail the request if socket fails
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully to parent',
      data: {
        communication: {
          ...populatedCommunication,
          id: populatedCommunication._id.toString(),
          _id: populatedCommunication._id.toString()
        },
        parentId: parent._id.toString(),
        parentName: `${parent.firstName} ${parent.lastName}`,
        parentEmail: parent.email
      }
    });

  } catch (error) {
    logger.error('❌ Error sending communication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
