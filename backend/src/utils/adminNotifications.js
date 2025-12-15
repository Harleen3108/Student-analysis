import { createNotification } from '../services/notificationService.js';
import User from '../models/User.js';
import logger from './logger.js';

/**
 * Send notification to all admins
 */
export const notifyAdmins = async ({
  type,
  priority = 'Normal',
  title,
  message,
  relatedStudent = null,
  relatedEntity = null,
  actionButton = null,
  createdBy = null
}) => {
  try {
    // Get all active admins
    const admins = await User.find({ role: 'admin', isActive: true });

    if (admins.length === 0) {
      logger.warn('No active admins found to send notification');
      return;
    }

    // Send notification to each admin
    const notificationPromises = admins.map(admin =>
      createNotification({
        recipientId: admin._id,
        type,
        priority,
        title,
        message,
        relatedStudent,
        relatedEntity,
        channels: {
          inApp: true,
          email: priority === 'High' || priority === 'Critical',
          sms: false,
          push: false
        },
        actionButton,
        createdBy
      })
    );

    await Promise.allSettled(notificationPromises);
    logger.info(`Notification sent to ${admins.length} admin(s): ${title}`);
  } catch (error) {
    logger.error('Error sending admin notification:', error);
  }
};

/**
 * Notify admins about new observation
 */
export const notifyObservationCreated = async (observation, teacher) => {
  const student = observation.student;
  const severityEmoji = {
    Low: '🟢',
    Medium: '🟡',
    High: '🟠',
    Critical: '🔴'
  };

  await notifyAdmins({
    type: 'System Alert',
    priority: observation.severity === 'Critical' || observation.severity === 'High' ? 'High' : 'Normal',
    title: `${severityEmoji[observation.severity]} New Observation: ${observation.observationType}`,
    message: `${teacher.firstName} ${teacher.lastName} created a ${observation.severity} severity ${observation.observationType} observation for ${student.firstName} ${student.lastName} (${student.rollNumber}): "${observation.title}"`,
    relatedStudent: student._id,
    relatedEntity: {
      entityType: 'Other',
      entityId: observation._id
    },
    actionButton: {
      text: 'View Student',
      link: `/students/${student._id}`
    },
    createdBy: teacher._id
  });
};

/**
 * Notify admins about grades submission
 */
export const notifyGradesSubmitted = async (className, subject, examType, examName, studentsCount, teacher) => {
  await notifyAdmins({
    type: 'Grade Update',
    priority: 'Normal',
    title: `📝 Grades Submitted: ${className} - ${subject}`,
    message: `${teacher.firstName} ${teacher.lastName} submitted ${examType} grades for ${studentsCount} students in Class ${className} (${subject} - ${examName})`,
    actionButton: {
      text: 'View Class Performance',
      link: `/analytics/class-performance`
    },
    createdBy: teacher._id
  });
};

/**
 * Notify admins about attendance marked
 */
export const notifyAttendanceMarked = async (className, date, summary, teacher) => {
  const absentCount = summary.absent || 0;
  const priority = absentCount > 5 ? 'High' : 'Normal';
  
  await notifyAdmins({
    type: 'Attendance Alert',
    priority,
    title: `📅 Attendance Marked: Class ${className}`,
    message: `${teacher.firstName} ${teacher.lastName} marked attendance for Class ${className} on ${new Date(date).toLocaleDateString()}. Present: ${summary.present || 0}, Absent: ${absentCount}, Late: ${summary.late || 0}`,
    actionButton: {
      text: 'View Attendance',
      link: `/analytics/attendance-trend`
    },
    createdBy: teacher._id
  });
};

/**
 * Notify admins about high absence rate
 */
export const notifyHighAbsenceRate = async (className, date, absentStudents, teacher) => {
  if (absentStudents.length === 0) return;

  const studentNames = absentStudents.slice(0, 3).map(s => s.firstName + ' ' + s.lastName).join(', ');
  const moreCount = absentStudents.length > 3 ? ` and ${absentStudents.length - 3} more` : '';

  await notifyAdmins({
    type: 'Attendance Alert',
    priority: 'High',
    title: `⚠️ High Absence Alert: Class ${className}`,
    message: `${absentStudents.length} students were absent in Class ${className} on ${new Date(date).toLocaleDateString()}: ${studentNames}${moreCount}. This may require attention.`,
    actionButton: {
      text: 'View At-Risk Students',
      link: `/risk-analysis`
    },
    createdBy: teacher._id
  });
};

/**
 * Notify admins about observation update
 */
export const notifyObservationUpdated = async (observation, teacher) => {
  const student = observation.student;

  await notifyAdmins({
    type: 'System Alert',
    priority: 'Normal',
    title: `✏️ Observation Updated`,
    message: `${teacher.firstName} ${teacher.lastName} updated an observation for ${student.firstName} ${student.lastName} (${student.rollNumber}): "${observation.title}"`,
    relatedStudent: student._id,
    actionButton: {
      text: 'View Student',
      link: `/students/${student._id}`
    },
    createdBy: teacher._id
  });
};

/**
 * Notify admins about critical observation
 */
export const notifyCriticalObservation = async (observation, teacher) => {
  const student = observation.student;

  await notifyAdmins({
    type: 'Emergency',
    priority: 'Critical',
    title: `🚨 CRITICAL: ${observation.observationType} Observation`,
    message: `URGENT: ${teacher.firstName} ${teacher.lastName} reported a CRITICAL ${observation.observationType} observation for ${student.firstName} ${student.lastName} (${student.rollNumber}): "${observation.title}". Immediate attention required!`,
    relatedStudent: student._id,
    relatedEntity: {
      entityType: 'Other',
      entityId: observation._id
    },
    actionButton: {
      text: 'View Details',
      link: `/students/${student._id}`
    },
    createdBy: teacher._id
  });
};
