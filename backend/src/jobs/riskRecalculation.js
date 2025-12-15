import cron from "node-cron";
import Student from "../models/Student.js";
import RiskFactor from "../models/RiskFactor.js";
import { calculateRiskScore } from "../services/riskCalculator.js";
import { sendRiskLevelAlert } from "../services/notificationService.js";
import logger from "../utils/logger.js";

/**
 * Recalculate risk scores for all active students
 */
export const recalculateAllRiskScores = async () => {
  try {
    logger.info("Starting risk recalculation for all students...");
    
    const students = await Student.find({ 
      isActive: true,
      status: { $in: ["Active", "At Risk", "Intervention"] }
    }).select("_id firstName lastName riskScore riskLevel");

    logger.info(`Found ${students.length} active students for risk recalculation`);

    let successful = 0;
    let failed = 0;
    let riskLevelChanges = 0;

    for (const student of students) {
      try {
        const oldRiskLevel = student.riskLevel;
        const oldRiskScore = student.riskScore;

        // Calculate new risk score
        const riskCalculation = await calculateRiskScore(student._id);
        
        // Update student with new risk data
        await Student.findByIdAndUpdate(student._id, {
          riskScore: riskCalculation.totalRiskScore,
          riskLevel: getRiskLevel(riskCalculation.totalRiskScore),
          riskFactors: riskCalculation.factors,
          predictedDropoutDate: riskCalculation.dropoutPrediction.timeline !== "Low risk" 
            ? calculateDropoutDate(riskCalculation.dropoutPrediction.timeline)
            : null,
          dropoutProbability: riskCalculation.dropoutPrediction.probability || 0,
        });

        // Save detailed risk factor analysis
        await RiskFactor.create({
          student: student._id,
          academicYear: getCurrentAcademicYear(),
          totalRiskScore: riskCalculation.totalRiskScore,
          riskLevel: getRiskLevel(riskCalculation.totalRiskScore),
          attendanceRisk: {
            score: riskCalculation.factors.attendance,
            weight: 0.25,
            details: riskCalculation.breakdown.attendance,
          },
          academicRisk: {
            score: riskCalculation.factors.academic,
            weight: 0.25,
            details: riskCalculation.breakdown.academic,
          },
          financialRisk: {
            score: riskCalculation.factors.financial,
            weight: 0.15,
            details: riskCalculation.breakdown.financial,
          },
          behavioralRisk: {
            score: riskCalculation.factors.behavioral,
            weight: 0.1,
            details: riskCalculation.breakdown.behavioral,
          },
          healthRisk: {
            score: riskCalculation.factors.health,
            weight: 0.1,
            details: riskCalculation.breakdown.health,
          },
          distanceRisk: {
            score: riskCalculation.factors.distance,
            weight: 0.1,
            details: riskCalculation.breakdown.distance,
          },
          familyRisk: {
            score: riskCalculation.factors.family,
            weight: 0.05,
            details: riskCalculation.breakdown.family,
          },
          dropoutPrediction: {
            probability: parseFloat(riskCalculation.dropoutPrediction.probability) || 0,
            timeline: riskCalculation.dropoutPrediction.timeline,
            urgency: riskCalculation.dropoutPrediction.urgency,
          },
          recommendations: riskCalculation.recommendations,
          previousRiskScore: oldRiskScore,
          riskTrend: getRiskTrend(oldRiskScore, riskCalculation.totalRiskScore),
          changeFromPrevious: oldRiskScore ? 
            ((riskCalculation.totalRiskScore - oldRiskScore) / oldRiskScore * 100).toFixed(2) : 0,
          calculatedBy: "System",
          modelVersion: "1.0",
          dataCompleteness: calculateDataCompleteness(student),
        });

        const newRiskLevel = getRiskLevel(riskCalculation.totalRiskScore);

        // Check if risk level changed significantly
        if (oldRiskLevel !== newRiskLevel) {
          riskLevelChanges++;
          
          // Send alert if risk level increased
          if (shouldSendRiskAlert(oldRiskLevel, newRiskLevel)) {
            await sendRiskLevelAlert(student, oldRiskLevel, newRiskLevel);
          }
          
          logger.info(`Risk level changed for ${student.firstName} ${student.lastName}: ${oldRiskLevel} → ${newRiskLevel}`);
        }

        successful++;
        
        // Log significant risk score changes
        const scoreChange = Math.abs(riskCalculation.totalRiskScore - oldRiskScore);
        if (scoreChange > 10) {
          logger.info(`Significant risk score change for ${student.firstName} ${student.lastName}: ${oldRiskScore} → ${riskCalculation.totalRiskScore}`);
        }

      } catch (error) {
        failed++;
        logger.error(`Failed to calculate risk for student ${student._id} (${student.firstName} ${student.lastName}):`, error);
      }
    }

    const summary = {
      totalStudents: students.length,
      successful,
      failed,
      riskLevelChanges,
      completedAt: new Date(),
    };

    logger.info(`Risk recalculation completed:`, summary);
    
    return summary;
  } catch (error) {
    logger.error("Error in risk recalculation job:", error);
    throw error;
  }
};

