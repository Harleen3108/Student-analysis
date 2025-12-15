import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import Grade from "../models/Grade.js";
import Intervention from "../models/Intervention.js";
import RiskFactor from "../models/RiskFactor.js";
import Class from "../models/Class.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

/**
 * Get dashboard analytics for admin
 */
export const getDashboardAnalytics = async () => {
  try {
    const [
      totalStudents,
      activeStudents,
      totalClasses,
      totalTeachers,
      riskDistribution,
      attendanceStats,
      interventionStats,
      recentActivities
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ isActive: true }),
      Class.countDocuments({ isActive: true }),
      User.countDocuments({ role: "teacher", isActive: true }),
      getRiskDistribution(),
      getAttendanceStatistics(),
      getInterventionStatistics(),
      getRecentActivities()
    ]);

    return {
      overview: {
        totalStudents,
        activeStudents,
        totalClasses,
        totalTeachers,
        dropoutRate: ((totalStudents - activeStudents) / totalStudents * 100).toFixed(2)
      },
      riskDistribution,
      attendanceStats,
      interventionStats,
      recentActivities
    };
  } catch (error) {
    logger.error("Dashboard analytics error:", error);
    throw error;
  }
};

/**
 * Get risk distribution analytics
 */
export const getRiskDistribution = async () => {
  try {
    const pipeline = [
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: "$riskLevel",
          count: { $sum: 1 },
          averageScore: { $avg: "$riskScore" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];

    const distribution = await Student.aggregate(pipeline);
    
    // Ensure all risk levels are represented
    const riskLevels = ["Low", "Medium", "High", "Critical"];
    const result = riskLevels.map(level => {
      const found = distribution.find(d => d._id === level);
      return {
        level,
        count: found ? found.count : 0,
        averageScore: found ? Math.round(found.averageScore) : 0
      };
    });

    return result;
  } catch (error) {
    logger.error("Risk distribution error:", error);
    throw error;
  }
};

/**
 * Get attendance statistics
 */
export const getAttendanceStatistics = async () => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const [
      todayAttendance,
      monthlyAverage,
      lowAttendanceStudents
    ] = await Promise.all([
      getTodayAttendanceStats(),
      getMonthlyAttendanceAverage(startOfMonth, today),
      getLowAttendanceStudents()
    ]);

    return {
      today: todayAttendance,
      monthlyAverage,
      lowAttendanceCount: lowAttendanceStudents.length,
      lowAttendanceStudents: lowAttendanceStudents.slice(0, 10) // Top 10
    };
  } catch (error) {
    logger.error("Attendance statistics error:", error);
    throw error;
  }
};

/**
 * Get today's attendance statistics
 */
const getTodayAttendanceStats = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const pipeline = [
      {
        $match: {
          date: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ];

    const results = await Attendance.aggregate(pipeline);
    
    let present = 0, absent = 0, late = 0, excused = 0;
    
    results.forEach(result => {
      switch (result._id) {
        case "Present": present = result.count; break;
        case "Absent": absent = result.count; break;
        case "Late": late = result.count; break;
        case "Excused": excused = result.count; break;
      }
    });

    const total = present + absent + late + excused;
    const percentage = total > 0 ? ((present + late) / total * 100).toFixed(2) : 0;

    return {
      present,
      absent,
      late,
      excused,
      total,
      percentage: parseFloat(percentage)
    };
  } catch (error) {
    logger.error("Today attendance stats error:", error);
    return { present: 0, absent: 0, late: 0, excused: 0, total: 0, percentage: 0 };
  }
};

/**
 * Get monthly attendance average
 */
const getMonthlyAttendanceAverage = async (startDate, endDate) => {
  try {
    const pipeline = [
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          presentRecords: {
            $sum: {
              $cond: [
                { $in: ["$status", ["Present", "Late"]] },
                1,
                0
              ]
            }
          }
        }
      }
    ];

    const result = await Attendance.aggregate(pipeline);
    
    if (result.length === 0) return 0;
    
    const { totalRecords, presentRecords } = result[0];
    return totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(2) : 0;
  } catch (error) {
    logger.error("Monthly attendance average error:", error);
    return 0;
  }
};

