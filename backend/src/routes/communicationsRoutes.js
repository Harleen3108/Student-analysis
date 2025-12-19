import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  sendEmailToParent,
  sendSMSToParent,
  sendReportToParent,
  getCommunicationHistory
} from '../controllers/communicationsController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Send email to parent
router.post('/send-email', sendEmailToParent);

// Send SMS to parent
router.post('/send-sms', sendSMSToParent);

// Send report to parent
router.post('/send-report', sendReportToParent);

// Get communication history
router.get('/history/:studentId', getCommunicationHistory);

export default router;
