import { body, param, query, validationResult } from "express-validator";
import { AppError } from "./errorHandler.js";
import mongoose from "mongoose";

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  try {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
      }));
      
      return next(new AppError("Validation failed", 400, errorMessages));
    }
    
    next();
  } catch (error) {
    // If there's an issue with validation result, just continue
    console.warn("Validation middleware error:", error.message);
    next();
  }
};

/**
 * Validate MongoDB ObjectId
 */
export const validateObjectId = (paramName = "id") => {
  return param(paramName)
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid ID format");
      }
      return true;
    });
};

/**
 * User registration validation
 */
export const validateUserRegistration = [
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("First name can only contain letters and spaces"),
    
  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Last name can only contain letters and spaces"),
    
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
    
  body("phone")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please provide a valid 10-digit Indian mobile number"),
    
  body("password")
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be between 6 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),
    
  body("role")
    .isIn(["admin", "teacher", "counselor", "parent"])
    .withMessage("Invalid user role"),
    
  handleValidationErrors,
];

/**
 * User login validation
 */
export const validateUserLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
    
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
    
  handleValidationErrors,
];

/**
 * Student creation validation
 */
export const validateStudentCreation = [
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("First name can only contain letters and spaces"),
    
  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Last name can only contain letters and spaces"),
    
  body("rollNumber")
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage("Roll number must be between 1 and 20 characters")
    .matches(/^[A-Z0-9]+$/)
    .withMessage("Roll number can only contain uppercase letters and numbers"),
    
  body("admissionNumber")
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage("Admission number must be between 1 and 20 characters")
    .matches(/^[A-Z0-9]+$/)
    .withMessage("Admission number can only contain uppercase letters and numbers"),
    
  body("dateOfBirth")
    .isISO8601()
    .withMessage("Please provide a valid date of birth")
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 5 || age > 25) {
        throw new Error("Student age must be between 5 and 25 years");
      }
      return true;
    }),
    
  body("gender")
    .isIn(["Male", "Female", "Other"])
    .withMessage("Gender must be Male, Female, or Other"),
    
  body("class")
    .isMongoId()
    .withMessage("Please provide a valid class ID"),
    
  body("section")
    .trim()
    .isLength({ min: 1, max: 5 })
    .withMessage("Section must be between 1 and 5 characters")
    .matches(/^[A-Z]+$/)
    .withMessage("Section must be uppercase letters only"),
    
  body("father.name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Father's name must be between 2 and 50 characters"),
    
  body("father.phone")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please provide a valid 10-digit mobile number for father"),
    
  body("mother.name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Mother's name must be between 2 and 50 characters"),
    
  body("mother.phone")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please provide a valid 10-digit mobile number for mother"),
    
  body("familyIncomeLevel")
    .isIn(["Below Poverty Line", "Low Income", "Middle Income", "High Income"])
    .withMessage("Invalid family income level"),
    
  body("distanceFromSchool")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Distance from school must be between 0 and 100 km"),
    
  body("transportationMode")
    .isIn(["Walk", "Bicycle", "School Bus", "Public Transport", "Private Vehicle"])
    .withMessage("Invalid transportation mode"),
    
  handleValidationErrors,
];

/**
 * Attendance marking validation
 */
export const validateAttendanceMarking = [
  body("student")
    .isMongoId()
    .withMessage("Please provide a valid student ID"),
    
  body("class")
    .isMongoId()
    .withMessage("Please provide a valid class ID"),
    
  body("date")
    .isISO8601()
    .withMessage("Please provide a valid date")
    .custom((value) => {
      const attendanceDate = new Date(value);
      const today = new Date();
      const diffTime = Math.abs(today - attendanceDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 30) {
        throw new Error("Cannot mark attendance for dates older than 30 days");
      }
      return true;
    }),
    
  body("status")
    .isIn(["Present", "Absent", "Late", "Excused"])
    .withMessage("Status must be Present, Absent, Late, or Excused"),
    
  body("timeIn")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Time in must be in HH:MM format"),
    
  body("lateMinutes")
    .optional()
    .isInt({ min: 0, max: 480 })
    .withMessage("Late minutes must be between 0 and 480"),
    
  handleValidationErrors,
];

