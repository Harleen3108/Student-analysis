import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { generateReport } from "../services/reportGenerator.js";
import Student from "../models/Student.js";
import Class from "../models/Class.js";
import Intervention from "../models/Intervention.js";

// @desc    Generate student report
// @route   POST /api/v1/reports/student
// @access  Private (Admin, Teacher, Counselor)
export const generateStudentReport = asyncHandler(async (req, res, next) => {
  const {
    studentId,
    reportType = "comprehensive",
    format = "pdf",
    includeRiskAnalysis = true,
    includeAttendance = true,
    includeGrades = true,
    includeInterventions = true,
    dateRange,
  } = req.body;

  // Verify student exists
  const student = await Student.findById(studentId);
  if (!student) {
    return next(new AppError("Student not found", 404));
  }

  // Check access permissions
  if (req.user.role === "parent") {
    const hasAccess = req.user.children.includes(studentId);
    if (!hasAccess) {
      return next(new AppError("Access denied", 403));
    }
  }

  const reportOptions = {
    studentId,
    reportType,
    format,
    includeRiskAnalysis,
    includeAttendance,
    includeGrades,
    includeInterventions,
    dateRange,
    generatedBy: req.user._id,
  };

  const report = await generateReport.studentReport(reportOptions);

  res.status(200).json({
    status: "success",
    data: {
      report: {
        id: report.id,
        downloadUrl: report.downloadUrl,
        filename: report.filename,
        format: report.format,
        generatedAt: report.generatedAt,
      },
    },
  });
});

// @desc    Generate class report
// @route   POST /api/v1/reports/class
// @access  Private (Admin, Teacher)
export const generateClassReport = asyncHandler(async (req, res, next) => {
  const {
    classId,
    reportType = "performance",
    format = "pdf",
    includeAttendance = true,
    includeGrades = true,
    includeRiskAnalysis = true,
    dateRange,
  } = req.body;

  // Verify class exists
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    return next(new AppError("Class not found", 404));
  }

  // Check if teacher has access to this class
  if (req.user.role === "teacher") {
    const hasAccess = 
      classDoc.classTeacher.toString() === req.user._id.toString() ||
      req.user.assignedClasses.includes(classId);
    
    if (!hasAccess) {
      return next(new AppError("Access denied", 403));
    }
  }

  const reportOptions = {
    classId,
    reportType,
    format,
    includeAttendance,
    includeGrades,
    includeRiskAnalysis,
    dateRange,
    generatedBy: req.user._id,
  };

  const report = await generateReport.classReport(reportOptions);

  res.status(200).json({
    status: "success",
    data: {
      report: {
        id: report.id,
        downloadUrl: report.downloadUrl,
        filename: report.filename,
        format: report.format,
        generatedAt: report.generatedAt,
      },
    },
  });
});

// @desc    Generate attendance report
// @route   POST /api/v1/reports/attendance
// @access  Private (Admin, Teacher)
export const generateAttendanceReport = asyncHandler(async (req, res, next) => {
  const {
    classId,
    studentId,
    dateRange,
    format = "pdf",
    groupBy = "student",
  } = req.body;

  const reportOptions = {
    classId,
    studentId,
    dateRange,
    format,
    groupBy,
    generatedBy: req.user._id,
  };

  const report = await generateReport.attendanceReport(reportOptions);

  res.status(200).json({
    status: "success",
    data: {
      report: {
        id: report.id,
        downloadUrl: report.downloadUrl,
        filename: report.filename,
        format: report.format,
        generatedAt: report.generatedAt,
      },
    },
  });
});

// @desc    Generate risk assessment report
// @route   POST /api/v1/reports/risk-assessment
// @access  Private (Admin, Counselor)
export const generateRiskAssessmentReport = asyncHandler(async (req, res, next) => {
  const {
    riskLevel,
    classId,
    includeRecommendations = true,
    format = "pdf",
    sortBy = "riskScore",
  } = req.body;

  const reportOptions = {
    riskLevel,
    classId,
    includeRecommendations,
    format,
    sortBy,
    generatedBy: req.user._id,
  };

  const report = await generateReport.riskAssessmentReport(reportOptions);

  res.status(200).json({
    status: "success",
    data: {
      report: {
        id: report.id,
        downloadUrl: report.downloadUrl,
        filename: report.filename,
        format: report.format,
        generatedAt: report.generatedAt,
      },
    },
  });
});

// @desc    Generate intervention report
// @route   POST /api/v1/reports/intervention
// @access  Private (Admin, Counselor)
export const generateInterventionReport = asyncHandler(async (req, res, next) => {
  const {
    interventionId,
    studentId,
    counselorId,
    status,
    dateRange,
    format = "pdf",
    includeOutcomes = true,
  } = req.body;

  const reportOptions = {
    interventionId,
    studentId,
    counselorId,
    status,
    dateRange,
    format,
    includeOutcomes,
    generatedBy: req.user._id,
  };

  const report = await generateReport.interventionReport(reportOptions);

  res.status(200).json({
    status: "success",
    data: {
      report: {
        id: report.id,
        downloadUrl: report.downloadUrl,
        filename: report.filename,
        format: report.format,
        generatedAt: report.generatedAt,
      },
    },
  });
});

