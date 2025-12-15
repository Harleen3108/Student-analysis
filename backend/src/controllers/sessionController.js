import Session from "../models/Session.js";
import Intervention from "../models/Intervention.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { createNotification } from "../services/notificationService.js";

// @desc    Get all sessions
// @route   GET /api/v1/sessions
// @access  Private (Admin, Counselor)
export const getSessions = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    status,
    sessionType,
    counselor,
    student,
    intervention,
    dateRange,
    sortBy = "scheduledDate",
    sortOrder = "desc",
  } = req.query;

  // Build query
  const query = {};
  
  if (status) query.status = status;
  if (sessionType) query.sessionType = sessionType;
  if (counselor) query.counselor = counselor;
  if (student) query.student = student;
  if (intervention) query.intervention = intervention;

  // Date range filter
  if (dateRange) {
    const { startDate, endDate } = JSON.parse(dateRange);
    query.scheduledDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // Role-based filtering
  if (req.user.role === "counselor") {
    query.counselor = req.user._id;
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [sessions, total] = await Promise.all([
    Session.find(query)
      .populate("student", "firstName lastName rollNumber photo riskLevel")
      .populate("counselor", "firstName lastName")
      .populate("intervention", "title type")
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip),
    Session.countDocuments(query),
  ]);

  res.status(200).json({
    status: "success",
    results: sessions.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
    data: {
      sessions,
    },
  });
});

// @desc    Get single session
// @route   GET /api/v1/sessions/:id
// @access  Private (Admin, Counselor)
export const getSession = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id)
    .populate("student", "firstName lastName rollNumber photo riskLevel class")
    .populate("counselor", "firstName lastName email phone")
    .populate("intervention", "title type priority")
    .populate("createdBy", "firstName lastName");

  if (!session) {
    return next(new AppError("Session not found", 404));
  }

  // Check access permissions
  const hasAccess = 
    req.user.role === "admin" ||
    session.counselor._id.toString() === req.user._id.toString() ||
    session.createdBy._id.toString() === req.user._id.toString();

  if (!hasAccess) {
    return next(new AppError("Access denied", 403));
  }

  res.status(200).json({
    status: "success",
    data: {
      session,
    },
  });
});

// @desc    Create new session
// @route   POST /api/v1/sessions
// @access  Private (Admin, Counselor)
export const createSession = asyncHandler(async (req, res, next) => {
  const {
    intervention,
    student,
    counselor,
    sessionType,
    scheduledDate,
    scheduledTime,
    duration,
    location,
    mode,
    objectives,
    additionalParticipants,
  } = req.body;

  // Verify intervention exists
  const interventionDoc = await Intervention.findById(intervention);
  if (!interventionDoc) {
    return next(new AppError("Intervention not found", 404));
  }

  // Verify student exists
  const studentDoc = await Student.findById(student);
  if (!studentDoc) {
    return next(new AppError("Student not found", 404));
  }

  // Get session number for this intervention
  const sessionCount = await Session.countDocuments({ intervention });
  const sessionNumber = sessionCount + 1;

  const session = await Session.create({
    intervention,
    student,
    counselor: counselor || req.user._id,
    sessionNumber,
    sessionType,
    scheduledDate,
    scheduledTime,
    duration,
    location,
    mode,
    objectives,
    additionalParticipants,
    createdBy: req.user._id,
  });

  // Populate the created session
  await session.populate([
    { path: "student", select: "firstName lastName rollNumber" },
    { path: "counselor", select: "firstName lastName" },
    { path: "intervention", select: "title type" },
  ]);

  // Send notification to counselor (if different from creator)
  if (session.counselor._id.toString() !== req.user._id.toString()) {
    await createNotification({
      recipientId: session.counselor._id,
      type: "Session Scheduled",
      priority: "Normal",
      title: `Session Scheduled: ${studentDoc.firstName} ${studentDoc.lastName}`,
      message: `A ${sessionType} session has been scheduled for ${new Date(scheduledDate).toDateString()} at ${scheduledTime}.`,
      relatedStudent: student,
      channels: {
        inApp: true,
        email: true,
        sms: false,
      },
      createdBy: req.user._id,
    });
  }

  // Send notification to parents if it's a parent meeting
  if (sessionType === "Parent Meeting" && additionalParticipants) {
    const parents = await User.find({
      role: "parent",
      children: student,
    });

    for (const parent of parents) {
      await createNotification({
        recipientId: parent._id,
        type: "Parent Meeting",
        priority: "High",
        title: `Parent Meeting Scheduled: ${studentDoc.firstName}`,
        message: `A parent meeting has been scheduled for ${new Date(scheduledDate).toDateString()} at ${scheduledTime}. Location: ${location}`,
        relatedStudent: student,
        channels: {
          inApp: true,
          email: true,
          sms: true,
        },
        createdBy: req.user._id,
      });
    }
  }

  res.status(201).json({
    status: "success",
    data: {
      session,
    },
  });
});

