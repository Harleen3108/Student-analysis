import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    // Meeting Details
    title: {
      type: String,
      required: [true, "Meeting title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Meeting description is required"],
    },
    topic: {
      type: String,
      required: [true, "Meeting topic is required"],
      enum: [
        "Academic Performance",
        "Attendance Issues",
        "Behavioral Concerns",
        "Risk Assessment",
        "Financial Assistance",
        "Health Issues",
        "General Discussion",
        "Intervention Planning",
        "Progress Review",
        "Other"
      ],
    },
    
    // Student Information
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
    },
    
    // Participants
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Organizer is required"],
    },
    organizerRole: {
      type: String,
      enum: ["admin", "teacher", "counselor"],
      required: true,
    },
    parents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    teachers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    counselors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    otherParticipants: [{
      name: String,
      role: String,
      email: String,
      phone: String,
    }],
    
    // Scheduling
    scheduledDate: {
      type: Date,
      required: [true, "Meeting date is required"],
    },
    scheduledTime: {
      type: String,
      required: [true, "Meeting time is required"],
    },
    duration: {
      type: Number, // in minutes
      default: 30,
    },
    endTime: {
      type: String,
    },
    
    // Location
    location: {
      type: String,
      required: [true, "Meeting location is required"],
    },
    locationType: {
      type: String,
      enum: ["In-Person", "Online", "Phone Call"],
      default: "In-Person",
    },
    meetingLink: {
      type: String, // For online meetings
    },
    
    // Status
    status: {
      type: String,
      enum: ["Scheduled", "Confirmed", "Rescheduled", "Cancelled", "Completed", "No Show"],
      default: "Scheduled",
    },
    priority: {
      type: String,
      enum: ["Low", "Normal", "High", "Urgent"],
      default: "Normal",
    },
    
    // Confirmation
    parentConfirmation: {
      confirmed: { type: Boolean, default: false },
      confirmedAt: Date,
      confirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    
    // Reminders
    remindersSent: [{
      sentAt: Date,
      sentTo: String, // email or phone
      method: String, // email, sms, notification
      status: String, // sent, failed
    }],
    
    // Meeting Notes
    agenda: {
      type: String,
    },
    notes: {
      type: String,
    },
    actionItems: [{
      item: String,
      assignedTo: String,
      dueDate: Date,
      status: {
        type: String,
        enum: ["Pending", "In Progress", "Completed"],
        default: "Pending",
      },
    }],
    outcome: {
      type: String,
    },
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpDate: {
      type: Date,
    },
    
    // Attachments
    attachments: [{
      name: String,
      url: String,
      type: String,
      uploadedAt: Date,
    }],
    
    // Cancellation
    cancellationReason: {
      type: String,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancelledAt: {
      type: Date,
    },
    
    // Rescheduling
    rescheduledFrom: {
      date: Date,
      time: String,
    },
    rescheduledReason: {
      type: String,
    },
    
    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
meetingSchema.index({ student: 1, scheduledDate: 1 });
meetingSchema.index({ organizer: 1, scheduledDate: 1 });
meetingSchema.index({ status: 1 });
meetingSchema.index({ scheduledDate: 1 });
meetingSchema.index({ parents: 1 });

// Virtual for formatted date
meetingSchema.virtual("formattedDate").get(function () {
  return this.scheduledDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Virtual for full date-time
meetingSchema.virtual("fullDateTime").get(function () {
  return `${this.formattedDate} at ${this.scheduledTime}`;
});

// Pre-save middleware to calculate end time
meetingSchema.pre("save", function (next) {
  if (this.scheduledTime && this.duration) {
    const [hours, minutes] = this.scheduledTime.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + this.duration;
    const endHours = Math.floor(endMinutes / 60) % 24;
    const endMins = endMinutes % 60;
    this.endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;
  }
  next();
});

const Meeting = mongoose.model("Meeting", meetingSchema);

export default Meeting;
