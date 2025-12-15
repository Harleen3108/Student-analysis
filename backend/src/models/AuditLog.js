import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    // User Information
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    userRole: {
      type: String,
      enum: ["admin", "teacher", "counselor", "parent"],
      required: [true, "User role is required"],
    },
    userName: {
      type: String,
      required: [true, "User name is required"],
    },
    userEmail: {
      type: String,
      required: [true, "User email is required"],
    },

    // Action Information
    action: {
      type: String,
      required: [true, "Action is required"],
      enum: [
        // Authentication
        "LOGIN",
        "LOGOUT",
        "LOGIN_FAILED",
        "PASSWORD_CHANGED",
        "PASSWORD_RESET",
        
        // Student Management
        "STUDENT_CREATED",
        "STUDENT_UPDATED",
        "STUDENT_DELETED",
        "STUDENT_VIEWED",
        "STUDENT_IMPORTED",
        "STUDENT_EXPORTED",
        
        // Attendance
        "ATTENDANCE_MARKED",
        "ATTENDANCE_UPDATED",
        "ATTENDANCE_BULK_MARKED",
        
        // Grades
        "GRADE_ADDED",
        "GRADE_UPDATED",
        "GRADE_DELETED",
        "GRADE_PUBLISHED",
        
        // Interventions
        "INTERVENTION_CREATED",
        "INTERVENTION_UPDATED",
        "INTERVENTION_APPROVED",
        "INTERVENTION_REJECTED",
        "INTERVENTION_COMPLETED",
        "INTERVENTION_CANCELLED",
        
        // Sessions
        "SESSION_SCHEDULED",
        "SESSION_CONDUCTED",
        "SESSION_CANCELLED",
        "SESSION_RESCHEDULED",
        
        // Risk Assessment
        "RISK_CALCULATED",
        "RISK_UPDATED",
        "RISK_VALIDATED",
        
        // Reports
        "REPORT_GENERATED",
        "REPORT_DOWNLOADED",
        "REPORT_SHARED",
        
        // Notifications
        "NOTIFICATION_SENT",
        "NOTIFICATION_READ",
        
        // Documents
        "DOCUMENT_UPLOADED",
        "DOCUMENT_DOWNLOADED",
        "DOCUMENT_DELETED",
        "DOCUMENT_VERIFIED",
        
        // User Management
        "USER_CREATED",
        "USER_UPDATED",
        "USER_DEACTIVATED",
        "USER_ACTIVATED",
        
        // System
        "SYSTEM_BACKUP",
        "SYSTEM_RESTORE",
        "SETTINGS_UPDATED",
        
        // Data Export/Import
        "DATA_EXPORTED",
        "DATA_IMPORTED",
        
        // Other
        "OTHER",
      ],
    },
    actionDescription: {
      type: String,
      required: [true, "Action description is required"],
    },

    // Resource Information
    resourceType: {
      type: String,
      enum: [
        "Student",
        "User",
        "Attendance",
        "Grade",
        "Intervention",
        "Session",
        "RiskFactor",
        "Notification",
        "Document",
        "Report",
        "Class",
        "Setting",
        "System",
        "Other",
      ],
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    resourceName: {
      type: String, // Human readable name of the resource
    },

    // Related Entities
    relatedStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
    relatedClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },

    // Request Information
    ipAddress: {
      type: String,
      required: [true, "IP address is required"],
    },
    userAgent: {
      type: String,
    },
    requestMethod: {
      type: String,
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    },
    requestUrl: {
      type: String,
    },
    requestHeaders: {
      type: Map,
      of: String,
    },

    // Response Information
    responseStatus: {
      type: Number,
    },
    responseTime: {
      type: Number, // in milliseconds
    },

    // Data Changes (for update operations)
    oldValues: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    newValues: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    changedFields: [String],

    // Additional Context
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    tags: [String],
    
    // Risk and Security
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
    },
    isSuspicious: {
      type: Boolean,
      default: false,
    },
    suspiciousReason: String,

    // Session Information
    sessionId: String,
    deviceInfo: {
      type: String,
    },
    location: {
      country: String,
      city: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },

    // Status
    status: {
      type: String,
      enum: ["Success", "Failed", "Partial", "Warning"],
      default: "Success",
    },
    errorMessage: String,
    errorCode: String,

    // Compliance and Legal
    isComplianceRelevant: {
      type: Boolean,
      default: false,
    },
    complianceType: {
      type: String,
      enum: ["GDPR", "FERPA", "Data Protection", "Privacy", "Other"],
    },
    retentionPeriod: {
      type: Number, // in days
      default: 2555, // 7 years default
    },
    
    // Timestamp (already handled by timestamps: true, but explicit for clarity)
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance and querying
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ relatedStudent: 1, timestamp: -1 });
auditLogSchema.index({ ipAddress: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ riskLevel: 1, isSuspicious: 1 });
auditLogSchema.index({ status: 1 });

