import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    // Session Basic Info
    intervention: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Intervention",
      required: [true, "Intervention reference is required"],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
    },
    counselor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Counselor reference is required"],
    },

    // Session Details
    sessionNumber: {
      type: Number,
      required: true,
    },
    sessionType: {
      type: String,
      enum: [
        "Individual Counseling",
        "Group Counseling",
        "Parent Meeting",
        "Teacher Consultation",
        "Follow-up",
        "Assessment",
        "Crisis Intervention",
        "Other",
      ],
      required: [true, "Session type is required"],
    },

    // Scheduling
    scheduledDate: {
      type: Date,
      required: [true, "Scheduled date is required"],
    },
    scheduledTime: {
      type: String,
      required: [true, "Scheduled time is required"], // Format: "HH:mm"
    },
    duration: {
      type: Number, // in minutes
      default: 30,
    },
    actualStartTime: String,
    actualEndTime: String,
    actualDuration: Number,

    // Location
    location: {
      type: String,
      default: "Counseling Room",
    },
    mode: {
      type: String,
      enum: ["In-Person", "Online", "Phone", "Home Visit"],
      default: "In-Person",
    },
    meetingLink: String,

    // Attendance
    studentAttended: {
      type: Boolean,
      default: false,
    },
    attendanceStatus: {
      type: String,
      enum: [
        "Scheduled",
        "Present",
        "Absent",
        "Late",
        "Cancelled",
        "Rescheduled",
      ],
      default: "Scheduled",
    },
    noShowReason: String,

    // Participants
    additionalParticipants: [
      {
        name: String,
        relation: {
          type: String,
          enum: ["Parent", "Guardian", "Teacher", "Sibling", "Friend", "Other"],
        },
        role: String,
      },
    ],

    // Session Content
    objectives: [
      {
        type: String,
      },
    ],
    topicsDiscussed: [
      {
        type: String,
      },
    ],

    // Detailed Notes (Confidential)
    sessionNotes: {
      type: String,
      required: function () {
        return this.status === "Completed";
      },
    },
    studentMood: {
      type: String,
      enum: [
        "Very Happy",
        "Happy",
        "Neutral",
        "Sad",
        "Very Sad",
        "Anxious",
        "Angry",
        "Confused",
        "Not Assessed",
      ],
      default: "Not Assessed",
    },
    studentEngagement: {
      type: String,
      enum: [
        "Very Engaged",
        "Engaged",
        "Neutral",
        "Disengaged",
        "Resistant",
        "Not Assessed",
      ],
      default: "Not Assessed",
    },

    // Observations
    observations: {
      physical: String,
      emotional: String,
      behavioral: String,
      cognitive: String,
    },

    // Concerns Raised
    concernsRaised: [
      {
        concern: String,
        severity: {
          type: String,
          enum: ["Low", "Medium", "High", "Critical"],
        },
      },
    ],

    // Interventions Applied During Session
    techniqueUsed: [
      {
        type: String,
        enum: [
          "Active Listening",
          "Cognitive Behavioral Therapy",
          "Solution-Focused Therapy",
          "Play Therapy",
          "Art Therapy",
          "Motivational Interviewing",
          "Mindfulness",
          "Goal Setting",
          "Other",
        ],
      },
    ],

    // Progress Assessment
    progressSinceLastSession: {
      type: String,
      enum: [
        "Significant Improvement",
        "Slight Improvement",
        "No Change",
        "Slight Decline",
        "Significant Decline",
        "N/A",
      ],
      default: "N/A",
    },
    goalsAchieved: [
      {
        goal: String,
        achieved: Boolean,
      },
    ],

    // Action Items
    actionItems: [
      {
        task: {
          type: String,
          required: true,
        },
        assignedTo: {
          type: String,
          enum: ["Student", "Parent", "Teacher", "Counselor", "Admin"],
          required: true,
        },
        dueDate: Date,
        completed: {
          type: Boolean,
          default: false,
        },
        completedDate: Date,
      },
    ],

    // Homework/Tasks for Student
    homeworkAssigned: [
      {
        description: String,
        dueDate: Date,
        completed: Boolean,
        completionNotes: String,
      },
    ],

    // Follow-up
    requiresFollowUp: {
      type: Boolean,
      default: false,
    },
    followUpDate: Date,
    followUpNotes: String,

    // Referrals
    referrals: [
      {
        referredTo: String,
        reason: String,
        urgency: {
          type: String,
          enum: ["Low", "Medium", "High", "Emergency"],
        },
        contactInfo: String,
        status: {
          type: String,
          enum: ["Pending", "Contacted", "Accepted", "Declined"],
        },
      },
    ],

    // Risk Assessment After Session
    riskAssessment: {
      immediateRisk: {
        type: Boolean,
        default: false,
      },
      riskLevel: {
        type: String,
        enum: ["No Risk", "Low", "Medium", "High", "Immediate Danger"],
      },
      riskFactors: [String],
      actionTaken: String,
    },

    // Documents
    documents: [
      {
        title: String,
        url: String,
        publicId: String,
        type: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Session Status
    status: {
      type: String,
      enum: [
        "Scheduled",
        "In Progress",
        "Completed",
        "Cancelled",
        "No Show",
        "Rescheduled",
      ],
      default: "Scheduled",
    },

    // Cancellation/Rescheduling
    cancellationReason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rescheduledTo: Date,

    // Satisfaction Rating (Optional)
    studentSatisfaction: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      feedback: String,
    },

    // Confidentiality Flag
    isConfidential: {
      type: Boolean,
      default: true,
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
  }
);

// Indexes
sessionSchema.index({ intervention: 1, sessionNumber: 1 });
sessionSchema.index({ student: 1, scheduledDate: 1 });
sessionSchema.index({ counselor: 1, status: 1 });
sessionSchema.index({ scheduledDate: 1, scheduledTime: 1 });
sessionSchema.index({ status: 1 });

// Pre-save middleware to calculate actual duration
sessionSchema.pre("save", function (next) {
  if (this.actualStartTime && this.actualEndTime) {
    const [startH, startM] = this.actualStartTime.split(":").map(Number);
    const [endH, endM] = this.actualEndTime.split(":").map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    this.actualDuration = endMinutes - startMinutes;
  }
  next();
});

// Static method to get upcoming sessions for counselor
sessionSchema.statics.getUpcomingSessions = async function (
  counselorId,
  days = 7
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + days);

  return await this.find({
    counselor: counselorId,
    scheduledDate: { $gte: today, $lte: futureDate },
    status: { $in: ["Scheduled", "In Progress"] },
  })
    .sort({ scheduledDate: 1, scheduledTime: 1 })
    .populate("student", "firstName lastName photo rollNumber riskLevel")
    .populate("intervention", "title type");
};

// Static method to get session history for student
sessionSchema.statics.getStudentHistory = async function (studentId) {
  return await this.find({
    student: studentId,
    status: "Completed",
  })
    .sort({ scheduledDate: -1 })
    .populate("counselor", "firstName lastName")
    .populate("intervention", "title type");
};

const Session = mongoose.model("Session", sessionSchema);

export default Session;
