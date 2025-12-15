import AuditLog from "../models/AuditLog.js";
import logger from "../utils/logger.js";

/**
 * Log user action
 */
export const logAction = async ({
  user,
  action,
  actionDescription,
  resourceType = null,
  resourceId = null,
  resourceName = null,
  relatedStudent = null,
  relatedClass = null,
  req = null,
  oldValues = null,
  newValues = null,
  changedFields = [],
  metadata = null,
  tags = [],
  riskLevel = "Low",
  isSuspicious = false,
  suspiciousReason = null,
  status = "Success",
  errorMessage = null,
  errorCode = null,
  isComplianceRelevant = false,
  complianceType = null
}) => {
  try {
    // Extract request information if available
    let ipAddress = "unknown";
    let userAgent = null;
    let requestMethod = null;
    let requestUrl = null;
    let requestHeaders = null;

    if (req) {
      ipAddress = req.ip || req.connection.remoteAddress || "unknown";
      userAgent = req.get("User-Agent");
      requestMethod = req.method;
      requestUrl = req.originalUrl;
      requestHeaders = new Map(Object.entries(req.headers));
    }

    const auditData = {
      user,
      action,
      actionDescription,
      resourceType,
      resourceId,
      resourceName,
      relatedStudent,
      relatedClass,
      ipAddress,
      userAgent,
      requestMethod,
      requestUrl,
      requestHeaders,
      oldValues: oldValues ? new Map(Object.entries(oldValues)) : null,
      newValues: newValues ? new Map(Object.entries(newValues)) : null,
      changedFields,
      metadata: metadata ? new Map(Object.entries(metadata)) : null,
      tags,
      riskLevel,
      isSuspicious,
      suspiciousReason,
      status,
      errorMessage,
      errorCode,
      isComplianceRelevant,
      complianceType
    };

    return await AuditLog.logAction(auditData);
  } catch (error) {
    logger.error("Audit logging failed:", error);
    // Don't throw error to avoid breaking the main operation
    return null;
  }
};

/**
 * Log authentication events
 */
export const logAuth = async (user, action, req, additionalData = {}) => {
  const actions = {
    LOGIN: "User logged in successfully",
    LOGOUT: "User logged out",
    LOGIN_FAILED: "Login attempt failed",
    PASSWORD_CHANGED: "User changed password",
    PASSWORD_RESET: "Password reset requested"
  };

  return await logAction({
    user: user || { _id: null, role: "unknown", fullName: "Unknown", email: "unknown" },
    action,
    actionDescription: actions[action] || action,
    resourceType: "User",
    resourceId: user?._id,
    resourceName: user?.fullName,
    req,
    metadata: additionalData,
    riskLevel: action === "LOGIN_FAILED" ? "Medium" : "Low",
    isSuspicious: action === "LOGIN_FAILED",
    isComplianceRelevant: true,
    complianceType: "Privacy"
  });
};

/**
 * Log student-related actions
 */
export const logStudentAction = async (user, action, student, req, additionalData = {}) => {
  const actions = {
    STUDENT_CREATED: `Created new student: ${student.fullName}`,
    STUDENT_UPDATED: `Updated student information: ${student.fullName}`,
    STUDENT_DELETED: `Deleted student: ${student.fullName}`,
    STUDENT_VIEWED: `Viewed student profile: ${student.fullName}`,
    STUDENT_IMPORTED: `Imported student data: ${student.fullName}`,
    STUDENT_EXPORTED: `Exported student data: ${student.fullName}`
  };

  return await logAction({
    user,
    action,
    actionDescription: actions[action] || `${action}: ${student.fullName}`,
    resourceType: "Student",
    resourceId: student._id,
    resourceName: student.fullName,
    relatedStudent: student._id,
    relatedClass: student.class,
    req,
    metadata: additionalData,
    riskLevel: ["STUDENT_DELETED", "STUDENT_EXPORTED"].includes(action) ? "High" : "Low",
    isComplianceRelevant: true,
    complianceType: "FERPA"
  });
};

/**
 * Log attendance actions
 */
