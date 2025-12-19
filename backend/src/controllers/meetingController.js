import Meeting from "../models/Meeting.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { createNotification } from "../services/notificationService.js";
import logger from "../utils/logger.js";

// @desc    Create a new meeting
// @route   POST /api/v1/meetings
// @access  Private (Admin, Teacher, Counselor)
export const createMeeting = asyncHandler(async (req, res, next) => {
  logger.info("📅 Creating meeting with data:", req.body);
  
  const {
    title,
    description,
    topic,
    studentId,
    scheduledDate,
    scheduledTime,
    duration,
    location,
    locationType,
    meetingLink,
    priority,
    agenda,
    parentIds,
    teacherIds,
    counselorIds,
    otherParticipants,
  } = req.body;

  // Validate student exists
  const student = await Student.findById(studentId).populate("class");
  if (!student) {
    logger.error("❌ Student not found:", studentId);
    return next(new AppError("Student not found", 404));
  }
  
  logger.info("✅ Student found:", student.firstName, student.lastName);

  // Find parent users for this student
  const parents = await User.find({
    role: "parent",
    children: studentId,
  });
  
  logger.info(`📧 Found ${parents.length} parent users for student`);

  const parentUserIds = parentIds || parents.map(p => p._id);

  // Create meeting
  const meeting = await Meeting.create({
    title,
    description,
    topic,
    student: studentId,
    organizer: req.user._id,
    organizerRole: req.user.role,
    parents: parentUserIds,
    teachers: teacherIds || [],
    counselors: counselorIds || [],
    otherParticipants: otherParticipants || [],
    scheduledDate,
    scheduledTime,
    duration: duration || 30,
    location,
    locationType: locationType || "In-Person",
    meetingLink,
    priority: priority || "Normal",
    agenda,
    createdBy: req.user._id,
  });

  // Populate meeting data
  await meeting.populate([
    { path: "student", select: "firstName lastName rollNumber section photo" },
    { path: "organizer", select: "firstName lastName email role" },
    { path: "parents", select: "firstName lastName email phone" },
    { path: "teachers", select: "firstName lastName email" },
    { path: "counselors", select: "firstName lastName email" },
  ]);

  // Send notifications to all participants
  const notificationPromises = [];

  // Notify parents
  for (const parent of meeting.parents) {
    notificationPromises.push(
      createNotification({
        recipientId: parent._id,
        type: "Parent Meeting",
        title: "Meeting Scheduled",
        message: `A meeting has been scheduled regarding ${student.firstName} ${student.lastName} on ${meeting.formattedDate} at ${scheduledTime}. Topic: ${topic}. Location: ${location}`,
        priority: priority || "Normal",
        relatedStudent: student._id,
        relatedEntity: {
          entityType: "Meeting",
          entityId: meeting._id,
        },
        channels: {
          inApp: { enabled: true },
          email: { enabled: true },
          sms: { enabled: priority === "Urgent" || priority === "High" },
          push: { enabled: false },
        },
        createdBy: req.user._id,
        actionButton: {
          text: "View Meeting",
          link: `/parent/meetings/${meeting._id}`,
        },
      })
    );
  }

  // Notify teachers
  for (const teacher of meeting.teachers) {
    notificationPromises.push(
      createNotification({
        recipientId: teacher._id,
        type: "Parent Meeting",
        title: "Meeting Scheduled",
        message: `You are invited to a meeting regarding ${student.firstName} ${student.lastName} on ${meeting.formattedDate} at ${scheduledTime}. Topic: ${topic}. Location: ${location}`,
        priority: priority || "Normal",
        relatedStudent: student._id,
        relatedEntity: {
          entityType: "Meeting",
          entityId: meeting._id,
        },
        channels: {
          inApp: { enabled: true },
          email: { enabled: true },
          sms: { enabled: false },
          push: { enabled: false },
        },
        createdBy: req.user._id,
        actionButton: {
          text: "View Meeting",
          link: `/meetings/${meeting._id}`,
        },
      })
    );
  }

  // Notify counselors
  for (const counselor of meeting.counselors) {
    notificationPromises.push(
      createNotification({
        recipientId: counselor._id,
        type: "Parent Meeting",
        title: "Meeting Scheduled",
        message: `You are invited to a meeting regarding ${student.firstName} ${student.lastName} on ${meeting.formattedDate} at ${scheduledTime}. Topic: ${topic}. Location: ${location}`,
        priority: priority || "Normal",
        relatedStudent: student._id,
        relatedEntity: {
          entityType: "Meeting",
          entityId: meeting._id,
        },
        channels: {
          inApp: { enabled: true },
          email: { enabled: true },
          sms: { enabled: false },
          push: { enabled: false },
        },
        createdBy: req.user._id,
        actionButton: {
          text: "View Meeting",
          link: `/meetings/${meeting._id}`,
        },
      })
    );
  }

  await Promise.all(notificationPromises);

  logger.info(`Meeting created: ${meeting._id} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: "Meeting scheduled successfully",
    data: {
      meeting,
      notificationsSent: notificationPromises.length,
    },
  });
});

// @desc    Get all meetings
// @route   GET /api/v1/meetings
// @access  Private
export const getAllMeetings = asyncHandler(async (req, res, next) => {
  const {
    status,
    studentId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = req.query;

  const query = {};

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by student
  if (studentId) {
    query.student = studentId;
  }

  // Filter by date range
  if (startDate || endDate) {
    query.scheduledDate = {};
    if (startDate) query.scheduledDate.$gte = new Date(startDate);
    if (endDate) query.scheduledDate.$lte = new Date(endDate);
  }

  // Role-based filtering
  if (req.user.role === "parent") {
    query.parents = req.user._id;
  } else if (req.user.role === "teacher") {
    query.$or = [
      { teachers: req.user._id },
      { organizer: req.user._id },
    ];
  } else if (req.user.role === "counselor") {
    query.$or = [
      { counselors: req.user._id },
      { organizer: req.user._id },
    ];
  }

  const skip = (page - 1) * limit;

  const [meetings, total] = await Promise.all([
    Meeting.find(query)
      .populate("student", "firstName lastName rollNumber section photo")
      .populate("organizer", "firstName lastName email role")
      .populate("parents", "firstName lastName email phone")
      .populate("teachers", "firstName lastName email")
      .populate("counselors", "firstName lastName email")
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean(),
    Meeting.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    results: meetings.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
    data: {
      meetings,
    },
  });
});

// @desc    Get single meeting
// @route   GET /api/v1/meetings/:id
// @access  Private
export const getMeetingById = asyncHandler(async (req, res, next) => {
  const meeting = await Meeting.findById(req.params.id)
    .populate("student", "firstName lastName rollNumber section photo class")
    .populate("organizer", "firstName lastName email role phone")
    .populate("parents", "firstName lastName email phone")
    .populate("teachers", "firstName lastName email phone")
    .populate("counselors", "firstName lastName email phone")
    .populate("createdBy", "firstName lastName")
    .populate("lastUpdatedBy", "firstName lastName");

  if (!meeting) {
    return next(new AppError("Meeting not found", 404));
  }

  res.status(200).json({
    success: true,
    data: {
      meeting,
    },
  });
});

// @desc    Update meeting
// @route   PUT /api/v1/meetings/:id
// @access  Private (Admin, Teacher, Counselor)
export const updateMeeting = asyncHandler(async (req, res, next) => {
  let meeting = await Meeting.findById(req.params.id);

  if (!meeting) {
    return next(new AppError("Meeting not found", 404));
  }

  // Check if user is authorized to update
  if (
    req.user.role !== "admin" &&
    meeting.organizer.toString() !== req.user._id.toString()
  ) {
    return next(new AppError("Not authorized to update this meeting", 403));
  }

  const updateData = { ...req.body };
  updateData.lastUpdatedBy = req.user._id;

  meeting = await Meeting.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).populate([
    { path: "student", select: "firstName lastName rollNumber section photo" },
    { path: "organizer", select: "firstName lastName email role" },
    { path: "parents", select: "firstName lastName email phone" },
  ]);

  logger.info(`Meeting updated: ${meeting._id} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: "Meeting updated successfully",
    data: {
      meeting,
    },
  });
});

