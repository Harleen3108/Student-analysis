import mongoose from "mongoose";

const communicationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },
    senderRole: {
      type: String,
      enum: ["admin", "teacher", "counselor"],
      required: true,
    },
    recipient: {
      type: String,
      enum: ["parent", "student", "both"],
      required: [true, "Recipient is required"],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      maxlength: 200,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: [
        "General",
        "Academic",
        "Behavioral",
        "Attendance",
        "Health",
        "Event",
        "Meeting Request",
        "Urgent"
      ],
      default: "General",
    },
    priority: {
      type: String,
      enum: ["Low", "Normal", "High", "Urgent"],
      default: "Normal",
    },
    method: {
      type: String,
      enum: ["Email", "SMS", "Phone Call", "In-Person", "App"],
      default: "Email",
    },
    status: {
      type: String,
      enum: ["Sent", "Delivered", "Read", "Replied", "Failed"],
      default: "Sent",
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    deliveredAt: Date,
    readAt: Date,
    repliedAt: Date,
    parentResponse: {
      message: String,
      receivedAt: Date,
    },
    attachments: [{
      name: String,
      url: String,
      type: String,
    }],
    tags: [{
      type: String,
      maxlength: 50,
    }],
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpDate: Date,
    followUpNotes: String,
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
communicationSchema.index({ sender: 1, createdAt: -1 });
communicationSchema.index({ student: 1, createdAt: -1 });
communicationSchema.index({ status: 1 });
communicationSchema.index({ type: 1 });
communicationSchema.index({ priority: 1 });

// Virtual for communication age
communicationSchema.virtual("age").get(function () {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
});

// Static method to get teacher's communications
communicationSchema.statics.getTeacherCommunications = async function (teacherId, filters = {}) {
  try {
    const query = { sender: teacherId, isArchived: false };
    
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.studentId) query.student = filters.studentId;

    return await this.find(query)
      .populate("student", "firstName lastName rollNumber section")
      .sort({ createdAt: -1 })
      .limit(filters.limit || 100);
  } catch (error) {
    throw new Error(`Error getting teacher communications: ${error.message}`);
  }
};

// Static method to get student communication history
communicationSchema.statics.getStudentHistory = async function (studentId) {
  try {
    return await this.find({ student: studentId, isArchived: false })
      .populate("sender", "firstName lastName email role")
      .sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(`Error getting student communication history: ${error.message}`);
  }
};

// Method to mark as read
communicationSchema.methods.markAsRead = function () {
  if (this.status === "Delivered" || this.status === "Sent") {
    this.status = "Read";
    this.readAt = new Date();
  }
  return this.save();
};

// Method to add parent response
communicationSchema.methods.addResponse = function (responseMessage) {
  this.parentResponse = {
    message: responseMessage,
    receivedAt: new Date(),
  };
  this.status = "Replied";
  this.repliedAt = new Date();
  return this.save();
};

const Communication = mongoose.model("Communication", communicationSchema);

export default Communication;
