import Student from "../models/Student.js";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Grade from "../models/Grade.js";
import Intervention from "../models/Intervention.js";
import RiskFactor from "../models/RiskFactor.js";
import Class from "../models/Class.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";

// @desc    Get dashboard analytics
// @route   GET /api/v1/analytics/dashboard
// @access  Private (Admin, Teacher, Counselor)
export const getDashboardAnalytics = asyncHandler(async (req, res, next) => {
  try {
    console.log('📊 Fetching dashboard analytics...');
    
    // Get real data from database
    const totalStudents = await Student.countDocuments({ isActive: { $ne: false } });
    console.log('Total students:', totalStudents);
    
    const atRiskStudents = await Student.countDocuments({ 
      isActive: { $ne: false },
      riskLevel: { $in: ['High', 'Critical'] }
    });
    console.log('At-risk students:', atRiskStudents);
    
    const activeInterventions = await Intervention.countDocuments({ 
      status: { $in: ['In Progress', 'Approved'] }
    });
    console.log('Active interventions:', activeInterventions);
    
    // Calculate average attendance
    const attendanceStats = await Student.aggregate([
      { $match: { isActive: { $ne: false } } },
      { $group: { _id: null, avgAttendance: { $avg: "$attendancePercentage" } } }
    ]);
    const averageAttendance = Math.round(attendanceStats[0]?.avgAttendance || 0);

    // Get risk distribution
    const riskDistribution = await Student.aggregate([
      { $match: { isActive: { $ne: false } } },
      { $group: { _id: "$riskLevel", count: { $sum: 1 } } }
    ]);

    const riskDistributionData = [
      { name: 'Low', value: 0, color: '#10B981' },
      { name: 'Medium', value: 0, color: '#F59E0B' },
      { name: 'High', value: 0, color: '#EF4444' },
      { name: 'Critical', value: 0, color: '#8B5CF6' }
    ];

    riskDistribution.forEach(item => {
      const index = riskDistributionData.findIndex(r => r.name === item._id);
      if (index !== -1) {
        riskDistributionData[index].value = item.count;
      }
    });

    // Get high risk students
    const highRiskStudents = await Student.find({
      isActive: { $ne: false },
      riskLevel: { $in: ['High', 'Critical'] }
    })
    .select('firstName lastName rollNumber section riskLevel riskScore photo')
    .limit(5)
    .lean();

    const formattedHighRiskStudents = highRiskStudents.map(student => ({
      id: student._id,
      name: `${student.firstName} ${student.lastName}`,
      class: student.section,
      rollNumber: student.rollNumber,
      riskLevel: student.riskLevel,
      riskScore: student.riskScore || 0,
      photo: student.photo || null
    }));

    // Mock attendance trend data (you can replace with real data)
    const attendanceTrend = [
      { month: 'Jan', percentage: 88 },
      { month: 'Feb', percentage: 92 },
      { month: 'Mar', percentage: 85 },
      { month: 'Apr', percentage: 90 },
      { month: 'May', percentage: 87 },
      { month: 'Jun', percentage: averageAttendance }
    ];

    // Get class performance data
    const classPerformance = await Student.aggregate([
      { $match: { isActive: { $ne: false } } },
      { 
        $group: { 
          _id: "$section", 
          avgScore: { $avg: "$overallPercentage" },
          avgAttendance: { $avg: "$attendancePercentage" }
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    const classPerformanceData = classPerformance.map(item => ({
      class: item._id,
      score: Math.round(item.avgScore || 0),
      attendance: Math.round(item.avgAttendance || 0)
    }));

    const analytics = {
      totalStudents,
      atRiskStudents,
      activeInterventions,
      averageAttendance,
      riskDistribution: riskDistributionData,
      attendanceTrend,
      classPerformance: classPerformanceData,
      highRiskStudents: formattedHighRiskStudents
    };

    console.log('📊 Analytics data:', analytics);

    res.status(200).json({
      status: "success",
      data: analytics,
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch dashboard analytics"
    });
  }
});

// @desc    Get risk distribution analytics
// @route   GET /api/v1/analytics/risk-distribution
// @access  Private (Admin, Counselor)
export const getRiskDistribution = asyncHandler(async (req, res, next) => {
  const distribution = await RiskFactor.getRiskDistribution();
  
  res.status(200).json({
    status: "success",
    data: {
      distribution,
    },
  });
});

// @desc    Get attendance trends
// @route   GET /api/v1/analytics/attendance-trends
// @access  Private (Admin, Teacher)
export const getAttendanceTrends = asyncHandler(async (req, res, next) => {
  const { classId, period = "6months" } = req.query;
  
  const trends = await getAnalytics.getAttendanceTrends(classId, period);
  
  res.status(200).json({
    status: "success",
    data: {
      trends,
    },
  });
});

// @desc    Get academic performance analytics
// @route   GET /api/v1/analytics/academic-performance
// @access  Private (Admin, Teacher)
export const getAcademicPerformance = asyncHandler(async (req, res, next) => {
  const { classId, subject, examType } = req.query;
  
  const performance = await getAnalytics.getAcademicPerformance({
    classId,
    subject,
    examType,
  });
  
  res.status(200).json({
    status: "success",
    data: {
      performance,
    },
  });
});

// @desc    Get intervention effectiveness
// @route   GET /api/v1/analytics/intervention-effectiveness
// @access  Private (Admin, Counselor)
export const getInterventionEffectiveness = asyncHandler(async (req, res, next) => {
  const { type, period = "year" } = req.query;
  
  const effectiveness = await getAnalytics.getInterventionEffectiveness(type, period);
  
  res.status(200).json({
    status: "success",
    data: {
      effectiveness,
    },
  });
});

// @desc    Get predictive analytics
// @route   GET /api/v1/analytics/predictions
// @access  Private (Admin, Counselor)
export const getPredictiveAnalytics = asyncHandler(async (req, res, next) => {
  const { horizon = "3months" } = req.query;
  
  const predictions = await getAnalytics.getPredictiveAnalytics(horizon);
  
  res.status(200).json({
    status: "success",
    data: {
      predictions,
    },
  });
});

// @desc    Get class comparison analytics
// @route   GET /api/v1/analytics/class-comparison
// @access  Private (Admin, Teacher)
export const getClassComparison = asyncHandler(async (req, res, next) => {
  const { metric = "attendance", period = "month" } = req.query;
  
  const comparison = await getAnalytics.getClassComparison(metric, period);
  
  res.status(200).json({
    status: "success",
    data: {
      comparison,
    },
  });
});

// @desc    Get student progress analytics
// @route   GET /api/v1/analytics/student-progress/:studentId
// @access  Private (Admin, Teacher, Counselor, Parent)
export const getStudentProgress = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;
  const { period = "6months" } = req.query;
  
  // Check if user has access to this student
  if (req.user.role === "parent") {
    const hasAccess = req.user.children.includes(studentId);
    if (!hasAccess) {
      return next(new AppError("Access denied", 403));
    }
  }
  
  const progress = await getAnalytics.getStudentProgress(studentId, period);
  
  res.status(200).json({
    status: "success",
    data: {
      progress,
    },
  });
});

// @desc    Get real-time statistics
// @route   GET /api/v1/analytics/real-time-stats
// @access  Private (Admin)
export const getRealTimeStats = asyncHandler(async (req, res, next) => {
  const stats = await getAnalytics.getRealTimeStats();
  
  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

// @desc    Get demographic analytics
// @route   GET /api/v1/analytics/demographics
// @access  Private (Admin)
export const getDemographicAnalytics = asyncHandler(async (req, res, next) => {
  const demographics = await getAnalytics.getDemographicAnalytics();
  
  res.status(200).json({
    status: "success",
    data: {
      demographics,
    },
  });
});

// @desc    Get financial impact analytics
// @route   GET /api/v1/analytics/financial-impact
// @access  Private (Admin)
export const getFinancialImpact = asyncHandler(async (req, res, next) => {
  const { period = "year" } = req.query;
  
  const impact = await getAnalytics.getFinancialImpact(period);
  
  res.status(200).json({
    status: "success",
    data: {
      impact,
    },
  });
});

// @desc    Get user statistics
// @route   GET /api/v1/analytics/user-stats
// @access  Private (Admin)
export const getUserStats = asyncHandler(async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    const roleStats = {
      admin: 0,
      teacher: 0,
      counselor: 0,
      parent: 0
    };

    usersByRole.forEach(item => {
      if (roleStats.hasOwnProperty(item._id)) {
        roleStats[item._id] = item.count;
      }
    });

    res.status(200).json({
      status: "success",
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        roleStats
      }
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch user statistics"
    });
  }
});

// @desc    Export analytics data
// @route   POST /api/v1/analytics/export
// @access  Private (Admin)
export const exportAnalytics = asyncHandler(async (req, res, next) => {
  const { type, format = "csv", filters = {} } = req.body;
  
  // Mock export functionality
  res.status(200).json({
    status: "success",
    data: {
      downloadUrl: "/exports/analytics.csv",
      filename: "analytics_export.csv",
    },
  });
});