// @desc    Update session
// @route   PUT /api/v1/sessions/:id
// @access  Private (Admin, Assigned Counselor)
export const updateSession = asyncHandler(async (req, res, next) => {
  let session = await Session.findById(req.params.id);

  if (!session) {
    return next(new AppError("Session not found", 404));
  }

  // Check permissions
  const canUpdate = 
    req.user.role === "admin" ||
    session.counselor.toString() === req.user._id.toString();

  if (!canUpdate) {
    return next(new AppError("Not authorized to update this session", 403));
  }

  session = await Session.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      lastUpdatedBy: req.user._id,
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate([
    { path: "student", select: "firstName lastName rollNumber" },
    { path: "counselor", select: "firstName lastName" },
    { path: "intervention", select: "title type" },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      session,
    },
  });
});

// @desc    Conduct session (mark as completed)
// @route   PUT /api/v1/sessions/:id/conduct
// @access  Private (Admin, Assigned Counselor)
export const conductSession = asyncHandler(async (req, res, next) => {
  const {
    sessionNotes,
    studentMood,
    studentEngagement,
    observations,
    concernsRaised,
    techniqueUsed,
    progressSinceLastSession,
    goalsAchieved,
    actionItems,
    homeworkAssigned,
    requiresFollowUp,
    followUpDate,
    followUpNotes,
    referrals,
    riskAssessment,
    studentSatisfaction,
    actualStartTime,
    actualEndTime,
  } = req.body;

  const session = await Session.findById(req.params.id)
    .populate("student", "firstName lastName")
    .populate("intervention", "title");

  if (!session) {
    return next(new AppError("Session not found", 404));
  }

  // Check permissions
  const canConduct = 
    req.user.role === "admin" ||
    session.counselor.toString() === req.user._id.toString();

  if (!canConduct) {
    return next(new AppError("Not authorized to conduct this session", 403));
  }

  // Update session with conducted details
  session.status = "Completed";
  session.attendanceStatus = "Present";
  session.studentAttended = true;
  session.sessionNotes = sessionNotes;
  session.studentMood = studentMood;
  session.studentEngagement = studentEngagement;
  session.observations = observations;
  session.concernsRaised = concernsRaised;
  session.techniqueUsed = techniqueUsed;
  session.progressSinceLastSession = progressSinceLastSession;
  session.goalsAchieved = goalsAchieved;
  session.actionItems = actionItems;
  session.homeworkAssigned = homeworkAssigned;
  session.requiresFollowUp = requiresFollowUp;
  session.followUpDate = followUpDate;
  session.followUpNotes = followUpNotes;
  session.referrals = referrals;
  session.riskAssessment = riskAssessment;
  session.studentSatisfaction = studentSatisfaction;
  session.actualStartTime = actualStartTime;
  session.actualEndTime = actualEndTime;

  await session.save();

  // Update intervention progress
  const intervention = await Intervention.findById(session.intervention._id);
  if (intervention) {
    const completedSessions = await Session.countDocuments({
      intervention: intervention._id,
      status: "Completed",
    });
    
    intervention.sessionsCompleted = completedSessions;
    await intervention.save();
  }

  res.status(200).json({
    status: "success",
    message: "Session conducted successfully",
    data: {
      session,
    },
  });
});

