import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import relativeTime from "dayjs/plugin/relativeTime.js";
import weekOfYear from "dayjs/plugin/weekOfYear.js";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);
dayjs.extend(weekOfYear);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

/**
 * Date utility functions for the Student Dropout Prevention System
 */

/**
 * Get current date in various formats
 */
export const getCurrentDate = () => {
  return {
    iso: dayjs().toISOString(),
    date: dayjs().toDate(),
    formatted: dayjs().format("YYYY-MM-DD"),
    display: dayjs().format("DD/MM/YYYY"),
    timestamp: dayjs().unix(),
    dayjs: dayjs()
  };
};

/**
 * Format date in different formats
 */
export const formatDate = (date, format = "DD/MM/YYYY") => {
  if (!date) return null;
  return dayjs(date).format(format);
};

/**
 * Parse date from string
 */
export const parseDate = (dateString, format = null) => {
  if (!dateString) return null;
  
  if (format) {
    return dayjs(dateString, format);
  }
  
  return dayjs(dateString);
};

/**
 * Get academic year for a given date
 */
export const getAcademicYear = (date = null) => {
  const targetDate = date ? dayjs(date) : dayjs();
  const year = targetDate.year();
  const month = targetDate.month() + 1; // dayjs months are 0-indexed
  
  // Academic year starts in April (month 4)
  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

/**
 * Get current academic year
 */
export const getCurrentAcademicYear = () => {
  return getAcademicYear();
};

/**
 * Get academic year start and end dates
 */
export const getAcademicYearDates = (academicYear = null) => {
  const year = academicYear || getCurrentAcademicYear();
  const [startYear, endYear] = year.split("-").map(Number);
  
  return {
    startDate: dayjs(`${startYear}-04-01`).toDate(),
    endDate: dayjs(`${endYear}-03-31`).toDate(),
    startDateFormatted: `${startYear}-04-01`,
    endDateFormatted: `${endYear}-03-31`
  };
};

/**
 * Get current term based on date
 */
export const getCurrentTerm = (date = null) => {
  const targetDate = date ? dayjs(date) : dayjs();
  const month = targetDate.month() + 1;
  
  if (month >= 4 && month <= 7) {
    return "Term 1";
  } else if (month >= 8 && month <= 11) {
    return "Term 2";
  } else {
    return "Term 3";
  }
};

/**
 * Get term dates
 */
export const getTermDates = (term, academicYear = null) => {
  const year = academicYear || getCurrentAcademicYear();
  const [startYear, endYear] = year.split("-").map(Number);
  
  switch (term) {
    case "Term 1":
      return {
        startDate: dayjs(`${startYear}-04-01`).toDate(),
        endDate: dayjs(`${startYear}-07-31`).toDate()
      };
    case "Term 2":
      return {
        startDate: dayjs(`${startYear}-08-01`).toDate(),
        endDate: dayjs(`${startYear}-11-30`).toDate()
      };
    case "Term 3":
      return {
        startDate: dayjs(`${startYear}-12-01`).toDate(),
        endDate: dayjs(`${endYear}-03-31`).toDate()
      };
    default:
      throw new Error("Invalid term");
  }
};

/**
 * Get date range for different periods
 */
export const getDateRange = (period, customDate = null) => {
  const baseDate = customDate ? dayjs(customDate) : dayjs();
  
  switch (period.toLowerCase()) {
    case "today":
      return {
        startDate: baseDate.startOf("day").toDate(),
        endDate: baseDate.endOf("day").toDate()
      };
      
    case "yesterday":
      const yesterday = baseDate.subtract(1, "day");
      return {
        startDate: yesterday.startOf("day").toDate(),
        endDate: yesterday.endOf("day").toDate()
      };
      
    case "this_week":
      return {
        startDate: baseDate.startOf("week").toDate(),
        endDate: baseDate.endOf("week").toDate()
      };
      
    case "last_week":
      const lastWeek = baseDate.subtract(1, "week");
      return {
        startDate: lastWeek.startOf("week").toDate(),
        endDate: lastWeek.endOf("week").toDate()
      };
      
    case "this_month":
      return {
        startDate: baseDate.startOf("month").toDate(),
        endDate: baseDate.endOf("month").toDate()
      };
      
    case "last_month":
      const lastMonth = baseDate.subtract(1, "month");
      return {
        startDate: lastMonth.startOf("month").toDate(),
        endDate: lastMonth.endOf("month").toDate()
      };
      
    case "this_quarter":
      return {
        startDate: baseDate.startOf("quarter").toDate(),
        endDate: baseDate.endOf("quarter").toDate()
      };
      
    case "last_quarter":
      const lastQuarter = baseDate.subtract(1, "quarter");
      return {
        startDate: lastQuarter.startOf("quarter").toDate(),
        endDate: lastQuarter.endOf("quarter").toDate()
      };
      
    case "this_year":
      return {
        startDate: baseDate.startOf("year").toDate(),
        endDate: baseDate.endOf("year").toDate()
      };
      
    case "last_year":
      const lastYear = baseDate.subtract(1, "year");
      return {
        startDate: lastYear.startOf("year").toDate(),
        endDate: lastYear.endOf("year").toDate()
      };
      
    default:
      throw new Error("Invalid period");
  }
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const today = dayjs();
  const birth = dayjs(dateOfBirth);
  
  return today.diff(birth, "year");
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  
  return dayjs(endDate).diff(dayjs(startDate), "day");
};

/**
 * Calculate working days between two dates (excluding weekends)
 */
export const workingDaysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  
  let current = dayjs(startDate);
  const end = dayjs(endDate);
  let workingDays = 0;
  
  while (current.isSameOrBefore(end, "day")) {
    // 0 = Sunday, 6 = Saturday
    if (current.day() !== 0 && current.day() !== 6) {
      workingDays++;
    }
    current = current.add(1, "day");
  }
  
  return workingDays;
};

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 */
export const getRelativeTime = (date) => {
  if (!date) return null;
  
  return dayjs(date).fromNow();
};

