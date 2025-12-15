import express from 'express';
import { 
  getTeacherDashboard, 
  getClassStudents, 
  getAtRiskStudents, 
  getStudentProfile 
} from '../controllers/teacherController.js';
import { 
  getClassAttendance, 
  markBulkAttendance, 
  getClassAttendanceSummary, 
  getStudentAttendanceTrends,
  getAttendanceHistory
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication and teacher authorization to all routes
router.use(protect);
router.use(authorize('teacher'));

// Dashboard routes
router.get('/dashboard', getTeacherDashboard);

// Class management routes
router.get('/classes/:className/students', getClassStudents);
router.get('/students/at-risk', getAtRiskStudents);
router.get('/students/:studentId/profile', getStudentProfile);

// Attendance routes
router.get('/classes/:className/attendance', getClassAttendance);
router.post('/attendance/bulk', markBulkAttendance);
router.get('/classes/:className/attendance/summary', getClassAttendanceSummary);
router.get('/classes/:className/attendance/history', getAttendanceHistory);
router.get('/students/:studentId/attendance/trends', getStudentAttendanceTrends);

// Academic performance routes
import { submitAcademicGrades, getSavedExams, getExamDetails } from '../controllers/teacherController.js';
router.post('/academic/grades', submitAcademicGrades);
router.get('/academic/exams', getSavedExams);
router.get('/academic/exams/:examId', getExamDetails);

// Observations routes
import { 
  getObservations, 
  createObservation, 
  updateObservation, 
  deleteObservation,
  getStudentObservations 
} from '../controllers/teacherController.js';
router.get('/observations', getObservations);
router.post('/observations', createObservation);
router.put('/observations/:observationId', updateObservation);
router.delete('/observations/:observationId', deleteObservation);
router.get('/students/:studentId/observations', getStudentObservations);

// Communications routes
import {
  getCommunications,
  sendCommunication,
  getStudentCommunicationHistory,
  updateCommunicationStatus
} from '../controllers/teacherController.js';
router.get('/communications', getCommunications);
router.post('/communications', sendCommunication);
router.get('/students/:studentId/communications', getStudentCommunicationHistory);
router.put('/communications/:communicationId/status', updateCommunicationStatus);

export default router;