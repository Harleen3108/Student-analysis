// User Roles
export const USER_ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  COUNSELOR: "counselor",
  PARENT: "parent",
};

// Student Status
export const STUDENT_STATUS = {
  ACTIVE: "Active",
  AT_RISK: "At Risk",
  INTERVENTION: "Intervention",
  DROPOUT: "Dropout",
  TRANSFERRED: "Transferred",
  GRADUATED: "Graduated",
};

// Risk Levels
export const RISK_LEVELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

// Attendance Status
export const ATTENDANCE_STATUS = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  HALF_DAY: "Half Day",
  EXCUSED: "Excused",
};

// Grade Levels
export const GRADE_LEVELS = {
  A_PLUS: "A+",
  A: "A",
  B_PLUS: "B+",
  B: "B",
  C_PLUS: "C+",
  C: "C",
  D: "D",
  E: "E",
  F: "F",
};

// Intervention Types
export const INTERVENTION_TYPES = {
  COUNSELING: "Counseling",
  PARENT_MEETING: "Parent Meeting",
  FINANCIAL_AID: "Financial Aid",
  REMEDIAL_CLASSES: "Remedial Classes",
  HOME_VISIT: "Home Visit",
  BEHAVIORAL_SUPPORT: "Behavioral Support",
  ACADEMIC_SUPPORT: "Academic Support",
  HEALTH_SUPPORT: "Health Support",
  MENTORING: "Mentoring",
  PEER_SUPPORT: "Peer Support",
  OTHER: "Other",
};

// Intervention Status
export const INTERVENTION_STATUS = {
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
};

// Notification Types
export const NOTIFICATION_TYPES = {
  ATTENDANCE_ALERT: "Attendance Alert",
  GRADE_UPDATE: "Grade Update",
  RISK_LEVEL_CHANGE: "Risk Level Change",
  INTERVENTION_CREATED: "Intervention Created",
  INTERVENTION_APPROVED: "Intervention Approved",
  INTERVENTION_UPDATE: "Intervention Update",
  PARENT_MEETING: "Parent Meeting",
  SYSTEM_ALERT: "System Alert",
  ACHIEVEMENT: "Achievement",
  REMINDER: "Reminder",
  EMERGENCY: "Emergency",
  OTHER: "Other",
};

// Risk Factor Weights
export const RISK_WEIGHTS = {
  ATTENDANCE: 0.25,
  ACADEMIC: 0.25,
  FINANCIAL: 0.15,
  BEHAVIORAL: 0.1,
  HEALTH: 0.1,
  DISTANCE: 0.1,
  FAMILY: 0.05,
};

// Risk Thresholds
export const RISK_THRESHOLDS = {
  LOW: parseInt(process.env.RISK_THRESHOLD_LOW) || 30,
  MEDIUM: parseInt(process.env.RISK_THRESHOLD_MEDIUM) || 60,
  HIGH: parseInt(process.env.RISK_THRESHOLD_HIGH) || 80,
};

// Academic Year
export const CURRENT_ACADEMIC_YEAR = "2024-2025";

// File Upload Limits
export const FILE_LIMITS = {
  MAX_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/jpg", "application/pdf"],
};

export default {
  USER_ROLES,
  STUDENT_STATUS,
  RISK_LEVELS,
  ATTENDANCE_STATUS,
  GRADE_LEVELS,
  INTERVENTION_TYPES,
  INTERVENTION_STATUS,
  NOTIFICATION_TYPES,
  RISK_WEIGHTS,
  RISK_THRESHOLDS,
  CURRENT_ACADEMIC_YEAR,
  FILE_LIMITS,
};