// @desc    Confirm meeting attendance
// @route   POST /api/v1/meetings/:id/confirm
// @access  Private (Parent)
export const confirmMeeting = asyncHandler(async (req, res, next) => {
  const meeting = await Meeting.findById(req.params.id);

  if (!meeting) {
    return next(new AppError("Meeting not found", 404));
  }

  // Check if user is a parent of the student
  if (req.user.role !== "parent" || !meeting.parents.includes(req.user._id)) {
    return next(new AppError("Not authorized to confirm this meeting", 403));
  }

  meeting.parentConfirmation = {
    confirmed: true,
    confirmedAt: new Date(),
    confirmedBy: req.user._id,
  };
  meeting.status = "Confirmed";

  await meeting.save();

  // Notify organizer
  await createNotification({
    recipientId: meeting.organizer,
    type: "Parent Meeting",
    title: "Meeting Confirmed",
    message: `${req.user.firstName} ${req.user.lastName} has confirmed attendance for the meeting on ${meeting.formattedDate}`,
    priority: "Normal",
    relatedEntity: {
      entityType: "Meeting",
      entityId: meeting._id,
    },
    channels: {
      inApp: { enabled: true },
      email: { enabled: true },
      sms: { enabled: false },
      push: { enabled: false },
    },
    createdBy: req.user._id,
  });

  res.status(200).json({
    success: true,
    message: "Meeting confirmed successfully",
    data: {
      meeting,
    },
  });
});

