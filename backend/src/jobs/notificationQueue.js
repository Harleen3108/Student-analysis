import Queue from "bull";
import { sendSMS } from "../services/smsService.js";
import { sendEmail } from "../services/emailService.js";
import { getSocketIO } from "../socket/socketHandler.js";
import Notification from "../models/Notification.js";
import logger from "../utils/logger.js";

// Create notification queues
const emailQueue = new Queue("email notifications", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },
});

const smsQueue = new Queue("sms notifications", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },
});

const inAppQueue = new Queue("in-app notifications", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },
});

// Email notification processor
emailQueue.process("send-email", async (job) => {
  const { notificationId, recipient, subject, html, text } = job.data;
  
  try {
    logger.info(`Processing email notification: ${notificationId}`);
    
    const result = await sendEmail({
      to: recipient.email,
      subject,
      html,
      text,
    });

    if (result.success) {
      // Update notification status
      await Notification.findByIdAndUpdate(notificationId, {
        "channels.email.sent": true,
        "channels.email.sentAt": new Date(),
        "channels.email.emailId": result.messageId,
      });
      
      logger.info(`Email sent successfully: ${notificationId}`);
      return { success: true, messageId: result.messageId };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    logger.error(`Email notification failed: ${notificationId}`, error);
    
    // Update notification with error
    await Notification.findByIdAndUpdate(notificationId, {
      $push: {
        errors: {
          channel: "email",
          errorMessage: error.message,
          occurredAt: new Date(),
        },
      },
    });
    
    throw error;
  }
});

// SMS notification processor
smsQueue.process("send-sms", async (job) => {
  const { notificationId, recipient, message } = job.data;
  
  try {
    logger.info(`Processing SMS notification: ${notificationId}`);
    
    const result = await sendSMS({
      to: recipient.phone,
      message,
    });

    if (result.success) {
      // Update notification status
      await Notification.findByIdAndUpdate(notificationId, {
        "channels.sms.sent": true,
        "channels.sms.sentAt": new Date(),
        "channels.sms.smsId": result.messageId,
        "channels.sms.phoneNumber": recipient.phone,
      });
      
      logger.info(`SMS sent successfully: ${notificationId}`);
      return { success: true, messageId: result.messageId };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    logger.error(`SMS notification failed: ${notificationId}`, error);
    
    // Update notification with error
    await Notification.findByIdAndUpdate(notificationId, {
      $push: {
        errors: {
          channel: "sms",
          errorMessage: error.message,
          occurredAt: new Date(),
        },
      },
    });
    
    throw error;
  }
});

// In-app notification processor
inAppQueue.process("send-in-app", async (job) => {
  const { notificationId, recipient, notification } = job.data;
  
  try {
    logger.info(`Processing in-app notification: ${notificationId}`);
    
    const io = getSocketIO();
    
    // Emit notification to user's socket room
    io.to(recipient._id.toString()).emit("notification", {
      id: notification._id,
      type: notification.type,
      priority: notification.priority,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt,
      actionButton: notification.actionButton,
    });

    // Update notification status
    await Notification.findByIdAndUpdate(notificationId, {
      "channels.inApp.sent": true,
      "channels.inApp.sentAt": new Date(),
    });
    
    logger.info(`In-app notification sent successfully: ${notificationId}`);
    return { success: true };
  } catch (error) {
    logger.error(`In-app notification failed: ${notificationId}`, error);
    
    // Update notification with error
    await Notification.findByIdAndUpdate(notificationId, {
      $push: {
        errors: {
          channel: "inApp",
          errorMessage: error.message,
          occurredAt: new Date(),
        },
      },
    });
    
    throw error;
  }
});

// Queue event handlers
emailQueue.on("completed", (job, result) => {
  logger.info(`Email job completed: ${job.id}`, result);
});

emailQueue.on("failed", (job, err) => {
  logger.error(`Email job failed: ${job.id}`, err);
});

smsQueue.on("completed", (job, result) => {
  logger.info(`SMS job completed: ${job.id}`, result);
});

smsQueue.on("failed", (job, err) => {
  logger.error(`SMS job failed: ${job.id}`, err);
});

inAppQueue.on("completed", (job, result) => {
  logger.info(`In-app job completed: ${job.id}`, result);
});

inAppQueue.on("failed", (job, err) => {
  logger.error(`In-app job failed: ${job.id}`, err);
});

// Add notification to appropriate queues
export const queueNotification = async (notification, recipient) => {
  const { channels } = notification;
  
  try {
    // Queue email notification
    if (channels.email.enabled) {
      await emailQueue.add(
        "send-email",
        {
          notificationId: notification._id,
          recipient,
          subject: notification.title,
          html: generateEmailHTML(notification),
          text: notification.message,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          delay: 1000, // 1 second delay
        }
      );
    }

    // Queue SMS notification
    if (channels.sms.enabled) {
      await smsQueue.add(
        "send-sms",
        {
          notificationId: notification._id,
          recipient,
          message: notification.shortMessage || notification.message,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          delay: 2000, // 2 second delay
        }
      );
    }

    // Queue in-app notification
    if (channels.inApp.enabled) {
      await inAppQueue.add(
        "send-in-app",
        {
          notificationId: notification._id,
          recipient,
          notification,
        },
        {
          attempts: 2,
          delay: 500, // 0.5 second delay
        }
      );
    }

    logger.info(`Notification queued successfully: ${notification._id}`);
  } catch (error) {
    logger.error(`Failed to queue notification: ${notification._id}`, error);
    throw error;
  }
};

// Schedule notification for later delivery
export const scheduleNotification = async (notification, recipient, deliveryTime) => {
  const delay = new Date(deliveryTime).getTime() - Date.now();
  
  if (delay <= 0) {
    // Deliver immediately if time has passed
    return await queueNotification(notification, recipient);
  }

  const { channels } = notification;
  
  try {
    // Schedule email notification
    if (channels.email.enabled) {
      await emailQueue.add(
        "send-email",
        {
          notificationId: notification._id,
          recipient,
          subject: notification.title,
          html: generateEmailHTML(notification),
          text: notification.message,
        },
        {
          delay,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
        }
      );
    }

    // Schedule SMS notification
    if (channels.sms.enabled) {
      await smsQueue.add(
        "send-sms",
        {
          notificationId: notification._id,
          recipient,
          message: notification.shortMessage || notification.message,
        },
        {
          delay,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
        }
      );
    }

    // Schedule in-app notification
    if (channels.inApp.enabled) {
      await inAppQueue.add(
        "send-in-app",
        {
          notificationId: notification._id,
          recipient,
          notification,
        },
        {
          delay,
          attempts: 2,
        }
      );
    }

    logger.info(`Notification scheduled successfully: ${notification._id} for ${deliveryTime}`);
  } catch (error) {
    logger.error(`Failed to schedule notification: ${notification._id}`, error);
    throw error;
  }
};

// Generate HTML for email notifications
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

// Get queue statistics
export const getQueueStats = async () => {
  try {
    const [emailStats, smsStats, inAppStats] = await Promise.all([
      {
        waiting: await emailQueue.getWaiting(),
        active: await emailQueue.getActive(),
        completed: await emailQueue.getCompleted(),
        failed: await emailQueue.getFailed(),
      },
      {
        waiting: await smsQueue.getWaiting(),
        active: await smsQueue.getActive(),
        completed: await smsQueue.getCompleted(),
        failed: await smsQueue.getFailed(),
      },
      {
        waiting: await inAppQueue.getWaiting(),
        active: await inAppQueue.getActive(),
        completed: await inAppQueue.getCompleted(),
        failed: await inAppQueue.getFailed(),
      },
    ]);

    return {
      email: {
        waiting: emailStats.waiting.length,
        active: emailStats.active.length,
        completed: emailStats.completed.length,
        failed: emailStats.failed.length,
      },
      sms: {
        waiting: smsStats.waiting.length,
        active: smsStats.active.length,
        completed: smsStats.completed.length,
        failed: smsStats.failed.length,
      },
      inApp: {
        waiting: inAppStats.waiting.length,
        active: inAppStats.active.length,
        completed: inAppStats.completed.length,
        failed: inAppStats.failed.length,
      },
    };
  } catch (error) {
    logger.error("Failed to get queue stats:", error);
    return null;
  }
};

// Clean completed jobs (run periodically)
export const cleanQueues = async () => {
  try {
    await Promise.all([
      emailQueue.clean(24 * 60 * 60 * 1000, "completed"), // Clean completed jobs older than 24 hours
      emailQueue.clean(24 * 60 * 60 * 1000, "failed"), // Clean failed jobs older than 24 hours
      smsQueue.clean(24 * 60 * 60 * 1000, "completed"),
      smsQueue.clean(24 * 60 * 60 * 1000, "failed"),
      inAppQueue.clean(24 * 60 * 60 * 1000, "completed"),
      inAppQueue.clean(24 * 60 * 60 * 1000, "failed"),
    ]);
    
    logger.info("Queue cleanup completed");
  } catch (error) {
    logger.error("Queue cleanup failed:", error);
  }
};

export { emailQueue, smsQueue, inAppQueue };