import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import Grade from "../models/Grade.js";
import Intervention from "../models/Intervention.js";
import Class from "../models/Class.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// @desc    Get Admin Dashboard Data
// @route   GET /api/v1/dashboard/admin
// @access  Private (Admin)
export const getAdminDashboard = asyncHandler(async (req, res, next) => {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 3, 1); // April 1st

  // Get key statistics
  const [
    totalStudents,
    activeStudents,
    atRiskStudents,
    criticalStudents,
    dropoutStudents,
    totalInterventions,
    activeInterventions,
    successfulInterventions,
    todayAbsent,
  ] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ isActive: true }),
    Student.countDocuments({
      riskLevel: { $in: ["Medium", "High", "Critical"] },
      isActive: true,
    }),
    Student.countDocuments({ riskLevel: "Critical", isActive: true }),
    Student.countDocuments({ status: "Dropout" }),
    Intervention.countDocuments(),
    Intervention.countDocuments({ status: "In Progress" }),
    Intervention.countDocuments({ outcome: "Successful" }),
    Attendance.countDocuments({
      date: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lte: new Date(today.setHours(23, 59, 59, 999)),
      },
      status: "Absent",
    }),
  ]);

  // Calculate dropout rate
  const dropoutRate =
    totalStudents > 0
      ? ((dropoutStudents / totalStudents) * 100).toFixed(2)
      : 0;

  // Get risk distribution
  const riskDistribution = await Student.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: "$riskLevel",
        count: { $sum: 1 },
      },
    },
  ]);

  // Get recent at-risk students (top 10 by risk score)
  const recentAtRisk = await Student.find({
    riskLevel: { $in: ["High", "Critical"] },
    isActive: true,
  })
    .select("firstName lastName rollNumber photo riskScore riskLevel")
    .populate("class", "name section")
    .sort({ riskScore: -1 })
    .limit(10)
    .lean();

  // Get attendance trends (last 30 days)
  const attendanceTrend = await Attendance.aggregate([
    {
      $match: {
        date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] },
        },
        absent: {
          $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Get class-wise statistics
  const classWiseStats = await Student.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: "$class",
        totalStudents: { $sum: 1 },
        atRiskCount: {
          $sum: {
            $cond: [
              { $in: ["$riskLevel", ["Medium", "High", "Critical"]] },
              1,
              0,
            ],
          },
        },
        avgRiskScore: { $avg: "$riskScore" },
        avgAttendance: { $avg: "$attendancePercentage" },
      },
    },
    {
      $lookup: {
        from: "classes",
        localField: "_id",
        foreignField: "_id",
        as: "classInfo",
      },
    },
    { $unwind: "$classInfo" },
    {
      $project: {
        className: "$classInfo.name",
        section: "$classInfo.section",
        totalStudents: 1,
        atRiskCount: 1,
        avgRiskScore: { $round: ["$avgRiskScore", 2] },
        avgAttendance: { $round: ["$avgAttendance", 2] },
      },
    },
    { $sort: { avgRiskScore: -1 } },
  ]);

  // Get intervention success rate
  const interventionStats = await Intervention.aggregate([
    {
      $group: {
        _id: "$outcome",
        count: { $sum: 1 },
      },
    },
  ]);

  const interventionSuccessRate = calculateSuccessRate(interventionStats);

  res.status(200).json({
    status: "success",
    data: {
      statistics: {
        totalStudents,
        activeStudents,
        atRiskStudents,
        criticalStudents,
        dropoutStudents,
        dropoutRate: parseFloat(dropoutRate),
        totalInterventions,
        activeInterventions,
        successfulInterventions,
        interventionSuccessRate,
        todayAbsent,
      },
      riskDistribution,
      recentAtRisk,
      attendanceTrend,
      classWiseStats,
    },
  });
});

// @desc    Get Teacher Dashboard Data
// @route   GET /api/v1/dashboard/teacher
// @access  Private (Teacher)
export const getTeacherDashboard = asyncHandler(async (req, res, next) => {
  const teacherId = req.user._id;
  const assignedClasses = req.user.assignedClasses;

  if (!assignedClasses || assignedClasses.length === 0) {
    return res.status(200).json({
      status: "success",
      message: "No classes assigned",
      data: {},
    });
  }

  // Get students in assigned classes
  const myStudents = await Student.find({
    class: { $in: assignedClasses },
    isActive: true,
  })
    .select(
      "firstName lastName rollNumber photo riskLevel riskScore attendancePercentage class"
    )
    .populate("class", "name section")
    .lean();

  // Calculate statistics
  const totalStudents = myStudents.length;
  const atRiskStudents = myStudents.filter((s) =>
    ["Medium", "High", "Critical"].includes(s.riskLevel)
  ).length;
  const criticalStudents = myStudents.filter(
    (s) => s.riskLevel === "Critical"
  ).length;

  // Today's absentees
  const today = new Date();
  const todayAbsent = await Attendance.find({
    class: { $in: assignedClasses },
    date: {
      $gte: new Date(today.setHours(0, 0, 0, 0)),
      $lte: new Date(today.setHours(23, 59, 59, 999)),
    },
    status: "Absent",
  })
    .populate("student", "firstName lastName rollNumber photo")
    .lean();

  // Students needing attention (top 10 by risk score)
  const needAttention = myStudents
    .filter((s) => s.riskLevel !== "Low")
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);

  // Class-wise breakdown
  const classBreakdown = await Student.aggregate([
    {
      $match: {
        class: { $in: assignedClasses },
        isActive: true,
      },
    },
    {
      $group: {
        _id: "$class",
        totalStudents: { $sum: 1 },
        atRiskCount: {
          $sum: {
            $cond: [
              { $in: ["$riskLevel", ["Medium", "High", "Critical"]] },
              1,
              0,
            ],
          },
        },
        avgAttendance: { $avg: "$attendancePercentage" },
        avgPerformance: { $avg: "$overallPercentage" },
      },
    },
    {
      $lookup: {
        from: "classes",
        localField: "_id",
        foreignField: "_id",
        as: "classInfo",
      },
    },
    { $unwind: "$classInfo" },
  ]);

  // Get pending interventions for teacher's students
  const pendingInterventions = await Intervention.find({
    student: { $in: myStudents.map((s) => s._id) },
    status: { $in: ["Pending Approval", "In Progress"] },
  })
    .populate("student", "firstName lastName rollNumber photo")
    .limit(10)
    .lean();

  res.status(200).json({
    status: "success",
    data: {
      statistics: {
        totalStudents,
        atRiskStudents,
        criticalStudents,
        todayAbsent: todayAbsent.length,
        pendingInterventions: pendingInterventions.length,
      },
      needAttention,
      todayAbsent,
      classBreakdown,
      pendingInterventions,
    },
  });
});

