import express from "express";
import {
  createMeeting,
  getAllMeetings,
  getMeetingById,
  updateMeeting,
  confirmMeeting,
  cancelMeeting,
  deleteMeeting,
} from "../controllers/meetingController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Protect all routes
router.use(protect);

// Public routes (all authenticated users)
router.get("/", getAllMeetings);
router.get("/:id", getMeetingById);

// Parent-specific routes
router.post("/:id/confirm", authorize("parent"), confirmMeeting);

// Admin, Teacher, Counselor routes
router.post(
  "/",
  authorize("admin", "teacher", "counselor"),
  createMeeting
);

router.put(
  "/:id",
  authorize("admin", "teacher", "counselor"),
  updateMeeting
);

router.post(
  "/:id/cancel",
  authorize("admin", "teacher", "counselor", "parent"),
  cancelMeeting
);

// Admin only
router.delete("/:id", authorize("admin"), deleteMeeting);

export default router;
