import Intervention from "../models/Intervention.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import Session from "../models/Session.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { createNotification } from "../services/notificationService.js";
import { calculateRiskScore } from "../services/riskCalculator.js";

// @desc    Get all interventions
// @route   GET /api/v1/interventions
// @access  Private (Admin, Counselor, Teacher)
export const getInterventions = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    status,
    type,
    priority,
    assignedCounselor,
    student,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build query
  const query = {};
  
  if (status) query.status = status;
  if (type) query.type = type;
  if (priority) query.priority = priority;
  if (assignedCounselor) query.assignedCounselor = assignedCounselor;
  if (student) query.student = student;

  // Role-based filtering
  if (req.user.role === "counselor") {
    query.assignedCounselor = req.user._id;
  } else if (req.user.role === "teacher") {
    query.involvedTeachers = req.user._id;
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [interventions, total] = await Promise.all([
    Intervention.find(query)
      .populate("student", "firstName lastName rollNumber photo riskLevel")
      .populate("assignedCounselor", "firstName lastName")
      .populate("involvedTeachers", "firstName lastName")
      .populate("approvedBy", "firstName lastName")
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip),
    Intervention.countDocuments(query),
  ]);

  res.status(200).json({
    status: "success",
    results: interventions.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
    data: {
      interventions,
    },
  });
});

// @desc    Get single intervention
// @route   GET /api/v1/interventions/:id
// @access  Private (Admin, Counselor, Teacher)
export const getIntervention = asyncHandler(async (req, res, next) => {
  const intervention = await Intervention.findById(req.params.id)
    .populate("student", "firstName lastName rollNumber photo riskLevel class")
    .populate("assignedCounselor", "firstName lastName email phone")
    .populate("involvedTeachers", "firstName lastName email")
    .populate("involvedParents", "firstName lastName email phone")
    .populate("approvedBy", "firstName lastName")
    .populate("createdBy", "firstName lastName");

  if (!intervention) {
    return next(new AppError("Intervention not found", 404));
  }

  // Check access permissions
  const hasAccess = 
    req.user.role === "admin" ||
    intervention.assignedCounselor._id.toString() === req.user._id.toString() ||
    intervention.involvedTeachers.some(t => t._id.toString() === req.user._id.toString()) ||
    intervention.createdBy._id.toString() === req.user._id.toString();

  if (!hasAccess) {
    return next(new AppError("Access denied", 403));
  }

  res.status(200).json({
    status: "success",
    data: {
      intervention,
    },
  });
});

// @desc    Create new intervention
// @route   POST /api/v1/interventions
// @access  Private (Admin, Counselor)
export const createIntervention = asyncHandler(async (req, res, next) => {
  const {
    title,
    description,
    student,
    type,
    priority,
    targetedRiskFactors,
    goals,
    actionPlan,
    resourcesRequired,
    budgetAllocated,
    startDate,
    endDate,
    frequency,
    assignedCounselor,
    involvedTeachers,
    involvedParents,
  } = req.body;

  // Verify student exists
  const studentDoc = await Student.findById(student);
  if (!studentDoc) {
    return next(new AppError("Student not found", 404));
  }

  // Get student's current risk metrics for baseline
  const currentRisk = await calculateRiskScore(student);

  const intervention = await Intervention.create({
    title,
    description,
    student,
    type,
    priority,
    targetedRiskFactors,
    goals,
    actionPlan,
    resourcesRequired,
    budgetAllocated,
    startDate,
    endDate,
    frequency,
    assignedCounselor: assignedCounselor || req.user._id,
    involvedTeachers,
    involvedParents,
    metricsBeforeIntervention: {
      riskScore: currentRisk.totalRiskScore,
      attendancePercentage: studentDoc.attendancePercentage,
      academicPercentage: studentDoc.overallPercentage,
    },
    createdBy: req.user._id,
  });

  // Populate the created intervention
  await intervention.populate([
    { path: "student", select: "firstName lastName rollNumber" },
    { path: "assignedCounselor", select: "firstName lastName" },
  ]);

  // Send notifications to involved parties
  const notificationRecipients = [
    assignedCounselor || req.user._id,
    ...(involvedTeachers || []),
    ...(involvedParents || []),
  ];

  for (const recipientId of notificationRecipients) {
    await createNotification({
      recipientId,
      type: "Intervention Created",
      priority: priority === "Urgent" ? "High" : "Normal",
      title: `New Intervention: ${title}`,
      message: `A new intervention "${title}" has been created for ${studentDoc.firstName} ${studentDoc.lastName}.`,
      relatedStudent: student,
      relatedIntervention: intervention._id,
      channels: {
        inApp: true,
        email: true,
        sms: priority === "Urgent",
      },
      createdBy: req.user._id,
    });
  }

  res.status(201).json({
    status: "success",
    data: {
      intervention,
    },
  });
});