/**
 * Recalculate risk for specific students
 */
export const recalculateStudentRisk = async (studentIds) => {
  try {
    logger.info(`Recalculating risk for ${studentIds.length} specific students`);
    
    const results = [];
    
    for (const studentId of studentIds) {
      try {
        const student = await Student.findById(studentId);
        if (!student) {
          results.push({ studentId, success: false, error: "Student not found" });
          continue;
        }

        const oldRiskLevel = student.riskLevel;
        const riskCalculation = await calculateRiskScore(studentId);
        
        await Student.findByIdAndUpdate(studentId, {
          riskScore: riskCalculation.totalRiskScore,
          riskLevel: getRiskLevel(riskCalculation.totalRiskScore),
          riskFactors: riskCalculation.factors,
        });

        const newRiskLevel = getRiskLevel(riskCalculation.totalRiskScore);
        
        if (oldRiskLevel !== newRiskLevel && shouldSendRiskAlert(oldRiskLevel, newRiskLevel)) {
          await sendRiskLevelAlert(student, oldRiskLevel, newRiskLevel);
        }

        results.push({ 
          studentId, 
          success: true, 
          oldRiskLevel, 
          newRiskLevel,
          riskScore: riskCalculation.totalRiskScore 
        });
        
      } catch (error) {
        results.push({ studentId, success: false, error: error.message });
      }
    }
    
    return results;
  } catch (error) {
    logger.error("Error in specific student risk recalculation:", error);
    throw error;
  }
};

/**
 * Identify students with rapidly increasing risk
 */