export const logAttendanceAction = async (user, action, attendanceData, req, additionalData = {}) => {
  const student = attendanceData.student;
  const actions = {
    ATTENDANCE_MARKED: `Marked attendance for ${student?.fullName || 'student'}`,
    ATTENDANCE_UPDATED: `Updated attendance for ${student?.fullName || 'student'}`,
    ATTENDANCE_BULK_MARKED: `Bulk attendance marked for class`
  };

  return await logAction({
    user,
    action,
    actionDescription: actions[action] || action,
    resourceType: "Attendance",
    resourceId: attendanceData._id,
    resourceName: `Attendance - ${student?.fullName || 'Unknown'}`,
    relatedStudent: student?._id,
    relatedClass: attendanceData.class,
    req,
    metadata: {
      date: attendanceData.date,
      status: attendanceData.status,
      ...additionalData
    },
    riskLevel: "Low"
  });
};

/**
 * Log grade actions
 */
export const logGradeAction = async (user, action, grade, req, additionalData = {}) => {
  const actions = {
    GRADE_ADDED: `Added grade for student`,
    GRADE_UPDATED: `Updated grade for student`,
    GRADE_DELETED: `Deleted grade for student`,
    GRADE_PUBLISHED: `Published grades for exam`
  };

  return await logAction({
    user,
    action,
    actionDescription: actions[action] || action,
    resourceType: "Grade",
    resourceId: grade._id,
    resourceName: `${grade.subject} - ${grade.examName}`,
    relatedStudent: grade.student,
    relatedClass: grade.class,
    req,
    metadata: {
      subject: grade.subject,
      examName: grade.examName,
      marksObtained: grade.marksObtained,
      maxMarks: grade.maxMarks,
      ...additionalData
    },
    riskLevel: "Low",
    isComplianceRelevant: true,
    complianceType: "FERPA"
  });
};

/**
 * Log intervention actions
 */
export const logInterventionAction = async (user, action, intervention, req, additionalData = {}) => {
  const actions = {
    INTERVENTION_CREATED: `Created intervention: ${intervention.title}`,
    INTERVENTION_UPDATED: `Updated intervention: ${intervention.title}`,
    INTERVENTION_APPROVED: `Approved intervention: ${intervention.title}`,
    INTERVENTION_REJECTED: `Rejected intervention: ${intervention.title}`,
    INTERVENTION_COMPLETED: `Completed intervention: ${intervention.title}`,
    INTERVENTION_CANCELLED: `Cancelled intervention: ${intervention.title}`
  };

  return await logAction({
    user,
    action,
    actionDescription: actions[action] || action,
    resourceType: "Intervention",
    resourceId: intervention._id,
    resourceName: intervention.title,
    relatedStudent: intervention.student,
    req,
    metadata: {
      type: intervention.type,
      priority: intervention.priority,
      status: intervention.status,
      ...additionalData
    },
    riskLevel: intervention.priority === "Urgent" ? "High" : "Medium"
  });
};

/**
 * Log session actions
 */
export const logSessionAction = async (user, action, session, req, additionalData = {}) => {
  const actions = {
    SESSION_SCHEDULED: `Scheduled counseling session`,
    SESSION_CONDUCTED: `Conducted counseling session`,
    SESSION_CANCELLED: `Cancelled counseling session`,
    SESSION_RESCHEDULED: `Rescheduled counseling session`
  };

  return await logAction({
    user,
    action,
    actionDescription: actions[action] || action,
    resourceType: "Session",
    resourceId: session._id,
    resourceName: `Session #${session.sessionNumber}`,
    relatedStudent: session.student,
    req,
    metadata: {
      sessionType: session.sessionType,
      scheduledDate: session.scheduledDate,
      status: session.status,
      ...additionalData
    },
    riskLevel: "Medium",
    isComplianceRelevant: true,
    complianceType: "Privacy"
  });
};

/**
 * Log risk assessment actions
 */
export const logRiskAction = async (user, action, student, req, additionalData = {}) => {
  const actions = {
    RISK_CALCULATED: `Risk assessment calculated for ${student.fullName}`,
    RISK_UPDATED: `Risk level updated for ${student.fullName}`,
    RISK_VALIDATED: `Risk assessment validated for ${student.fullName}`
  };

  return await logAction({
    user,
    action,
    actionDescription: actions[action] || action,
    resourceType: "RiskFactor",
    resourceName: `Risk Assessment - ${student.fullName}`,
    relatedStudent: student._id,
    req,
    metadata: {
      riskLevel: student.riskLevel,
      riskScore: student.riskScore,
      ...additionalData
    },
    riskLevel: student.riskLevel === "Critical" ? "High" : "Medium"
  });
};

