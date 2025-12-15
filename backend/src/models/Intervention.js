import mongoose from "mongoose";

const interventionSchema = new mongoose.Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: [true, "Intervention title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },

    // Student and Class
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },

    // Intervention Type
    type: {
      type: String,
      enum: [
        "Counseling",
        "Parent Meeting",
        "Financial Aid",
        "Remedial Classes",
        "Home Visit",
        "Behavioral Support",
        "Academic Support",
        "Health Support",
        "Mentoring",
        "Peer Support",
        "Other",
      ],
      required: [true, "Intervention type is required"],
    },

    // Priority and Urgency
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    urgencyLevel: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },

    // Risk Factors Being Addressed
    targetedRiskFactors: [
      {
        type: String,
        enum: [
          "Attendance",
          "Academic",
          "Financial",
          "Behavioral",
          "Health",
          "Distance",
          "Family",
        ],
      },
    ],

    // Goals and Objectives
    goals: [
      {
        description: {
          type: String,
          required: true,
        },
        targetValue: {
          type: String,
        },
        achieved: {
          type: Boolean,
          default: false,
        },
        achievedDate: Date,
      },
    ],

    // Action Plan
    actionPlan: {
      type: String,
      required: [true, "Action plan is required"],
    },

    // Resources Required
    resourcesRequired: [
      {
        item: String,
        quantity: Number,
        cost: Number,
      },
    ],
    budgetAllocated: {
      type: Number,
      default: 0,
    },
    budgetSpent: {
      type: Number,
      default: 0,
    },

    // Timeline
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    actualEndDate: {
      type: Date,
    },

    // Schedule
    frequency: {
      type: String,
      enum: [
        "Daily",
        "Weekly",
        "Bi-weekly",
        "Monthly",
        "One-time",
        "As Needed",
      ],
      default: "Weekly",
    },
    scheduledSessions: [
      {
        date: {
          type: Date,
          required: true,
        },
        time: {
          type: String,
          required: true,
        },
        duration: {
          type: Number, // in minutes
          default: 30,
        },
        location: String,
        status: {
          type: String,
          enum: [
            "Scheduled",
            "Completed",
            "Cancelled",
            "Rescheduled",
            "No Show",
          ],
          default: "Scheduled",
        },
      },
    ],

    // Stakeholders
    assignedCounselor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned counselor is required"],
    },
    involvedTeachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    involvedParents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    externalAgencies: [
      {
        name: String,
        contactPerson: String,
        phone: String,
        email: String,
      },
    ],

    // Status Tracking
    status: {
      type: String,
      enum: [
        "Pending Approval",
        "Approved",
        "In Progress",
        "On Hold",
        "Completed",
        "Cancelled",
        "Failed",
      ],
      default: "Pending Approval",
    },

    // Approval
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    rejectionReason: String,

    // Progress Tracking
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    sessionsCompleted: {
      type: Number,
      default: 0,
    },
    sessionsCancelled: {
      type: Number,
      default: 0,
    },

    // Metrics Before Intervention
    metricsBeforeIntervention: {
      riskScore: Number,
      attendancePercentage: Number,
      academicPercentage: Number,
      behavioralScore: Number,
    },

    // Metrics After Intervention
    metricsAfterIntervention: {
      riskScore: Number,
      attendancePercentage: Number,
      academicPercentage: Number,
      behavioralScore: Number,
    },

    // Outcome
    outcome: {
      type: String,
      enum: [
        "Successful",
        "Partially Successful",
        "Not Successful",
        "Ongoing",
        "Not Evaluated",
      ],
      default: "Not Evaluated",
    },
    outcomeDescription: {
      type: String,
    },
    improvementPercentage: {
      type: Number,
    },

    // Follow-up
    requiresFollowUp: {
      type: Boolean,
      default: false,
    },
    followUpDate: Date,
    followUpNotes: String,

    // Documents and Evidence
    documents: [
      {
        title: String,
        url: String,
        publicId: String,
        type: {
          type: String,
          enum: ["Report", "Certificate", "Photo", "Document", "Other"],
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    // Notes and Comments
    notes: [
      {
        content: {
          type: String,
          required: true,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Success Story
    isSuccessStory: {
      type: Boolean,
      default: false,
    },
    successStoryDetails: {
      beforeDescription: String,
      afterDescription: String,
      keyFactors: [String],
      testimonial: String,
      photos: [
        {
          url: String,
          publicId: String,
          caption: String,
        },
      ],
    },

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

// Virtual for duration in days
interventionSchema.virtual("durationInDays").get(function () {
  const end = this.actualEndDate || this.endDate;
  const start = this.startDate;
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
});

// Virtual for total sessions
interventionSchema.virtual("totalSessions").get(function () {
  return this.scheduledSessions.length;
});

// Virtual for pending sessions
interventionSchema.virtual("pendingSessions").get(function () {
  return this.scheduledSessions.filter((s) => s.status === "Scheduled").length;
});

// Virtual for effectiveness
interventionSchema.virtual("effectiveness").get(function () {
  if (this.metricsBeforeIntervention && this.metricsAfterIntervention) {
    const before = this.metricsBeforeIntervention.riskScore || 0;
    const after = this.metricsAfterIntervention.riskScore || 0;
    return before > 0 ? (((before - after) / before) * 100).toFixed(2) : 0;
  }
  return 0;
});

// Indexes
interventionSchema.index({ student: 1, status: 1 });
interventionSchema.index({ assignedCounselor: 1, status: 1 });
interventionSchema.index({ type: 1 });
interventionSchema.index({ priority: 1 });
interventionSchema.index({ approvalStatus: 1 });
interventionSchema.index({ outcome: 1 });
interventionSchema.index({ startDate: 1, endDate: 1 });

// Pre-save middleware to update completion percentage
interventionSchema.pre("save", function (next) {
  if (this.scheduledSessions && this.scheduledSessions.length > 0) {
    const completed = this.scheduledSessions.filter(
      (s) => s.status === "Completed"
    ).length;
    this.completionPercentage = (
      (completed / this.scheduledSessions.length) *
      100
    ).toFixed(2);
    this.sessionsCompleted = completed;
    this.sessionsCancelled = this.scheduledSessions.filter(
      (s) => s.status === "Cancelled"
    ).length;
  }
  next();
});

const Intervention = mongoose.model("Intervention", interventionSchema);

export default Intervention;
