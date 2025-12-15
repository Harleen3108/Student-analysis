/**
 * Validation utility functions for the Student Dropout Prevention System
 */

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    isValid: emailRegex.test(email),
    message: emailRegex.test(email) ? null : "Invalid email format"
  };
};

/**
 * Validate phone number (Indian format)
 */
export const validatePhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, "");
  const phoneRegex = /^[6-9]\d{9}$/;
  
  return {
    isValid: phoneRegex.test(cleaned),
    message: phoneRegex.test(cleaned) ? null : "Invalid phone number. Must be 10 digits starting with 6-9"
  };
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return {
    isValid: errors.length === 0,
    message: errors.length > 0 ? errors.join(". ") : null,
    strength: calculatePasswordStrength(password)
  };
};

/**
 * Calculate password strength
 */
const calculatePasswordStrength = (password) => {
  let score = 0;
  
  // Length
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character types
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  
  // Complexity
  if (password.length >= 16) score += 1;
  
  if (score <= 2) return "Weak";
  if (score <= 4) return "Medium";
  if (score <= 6) return "Strong";
  return "Very Strong";
};

/**
 * Validate name
 */
export const validateName = (name, fieldName = "Name") => {
  const nameRegex = /^[a-zA-Z\s.'-]+$/;
  
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      message: `${fieldName} is required`
    };
  }
  
  if (name.trim().length < 2) {
    return {
      isValid: false,
      message: `${fieldName} must be at least 2 characters long`
    };
  }
  
  if (name.trim().length > 50) {
    return {
      isValid: false,
      message: `${fieldName} must not exceed 50 characters`
    };
  }
  
  if (!nameRegex.test(name.trim())) {
    return {
      isValid: false,
      message: `${fieldName} can only contain letters, spaces, dots, hyphens, and apostrophes`
    };
  }
  
  return {
    isValid: true,
    message: null
  };
};

/**
 * Validate roll number
 */
export const validateRollNumber = (rollNumber) => {
  const rollRegex = /^[A-Z0-9]{6,15}$/;
  
  if (!rollNumber || rollNumber.trim().length === 0) {
    return {
      isValid: false,
      message: "Roll number is required"
    };
  }
  
  const cleaned = rollNumber.trim().toUpperCase();
  
  if (!rollRegex.test(cleaned)) {
    return {
      isValid: false,
      message: "Roll number must be 6-15 characters long and contain only letters and numbers"
    };
  }
  
  return {
    isValid: true,
    message: null
  };
};

/**
 * Validate date of birth
 */
export const validateDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth) {
    return {
      isValid: false,
      message: "Date of birth is required"
    };
  }
  
  const dob = new Date(dateOfBirth);
  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 25); // Maximum age 25
  const maxDate = new Date();
  maxDate.setFullYear(today.getFullYear() - 5); // Minimum age 5
  
  if (isNaN(dob.getTime())) {
    return {
      isValid: false,
      message: "Invalid date format"
    };
  }
  
  if (dob > today) {
    return {
      isValid: false,
      message: "Date of birth cannot be in the future"
    };
  }
  
  if (dob < minDate) {
    return {
      isValid: false,
      message: "Student age cannot exceed 25 years"
    };
  }
  
  if (dob > maxDate) {
    return {
      isValid: false,
      message: "Student must be at least 5 years old"
    };
  }
  
  return {
    isValid: true,
    message: null
  };
};

/**
 * Validate percentage
 */
export const validatePercentage = (percentage, fieldName = "Percentage") => {
  if (percentage === null || percentage === undefined || percentage === "") {
    return {
      isValid: false,
      message: `${fieldName} is required`
    };
  }
  
  const num = Number(percentage);
  
  if (isNaN(num)) {
    return {
      isValid: false,
      message: `${fieldName} must be a valid number`
    };
  }
  
  if (num < 0 || num > 100) {
    return {
      isValid: false,
      message: `${fieldName} must be between 0 and 100`
    };
  }
  
  return {
    isValid: true,
    message: null
  };
};

/**
 * Validate marks
 */
export const validateMarks = (marksObtained, maxMarks) => {
  const errors = [];
  
  if (marksObtained === null || marksObtained === undefined || marksObtained === "") {
    errors.push("Marks obtained is required");
  } else {
    const obtained = Number(marksObtained);
    if (isNaN(obtained)) {
      errors.push("Marks obtained must be a valid number");
    } else if (obtained < 0) {
      errors.push("Marks obtained cannot be negative");
    }
  }
  
  if (maxMarks === null || maxMarks === undefined || maxMarks === "") {
    errors.push("Maximum marks is required");
  } else {
    const max = Number(maxMarks);
    if (isNaN(max)) {
      errors.push("Maximum marks must be a valid number");
    } else if (max <= 0) {
      errors.push("Maximum marks must be greater than 0");
    }
  }
  
  // Cross validation
  if (errors.length === 0) {
    const obtained = Number(marksObtained);
    const max = Number(maxMarks);
    
    if (obtained > max) {
      errors.push("Marks obtained cannot exceed maximum marks");
    }
  }
  
  return {
    isValid: errors.length === 0,
    message: errors.length > 0 ? errors.join(". ") : null
  };
};

/**
 * Validate address
 */
export const validateAddress = (address) => {
  const errors = [];
  
  if (!address) {
    return {
      isValid: false,
      message: "Address is required"
    };
  }
  
  if (!address.city || address.city.trim().length === 0) {
    errors.push("City is required");
  }
  
  if (!address.state || address.state.trim().length === 0) {
    errors.push("State is required");
  }
  
  if (!address.pincode || address.pincode.trim().length === 0) {
    errors.push("Pincode is required");
  } else {
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(address.pincode.trim())) {
      errors.push("Pincode must be 6 digits");
    }
  }
  
  return {
    isValid: errors.length === 0,
    message: errors.length > 0 ? errors.join(". ") : null
  };
};