/**
 * Check if date is in the past
 */
export const isInPast = (date) => {
  if (!date) return false;
  
  return dayjs(date).isBefore(dayjs());
};

/**
 * Check if date is in the future
 */
export const isInFuture = (date) => {
  if (!date) return false;
  
  return dayjs(date).isAfter(dayjs());
};

/**
 * Check if date is today
 */
export const isToday = (date) => {
  if (!date) return false;
  
  return dayjs(date).isSame(dayjs(), "day");
};

/**
 * Check if date is weekend
 */
export const isWeekend = (date) => {
  if (!date) return false;
  
  const day = dayjs(date).day();
  return day === 0 || day === 6; // Sunday or Saturday
};

/**
 * Get next working day
 */
export const getNextWorkingDay = (date = null) => {
  let current = date ? dayjs(date) : dayjs();
  
  do {
    current = current.add(1, "day");
  } while (isWeekend(current.toDate()));
  
  return current.toDate();
};

/**
 * Get previous working day
 */
export const getPreviousWorkingDay = (date = null) => {
  let current = date ? dayjs(date) : dayjs();
  
  do {
    current = current.subtract(1, "day");
  } while (isWeekend(current.toDate()));
  
  return current.toDate();
};

/**
 * Get week number of the year
 */
export const getWeekNumber = (date = null) => {
  const targetDate = date ? dayjs(date) : dayjs();
  return targetDate.week();
};

/**
 * Get month name
 */
export const getMonthName = (date = null, format = "MMMM") => {
  const targetDate = date ? dayjs(date) : dayjs();
  return targetDate.format(format);
};

/**
 * Get day name
 */
export const getDayName = (date = null, format = "dddd") => {
  const targetDate = date ? dayjs(date) : dayjs();
  return targetDate.format(format);
};

/**
 * Add time to date
 */
export const addTime = (date, amount, unit) => {
  if (!date) return null;
  
  return dayjs(date).add(amount, unit).toDate();
};

/**
 * Subtract time from date
 */
