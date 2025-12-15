import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getParentDashboard,
  getStudentAttendance,
  getStudentAcademicPerformance,
  getStudentRiskStatus,
  getStudentInterventions,
  getParentCommunications,
  replyToCommunication,
  markCommunicationAsRead,
  updateParentProfile
} from '../controllers/parentController.js';

const router = express.Router();

// Apply authentication and parent authorization to all routes
router.use(protect);
router.use(authorize('parent'));

// Dashboard
router.get('/dashboard', getParentDashboard);

// Student data routes
router.get('/students/:studentId/attendance', getStudentAttendance);
router.get('/students/:studentId/academic', getStudentAcademicPerformance);
router.get('/students/:studentId/risk', getStudentRiskStatus);
router.get('/students/:studentId/interventions', getStudentInterventions);

// Communications
router.get('/communications', getParentCommunications);
router.post('/communications/:communicationId/reply', replyToCommunication);
router.put('/communications/:communicationId/read', markCommunicationAsRead);

// Profile
router.put('/profile', updateParentProfile);

// Admin function to link students (should be in admin routes but adding here for convenience)
import { linkStudentsToParent } from '../controllers/parentController.js';
router.post('/link-students', linkStudentsToParent);

export default router;
