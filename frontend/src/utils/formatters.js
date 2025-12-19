/**
 * Format class and section for display
 * @param {string} section - The section field (e.g., "11A", "A", "10-B")
 * @returns {string} - Formatted class display (e.g., "Class 11-A")
 */
export const formatClassSection = (section) => {
  if (!section) return 'N/A';
  
  // If section already contains a hyphen or space, return as is with "Class" prefix
  if (section.includes('-') || section.includes(' ')) {
    return `Class ${section}`;
  }
  
  // Extract grade and section from formats like "11A", "10B", "9C"
  const match = section.match(/^(\d+)([A-Z])$/);
  if (match) {
    const [, grade, sec] = match;
    return `Class ${grade}-${sec}`;
  }
  
  // If it's just a letter (A, B, C), return as is
  if (/^[A-Z]$/.test(section)) {
    return `Section ${section}`;
  }
  
  // Default: return with "Class" prefix
  return `Class ${section}`;
};

/**
 * Extract just the section letter from the section field
 * @param {string} section - The section field (e.g., "11A", "A", "10-B")
 * @returns {string} - Just the section letter (e.g., "A")
 */
export const extractSection = (section) => {
  if (!section) return 'N/A';
  
  // Extract section from formats like "11A", "10B"
  const match = section.match(/^(\d+)([A-Z])$/);
  if (match) {
    return match[2];
  }
  
  // Extract from "10-A" format
  const dashMatch = section.match(/^(\d+)-([A-Z])$/);
  if (dashMatch) {
    return dashMatch[2];
  }
  
  // If it's already just a letter
  if (/^[A-Z]$/.test(section)) {
    return section;
  }
  
  return section;
};

/**
 * Extract just the grade/class number from the section field
 * @param {string} section - The section field (e.g., "11A", "A", "10-B")
 * @returns {string} - Just the grade number (e.g., "11")
 */
export const extractGrade = (section) => {
  if (!section) return 'N/A';
  
  // Extract grade from formats like "11A", "10B"
  const match = section.match(/^(\d+)([A-Z])$/);
  if (match) {
    return match[1];
  }
  
  // Extract from "10-A" format
  const dashMatch = section.match(/^(\d+)-([A-Z])$/);
  if (dashMatch) {
    return dashMatch[1];
  }
  
  // If it's just a number
  if (/^\d+$/.test(section)) {
    return section;
  }
  
  return 'N/A';
};

/**
 * Format student name
 * @param {object} student - Student object with firstName, middleName, lastName
 * @returns {string} - Formatted full name
 */
export const formatStudentName = (student) => {
  if (!student) return 'N/A';
  
  const parts = [
    student.firstName,
    student.middleName,
    student.lastName
  ].filter(Boolean);
  
  return parts.join(' ');
};

/**
 * Format percentage with fallback
 * @param {number} value - The percentage value
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} - Formatted percentage (e.g., "85%")
 */
export const formatPercentage = (value, decimals = 0) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return `${Number(value).toFixed(decimals)}%`;
};
