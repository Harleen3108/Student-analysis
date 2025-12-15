import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createAdminObservation,
  getStudentObservations,
  sendCommunicationToParent
} from '../controllers/adminController.js';

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(protect);
router.use(authorize('admin'));

// Admin observation routes
router.post('/observations', createAdminObservation);
router.get('/students/:studentId/observations', getStudentObservations);

// Admin communication routes
router.post('/communications', sendCommunicationToParent);

export default router;
