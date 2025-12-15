import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import Grade from "../models/Grade.js";
import logger from "../utils/logger.js";

/**
 * Calculate comprehensive risk score for a student
 * Risk Score Range: 0-100 (Higher = Greater Risk)
 */
export const calculateRiskScore = async (studentId) => {
  try {
    const student = await Student.findById(studentId).populate("class");

    if (!student) {
      throw new Error("Student not found");
    }

    // Initialize risk factors
    const factors = {
      attendance: 0,
      academic: 0,
      financial: 0,
      behavioral: 0,
      health: 0,
      distance: 0,
      family: 0,
    };

    const breakdown = {};

    // 1. ATTENDANCE RISK (Weight: 25%)
    const attendanceRisk = await calculateAttendanceRisk(student);
    factors.attendance = attendanceRisk.score;
    breakdown.attendance = attendanceRisk.details;

    // 2. ACADEMIC RISK (Weight: 25%)
    const academicRisk = await calculateAcademicRisk(student);
    factors.academic = academicRisk.score;
    breakdown.academic = academicRisk.details;

    // 3. FINANCIAL RISK (Weight: 15%)
    const financialRisk = calculateFinancialRisk(student);
    factors.financial = financialRisk.score;
    breakdown.financial = financialRisk.details;

    // 4. BEHAVIORAL RISK (Weight: 10%)
    const behavioralRisk = calculateBehavioralRisk(student);
    factors.behavioral = behavioralRisk.score;
    breakdown.behavioral = behavioralRisk.details;

    // 5. HEALTH RISK (Weight: 10%)
    const healthRisk = calculateHealthRisk(student);
    factors.health = healthRisk.score;
    breakdown.health = healthRisk.details;

    // 6. DISTANCE RISK (Weight: 10%)
    const distanceRisk = calculateDistanceRisk(student);
    factors.distance = distanceRisk.score;
    breakdown.distance = distanceRisk.details;

    // 7. FAMILY RISK (Weight: 5%)
    const familyRisk = calculateFamilyRisk(student);
    factors.family = familyRisk.score;
    breakdown.family = familyRisk.details;

    // Calculate weighted total risk score
    const weights = {
      attendance: 0.25,
      academic: 0.25,
      financial: 0.15,
      behavioral: 0.1,
      health: 0.1,
      distance: 0.1,
      family: 0.05,
    };

    let totalRiskScore = 0;
    for (const [factor, score] of Object.entries(factors)) {
      totalRiskScore += score * weights[factor];
    }

    totalRiskScore = Math.round(totalRiskScore);

    // Generate recommendations
    const recommendations = generateRecommendations(factors, breakdown);

    // Predict dropout timeline
    const dropoutPrediction = predictDropoutTimeline(totalRiskScore, factors);

    logger.info(`Risk calculated for ${student.fullName}: ${totalRiskScore}`);

    return {
      totalRiskScore,
      factors,
      breakdown,
      recommendations,
      dropoutPrediction,
    };
  } catch (error) {
    logger.error("Risk calculation error:", error);
    throw error;
  }
};

/**
 * Calculate Attendance Risk (0-100)
 */
const calculateAttendanceRisk = async (student) => {
  const details = {};
  let score = 0;

  // Get attendance data for current academic year
  const startDate = new Date(new Date().getFullYear(), 3, 1); // April 1st
  const endDate = new Date();

  const attendanceSummary = await Attendance.getStudentSummary(
    student._id,
    startDate,
    endDate
  );

  const attendancePercent = parseFloat(attendanceSummary.percentage) || 100;
  details.attendancePercentage = attendancePercent;

  // Risk based on attendance percentage
  if (attendancePercent >= 95) {
    score += 0;
    details.level = "Excellent";
  } else if (attendancePercent >= 85) {
    score += 15;
    details.level = "Good";
  } else if (attendancePercent >= 75) {
    score += 35;
    details.level = "Fair";
  } else if (attendancePercent >= 60) {
    score += 60;
    details.level = "Poor";
  } else {
    score += 85;
    details.level = "Critical";
  }

  // Consecutive absences (high risk indicator)
  if (student.consecutiveAbsences >= 5) {
    score += 15;
    details.consecutiveAbsences = student.consecutiveAbsences;
  } else if (student.consecutiveAbsences >= 3) {
    score += 8;
    details.consecutiveAbsences = student.consecutiveAbsences;
  }

  return {
    score: Math.min(score, 100),
    details,
  };
};

/**
 * Calculate Academic Risk (0-100)
 */
const calculateAcademicRisk = async (student) => {
  const details = {};
  let score = 0;

  const overallPercentage = student.overallPercentage || 0;
  details.overallPercentage = overallPercentage;

  // Risk based on overall percentage
  if (overallPercentage >= 75) {
    score += 0;
    details.level = "Excellent";
  } else if (overallPercentage >= 60) {
    score += 20;
    details.level = "Good";
  } else if (overallPercentage >= 45) {
    score += 45;
    details.level = "Fair";
  } else if (overallPercentage >= 33) {
    score += 70;
    details.level = "Poor";
  } else {
    score += 90;
    details.level = "Critical";
  }

  // Failed subjects
  const failedSubjects = student.failedSubjectsCount || 0;
  details.failedSubjects = failedSubjects;

  if (failedSubjects >= 3) {
    score += 10;
  } else if (failedSubjects >= 1) {
    score += 5;
  }

  // Academic trend
  details.trend = student.academicTrend;
  if (student.academicTrend === "Declining") {
    score += 10;
  } else if (student.academicTrend === "Improving") {
    score -= 5;
  }

  return {
    score: Math.max(0, Math.min(score, 100)),
    details,
  };
};

