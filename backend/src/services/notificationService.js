import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import { sendSMS } from "./smsService.js";
import { sendEmail } from "./emailService.js";
import { getSocketIO } from "../socket/socketHandler.js";
import logger from "../utils/logger.js";

/**
 * Create and send notification through multiple channels
 */
export const createNotification = async ({
  recipientId,
  type,
  priority = "Normal",
  title,
  message,
  shortMessage = null,
  relatedStudent = null,
  relatedIntervention = null,
  relatedEntity = null,
  channels = {
    inApp: true,
    email: false,
    sms: false,
    push: false,
  },
  createdBy = null,
  actionButton = null,
}) => {
  try {
    // Get recipient details
    const recipient = await User.findById(recipientId);

    if (!recipient) {
      throw new Error("Recipient not found");
    }

    // Check user notification preferences
    const userPreferences = recipient.notificationPreferences;

    // Check quiet hours
    const now = new Date();
    const currentTime = `${now.getHours()}:${now.getMinutes()}`;

    if (userPreferences.quietHours.enabled) {
      const { start, end } = userPreferences.quietHours;
      if (isInQuietHours(currentTime, start, end)) {
        // Schedule for later (after quiet hours end)
        channels.sms = false;
        channels.email = false;
      }
    }

    // Override based on user preferences
    if (!userPreferences.email) channels.email = false;
    if (!userPreferences.sms) channels.sms = false;
    if (!userPreferences.inApp) channels.inApp = false;

    // For critical notifications, always send
    if (priority === "Critical") {
      channels.sms = userPreferences.sms;
      channels.email = userPreferences.email;
    }

    // Create notification record
    const notification = await Notification.create({
      recipient: recipientId,
      recipientRole: recipient.role,
      type,
      priority,
      title,
      message,
      shortMessage: shortMessage || message.substring(0, 157) + "...",
      relatedStudent,
      relatedIntervention,
      relatedEntity,
      channels,
      actionButton,
      createdBy,
    });

    // Send through enabled channels
    const sendPromises = [];

    // 1. In-App Notification (Real-time via Socket.io)
    if (channels.inApp.enabled) {
      sendPromises.push(sendInAppNotification(recipient._id, notification));
    }

    // 2. Email Notification
    if (channels.email.enabled) {
      sendPromises.push(sendEmailNotification(recipient, notification));
    }

    // 3. SMS Notification
    if (channels.sms.enabled) {
      sendPromises.push(sendSMSNotification(recipient, notification));
    }

    // 4. Push Notification (if implemented)
    if (channels.push.enabled) {
      // TODO: Implement push notification
    }

    // Send all notifications
    await Promise.allSettled(sendPromises);

    // Update notification status
    const allSent =
      (!channels.inApp.enabled || notification.channels.inApp.sent) &&
      (!channels.email.enabled || notification.channels.email.sent) &&
      (!channels.sms.enabled || notification.channels.sms.sent);

    if (allSent) {
      notification.status = "Sent";
      await notification.save();
    }

    logger.info(
      `Notification created and sent: ${notification._id} to ${recipient.email}`
    );

    return notification;
  } catch (error) {
    logger.error("Notification creation error:", error);
    throw error;
  }
};

/**
 * Send in-app notification via Socket.io
 */
const sendInAppNotification = async (userId, notification) => {
  try {
    const io = getSocketIO();

    // Emit notification to user's socket room
    io.to(userId.toString()).emit("notification", {
      id: notification._id,
      type: notification.type,
      priority: notification.priority,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt,
    });

    // Update notification record
    notification.channels.inApp.sent = true;
    notification.channels.inApp.sentAt = new Date();
    await notification.save();

    logger.info(`In-app notification sent to user: ${userId}`);
    return true;
  } catch (error) {
    logger.error("In-app notification error:", error);
    notification.errors.push({
      channel: "inApp",
      errorMessage: error.message,
    });
    await notification.save();
    return false;
  }
};

/**
 * Send email notification
 */
const sendEmailNotification = async (recipient, notification) => {
  try {
    const emailSent = await sendEmail({
      to: recipient.email,
      subject: notification.title,
      html: generateEmailHTML(notification),
      text: notification.message,
    });

    if (emailSent) {
      notification.channels.email.sent = true;
      notification.channels.email.sentAt = new Date();
      await notification.save();

      logger.info(`Email sent to: ${recipient.email}`);
      return true;
    }

    return false;
  } catch (error) {
    logger.error("Email notification error:", error);
    notification.errors.push({
      channel: "email",
      errorMessage: error.message,
    });
    await notification.save();
    return false;
  }
};

/**
 * Send SMS notification
 */