/**
 * Get students with low attendance
 */
const getLowAttendanceStudents = async () => {
  try {
    return await Student.find({
      isActive: true,
      attendancePercentage: { $lt: 75 }
    })
    .select("firstName lastName rollNumber attendancePercentage riskLevel")
    .sort({ attendancePercentage: 1 })
    .limit(20);
  } catch (error) {
    logger.error("Low attendance students error:", error);
    return [];
  }
};

/**
 * Get intervention statistics
 */
export const getInterventionStatistics = async () => {
  try {
    const [
      totalInterventions,
      activeInterventions,
      completedInterventions,
      successfulInterventions,
      interventionsByType
    ] = await Promise.all([
      Intervention.countDocuments(),
      Intervention.countDocuments({ status: "In Progress" }),
      Intervention.countDocuments({ status: "Completed" }),
      Intervention.countDocuments({ outcome: "Successful" }),
      getInterventionsByType()
    ]);

    const successRate = completedInterventions > 0 
      ? ((successfulInterventions / completedInterventions) * 100).toFixed(2)
      : 0;

    return {
      total: totalInterventions,
      active: activeInterventions,
      completed: completedInterventions,
      successful: successfulInterventions,
      successRate: parseFloat(successRate),
      byType: interventionsByType
    };
  } catch (error) {
    logger.error("Intervention statistics error:", error);
    throw error;
  }
};

/**
 * Get interventions by type
 */