/**
 * Grade entry validation
 */
export const validateGradeEntry = [
  body("student")
    .isMongoId()
    .withMessage("Please provide a valid student ID"),
    
  body("class")
    .isMongoId()
    .withMessage("Please provide a valid class ID"),
    
  body("subject")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Subject name must be between 2 and 50 characters"),
    
  body("examType")
    .isIn(["Unit Test", "Monthly Test", "Mid Term", "Final", "Quarterly", "Half Yearly", "Annual", "Assignment", "Project", "Other"])
    .withMessage("Invalid exam type"),
    
  body("examName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Exam name must be between 2 and 100 characters"),
    
  body("examDate")
    .isISO8601()
    .withMessage("Please provide a valid exam date"),
    
  body("marksObtained")
    .isFloat({ min: 0 })
    .withMessage("Marks obtained must be a positive number"),
    
  body("maxMarks")
    .isFloat({ min: 1 })
    .withMessage("Maximum marks must be greater than 0"),
    
  body("passingMarks")
    .isFloat({ min: 0 })
    .withMessage("Passing marks must be a positive number")
    .custom((value, { req }) => {
      if (value > req.body.maxMarks) {
        throw new Error("Passing marks cannot be greater than maximum marks");
      }
      return true;
    }),
    
  body("term")
    .isIn(["Term 1", "Term 2", "Term 3"])
    .withMessage("Invalid term"),
    
  handleValidationErrors,
];

/**
 * Intervention creation validation
 */
export const validateInterventionCreation = [
  body("title")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters"),
    
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
    
  body("student")
    .isMongoId()
    .withMessage("Please provide a valid student ID"),
    
  body("type")
    .isIn(["Counseling", "Parent Meeting", "Financial Aid", "Remedial Classes", "Home Visit", "Behavioral Support", "Academic Support", "Health Support", "Mentoring", "Peer Support", "Other"])
    .withMessage("Invalid intervention type"),
    
  body("priority")
    .isIn(["Low", "Medium", "High", "Urgent"])
    .withMessage("Priority must be Low, Medium, High, or Urgent"),
    
  body("startDate")
    .isISO8601()
    .withMessage("Please provide a valid start date"),
    
  body("endDate")
    .isISO8601()
    .withMessage("Please provide a valid end date")
    .custom((value, { req }) => {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(value);
      
      if (endDate <= startDate) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),
    
  body("actionPlan")
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage("Action plan must be between 20 and 2000 characters"),
    
  body("budgetAllocated")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Budget allocated must be a positive number"),
    
  handleValidationErrors,
];

/**
 * Session creation validation
 */
export const validateSessionCreation = [
  body("intervention")
    .isMongoId()
    .withMessage("Please provide a valid intervention ID"),
    
  body("student")
    .isMongoId()
    .withMessage("Please provide a valid student ID"),
    
  body("sessionType")
    .isIn(["Individual Counseling", "Group Counseling", "Parent Meeting", "Teacher Consultation", "Follow-up", "Assessment", "Crisis Intervention", "Other"])
    .withMessage("Invalid session type"),
    
  body("scheduledDate")
    .isISO8601()
    .withMessage("Please provide a valid scheduled date")
    .custom((value) => {
      const scheduledDate = new Date(value);
      const today = new Date();
      
      if (scheduledDate < today) {
        throw new Error("Scheduled date cannot be in the past");
      }
      return true;
    }),
    
  body("scheduledTime")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Scheduled time must be in HH:MM format"),
    
  body("duration")
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage("Duration must be between 15 and 480 minutes"),
    
  body("location")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location must not exceed 100 characters"),
    
  body("mode")
    .isIn(["In-Person", "Online", "Phone", "Home Visit"])
    .withMessage("Invalid session mode"),
    
  handleValidationErrors,
];

/**
 * Query parameter validation for pagination
 */
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
    
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
    
  query("sortBy")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Sort by field name is invalid"),
    
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be 'asc' or 'desc'"),
    
  handleValidationErrors,
];