export const subtractTime = (date, amount, unit) => {
  if (!date) return null;
  
  return dayjs(date).subtract(amount, unit).toDate();
};

/**
 * Get start of period
 */
export const startOf = (date, unit) => {
  if (!date) return null;
  
  return dayjs(date).startOf(unit).toDate();
};

/**
 * Get end of period
 */
export const endOf = (date, unit) => {
  if (!date) return null;
  
  return dayjs(date).endOf(unit).toDate();
};

/**
 * Check if date is between two dates
 */
export const isBetween = (date, startDate, endDate, unit = "day", inclusivity = "[]") => {
  if (!date || !startDate || !endDate) return false;
  
  return dayjs(date).isBetween(dayjs(startDate), dayjs(endDate), unit, inclusivity);
};

/**
 * Get attendance date ranges for reports
 */
export const getAttendanceDateRanges = () => {
  const today = dayjs();
  
  return {
    today: getDateRange("today"),
    thisWeek: getDateRange("this_week"),
    thisMonth: getDateRange("this_month"),
    thisQuarter: getDateRange("this_quarter"),
    thisAcademicYear: getAcademicYearDates(),
    last7Days: {
      startDate: today.subtract(7, "day").toDate(),
      endDate: today.toDate()
    },
    last30Days: {
      startDate: today.subtract(30, "day").toDate(),
      endDate: today.toDate()
    },
    last90Days: {
      startDate: today.subtract(90, "day").toDate(),
      endDate: today.toDate()
    }
  };
};

/**
 * Format time duration in human readable format
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes < 0) return "0 minutes";
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} minute${mins !== 1 ? "s" : ""}`;
  } else if (mins === 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  } else {
    return `${hours} hour${hours !== 1 ? "s" : ""} ${mins} minute${mins !== 1 ? "s" : ""}`;
  }
};

/**
 * Get time slots for scheduling
 */
export const getTimeSlots = (startTime = "09:00", endTime = "17:00", interval = 30) => {
  const slots = [];
  let current = dayjs(`2000-01-01 ${startTime}`);
  const end = dayjs(`2000-01-01 ${endTime}`);
  
  while (current.isBefore(end)) {
    slots.push({
      value: current.format("HH:mm"),
      label: current.format("h:mm A"),
      display: current.format("HH:mm")
    });
    current = current.add(interval, "minute");
  }
  
  return slots;
};

/**
 * Validate date string
 */
export const isValidDate = (dateString) => {
  return dayjs(dateString).isValid();
};

/**
 * Convert timezone
 */
export const convertTimezone = (date, fromTz, toTz) => {
  if (!date) return null;
  
  return dayjs.tz(date, fromTz).tz(toTz).toDate();
};

/**
 * Get Indian Standard Time
 */
export const getIST = (date = null) => {
  const targetDate = date ? dayjs(date) : dayjs();
  return targetDate.tz("Asia/Kolkata").toDate();
};

/**
 * Format date for database storage
 */
export const formatForDB = (date) => {
  if (!date) return null;
  
  return dayjs(date).utc().toDate();
};

/**
 * Format date for display
 */
export const formatForDisplay = (date, format = "DD/MM/YYYY hh:mm A") => {
  if (!date) return null;
  
  return dayjs(date).format(format);
};

export default {
  getCurrentDate,
  formatDate,
  parseDate,
  getAcademicYear,
  getCurrentAcademicYear,
  getAcademicYearDates,
  getCurrentTerm,
  getTermDates,
  getDateRange,
  calculateAge,
  daysBetween,
  workingDaysBetween,
  getRelativeTime,
  isInPast,
  isInFuture,
  isToday,
  isWeekend,
  getNextWorkingDay,
  getPreviousWorkingDay,
  getWeekNumber,
  getMonthName,
  getDayName,
  addTime,
  subtractTime,
  startOf,
  endOf,
  isBetween,
  getAttendanceDateRanges,
  formatDuration,
  getTimeSlots,
  isValidDate,
  convertTimezone,
  getIST,
  formatForDB,
  formatForDisplay
};