// @desc    Update intervention
// @route   PUT /api/v1/interventions/:id
// @access  Private (Admin, Assigned Counselor)
export const updateIntervention = asyncHandler(async (req, res, next) => {
  let intervention = await Intervention.findById(req.params.id);

  if (!intervention) {
    return next(new AppError("Intervention not found", 404));
  }

  // Check permissions
  const canUpdate = 
    req.user.role === "admin" ||
    intervention.assignedCounselor.toString() === req.user._id.toString();

  if (!canUpdate) {
    return next(new AppError("Not authorized to update this intervention", 403));
  }

  intervention = await Intervention.findByIdAndUpdate(
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
    { path: "assignedCounselor", select: "firstName lastName" },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      intervention,
    },
  });
});

// @desc    Approve intervention
// @route   PUT /api/v1/interventions/:id/approve
// @access  Private (Admin)
export const approveIntervention = asyncHandler(async (req, res, next) => {
  const { approvalNotes } = req.body;

  const intervention = await Intervention.findById(req.params.id)
    .populate("student", "firstName lastName")
    .populate("assignedCounselor", "firstName lastName");

  if (!intervention) {
    return next(new AppError("Intervention not found", 404));
  }

  if (intervention.approvalStatus === "Approved") {
    return next(new AppError("Intervention already approved", 400));
  }

  intervention.approvalStatus = "Approved";
  intervention.approvedBy = req.user._id;
  intervention.approvedAt = new Date();
  intervention.status = "Approved";
  
  if (approvalNotes) {
    intervention.notes.push({
      content: `Approval Notes: ${approvalNotes}`,
      addedBy: req.user._id,
    });
  }

  await intervention.save();

  // Notify assigned counselor
  await createNotification({
    recipientId: intervention.assignedCounselor._id,
    type: "Intervention Approved",
    priority: "Normal",
    title: `Intervention Approved: ${intervention.title}`,
    message: `Your intervention "${intervention.title}" for ${intervention.student.firstName} ${intervention.student.lastName} has been approved.`,
    relatedStudent: intervention.student._id,
    relatedIntervention: intervention._id,
    channels: {
      inApp: true,
      email: true,
      sms: false,
    },
    createdBy: req.user._id,
  });

  res.status(200).json({
    status: "success",
    message: "Intervention approved successfully",
    data: {
      intervention,
    },
  });
});

// @desc    Reject intervention
// @route   PUT /api/v1/interventions/:id/reject
// @access  Private (Admin)
export const rejectIntervention = asyncHandler(async (req, res, next) => {
  const { rejectionReason } = req.body;

  if (!rejectionReason) {
    return next(new AppError("Rejection reason is required", 400));
  }

  const intervention = await Intervention.findById(req.params.id)
    .populate("student", "firstName lastName")
    .populate("assignedCounselor", "firstName lastName");

  if (!intervention) {
    return next(new AppError("Intervention not found", 404));
  }

  intervention.approvalStatus = "Rejected";
  intervention.rejectionReason = rejectionReason;
  intervention.status = "Cancelled";

  intervention.notes.push({
    content: `Rejection Reason: ${rejectionReason}`,
    addedBy: req.user._id,
  });

  await intervention.save();

  // Notify assigned counselor
  await createNotification({
    recipientId: intervention.assignedCounselor._id,
    type: "Intervention Rejected",
    priority: "High",
    title: `Intervention Rejected: ${intervention.title}`,
    message: `Your intervention "${intervention.title}" has been rejected. Reason: ${rejectionReason}`,
    relatedStudent: intervention.student._id,
    relatedIntervention: intervention._id,
    channels: {
      inApp: true,
      email: true,
      sms: false,
    },
    createdBy: req.user._id,
  });

  res.status(200).json({
    status: "success",
    message: "Intervention rejected",
    data: {
      intervention,
    },
  });
});

