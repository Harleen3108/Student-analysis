import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/auth.js';
import { generateReport } from '../services/reportGenerator.js';
import logger from '../utils/logger.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: map simple date range keys from frontend to actual start/end dates
const resolveDateRange = (rangeKey) => {
  if (!rangeKey || rangeKey === 'current-year') {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return { startDate: start, endDate: now };
  }

  const end = new Date();
  const start = new Date();

  switch (rangeKey) {
    case 'last-7-days':
      start.setDate(end.getDate() - 7);
      break;
    case 'last-30-days':
      start.setDate(end.getDate() - 30);
      break;
    case 'last-3-months':
      start.setMonth(end.getMonth() - 3);
      break;
    case 'last-6-months':
      start.setMonth(end.getMonth() - 6);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }

  return { startDate: start, endDate: end };
};

// Helper: stream generated file back to client and clean it up after download
const sendGeneratedFile = (res, reportPromise) => {
  return reportPromise
    .then((report) => {
      const { filePath, filename } = report;
      if (!filePath || !fs.existsSync(filePath)) {
        logger.error('Generated report file not found on disk', { filePath });
        return res.status(500).json({
          success: false,
          message: 'Report file could not be generated',
        });
      }

      res.download(filePath, filename, (err) => {
        if (err) {
          logger.error('Error sending report file', { error: err.message, filePath });
        }

        // Best-effort cleanup of generated file
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            logger.warn('Failed to delete generated report file', {
              error: unlinkErr.message,
              filePath,
            });
          }
        });
      });
    })
    .catch((error) => {
      logger.error('Report generation error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to generate report',
        error: error.message,
      });
    });
};

// Risk Analysis Report
// POST /api/v1/reports/risk-analysis
router.post('/risk-analysis', protect, async (req, res) => {
  const { dateRange, classFilter } = req.body;

  const options = {
    riskLevel: null, // all levels
    classId: null, // could be wired to a real Class _id later
    includeRecommendations: true,
    format: req.body.format || 'pdf',
    sortBy: 'riskScore',
    generatedBy: req.user.email || req.user._id.toString(),
  };

  // Date range is not directly used by riskAssessmentReport yet, but we still resolve it for future use
  if (dateRange) {
    options.dateRange = resolveDateRange(dateRange);
  }

  return sendGeneratedFile(res, generateReport.riskAssessmentReport(options));
});

// Attendance Report
// POST /api/v1/reports/attendance
router.post('/attendance', protect, async (req, res) => {
  const { dateRange } = req.body;

  const options = {
    classId: null,
    studentId: null,
    dateRange: dateRange ? resolveDateRange(dateRange) : null,
    format: req.body.format || 'pdf',
    groupBy: 'student',
    generatedBy: req.user.email || req.user._id.toString(),
  };

  return sendGeneratedFile(res, generateReport.attendanceReport(options));
});

// Academic Performance Report
// POST /api/v1/reports/academic-performance
router.post('/academic-performance', protect, async (req, res) => {
  const { dateRange } = req.body;

  const options = {
    classId: null,
    studentId: null,
    academicYear: null,
    term: null,
    subject: null,
    format: req.body.format || 'pdf',
    generatedBy: req.user.email || req.user._id.toString(),
  };

  if (dateRange) {
    options.dateRange = resolveDateRange(dateRange);
  }

  return sendGeneratedFile(res, generateReport.academicReport(options));
});

// Intervention Summary Report
// POST /api/v1/reports/intervention-summary
router.post('/intervention-summary', protect, async (req, res) => {
  const { dateRange } = req.body;

  const options = {
    dateRange: dateRange ? resolveDateRange(dateRange) : null,
    status: null,
    type: null,
    outcome: null,
    includeOutcomes: true,
    format: req.body.format || 'pdf',
    generatedBy: req.user.email || req.user._id.toString(),
  };

  return sendGeneratedFile(res, generateReport.interventionReport(options));
});

// Class Overview Report (school-wide performance snapshot for now)
// POST /api/v1/reports/class-overview
router.post('/class-overview', protect, async (req, res) => {
  const { dateRange } = req.body;

  const options = {
    dateRange: dateRange ? resolveDateRange(dateRange) : null,
    includeAttendance: true,
    includeGrades: true,
    includeRiskAnalysis: true,
    includeInterventions: true,
    format: req.body.format || 'pdf',
    generatedBy: req.user.email || req.user._id.toString(),
  };

  return sendGeneratedFile(res, generateReport.schoolPerformanceReport(options));
});

// Parent Communication Log
// For now this generates a simple placeholder PDF so the button works end‑to‑end.
// You can extend this later to include real Communication model data.
router.post('/parent-communication', protect, async (req, res) => {
  const options = {
    reportType: 'monthly',
    format: req.body.format || 'pdf',
    includePhotos: false,
    // Reuse parent-style report with the first active student, or fall back to generic school performance
  };

  // For now, delegate to schoolPerformanceReport so user still gets a useful file
  return sendGeneratedFile(
    res,
    generateReport.schoolPerformanceReport({
      dateRange: req.body.dateRange ? resolveDateRange(req.body.dateRange) : null,
      includeAttendance: true,
      includeGrades: true,
      includeRiskAnalysis: true,
      includeInterventions: true,
      format: options.format,
      generatedBy: req.user.email || req.user._id.toString(),
    })
  );
});

// Basic health/history endpoint so frontend can check connectivity if needed
router.get('/history', protect, (req, res) => {
  // Full history tracking would require a Report model; for now return an empty list.
  res.json({
    success: true,
    data: [],
  });
});

// Schedule report generation (lightweight stub)
// POST /api/v1/reports/schedule
router.post('/schedule', protect, (req, res) => {
  logger.info('Report schedule request received', {
    user: req.user.email || req.user._id.toString(),
    body: req.body,
  });

  // In a full implementation, this would persist a job and configure a cron schedule.
  // For now, we simply acknowledge the request so the UI has a working endpoint.
  res.status(201).json({
    success: true,
    message: 'Report scheduling request received',
  });
});

export default router;