const getInterventionsByType = async () => {
  try {
    const pipeline = [
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          successful: {
            $sum: {
              $cond: [{ $eq: ["$outcome", "Successful"] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ];

    return await Intervention.aggregate(pipeline);
  } catch (error) {
    logger.error("Interventions by type error:", error);
    return [];
  }
};

/**
 * Get recent activities
 */
export const getRecentActivities = async (limit = 10) => {
  try {
    // Get recent interventions, risk changes, etc.
    const recentInterventions = await Intervention.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("student", "firstName lastName rollNumber")
      .populate("assignedCounselor", "firstName lastName")
      .select("title type status createdAt");

    const recentRiskChanges = await Student.find({
      riskLevel: { $in: ["High", "Critical"] }
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("firstName lastName rollNumber riskLevel riskScore updatedAt");

    const activities = [];

    // Add intervention activities
    recentInterventions.forEach(intervention => {
      activities.push({
        type: "intervention",
        title: `New ${intervention.type} intervention`,
        description: `${intervention.title} for ${intervention.student.firstName} ${intervention.student.lastName}`,
        timestamp: intervention.createdAt,
        priority: intervention.status === "Pending Approval" ? "high" : "normal"
      });
    });

    // Add risk change activities
    recentRiskChanges.forEach(student => {
      activities.push({
        type: "risk_change",
        title: `${student.riskLevel} risk student`,
        description: `${student.firstName} ${student.lastName} (${student.rollNumber}) - Risk Score: ${student.riskScore}`,
        timestamp: student.updatedAt,
        priority: student.riskLevel === "Critical" ? "critical" : "high"
      });
    });

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (error) {
    logger.error("Recent activities error:", error);
    return [];
  }
};

/**
 * Get class-wise analytics
 */
export const getClassAnalytics = async (classId = null) => {
  try {
    const matchStage = classId 
      ? { class: new mongoose.Types.ObjectId(classId), isActive: true }
      : { isActive: true };

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "classes",
          localField: "class",
          foreignField: "_id",
          as: "classInfo"
        }
      },
      { $unwind: "$classInfo" },
      {
        $group: {
          _id: {
            classId: "$class",
            className: "$classInfo.name",
            section: "$classInfo.section"
          },
          totalStudents: { $sum: 1 },
          averageAttendance: { $avg: "$attendancePercentage" },
          averagePerformance: { $avg: "$overallPercentage" },
          averageRiskScore: { $avg: "$riskScore" },
          lowRisk: {
            $sum: { $cond: [{ $eq: ["$riskLevel", "Low"] }, 1, 0] }
          },
          mediumRisk: {
            $sum: { $cond: [{ $eq: ["$riskLevel", "Medium"] }, 1, 0] }
          },
          highRisk: {
            $sum: { $cond: [{ $eq: ["$riskLevel", "High"] }, 1, 0] }
          },
          criticalRisk: {
            $sum: { $cond: [{ $eq: ["$riskLevel", "Critical"] }, 1, 0] }
          }
        }
      },
      {
        $sort: { "_id.className": 1, "_id.section": 1 }
      }
    ];

    return await Student.aggregate(pipeline);
  } catch (error) {
    logger.error("Class analytics error:", error);
    throw error;
  }
};

/**
 * Get attendance trends
 */
export const getAttendanceTrends = async (period = "month", classId = null) => {
  try {
    const endDate = new Date();
    let startDate = new Date();
    let groupBy = {};

    switch (period) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        groupBy = {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" }
        };
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        groupBy = {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" }
        };
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        groupBy = {
          year: { $year: "$date" },
          month: { $month: "$date" }
        };
        break;
    }

    const matchStage = {
      date: { $gte: startDate, $lte: endDate }
    };

    if (classId) {
      matchStage.class = new mongoose.Types.ObjectId(classId);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: groupBy,
          totalRecords: { $sum: 1 },
          presentRecords: {
            $sum: {
              $cond: [
                { $in: ["$status", ["Present", "Late"]] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          totalRecords: 1,
          presentRecords: 1,
          percentage: {
            $multiply: [
              { $divide: ["$presentRecords", "$totalRecords"] },
              100
            ]
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ];

    return await Attendance.aggregate(pipeline);
  } catch (error) {
    logger.error("Attendance trends error:", error);
    throw error;
  }
};

/**
 * Get academic performance trends
 */
export const getAcademicTrends = async (period = "term", classId = null) => {
  try {
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;

    const matchStage = {
      academicYear,
      isPublished: true
    };

    if (classId) {
      matchStage.class = new mongoose.Types.ObjectId(classId);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            term: "$term",
            subject: "$subject"
          },
          averagePercentage: { $avg: "$percentage" },
          totalStudents: { $sum: 1 },
          passedStudents: {
            $sum: { $cond: ["$isPassed", 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 1,
          averagePercentage: { $round: ["$averagePercentage", 2] },
          totalStudents: 1,
          passedStudents: 1,
          passRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$passedStudents", "$totalStudents"] },
                  100
                ]
              },
              2
            ]
          }
        }
      },
      { $sort: { "_id.term": 1, "_id.subject": 1 } }
    ];

    return await Grade.aggregate(pipeline);
  } catch (error) {
    logger.error("Academic trends error:", error);
    throw error;
  }
};

/**
 * Get risk factor analysis
 */
export const getRiskFactorAnalysis = async () => {
  try {
    const pipeline = [
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: null,
          avgAttendanceRisk: { $avg: "$riskFactors.attendance" },
          avgAcademicRisk: { $avg: "$riskFactors.academic" },
          avgFinancialRisk: { $avg: "$riskFactors.financial" },
          avgBehavioralRisk: { $avg: "$riskFactors.behavioral" },
          avgHealthRisk: { $avg: "$riskFactors.health" },
          avgDistanceRisk: { $avg: "$riskFactors.distance" },
          avgFamilyRisk: { $avg: "$riskFactors.family" },
          totalStudents: { $sum: 1 }
        }
      }
    ];

    const result = await Student.aggregate(pipeline);
    
    if (result.length === 0) {
      return {
        attendance: 0, academic: 0, financial: 0, behavioral: 0,
        health: 0, distance: 0, family: 0
      };
    }

    const data = result[0];
    return {
      attendance: Math.round(data.avgAttendanceRisk || 0),
      academic: Math.round(data.avgAcademicRisk || 0),
      financial: Math.round(data.avgFinancialRisk || 0),
      behavioral: Math.round(data.avgBehavioralRisk || 0),
      health: Math.round(data.avgHealthRisk || 0),
      distance: Math.round(data.avgDistanceRisk || 0),
      family: Math.round(data.avgFamilyRisk || 0)
    };
  } catch (error) {
    logger.error("Risk factor analysis error:", error);
    throw error;
  }
};

/**
 * Get intervention effectiveness analysis
 */
export const getInterventionEffectiveness = async () => {
  try {
    const pipeline = [
      {
        $match: {
          status: "Completed",
          metricsBeforeIntervention: { $exists: true },
          metricsAfterIntervention: { $exists: true }
        }
      },
      {
        $project: {
          type: 1,
          outcome: 1,
          riskImprovement: {
            $subtract: [
              "$metricsBeforeIntervention.riskScore",
              "$metricsAfterIntervention.riskScore"
            ]
          },
          attendanceImprovement: {
            $subtract: [
              "$metricsAfterIntervention.attendancePercentage",
              "$metricsBeforeIntervention.attendancePercentage"
            ]
          },
          academicImprovement: {
            $subtract: [
              "$metricsAfterIntervention.academicPercentage",
              "$metricsBeforeIntervention.academicPercentage"
            ]
          }
        }
      },
      {
        $group: {
          _id: "$type",
          totalInterventions: { $sum: 1 },
          successfulInterventions: {
            $sum: { $cond: [{ $eq: ["$outcome", "Successful"] }, 1, 0] }
          },
          avgRiskImprovement: { $avg: "$riskImprovement" },
          avgAttendanceImprovement: { $avg: "$attendanceImprovement" },
          avgAcademicImprovement: { $avg: "$academicImprovement" }
        }
      },
      {
        $project: {
          _id: 1,
          totalInterventions: 1,
          successfulInterventions: 1,
          successRate: {
            $multiply: [
              { $divide: ["$successfulInterventions", "$totalInterventions"] },
              100
            ]
          },
          avgRiskImprovement: { $round: ["$avgRiskImprovement", 2] },
          avgAttendanceImprovement: { $round: ["$avgAttendanceImprovement", 2] },
          avgAcademicImprovement: { $round: ["$avgAcademicImprovement", 2] }
        }
      },
      { $sort: { successRate: -1 } }
    ];

    return await Intervention.aggregate(pipeline);
  } catch (error) {
    logger.error("Intervention effectiveness error:", error);
    throw error;
  }
};

/**
 * Get predictive analytics
 */
export const getPredictiveAnalytics = async () => {
  try {
    const [
      dropoutPredictions,
      riskTrends,
      interventionNeeds
    ] = await Promise.all([
      getDropoutPredictions(),
      getRiskTrends(),
      getInterventionNeeds()
    ]);

    return {
      dropoutPredictions,
      riskTrends,
      interventionNeeds
    };
  } catch (error) {
    logger.error("Predictive analytics error:", error);
    throw error;
  }
};

/**
 * Get dropout predictions
 */
const getDropoutPredictions = async () => {
  try {
    const pipeline = [
      {
        $match: {
          isActive: true,
          riskLevel: { $in: ["High", "Critical"] }
        }
      },
      {
        $group: {
          _id: "$predictedDropoutDate",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];

    return await Student.aggregate(pipeline);
  } catch (error) {
    logger.error("Dropout predictions error:", error);
    return [];
  }
};

/**
 * Get risk trends
 */
const getRiskTrends = async () => {
  try {
    // This would typically use historical risk data
    // For now, return current distribution
    return await getRiskDistribution();
  } catch (error) {
    logger.error("Risk trends error:", error);
    return [];
  }
};

/**
 * Get intervention needs
 */
const getInterventionNeeds = async () => {
  try {
    const pipeline = [
      {
        $match: {
          isActive: true,
          hasActiveIntervention: false,
          riskLevel: { $in: ["Medium", "High", "Critical"] }
        }
      },
      {
        $group: {
          _id: "$riskLevel",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];

    return await Student.aggregate(pipeline);
  } catch (error) {
    logger.error("Intervention needs error:", error);
    return [];
  }
};

export default {
  getDashboardAnalytics,
  getRiskDistribution,
  getAttendanceStatistics,
  getInterventionStatistics,
  getRecentActivities,
  getClassAnalytics,
  getAttendanceTrends,
  getAcademicTrends,
  getRiskFactorAnalysis,
  getInterventionEffectiveness,
  getPredictiveAnalytics
};