/**
 * Log document actions
 */
export const logDocumentAction = async (user, action, document, req, additionalData = {}) => {
  const actions = {
    DOCUMENT_UPLOADED: `Uploaded document: ${document.title}`,
    DOCUMENT_DOWNLOADED: `Downloaded document: ${document.title}`,
    DOCUMENT_DELETED: `Deleted document: ${document.title}`,
    DOCUMENT_VERIFIED: `Verified document: ${document.title}`
  };

  return await logAction({
    user,
    action,
    actionDescription: actions[action] || action,
    resourceType: "Document",
    resourceId: document._id,
    resourceName: document.title,
    relatedStudent: document.relatedStudent,
    req,
    metadata: {
      documentType: document.documentType,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      ...additionalData
    },
    riskLevel: action === "DOCUMENT_DELETED" ? "Medium" : "Low",
    isComplianceRelevant: true,
    complianceType: "Data Protection"
  });
};

/**
 * Log notification actions
 */
export const logNotificationAction = async (user, action, notification, req, additionalData = {}) => {
  const actions = {
    NOTIFICATION_SENT: `Sent notification: ${notification.title}`,
    NOTIFICATION_READ: `Read notification: ${notification.title}`
  };

  return await logAction({
    user,
    action,
    actionDescription: actions[action] || action,
    resourceType: "Notification",
    resourceId: notification._id,
    resourceName: notification.title,
    relatedStudent: notification.relatedStudent,
    req,
    metadata: {
      type: notification.type,
      priority: notification.priority,
      channels: notification.channels,
      ...additionalData
    },
    riskLevel: "Low"
  });
};

/**
 * Log report actions
 */
export const logReportAction = async (user, action, reportData, req, additionalData = {}) => {
  const actions = {
    REPORT_GENERATED: `Generated report: ${reportData.title || reportData.type}`,
    REPORT_DOWNLOADED: `Downloaded report: ${reportData.title || reportData.type}`,
    REPORT_SHARED: `Shared report: ${reportData.title || reportData.type}`
  };

  return await logAction({
    user,
    action,
    actionDescription: actions[action] || action,
    resourceType: "Report",
    resourceId: reportData._id,
    resourceName: reportData.title || reportData.type,
    req,
    metadata: {
      reportType: reportData.type,
      format: reportData.format,
      dateRange: reportData.dateRange,
      ...additionalData
    },
    riskLevel: "Medium",
    isComplianceRelevant: true,
    complianceType: "Data Protection"
  });
};

/**
 * Log user management actions
 */
export const logUserAction = async (user, action, targetUser, req, additionalData = {}) => {
  const actions = {
    USER_CREATED: `Created new user: ${targetUser.fullName}`,
    USER_UPDATED: `Updated user: ${targetUser.fullName}`,
    USER_DEACTIVATED: `Deactivated user: ${targetUser.fullName}`,
    USER_ACTIVATED: `Activated user: ${targetUser.fullName}`
  };

  return await logAction({
    user,
    action,
    actionDescription: actions[action] || action,
    resourceType: "User",
    resourceId: targetUser._id,
    resourceName: targetUser.fullName,
    req,
    metadata: {
      targetUserRole: targetUser.role,
      targetUserEmail: targetUser.email,
      ...additionalData
    },
    riskLevel: ["USER_CREATED", "USER_DEACTIVATED"].includes(action) ? "High" : "Medium",
    isComplianceRelevant: true,
    complianceType: "Privacy"
  });
};

/**
 * Log system actions
 */
