import crypto from "crypto";

/**
 * Helper utility functions for the Student Dropout Prevention System
 */

/**
 * Generate random string
 */
export const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

/**
 * Generate secure password
 */
export const generateSecurePassword = (length = 12) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

/**
 * Sanitize string (remove HTML tags and special characters)
 */
export const sanitizeString = (str) => {
  if (!str) return "";
  
  return str
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>'"&]/g, "") // Remove potentially dangerous characters
    .trim();
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (str) => {
  if (!str) return "";
  
  return str
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Generate initials from name
 */
export const generateInitials = (firstName, lastName) => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : "";
  const last = lastName ? lastName.charAt(0).toUpperCase() : "";
  return first + last;
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, "");
  
  // Format as Indian phone number
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  
  return phone;
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (Indian)
 */
export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ""));
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value, total, decimals = 2) => {
  if (total === 0) return 0;
  return Number(((value / total) * 100).toFixed(decimals));
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Generate academic roll number
 */
export const generateRollNumber = (year, classNumber, section, sequence) => {
  const yearSuffix = year.toString().slice(-2);
  const classFormatted = classNumber.toString().padStart(2, "0");
  const sequenceFormatted = sequence.toString().padStart(3, "0");
  
  return `${yearSuffix}${classFormatted}${section}${sequenceFormatted}`;
};

/**
 * Calculate grade from percentage
 */
export const calculateGrade = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C+";
  if (percentage >= 40) return "C";
  if (percentage >= 33) return "D";
  if (percentage >= 25) return "E";
  return "F";
};

/**
 * Format currency (Indian Rupees)
 */
export const formatCurrency = (amount, currency = "INR") => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

export default {
  generateRandomString,
  generateSecurePassword,
  sanitizeString,
  capitalizeWords,
  generateInitials,
  formatPhoneNumber,
  isValidEmail,
  isValidPhoneNumber,
  calculatePercentage,
  formatFileSize,
  generateRollNumber,
  calculateGrade,
  formatCurrency
};