/**
 * Date range validation
 */
export const validateDateRange = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO date"),
    
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO date")
    .custom((value, { req }) => {
      if (req.query.startDate && value) {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(value);
        
        if (endDate <= startDate) {
          throw new Error("End date must be after start date");
        }
      }
      return true;
    }),
    
  handleValidationErrors,
];

/**
 * Email validation
 */
export const validateEmail = [
  body("to")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid recipient email address"),
    
  body("subject")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Subject must be between 1 and 200 characters"),
    
  body("message")
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage("Message must be between 1 and 5000 characters"),
    
  handleValidationErrors,
];

/**
 * SMS validation
 */
export const validateSMS = [
  body("to")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please provide a valid 10-digit mobile number"),
    
  body("message")
    .trim()
    .isLength({ min: 1, max: 160 })
    .withMessage("SMS message must be between 1 and 160 characters"),
    
  handleValidationErrors,
];

/**
 * Password change validation
 */
export const validatePasswordChange = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
    
  body("newPassword")
    .isLength({ min: 6, max: 128 })
    .withMessage("New password must be between 6 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("New password must contain at least one lowercase letter, one uppercase letter, and one number"),
    
  body("confirmPassword")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match new password");
      }
      return true;
    }),
    
  handleValidationErrors,
];

/**
 * File upload validation
 */
export const validateFileUpload = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
    
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
    
  body("documentType")
    .isIn(["Student Photo", "Birth Certificate", "Address Proof", "Income Certificate", "Medical Certificate", "Previous School Records", "Report Card", "Intervention Report", "Session Notes", "Assessment Report", "Parent Consent", "Other"])
    .withMessage("Invalid document type"),
    
  handleValidationErrors,
];

/**
 * Bulk operation validation
 */
export const validateBulkOperation = [
  body("operation")
    .isIn(["create", "update", "delete"])
    .withMessage("Operation must be create, update, or delete"),
    
  body("data")
    .isArray({ min: 1, max: 100 })
    .withMessage("Data must be an array with 1 to 100 items"),
    
  handleValidationErrors,
];

/**
 * Search validation
 */
export const validateSearch = [
  query("q")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search query must be between 1 and 100 characters"),
    
  query("type")
    .optional()
    .isIn(["student", "user", "class", "intervention", "all"])
    .withMessage("Search type must be student, user, class, intervention, or all"),
    
  handleValidationErrors,
];

/**
 * Custom validation for Indian phone numbers
 */
export const validateIndianPhone = (value) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(value)) {
    throw new Error("Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9");
  }
  return true;
};

/**
 * Custom validation for strong password
 */
export const validateStrongPassword = (value) => {
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  if (!strongPasswordRegex.test(value)) {
    throw new Error("Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character");
  }
  return true;
};

/**
 * Custom validation for academic year format
 */
export const validateAcademicYear = (value) => {
  const academicYearRegex = /^\d{4}-\d{4}$/;
  if (!academicYearRegex.test(value)) {
    throw new Error("Academic year must be in format YYYY-YYYY (e.g., 2024-2025)");
  }
  
  const [startYear, endYear] = value.split("-").map(Number);
  if (endYear !== startYear + 1) {
    throw new Error("Academic year end year must be exactly one year after start year");
  }
  
  return true;
};

// Alias for user validation
export const validateUser = validateUserRegistration;

export default {
  handleValidationErrors,
  validateObjectId,
  validateUserRegistration,
  validateUser,
  validateUserLogin,
  validateStudentCreation,
  validateAttendanceMarking,
  validateGradeEntry,
  validateInterventionCreation,
  validateSessionCreation,
  validatePagination,
  validateDateRange,
  validateEmail,
  validateSMS,
  validatePasswordChange,
  validateFileUpload,
  validateBulkOperation,
  validateSearch,
  validateIndianPhone,
  validateStrongPassword,
  validateAcademicYear,
};