// TTL Index - Delete logs after retention period
auditLogSchema.index(
  { timestamp: 1 },
  { 
    expireAfterSeconds: 0,
    partialFilterExpression: { 
      timestamp: { $lt: new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000) } // 7 years
    }
  }
);

// Text index for searching
auditLogSchema.index({
  actionDescription: "text",
  resourceName: "text",
  errorMessage: "text",
});

// Static method to log an action
auditLogSchema.statics.logAction = async function ({
  user,
  action,
  actionDescription,
  resourceType = null,
  resourceId = null,
  resourceName = null,
  relatedStudent = null,
  relatedClass = null,
  ipAddress,
  userAgent = null,
  requestMethod = null,
  requestUrl = null,
  requestHeaders = null,
  responseStatus = null,
  responseTime = null,
  oldValues = null,
  newValues = null,
  changedFields = [],
  metadata = null,
  tags = [],
  riskLevel = "Low",
  isSuspicious = false,
  suspiciousReason = null,
  sessionId = null,
  deviceInfo = null,
  location = null,
  status = "Success",
  errorMessage = null,
  errorCode = null,
  isComplianceRelevant = false,
  complianceType = null,
}) {
  try {
    const auditLog = new this({
      user: user._id,
      userRole: user.role,
      userName: user.fullName || `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
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
      responseStatus,
      responseTime,
      oldValues,
      newValues,
      changedFields,
      metadata,
      tags,
      riskLevel,
      isSuspicious,
      suspiciousReason,
      sessionId,
      deviceInfo,
      location,
      status,
      errorMessage,
      errorCode,
      isComplianceRelevant,
      complianceType,
    });

    return await auditLog.save();
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw error to avoid breaking the main operation
    return null;
  }
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = async function (
  userId,
  startDate = null,
  endDate = null,
  limit = 100
) {
  const query = { user: userId };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  return await this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .select("-requestHeaders -oldValues -newValues");
};

// Static method to get suspicious activities
auditLogSchema.statics.getSuspiciousActivities = async function (days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.find({
    $or: [
      { isSuspicious: true },
      { riskLevel: { $in: ["High", "Critical"] } },
      { status: "Failed" },
    ],
    timestamp: { $gte: startDate },
  })
    .sort({ timestamp: -1 })
    .populate("user", "firstName lastName email role");
};

// Static method to get activity summary
auditLogSchema.statics.getActivitySummary = async function (days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const pipeline = [
    {
      $match: {
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          action: "$action",
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp",
            },
          },
        },
        count: { $sum: 1 },
        users: { $addToSet: "$user" },
      },
    },
    {
      $group: {
        _id: "$_id.action",
        totalCount: { $sum: "$count" },
        uniqueUsers: { $sum: { $size: "$users" } },
        dailyActivity: {
          $push: {
            date: "$_id.date",
            count: "$count",
          },
        },
      },
    },
    {
      $sort: { totalCount: -1 },
    },
  ];

  return await this.aggregate(pipeline);
};

// Static method to get resource access logs
auditLogSchema.statics.getResourceAccessLogs = async function (
  resourceType,
  resourceId,
  limit = 50
) {
  return await this.find({
    resourceType,
    resourceId,
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("user", "firstName lastName email role")
    .select("-requestHeaders -oldValues -newValues");
};

// Method to check if log should be retained
auditLogSchema.methods.shouldRetain = function () {
  const retentionDate = new Date(this.timestamp);
  retentionDate.setDate(retentionDate.getDate() + this.retentionPeriod);
  return new Date() < retentionDate;
};

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;