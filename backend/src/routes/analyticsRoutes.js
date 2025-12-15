import express from 'express';
import { 
  getDashboardAnalytics,
  getUserStats,
  getRiskDistribution,
  getAttendanceTrends,
  getAcademicPerformance,
  getInterventionEffectiveness,
  getPredictiveAnalytics,
  getClassComparison,
  getStudentProgress,
  getRealTimeStats,
  getDemographicAnalytics,
  getFinancialImpact,
  exportAnalytics
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Dashboard analytics - accessible to admin, teacher, counselor
router.get('/dashboard', authorize('admin', 'teacher', 'counselor'), getDashboardAnalytics);

// User statistics - admin only
router.get('/user-stats', authorize('admin'), getUserStats);

// Risk distribution - admin, counselor
router.get('/risk-distribution', authorize('admin', 'counselor'), getRiskDistribution);

// Attendance trends - admin, teacher
router.get('/attendance-trend', authorize('admin', 'teacher'), getAttendanceTrends);

// Academic performance - admin, teacher
router.get('/academic-performance', authorize('admin', 'teacher'), getAcademicPerformance);

// Class performance - admin, teacher
router.get('/class-performance', authorize('admin', 'teacher'), getClassComparison);

// High risk students - admin, counselor
router.get('/high-risk-students', authorize('admin', 'counselor'), (req, res) => {
  // This will be handled by the dashboard endpoint for now
  res.redirect('/api/v1/analytics/dashboard');
});

// Intervention effectiveness - admin, counselor
router.get('/intervention-effectiveness', authorize('admin', 'counselor'), getInterventionEffectiveness);

// Predictive analytics - admin, counselor
router.get('/predictions', authorize('admin', 'counselor'), getPredictiveAnalytics);

// Student progress - admin, teacher, counselor, parent (with restrictions)
router.get('/student-progress/:studentId', getStudentProgress);

// Real-time stats - admin only
router.get('/real-time-stats', authorize('admin'), getRealTimeStats);

// Demographics - admin only
router.get('/demographics', authorize('admin'), getDemographicAnalytics);

// Financial impact - admin only
router.get('/financial-impact', authorize('admin'), getFinancialImpact);

// Export analytics - admin only
router.post('/export', authorize('admin'), exportAnalytics);

export default router;