export const logSystemAction = async (user, action, req, additionalData = {}) => {
  const actions = {
    SYSTEM_BACKUP: "System backup initiated",
    SYSTEM_RESTORE: "System restore initiated",
    SETTINGS_UPDATED: "System settings updated",
    DATA_EXPORTED: "System data exported",
    DATA_IMPORTED: "System data imported"
  };

  return await logAction({
    user,
    action,
    actionDescription: actions[action] || action,
    resourceType: "System",
    req,
    metadata: additionalData,
    riskLevel: ["SYSTEM_RESTORE", "DATA_IMPORTED"].includes(action) ? "Critical" : "High",
    isComplianceRelevant: true,
    complianceType: "Data Protection"
  });
};

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (filters = {}, options = {}) => {
  try {
    const {
      userId,
      action,
      resourceType,
      startDate,
      endDate,
      riskLevel,
      isSuspicious,
      status
    } = filters;

    const {
      page = 1,
      limit = 50,
      sortBy = "timestamp",
      sortOrder = "desc"
    } = options;

    // Build query
    const query = {};

    if (userId) query.user = userId;
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (riskLevel) query.riskLevel = riskLevel;
    if (isSuspicious !== undefined) query.isSuspicious = isSuspicious;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Execute query
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate("user", "firstName lastName email role")
        .populate("relatedStudent", "firstName lastName rollNumber")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select("-requestHeaders -oldValues -newValues"), // Exclude sensitive data
      AuditLog.countDocuments(query)
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error("Get audit logs error:", error);
    throw error;
  }
};

/**
 * Get audit statistics
 */
export const getAuditStatistics = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalLogs,
      suspiciousActivities,
      failedActions,
      userActivity,
      actionDistribution,
      riskDistribution
    ] = await Promise.all([
      AuditLog.countDocuments({ timestamp: { $gte: startDate } }),
      AuditLog.countDocuments({ 
        timestamp: { $gte: startDate },
        isSuspicious: true 
      }),
      AuditLog.countDocuments({ 
        timestamp: { $gte: startDate },
        status: "Failed" 
      }),
      getUserActivityStats(startDate),
      getActionDistribution(startDate),
      getRiskDistribution(startDate)
    ]);

    return {
      totalLogs,
      suspiciousActivities,
      failedActions,
      userActivity,
      actionDistribution,
      riskDistribution
    };
  } catch (error) {
    logger.error("Audit statistics error:", error);
    throw error;
  }
};

/**
 * Get user activity statistics
 */
const getUserActivityStats = async (startDate) => {
  try {
    const pipeline = [
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: "$userRole",
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: "$user" }
        }
      },
      {
        $project: {
          _id: 1,
          count: 1,
          uniqueUsers: { $size: "$uniqueUsers" }
        }
      }
    ];

    return await AuditLog.aggregate(pipeline);
  } catch (error) {
    logger.error("User activity stats error:", error);
    return [];
  }
};

/**
 * Get action distribution
 */
const getActionDistribution = async (startDate) => {
  try {
    const pipeline = [
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ];

    return await AuditLog.aggregate(pipeline);
  } catch (error) {
    logger.error("Action distribution error:", error);
    return [];
  }
};

/**
 * Get risk distribution in audit logs
 */
const getRiskDistribution = async (startDate) => {
  try {
    const pipeline = [
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: "$riskLevel",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ];

    return await AuditLog.aggregate(pipeline);
  } catch (error) {
    logger.error("Risk distribution error:", error);
    return [];
  }
};

/**
 * Detect suspicious activities
 */
export const detectSuspiciousActivities = async () => {
  try {
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    // Multiple failed login attempts
    const failedLogins = await AuditLog.aggregate([
      {
        $match: {
          action: "LOGIN_FAILED",
          timestamp: { $gte: last24Hours }
        }
      },
      {
        $group: {
          _id: "$ipAddress",
          count: { $sum: 1 },
          users: { $addToSet: "$userEmail" }
        }
      },
      {
        $match: { count: { $gte: 5 } }
      }
    ]);

    // Unusual access patterns
    const unusualAccess = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: last24Hours },
          action: { $in: ["STUDENT_VIEWED", "DOCUMENT_DOWNLOADED"] }
        }
      },
      {
        $group: {
          _id: "$user",
          count: { $sum: 1 },
          distinctResources: { $addToSet: "$resourceId" }
        }
      },
      {
        $match: { count: { $gte: 100 } }
      }
    ]);

    return {
      failedLogins,
      unusualAccess,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error("Suspicious activity detection error:", error);
    return { failedLogins: [], unusualAccess: [], timestamp: new Date() };
  }
};

export default {
  logAction,
  logAuth,
  logStudentAction,
  logAttendanceAction,
  logGradeAction,
  logInterventionAction,
  logSessionAction,
  logRiskAction,
  logDocumentAction,
  logNotificationAction,
  logReportAction,
  logUserAction,
  logSystemAction,
  getAuditLogs,
  getAuditStatistics,
  detectSuspiciousActivities
};