import mongoose from "mongoose";

const teacherObservationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher is required"],
    },
    class: {
      type: String,
      required: [true, "Class is required"],
    },
    observationType: {
      type: String,
      enum: [
        "Behavioral",
        "Academic",
        "Health",
        "Engagement",
        "Social",
        "Attendance",
        "General"
      ],
      required: [true, "Observation type is required"],
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    title: {
      type: String,
      required: [true, "Observation title is required"],
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, "Observation description is required"],
      maxlength: 1000,
    },
    actionTaken: {
      type: String,
      maxlength: 500,
    },
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpDate: {
      type: Date,
    },
    followUpNotes: {
      type: String,
      maxlength: 500,
    },
    tags: [{
      type: String,
      maxlength: 50,
    }],
    isPrivate: {
      type: Boolean,
      default: false, // If true, only visible to teacher and admin
    },
    status: {
      type: String,
      enum: ["Active", "Resolved", "Escalated"],
      default: "Active",
    },
    // For tracking patterns
    relatedObservations: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherObservation",
    }],
    // Visibility settings
    visibleTo: [{
      role: {
        type: String,
        enum: ["admin", "counselor", "teacher", "parent"],
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
teacherObservationSchema.index({ student: 1, createdAt: -1 });
teacherObservationSchema.index({ teacher: 1, createdAt: -1 });
teacherObservationSchema.index({ class: 1, createdAt: -1 });
teacherObservationSchema.index({ observationType: 1 });
teacherObservationSchema.index({ severity: 1 });
teacherObservationSchema.index({ status: 1 });

// Virtual for observation age
teacherObservationSchema.virtual("age").get(function () {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
});

// Static method to get student observations summary
teacherObservationSchema.statics.getStudentSummary = async function (studentId) {
  try {
    const pipeline = [
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
        },
      },
      {
        $group: {
          _id: "$observationType",
          count: { $sum: 1 },
          latestDate: { $max: "$createdAt" },
          severities: { $push: "$severity" },
        },
      },
      {
        $project: {
          _id: 0,
          type: "$_id",
          count: 1,
          latestDate: 1,
          highSeverityCount: {
            $size: {
              $filter: {
                input: "$severities",
                cond: { $in: ["$$this", ["High", "Critical"]] },
              },
            },
          },
        },
      },
    ];

    return await this.aggregate(pipeline);
  } catch (error) {
    throw new Error(`Error getting student observations summary: ${error.message}`);
  }
};

// Static method to get teacher's recent observations
teacherObservationSchema.statics.getTeacherRecent = async function (teacherId, limit = 10) {
  try {
    return await this.find({ teacher: teacherId })
      .populate("student", "firstName lastName rollNumber")
      .sort({ createdAt: -1 })
      .limit(limit);
  } catch (error) {
    throw new Error(`Error getting teacher's recent observations: ${error.message}`);
  }
};

// Static method to get class observations
teacherObservationSchema.statics.getClassObservations = async function (className, teacherId) {
  try {
    return await this.find({ 
      class: className,
      teacher: teacherId 
    })
      .populate("student", "firstName lastName rollNumber")
      .sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(`Error getting class observations: ${error.message}`);
  }
};

// Method to check if follow-up is due
teacherObservationSchema.methods.isFollowUpDue = function () {
  if (!this.followUpRequired || !this.followUpDate) return false;
  return new Date() >= this.followUpDate;
};

// Pre-save middleware
teacherObservationSchema.pre("save", function (next) {
  // Auto-set visibility based on observation type and severity
  if (this.isNew) {
    this.visibleTo = [
      { role: "admin" },
      { role: "teacher", userId: this.teacher },
    ];
    
    // Add counselor for behavioral or high severity observations
    if (this.observationType === "Behavioral" || ["High", "Critical"].includes(this.severity)) {
      this.visibleTo.push({ role: "counselor" });
    }
    
    // Add parent visibility for certain types (if not private)
    if (!this.isPrivate && ["Health", "Academic"].includes(this.observationType)) {
      this.visibleTo.push({ role: "parent" });
    }
  }
});

const TeacherObservation = mongoose.model("TeacherObservation", teacherObservationSchema);

export default TeacherObservation;