/**
 * Validate file upload
 */
export const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"],
    required = false
  } = options;
  
  if (!file) {
    return {
      isValid: !required,
      message: required ? "File is required" : null
    };
  }
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      message: `File size must not exceed ${Math.round(maxSize / (1024 * 1024))}MB`
    };
  }
  
  if (!allowedTypes.includes(file.mimetype)) {
    return {
      isValid: false,
      message: `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`
    };
  }
  
  return {
    isValid: true,
    message: null
  };
};

/**
 * Validate academic year
 */
export const validateAcademicYear = (academicYear) => {
  const yearRegex = /^\d{4}-\d{4}$/;
  
  if (!academicYear) {
    return {
      isValid: false,
      message: "Academic year is required"
    };
  }
  
  if (!yearRegex.test(academicYear)) {
    return {
      isValid: false,
      message: "Academic year must be in format YYYY-YYYY (e.g., 2024-2025)"
    };
  }
  
  const [startYear, endYear] = academicYear.split("-").map(Number);
  
  if (endYear !== startYear + 1) {
    return {
      isValid: false,
      message: "End year must be exactly one year after start year"
    };
  }
  
  const currentYear = new Date().getFullYear();
  if (startYear < currentYear - 5 || startYear > currentYear + 2) {
    return {
      isValid: false,
      message: "Academic year must be within reasonable range"
    };
  }
  
  return {
    isValid: true,
    message: null
  };
};

/**
 * Validate class and section
 */
export const validateClassSection = (className, section) => {
  const errors = [];
  
  if (!className || className.trim().length === 0) {
    errors.push("Class name is required");
  }
  
  if (!section || section.trim().length === 0) {
    errors.push("Section is required");
  } else {
    const sectionRegex = /^[A-Z]$/;
    if (!sectionRegex.test(section.trim().toUpperCase())) {
      errors.push("Section must be a single letter (A-Z)");
    }
  }
  
  return {
    isValid: errors.length === 0,
    message: errors.length > 0 ? errors.join(". ") : null
  };
};

/**
 * Validate intervention data
 */
export const validateIntervention = (intervention) => {
  const errors = [];
  
  if (!intervention.title || intervention.title.trim().length === 0) {
    errors.push("Intervention title is required");
  }
  
  if (!intervention.description || intervention.description.trim().length === 0) {
    errors.push("Intervention description is required");
  }
  
  if (!intervention.type) {
    errors.push("Intervention type is required");
  }
  
  if (!intervention.student) {
    errors.push("Student is required");
  }
  
  if (!intervention.assignedCounselor) {
    errors.push("Assigned counselor is required");
  }
  
  if (!intervention.startDate) {
    errors.push("Start date is required");
  }
  
  if (!intervention.endDate) {
    errors.push("End date is required");
  }
  
  // Date validation
  if (intervention.startDate && intervention.endDate) {
    const start = new Date(intervention.startDate);
    const end = new Date(intervention.endDate);
    
    if (start >= end) {
      errors.push("End date must be after start date");
    }
    
    if (start < new Date()) {
      errors.push("Start date cannot be in the past");
    }
  }
  
  return {
    isValid: errors.length === 0,
    message: errors.length > 0 ? errors.join(". ") : null
  };
};

/**
 * Validate risk score
 */
export const validateRiskScore = (riskScore) => {
  if (riskScore === null || riskScore === undefined) {
    return {
      isValid: false,
      message: "Risk score is required"
    };
  }
  
  const score = Number(riskScore);
  
  if (isNaN(score)) {
    return {
      isValid: false,
      message: "Risk score must be a valid number"
    };
  }
  
  if (score < 0 || score > 100) {
    return {
      isValid: false,
      message: "Risk score must be between 0 and 100"
    };
  }
  
  return {
    isValid: true,
    message: null
  };
};

/**
 * Validate distance
 */
export const validateDistance = (distance) => {
  if (distance === null || distance === undefined || distance === "") {
    return {
      isValid: false,
      message: "Distance is required"
    };
  }
  
  const dist = Number(distance);
  
  if (isNaN(dist)) {
    return {
      isValid: false,
      message: "Distance must be a valid number"
    };
  }
  
  if (dist < 0) {
    return {
      isValid: false,
      message: "Distance cannot be negative"
    };
  }
  
  if (dist > 100) {
    return {
      isValid: false,
      message: "Distance seems unreasonably high (>100km)"
    };
  }
  
  return {
    isValid: true,
    message: null
  };
};

/**
 * Validate multiple fields at once
 */
export const validateMultiple = (validations) => {
  const results = {};
  let isValid = true;
  
  for (const [field, validation] of Object.entries(validations)) {
    results[field] = validation;
    if (!validation.isValid) {
      isValid = false;
    }
  }
  
  return {
    isValid,
    results,
    errors: Object.entries(results)
      .filter(([_, result]) => !result.isValid)
      .map(([field, result]) => `${field}: ${result.message}`)
  };
};

export default {
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  validateName,
  validateRollNumber,
  validateDateOfBirth,
  validatePercentage,
  validateMarks,
  validateAddress,
  validateFileUpload,
  validateAcademicYear,
  validateClassSection,
  validateIntervention,
  validateRiskScore,
  validateDistance,
  validateMultiple
};