export const identifyRapidRiskIncrease = async () => {
  try {
    logger.info("Identifying students with rapid risk increase...");
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const pipeline = [
      {
        $match: {
          calculatedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $sort: { student: 1, calculatedAt: -1 },
      },
      {
        $group: {
          _id: "$student",
          riskHistory: { $push: "$$ROOT" },
        },
      },
      {
        $match: {
          "riskHistory.1": { $exists: true }, // At least 2 records
        },
      },
    ];

    const studentRiskHistory = await RiskFactor.aggregate(pipeline);
    const rapidIncreaseStudents = [];

    for (const record of studentRiskHistory) {
      const history = record.riskHistory;
      const latest = history[0];
      const previous = history[1];
      
      const riskIncrease = latest.totalRiskScore - previous.totalRiskScore;
      const timeSpan = (latest.calculatedAt - previous.calculatedAt) / (1000 * 60 * 60 * 24); // days
      
      // Flag if risk increased by more than 15 points in less than 7 days
      if (riskIncrease > 15 && timeSpan <= 7) {
        const student = await Student.findById(record._id).select("firstName lastName rollNumber riskLevel");
        
        rapidIncreaseStudents.push({
          student,
          riskIncrease,
          timeSpan,
          currentRisk: latest.totalRiskScore,
          previousRisk: previous.totalRiskScore,
        });
      }
    }

    if (rapidIncreaseStudents.length > 0) {
      logger.warn(`Found ${rapidIncreaseStudents.length} students with rapid risk increase`);
      
      // Send alert to administrators and counselors
      // This could be implemented as a separate notification
    }

    return rapidIncreaseStudents;
  } catch (error) {
    logger.error("Error identifying rapid risk increase:", error);
    throw error;
  }
};

/**
 * Generate risk trend report
 */
export const generateRiskTrendReport = async (period = "month") => {
  try {
    const startDate = new Date();
    
    switch (period) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const pipeline = [
      {
        $match: {
          calculatedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$calculatedAt",
              },
            },
            riskLevel: "$riskLevel",
          },
          count: { $sum: 1 },
          averageRiskScore: { $avg: "$totalRiskScore" },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          riskDistribution: {
            $push: {
              level: "$_id.riskLevel",
              count: "$count",
              averageScore: "$averageRiskScore",
            },
          },
          totalStudents: { $sum: "$count" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];

    const trendData = await RiskFactor.aggregate(pipeline);
    
    return {
      period,
      startDate,
      endDate: new Date(),
      data: trendData,
      generatedAt: new Date(),
    };
  } catch (error) {
    logger.error("Error generating risk trend report:", error);
    throw error;
  }
};

// Helper functions
const getRiskLevel = (riskScore) => {
  if (riskScore < 30) return "Low";
  if (riskScore < 60) return "Medium";
  if (riskScore < 80) return "High";
  return "Critical";
};

const getRiskTrend = (oldScore, newScore) => {
  if (!oldScore) return "Unknown";
  
  const change = newScore - oldScore;
  if (change > 5) return "Worsening";
  if (change < -5) return "Improving";
  return "Stable";
};

const shouldSendRiskAlert = (oldLevel, newLevel) => {
  const levels = ["Low", "Medium", "High", "Critical"];
  const oldIndex = levels.indexOf(oldLevel);
  const newIndex = levels.indexOf(newLevel);
  
  // Send alert if risk level increased
  return newIndex > oldIndex;
};

const calculateDropoutDate = (timeline) => {
  const now = new Date();
  
  switch (timeline) {
    case "1-3 months":
      now.setMonth(now.getMonth() + 2);
      break;
    case "3-6 months":
      now.setMonth(now.getMonth() + 4);
      break;
    case "6-12 months":
      now.setMonth(now.getMonth() + 9);
      break;
    default:
      return null;
  }
  
  return now;
};

const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Academic year starts in April (month 3)
  if (month >= 3) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

const calculateDataCompleteness = (student) => {
  const requiredFields = [
    "firstName", "lastName", "dateOfBirth", "gender", "class",
    "attendancePercentage", "overallPercentage", "familyIncomeLevel",
    "distanceFromSchool", "transportationMode", "father.name", "mother.name"
  ];
  
  let completedFields = 0;
  
  requiredFields.forEach(field => {
    const value = field.includes(".") 
      ? field.split(".").reduce((obj, key) => obj?.[key], student)
      : student[field];
    
    if (value !== null && value !== undefined && value !== "") {
      completedFields++;
    }
  });
  
  return (completedFields / requiredFields.length * 100).toFixed(2);
};

// Schedule the risk recalculation job
export const scheduleRiskRecalculation = () => {
  // Run daily at 2 AM
  cron.schedule("0 2 * * *", async () => {
    if (process.env.ENABLE_CRON_JOBS === "true") {
      logger.info("Starting scheduled risk recalculation...");
      try {
        await recalculateAllRiskScores();
      } catch (error) {
        logger.error("Scheduled risk recalculation failed:", error);
      }
    }
  });

  // Run rapid risk increase check every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    if (process.env.ENABLE_CRON_JOBS === "true") {
      try {
        await identifyRapidRiskIncrease();
      } catch (error) {
        logger.error("Rapid risk increase check failed:", error);
      }
    }
  });

  logger.info("Risk recalculation jobs scheduled");
};

export default {
  recalculateAllRiskScores,
  recalculateStudentRisk,
  identifyRapidRiskIncrease,
  generateRiskTrendReport,
  scheduleRiskRecalculation,
};