const sendSMSNotification = async (recipient, notification) => {
  try {
    const smsSent = await sendSMS({
      to: recipient.phone,
      message: notification.shortMessage,
    });

    if (smsSent) {
      notification.channels.sms.sent = true;
      notification.channels.sms.sentAt = new Date();
      notification.channels.sms.phoneNumber = recipient.phone;
      await notification.save();

      logger.info(`SMS sent to: ${recipient.phone}`);
      return true;
    }

    return false;
  } catch (error) {
    logger.error("SMS notification error:", error);
    notification.errors.push({
      channel: "sms",
      errorMessage: error.message,
    });
    await notification.save();
    return false;
  }
};

/**
 * Send attendance alert to parent
 */
export const sendAttendanceAlert = async (student, attendanceData) => {
  try {
    // Get parent user
    const parent = await User.findOne({
      role: "parent",
      children: student._id,
    });

    if (!parent) {
      logger.warn(`No parent found for student: ${student._id}`);
      return;
    }

    const message = `${student.fullName} (${student.rollNumber}) was marked ${
      attendanceData.status
    } on ${new Date(attendanceData.date).toDateString()}.`;

    // Determine priority based on consecutive absences
    let priority = "Normal";
    if (student.consecutiveAbsences >= 3) {
      priority = "High";
    }
    if (student.consecutiveAbsences >= 5) {
      priority = "Critical";
    }

    await createNotification({
      recipientId: parent._id,
      type: "Attendance Alert",
      priority,
      title: `Attendance Alert: ${student.firstName}`,
      message,
      relatedStudent: student._id,
      channels: {
        inApp: true,
        email: true,
        sms: priority === "Critical" || priority === "High",
        push: false,
      },
    });
  } catch (error) {
    logger.error("Attendance alert error:", error);
  }
};

/**
 * Send risk level change alert
 */
export const sendRiskLevelAlert = async (student, oldLevel, newLevel) => {
  try {
    // Notify counselors and admin
    const counselors = await User.find({ role: "counselor", isActive: true });
    const admin = await User.find({ role: "admin", isActive: true });

    const recipients = [...counselors, ...admin];

    const message = `Risk level changed for ${student.fullName} (${student.rollNumber}) from ${oldLevel} to ${newLevel}. Current risk score: ${student.riskScore}.`;

    for (const recipient of recipients) {
      await createNotification({
        recipientId: recipient._id,
        type: "Risk Level Change",
        priority: newLevel === "Critical" ? "Critical" : "High",
        title: `Risk Alert: ${student.firstName} ${student.lastName}`,
        message,
        relatedStudent: student._id,
        channels: {
          inApp: true,
          email: true,
          sms: newLevel === "Critical",
          push: false,
        },
        actionButton: {
          text: "View Student",
          link: `/students/${student._id}`,
        },
      });
    }
  } catch (error) {
    logger.error("Risk level alert error:", error);
  }
};

/**
 * Send intervention notification
 */
export const sendInterventionNotification = async (
  intervention,
  type,
  recipients
) => {
  try {
    const student = await Student.findById(intervention.student);

    let title, message;

    switch (type) {
      case "created":
        title = "New Intervention Created";
        message = `A new intervention "${intervention.title}" has been created for ${student.fullName}.`;
        break;
      case "approved":
        title = "Intervention Approved";
        message = `Intervention "${intervention.title}" for ${student.fullName} has been approved.`;
        break;
      case "completed":
        title = "Intervention Completed";
        message = `Intervention "${intervention.title}" for ${student.fullName} has been completed.`;
        break;
      default:
        title = "Intervention Update";
        message = `Intervention "${intervention.title}" for ${student.fullName} has been updated.`;
    }

    for (const recipientId of recipients) {
      await createNotification({
        recipientId,
        type: "Intervention Update",
        priority: "Normal",
        title,
        message,
        relatedStudent: student._id,
        relatedIntervention: intervention._id,
        channels: {
          inApp: true,
          email: true,
          sms: false,
          push: false,
        },
      });
    }
  } catch (error) {
    logger.error("Intervention notification error:", error);
  }
};

/**
 * Generate HTML for email
 */
const generateEmailHTML = (notification) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .priority-high { border-left: 4px solid #EF4444; }
        .priority-critical { border-left: 4px solid #DC2626; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Student Dropout Prevention System</h2>
        </div>
        <div class="content priority-${notification.priority.toLowerCase()}">
          <h3>${notification.title}</h3>
          <p>${notification.message}</p>
          ${
            notification.actionButton
              ? `<a href="${process.env.FRONTEND_URL}${notification.actionButton.link}" class="button">${notification.actionButton.text}</a>`
              : ""
          }
        </div>
        <div class="footer">
          <p>This is an automated notification from Student Dropout Prevention System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Check if current time is in quiet hours
 */
const isInQuietHours = (currentTime, startTime, endTime) => {
  const current = timeToMinutes(currentTime);
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  if (start < end) {
    return current >= start && current <= end;
  } else {
    // Quiet hours span midnight
    return current >= start || current <= end;
  }
};

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};