// @desc    Generate academic performance report
// @route   POST /api/v1/reports/academic-performance
// @access  Private (Admin, Teacher)
export const generateAcademicReport = asyncHandler(async (req, res, next) => {
  const {
    classId,
    studentId,
    subject,
    examType,
    dateRange,
    format = "pdf",
    includeComparison = true,
  } = req.body;

  const reportOptions = {
    classId,
    studentId,
    subject,
    examType,
    dateRange,
    format,
    includeComparison,
    generatedBy: req.user._id,
  };

  const report = await generateReport.academicReport(reportOptions);

  res.status(200).json({
    status: "success",
    data: {
      report: {
        id: report.id,
        downloadUrl: report.downloadUrl,
        filename: report.filename,
        format: report.format,
        generatedAt: report.generatedAt,
      },
    },
  });
});

// @desc    Generate parent report
// @route   POST /api/v1/reports/parent
// @access  Private (Admin, Teacher, Parent)
export const generateParentReport = asyncHandler(async (req, res, next) => {
  const {
    studentId,
    reportType = "monthly",
    format = "pdf",
    includePhotos = false,
  } = req.body;

  // Check access for parents
  if (req.user.role === "parent") {
    const hasAccess = req.user.children.includes(studentId);
    if (!hasAccess) {
      return next(new AppError("Access denied", 403));
    }
  }

  const reportOptions = {
    studentId,
    reportType,
    format,
    includePhotos,
    generatedBy: req.user._id,
  };

  const report = await generateReport.parentReport(reportOptions);

  res.status(200).json({
    status: "success",
    data: {
      report: {
        id: report.id,
        downloadUrl: report.downloadUrl,
        filename: report.filename,
        format: report.format,
        generatedAt: report.generatedAt,
      },
    },
  });
});

// @desc    Generate custom report
// @route   POST /api/v1/reports/custom
// @access  Private (Admin)
export const generateCustomReport = asyncHandler(async (req, res, next) => {
  const {
    title,
    description,
    dataSource,
    filters,
    fields,
    format = "pdf",
    chartTypes = [],
  } = req.body;

  const reportOptions = {
    title,
    description,
    dataSource,
    filters,
    fields,
    format,
    chartTypes,
    generatedBy: req.user._id,
  };

  const report = await generateReport.customReport(reportOptions);

  res.status(200).json({
    status: "success",
    data: {
      report: {
        id: report.id,
        downloadUrl: report.downloadUrl,
        filename: report.filename,
        format: report.format,
        generatedAt: report.generatedAt,
      },
    },
  });
});

// @desc    Get report history
// @route   GET /api/v1/reports/history
// @access  Private
export const getReportHistory = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    reportType,
    format,
    dateRange,
  } = req.query;

  const history = await generateReport.getReportHistory({
    userId: req.user._id,
    userRole: req.user.role,
    page: parseInt(page),
    limit: parseInt(limit),
    reportType,
    format,
    dateRange,
  });

  res.status(200).json({
    status: "success",
    results: history.reports.length,
    pagination: history.pagination,
    data: {
      reports: history.reports,
    },
  });
});

// @desc    Download report
// @route   GET /api/v1/reports/download/:reportId
// @access  Private
export const downloadReport = asyncHandler(async (req, res, next) => {
  const { reportId } = req.params;

  const reportFile = await generateReport.downloadReport(reportId, req.user._id);

  if (!reportFile) {
    return next(new AppError("Report not found or access denied", 404));
  }

  res.setHeader("Content-Type", reportFile.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${reportFile.filename}"`);
  
  res.send(reportFile.buffer);
});

// @desc    Delete report
// @route   DELETE /api/v1/reports/:reportId
// @access  Private
export const deleteReport = asyncHandler(async (req, res, next) => {
  const { reportId } = req.params;

  const deleted = await generateReport.deleteReport(reportId, req.user._id);

  if (!deleted) {
    return next(new AppError("Report not found or access denied", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Report deleted successfully",
  });
});

// @desc    Schedule report generation
// @route   POST /api/v1/reports/schedule
// @access  Private (Admin)
export const scheduleReport = asyncHandler(async (req, res, next) => {
  const {
    reportType,
    reportOptions,
    schedule, // cron expression
    recipients,
    isActive = true,
  } = req.body;

  const scheduledReport = await generateReport.scheduleReport({
    reportType,
    reportOptions,
    schedule,
    recipients,
    isActive,
    createdBy: req.user._id,
  });

  res.status(201).json({
    status: "success",
    data: {
      scheduledReport,
    },
  });
});