// @desc    Complete intervention
// @route   PUT /api/v1/interventions/:id/complete
// @access  Private (Admin, Assigned Counselor)
export const completeIntervention = asyncHandler(async (req, res, next) => {
  const { outcome, outcomeDescription, improvementPercentage } = req.body;

  const intervention = await Intervention.findById(req.params.id)
    .populate("student");

  if (!intervention) {
    return next(new AppError("Intervention not found", 404));
  }

  // Check permissions
  const canComplete = 
    req.user.role === "admin" ||
    intervention.assignedCounselor.toString() === req.user._id.toString();

  if (!canComplete) {
    return next(new AppError("Not authorized to complete this intervention", 403));
  }

  // Get current risk metrics for comparison
  const currentRisk = await calculateRiskScore(intervention.student._id);

  intervention.status = "Completed";
  intervention.outcome = outcome;
  intervention.outcomeDescription = outcomeDescription;
  intervention.improvementPercentage = improvementPercentage;
  intervention.actualEndDate = new Date();
  
  intervention.metricsAfterIntervention = {
    riskScore: currentRisk.totalRiskScore,
    attendancePercentage: intervention.student.attendancePercentage,
    academicPercentage: intervention.student.overallPercentage,
  };

  await intervention.save();

  res.status(200).json({
    status: "success",
    message: "Intervention completed successfully",
    data: {
      intervention,
    },
  });
});

// @desc    Add session to intervention
// @route   POST /api/v1/interventions/:id/sessions
// @access  Private (Admin, Assigned Counselor)
export const addSession = asyncHandler(async (req, res, next) => {
  const intervention = await Intervention.findById(req.params.id);

  if (!intervention) {
    return next(new AppError("Intervention not found", 404));
  }

  // Check permissions
  const canAddSession = 
    req.user.role === "admin" ||
    intervention.assignedCounselor.toString() === req.user._id.toString();

  if (!canAddSession) {
    return next(new AppError("Not authorized to add sessions", 403));
  }

  const session = await Session.create({
    ...req.body,
    intervention: intervention._id,
    student: intervention.student,
    counselor: intervention.assignedCounselor,
    createdBy: req.user._id,
  });

  res.status(201).json({
    status: "success",
    data: {
      session,
    },
  });
});

// @desc    Get intervention sessions
// @route   GET /api/v1/interventions/:id/sessions
// @access  Private (Admin, Assigned Counselor)
export const getInterventionSessions = asyncHandler(async (req, res, next) => {
  const intervention = await Intervention.findById(req.params.id);

  if (!intervention) {
    return next(new AppError("Intervention not found", 404));
  }

  const sessions = await Session.find({ intervention: req.params.id })
    .populate("counselor", "firstName lastName")
    .sort({ scheduledDate: -1 });

  res.status(200).json({
    status: "success",
    results: sessions.length,
    data: {
      sessions,
    },
  });
});

// @desc    Delete intervention
// @route   DELETE /api/v1/interventions/:id
// @access  Private (Admin)
export const deleteIntervention = asyncHandler(async (req, res, next) => {
  const intervention = await Intervention.findById(req.params.id);

  if (!intervention) {
    return next(new AppError("Intervention not found", 404));
  }

  await intervention.deleteOne();

  res.status(200).json({
    status: "success",
    message: "Intervention deleted successfully",
  });
});