// @desc    Cancel session
// @route   PUT /api/v1/sessions/:id/cancel
// @access  Private (Admin, Assigned Counselor)
export const cancelSession = asyncHandler(async (req, res, next) => {
  const { cancellationReason } = req.body;

  if (!cancellationReason) {
    return next(new AppError("Cancellation reason is required", 400));
  }

  const session = await Session.findById(req.params.id)
    .populate("student", "firstName lastName")
    .populate("counselor", "firstName lastName");

  if (!session) {
    return next(new AppError("Session not found", 404));
  }

  // Check permissions
  const canCancel = 
    req.user.role === "admin" ||
    session.counselor._id.toString() === req.user._id.toString();

  if (!canCancel) {
    return next(new AppError("Not authorized to cancel this session", 403));
  }

  session.status = "Cancelled";
  session.attendanceStatus = "Cancelled";
  session.cancellationReason = cancellationReason;
  session.cancelledBy = req.user._id;

  await session.save();

  // Notify relevant parties about cancellation
  const notificationRecipients = [session.counselor._id];
  
  // Add parents if it was a parent meeting
  if (session.sessionType === "Parent Meeting") {
    const parents = await User.find({
      role: "parent",
      children: session.student._id,
    });
    notificationRecipients.push(...parents.map(p => p._id));
  }

  for (const recipientId of notificationRecipients) {
    if (recipientId.toString() !== req.user._id.toString()) {
      await createNotification({
        recipientId,
        type: "Session Cancelled",
        priority: "Normal",
        title: `Session Cancelled: ${session.student.firstName} ${session.student.lastName}`,
        message: `The ${session.sessionType} session scheduled for ${new Date(session.scheduledDate).toDateString()} has been cancelled. Reason: ${cancellationReason}`,
        relatedStudent: session.student._id,
        channels: {
          inApp: true,
          email: true,
          sms: false,
        },
        createdBy: req.user._id,
      });
    }
  }

  res.status(200).json({
    status: "success",
    message: "Session cancelled successfully",
    data: {
      session,
    },
  });
});

// @desc    Reschedule session
// @route   PUT /api/v1/sessions/:id/reschedule
// @access  Private (Admin, Assigned Counselor)
export const rescheduleSession = asyncHandler(async (req, res, next) => {
  const { newDate, newTime, reason } = req.body;

  if (!newDate || !newTime) {
    return next(new AppError("New date and time are required", 400));
  }

  const session = await Session.findById(req.params.id)
    .populate("student", "firstName lastName")
    .populate("counselor", "firstName lastName");

  if (!session) {
    return next(new AppError("Session not found", 404));
  }

  // Check permissions
  const canReschedule = 
    req.user.role === "admin" ||
    session.counselor._id.toString() === req.user._id.toString();

  if (!canReschedule) {
    return next(new AppError("Not authorized to reschedule this session", 403));
  }

  // Store old date/time for notification
  const oldDate = session.scheduledDate;
  const oldTime = session.scheduledTime;

  session.scheduledDate = newDate;
  session.scheduledTime = newTime;
  session.status = "Rescheduled";
  session.rescheduledTo = new Date(`${newDate} ${newTime}`);

  if (reason) {
    session.cancellationReason = `Rescheduled: ${reason}`;
  }

  await session.save();

  // Send notifications about rescheduling
  const notificationRecipients = [session.counselor._id];
  
  if (session.sessionType === "Parent Meeting") {
    const parents = await User.find({
      role: "parent",
      children: session.student._id,
    });
    notificationRecipients.push(...parents.map(p => p._id));
  }

  for (const recipientId of notificationRecipients) {
    if (recipientId.toString() !== req.user._id.toString()) {
      await createNotification({
        recipientId,
        type: "Session Rescheduled",
        priority: "Normal",
        title: `Session Rescheduled: ${session.student.firstName} ${session.student.lastName}`,
        message: `The session has been rescheduled from ${new Date(oldDate).toDateString()} ${oldTime} to ${new Date(newDate).toDateString()} ${newTime}.`,
        relatedStudent: session.student._id,
        channels: {
          inApp: true,
          email: true,
          sms: true,
        },
        createdBy: req.user._id,
      });
    }
  }

  res.status(200).json({
    status: "success",
    message: "Session rescheduled successfully",
    data: {
      session,
    },
  });
});

// @desc    Get upcoming sessions for counselor
// @route   GET /api/v1/sessions/upcoming
// @access  Private (Counselor)
export const getUpcomingSessions = asyncHandler(async (req, res, next) => {
  const { days = 7 } = req.query;

  const sessions = await Session.getUpcomingSessions(req.user._id, parseInt(days));

  res.status(200).json({
    status: "success",
    results: sessions.length,
    data: {
      sessions,
    },
  });
});

// @desc    Get session history for student
// @route   GET /api/v1/sessions/student/:studentId/history
// @access  Private (Admin, Counselor, Parent)
export const getStudentSessionHistory = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;

  // Check access for parents
  if (req.user.role === "parent") {
    const hasAccess = req.user.children.includes(studentId);
    if (!hasAccess) {
      return next(new AppError("Access denied", 403));
    }
  }

  const sessions = await Session.getStudentHistory(studentId);

  res.status(200).json({
    status: "success",
    results: sessions.length,
    data: {
      sessions,
    },
  });
});

// @desc    Delete session
// @route   DELETE /api/v1/sessions/:id
// @access  Private (Admin)
export const deleteSession = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    return next(new AppError("Session not found", 404));
  }

  await session.deleteOne();

  res.status(200).json({
    status: "success",
    message: "Session deleted successfully",
  });
});