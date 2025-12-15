import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { createNotification } from "../services/notificationService.js";

// @desc    Get user notifications
// @route   GET /api/v1/notifications
// @access  Private
export const getUserNotifications = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50, unreadOnly = false } = req.query;

  const query = { recipient: req.user._id };
  if (unreadOnly === "true") {
    query.isRead = false;
  }

  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("relatedStudent", "firstName lastName photo rollNumber")
      .populate("createdBy", "firstName lastName")
      .lean(),
    Notification.countDocuments(query),
    Notification.getUnreadCount(req.user._id),
  ]);

  res.status(200).json({
    status: "success",
    results: notifications.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
    data: {
      notifications,
      unreadCount,
    },
  });
});

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    return next(new AppError("Notification not found", 404));
  }

  notification.isRead = true;
  notification.readAt = new Date();
  notification.status = "Read";
  await notification.save();

  res.status(200).json({
    status: "success",
    message: "Notification marked as read",
    data: {
      notification,
    },
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
export const markAllAsRead = asyncHandler(async (req, res, next) => {
  const result = await Notification.markAllAsRead(req.user._id);

  res.status(200).json({
    status: "success",
    message: "All notifications marked as read",
    data: {
      modified: result.modifiedCount,
    },
  });
});

// @desc    Get unread count
// @route   GET /api/v1/notifications/unread-count
// @access  Private
export const getUnreadCount = asyncHandler(async (req, res, next) => {
  const count = await Notification.getUnreadCount(req.user._id);

  res.status(200).json({
    status: "success",
    data: {
      unreadCount: count,
    },
  });
});

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    return next(new AppError("Notification not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Notification deleted",
  });
});

// @desc    Update notification preferences
// @route   PUT /api/v1/notifications/preferences
// @access  Private
export const updateNotificationPreferences = asyncHandler(
  async (req, res, next) => {
    const { email, sms, inApp, quietHours } = req.body;

    const updates = {};
    if (email !== undefined) updates["notificationPreferences.email"] = email;
    if (sms !== undefined) updates["notificationPreferences.sms"] = sms;
    if (inApp !== undefined) updates["notificationPreferences.inApp"] = inApp;
    if (quietHours) updates["notificationPreferences.quietHours"] = quietHours;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    }).select("notificationPreferences");

    res.status(200).json({
      status: "success",
      message: "Notification preferences updated",
      data: {
        preferences: user.notificationPreferences,
      },
    });
  }
);

// @desc    Send test notification (Admin only)
// @route   POST /api/v1/notifications/test
// @access  Private (Admin)
export const sendTestNotification = asyncHandler(async (req, res, next) => {
  const { recipientId, type, title, message, channels } = req.body;

  const notification = await createNotification({
    recipientId,
    type: type || "System Alert",
    priority: "Normal",
    title: title || "Test Notification",
    message: message || "This is a test notification",
    channels: channels || {
      inApp: true,
      email: false,
      sms: false,
    },
    createdBy: req.user._id,
  });

  res.status(200).json({
    status: "success",
    message: "Test notification sent",
    data: {
      notification,
    },
  });
});

// Named exports - no default export needed