// @desc    Get Counselor Dashboard Data
// @route   GET /api/v1/dashboard/counselor
// @access  Private (Counselor)
export const getCounselorDashboard = asyncHandler(async (req, res, next) => {
  const counselorId = req.user._id;

  // Get assigned interventions
  const myInterventions = await Intervention.find({
    assignedCounselor: counselorId,
  })
    .populate("student", "firstName lastName rollNumber photo riskLevel")
    .sort({ urgencyLevel: -1, startDate: 1 })
    .lean();

  // Calculate statistics
  const totalCases = myInterventions.length;
  const activeCases = myInterventions.filter(
    (i) => i.status === "In Progress"
  ).length;
  const pendingApproval = myInterventions.filter(
    (i) => i.approvalStatus === "Pending"
  ).length;
  const completedCases = myInterventions.filter(
    (i) => i.status === "Completed"
  ).length;
  const successfulCases = myInterventions.filter(
    (i) => i.outcome === "Successful"
  ).length;

  // Priority queue (most urgent cases)
  const priorityQueue = myInterventions
    .filter((i) => i.status === "In Progress")
    .sort((a, b) => b.urgencyLevel - a.urgencyLevel)
    .slice(0, 20);

  // Today's sessions (implement Session model queries)
  // For now, return empty array
  const todaySessions = [];

  // Success metrics
  const successRate =
    completedCases > 0
      ? ((successfulCases / completedCases) * 100).toFixed(2)
      : 0;

  // Students helped this month
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  const studentsHelpedThisMonth = await Intervention.countDocuments({
    assignedCounselor: counselorId,
    outcome: "Successful",
    actualEndDate: { $gte: startOfMonth },
  });

  // Intervention type distribution
  const interventionTypes = await Intervention.aggregate([
    { $match: { assignedCounselor: counselorId } },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      statistics: {
        totalCases,
        activeCases,
        pendingApproval,
        completedCases,
        successfulCases,
        successRate: parseFloat(successRate),
        studentsHelpedThisMonth,
      },
      priorityQueue,
      todaySessions,
      interventionTypes,
      workload: {
        active: activeCases,
        pending: pendingApproval,
        scheduled: todaySessions.length,
      },
    },
  });
});

// @desc    Get Parent Dashboard Data
// @route   GET /api/v1/dashboard/parent
// @access  Private (Parent)
export const getParentDashboard = asyncHandler(async (req, res, next) => {
  const parentId = req.user._id;
  const children = req.user.children;

  if (!children || children.length === 0) {
    return res.status(200).json({
      status: "success",
      message: "No children linked",
      data: {},
    });
  }

  // Get children details
  const childrenData = await Student.find({
    _id: { $in: children },
    isActive: true,
  })
    .populate("class", "name section classTeacher")
    .lean();

  // Get recent updates for each child
  const childrenWithUpdates = await Promise.all(
    childrenData.map(async (child) => {
      // Recent attendance
      const recentAttendance = await Attendance.find({
        student: child._id,
      })
        .sort({ date: -1 })
        .limit(7)
        .lean();

      // Recent grades
      const recentGrades = await Grade.find({
        student: child._id,
        isPublished: true,
      })
        .sort({ examDate: -1 })
        .limit(5)
        .lean();

      // Active interventions
      const activeInterventions = await Intervention.find({
        student: child._id,
        status: "In Progress",
      })
        .select("title type startDate endDate")
        .lean();

      return {
        ...child,
        recentAttendance,
        recentGrades,
        activeInterventions,
      };
    })
  );

  res.status(200).json({
    status: "success",
    data: {
      children: childrenWithUpdates,
    },
  });
});

// Helper function to calculate success rate
const calculateSuccessRate = (stats) => {
  const total = stats.reduce((sum, s) => sum + s.count, 0);
  const successful = stats.find((s) => s._id === "Successful")?.count || 0;
  return total > 0 ? ((successful / total) * 100).toFixed(2) : 0;
};

export default {
  getAdminDashboard,
  getTeacherDashboard,
  getCounselorDashboard,
  getParentDashboard,
};