/**
 * Calculate Financial Risk (0-100)
 */
const calculateFinancialRisk = (student) => {
  const details = {};
  let score = 0;

  details.incomeLevel = student.familyIncomeLevel;

  // Income level risk
  switch (student.familyIncomeLevel) {
    case "Below Poverty Line":
      score += 80;
      break;
    case "Low Income":
      score += 50;
      break;
    case "Middle Income":
      score += 20;
      break;
    case "High Income":
      score += 0;
      break;
  }

  // Economic distress
  if (student.hasEconomicDistress) {
    score += 20;
    details.hasEconomicDistress = true;
  }

  // Parent education (lower education = higher risk)
  const fatherEducation = student.father.education;
  const motherEducation = student.mother.education;

  if (fatherEducation === "None" || motherEducation === "None") {
    score += 10;
  }

  return {
    score: Math.min(score, 100),
    details,
  };
};

/**
 * Calculate Behavioral Risk (0-100)
 */
const calculateBehavioralRisk = (student) => {
  const details = {};
  let score = 0;

  if (student.hasBehavioralIssues) {
    score += 60;
    details.hasBehavioralIssues = true;
    details.details = student.behavioralDetails;
  }

  // Late coming frequency
  if (student.lateComingCount > 20) {
    score += 20;
  } else if (student.lateComingCount > 10) {
    score += 10;
  }

  // Previous dropout attempts
  if (student.previousDropoutAttempts > 0) {
    score += 20;
    details.previousDropoutAttempts = student.previousDropoutAttempts;
  }

  return {
    score: Math.min(score, 100),
    details,
  };
};

/**
 * Calculate Health Risk (0-100)
 */
const calculateHealthRisk = (student) => {
  const details = {};
  let score = 0;

  if (student.hasHealthIssues) {
    score += 60;
    details.hasHealthIssues = true;
    details.details = student.healthDetails;
  }

  return {
    score: Math.min(score, 100),
    details,
  };
};

/**
 * Calculate Distance Risk (0-100)
 */
const calculateDistanceRisk = (student) => {
  const details = {};
  let score = 0;

  const distance = student.distanceFromSchool || 0;
  details.distance = distance;
  details.transportMode = student.transportationMode;

  // Distance risk
  if (distance > 10) {
    score += 50;
  } else if (distance > 5) {
    score += 30;
  } else if (distance > 2) {
    score += 15;
  }

  // Transportation mode
  if (student.transportationMode === "Walk" && distance > 3) {
    score += 20;
  }

  return {
    score: Math.min(score, 100),
    details,
  };
};

/**
 * Calculate Family Risk (0-100)
 */
const calculateFamilyRisk = (student) => {
  const details = {};
  let score = 0;

  if (student.hasFamilyProblems) {
    score += 70;
    details.hasFamilyProblems = true;
  }

  // Number of siblings
  if (student.siblings.count > 4) {
    score += 15;
  } else if (student.siblings.count > 2) {
    score += 10;
  }

  return {
    score: Math.min(score, 100),
    details,
  };
};

/**
 * Generate personalized recommendations
 */
const generateRecommendations = (factors, breakdown) => {
  const recommendations = [];

  // Attendance recommendations
  if (factors.attendance > 50) {
    recommendations.push({
      priority: "High",
      category: "Attendance",
      action: "Immediate Parent Meeting",
      description:
        "Schedule urgent meeting with parents to discuss attendance issues",
    });
    recommendations.push({
      priority: "High",
      category: "Attendance",
      action: "Daily Attendance Monitoring",
      description: "Implement daily check-ins and follow-ups for absences",
    });
  } else if (factors.attendance > 30) {
    recommendations.push({
      priority: "Medium",
      category: "Attendance",
      action: "Parent Communication",
      description: "Send weekly attendance reports to parents",
    });
  }

  // Academic recommendations
  if (factors.academic > 50) {
    recommendations.push({
      priority: "High",
      category: "Academic",
      action: "Remedial Classes",
      description: "Enroll student in after-school remedial classes",
    });
    recommendations.push({
      priority: "High",
      category: "Academic",
      action: "Peer Tutoring",
      description: "Assign peer tutor for struggling subjects",
    });
  }

  // Financial recommendations
  if (factors.financial > 50) {
    recommendations.push({
      priority: "High",
      category: "Financial",
      action: "Financial Aid Assessment",
      description:
        "Evaluate eligibility for scholarships and financial assistance",
    });
  }

  // Behavioral recommendations
  if (factors.behavioral > 40) {
    recommendations.push({
      priority: "High",
      category: "Behavioral",
      action: "Counseling Sessions",
      description:
        "Schedule regular counseling sessions to address behavioral issues",
    });
  }

  // Health recommendations
  if (factors.health > 40) {
    recommendations.push({
      priority: "Medium",
      category: "Health",
      action: "Health Assessment",
      description: "Refer to school health services for medical evaluation",
    });
  }

  return recommendations;
};

/**
 * Predict dropout timeline based on risk score
 */
const predictDropoutTimeline = (riskScore, factors) => {
  if (riskScore >= 80) {
    return {
      timeline: "1-3 months",
      probability: "85-95%",
      urgency: "Critical",
    };
  } else if (riskScore >= 60) {
    return {
      timeline: "3-6 months",
      probability: "60-75%",
      urgency: "High",
    };
  } else if (riskScore >= 40) {
    return {
      timeline: "6-12 months",
      probability: "30-50%",
      urgency: "Medium",
    };
  } else {
    return {
      timeline: "Low risk",
      probability: "<20%",
      urgency: "Low",
    };
  }
};
