import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // Recipient Information
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
    },
    recipientRole: {
      type: String,
      enum: ["admin", "teacher", "counselor", "parent"],
      required: true,
    },

    // Notification Type
    type: {
      type: String,
      enum: [
        "Attendance Alert",
        "Grade Update",
        "Risk Level Change",
        "Intervention Created",
        "Intervention Approved",
        "Intervention Update",
        "Parent Meeting",
        "System Alert",
        "Achievement",
        "Reminder",
        "Emergency",
        "Other",
      ],
      required: [true, "Notification type is required"],
    },

    // Priority
    priority: {
      type: String,
      enum: ["Low", "Normal", "High", "Critical"],
      default: "Normal",
    },

    // Content
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    shortMessage: {
      type: String, // For SMS (160 chars)
      trim: true,
    },

    // Related Entities
    relatedStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
    relatedIntervention: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Intervention",
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ["Attendance", "Grade", "Intervention", "Session", "Other"],
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },

    // Delivery Channels
    channels: {
      inApp: {
        enabled: {
          type: Boolean,
          default: true,
        },
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
      },
      email: {
        enabled: {
          type: Boolean,
          default: false,
        },
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        emailId: String, // Message ID from email service
      },
      sms: {
        enabled: {
          type: Boolean,
          default: false,
        },
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        smsId: String, // Message ID from SMS service
        phoneNumber: String,
      },
      push: {
        enabled: {
          type: Boolean,
          default: false,
        },
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
      },
    },

    // Status
    status: {
      type: String,
      enum: ["Pending", "Sent", "Delivered", "Read", "Failed"],
      default: "Pending",
    },

    // Read Status
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,

    // Action Button (Optional)
    actionButton: {
      text: String,
      link: String,
      action: String,
    },

    // Scheduling
    scheduledFor: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },

    // Error Tracking
    deliveryErrors: [
      {
        channel: {
          type: String,
          enum: ["email", "sms", "push", "inApp"],
        },
        errorMessage: String,
        occurredAt: {
          type: Date,
          default: Date.now,
        },
        retryCount: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Metadata
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ status: 1, scheduledFor: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ relatedStudent: 1 });
notificationSchema.index({ createdAt: -1 });

// TTL Index - Delete read notifications after 90 days
notificationSchema.index(
  { readAt: 1 },
  {
    expireAfterSeconds: 7776000, // 90 days
    partialFilterExpression: { isRead: true },
  }
);

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = async function (userId) {
  return await this.countDocuments({
    recipient: userId,
    isRead: false,
    status: { $ne: "Failed" },
  });
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = async function (userId) {
  return await this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to get notifications for user
notificationSchema.statics.getUserNotifications = async function (
  userId,
  limit = 50,
  skip = 0
) {
  return await this.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate("relatedStudent", "firstName lastName photo rollNumber")
    .populate("createdBy", "firstName lastName");
};

// Pre-save middleware to set short message for SMS
notificationSchema.pre("save", function (next) {
  if (!this.shortMessage && this.channels.sms.enabled) {
    // Truncate message to 160 characters for SMS
    this.shortMessage =
      this.message.length > 157
        ? this.message.substring(0, 157) + "..."
        : this.message;
  }
  next();
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