// @desc    Cancel meeting
// @route   POST /api/v1/meetings/:id/cancel
// @access  Private
export const cancelMeeting = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  const meeting = await Meeting.findById(req.params.id).populate([
    { path: "parents", select: "firstName lastName" },
    { path: "teachers", select: "firstName lastName" },
    { path: "counselors", select: "firstName lastName" },
    { path: "student", select: "firstName lastName" },
  ]);

  if (!meeting) {
    return next(new AppError("Meeting not found", 404));
  }

  meeting.status = "Cancelled";
  meeting.cancellationReason = reason;
  meeting.cancelledBy = req.user._id;
  meeting.cancelledAt = new Date();

  await meeting.save();

  // Notify all participants
  const participants = [
    ...meeting.parents,
    ...meeting.teachers,
    ...meeting.counselors,
  ].filter(p => p._id.toString() !== req.user._id.toString());

  const notificationPromises = participants.map(participant =>
    createNotification({
      recipientId: participant._id,
      type: "Parent Meeting",
      title: "Meeting Cancelled",
      message: `The meeting regarding ${meeting.student.firstName} ${meeting.student.lastName} scheduled for ${meeting.formattedDate} has been cancelled. Reason: ${reason}`,
      priority: "High",
      relatedStudent: meeting.student._id,
      relatedEntity: {
        entityType: "Meeting",
        entityId: meeting._id,
      },
      channels: {
        inApp: { enabled: true },
        email: { enabled: true },
        sms: { enabled: true },
        push: { enabled: false },
      },
      createdBy: req.user._id,
    })
  );

  await Promise.all(notificationPromises);

  res.status(200).json({
    success: true,
    message: "Meeting cancelled successfully",
    data: {
      meeting,
    },
  });
});

// @desc    Delete meeting
// @route   DELETE /api/v1/meetings/:id
// @access  Private (Admin)
export const deleteMeeting = asyncHandler(async (req, res, next) => {
  const meeting = await Meeting.findById(req.params.id);

  if (!meeting) {
    return next(new AppError("Meeting not found", 404));
  }

  await meeting.deleteOne();

  res.status(200).json({
    success: true,
    message: "Meeting deleted successfully",
    data: null,
  });
});
