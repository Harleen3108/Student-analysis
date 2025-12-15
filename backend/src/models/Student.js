import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    // Personal Information
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    photo: {
      url: String,
      publicId: String, // Cloudinary public ID for deletion
    },
    rollNumber: {
      type: String,
      required: [true, "Roll number is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    admissionNumber: {
      type: String,
      required: [true, "Admission number is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: [true, "Gender is required"],
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    address: {
      street: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      fullAddress: String,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    phone: {
      type: String,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
    },

    // Academic Information
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: false, // Make optional for now
    },
    section: {
      type: String,
      required: [true, "Section is required"],
      uppercase: true,
    },
    dateOfAdmission: {
      type: Date,
      required: [true, "Date of admission is required"],
      default: Date.now,
    },
    previousSchool: {
      name: String,
      address: String,
      lastClass: String,
    },

    // Attendance Metrics (Auto-calculated)
    attendancePercentage: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    totalDaysPresent: {
      type: Number,
      default: 0,
    },
    totalDaysAbsent: {
      type: Number,
      default: 0,
    },
    consecutiveAbsences: {
      type: Number,
      default: 0,
    },
    lateComingCount: {
      type: Number,
      default: 0,
    },

    // Academic Performance (Auto-calculated)
    overallPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    failedSubjectsCount: {
      type: Number,
      default: 0,
    },
    academicTrend: {
      type: String,
      enum: ["Improving", "Stable", "Declining", "Unknown"],
      default: "Unknown",
    },

    // Family Information
    father: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: String,
      occupation: String,
      education: {
        type: String,
        enum: [
          "None",
          "Primary",
          "Secondary",
          "Higher Secondary",
          "Graduate",
          "Post Graduate",
          "Doctorate",
        ],
      },
      income: Number,
    },
    mother: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: String,
      occupation: String,
      education: {
        type: String,
        enum: [
          "None",
          "Primary",
          "Secondary",
          "Higher Secondary",
          "Graduate",
          "Post Graduate",
          "Doctorate",
        ],
      },
      income: Number,
    },
    guardian: {
      name: String,
      phone: String,
      email: String,
      relation: String,
    },
    siblings: {
      count: { type: Number, default: 0 },
      inSchool: { type: Number, default: 0 },
    },
    familyIncomeLevel: {
      type: String,
      enum: [
        "Below Poverty Line",
        "Low Income",
        "Middle Income",
        "High Income",
      ],
      required: [true, "Family income level is required"],
    },

    // Risk Factors
    distanceFromSchool: {
      type: Number, // in kilometers
      required: [true, "Distance from school is required"],
    },
    transportationMode: {
      type: String,
      enum: [
        "Walk",
        "Bicycle",
        "School Bus",
        "Public Transport",
        "Private Vehicle",
      ],
      required: [true, "Transportation mode is required"],
    },
    hasHealthIssues: {
      type: Boolean,
      default: false,
    },
    healthDetails: {
      type: String,
    },
    hasBehavioralIssues: {
      type: Boolean,
      default: false,
    },
    behavioralDetails: {
      type: String,
    },
    hasFamilyProblems: {
      type: Boolean,
      default: false,
    },
    familyProblemDetails: {
      type: String,
    },
    hasEconomicDistress: {
      type: Boolean,
      default: false,
    },
    economicDistressDetails: {
      type: String,
    },
    previousDropoutAttempts: {
      type: Number,
      default: 0,
    },

    // Risk Score (Auto-calculated by ML)
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
    },
    riskFactors: {
      attendance: { type: Number, default: 0 },
      academic: { type: Number, default: 0 },
      financial: { type: Number, default: 0 },
      behavioral: { type: Number, default: 0 },
      health: { type: Number, default: 0 },
      distance: { type: Number, default: 0 },
      family: { type: Number, default: 0 },
    },
    predictedDropoutDate: {
      type: Date,
    },
    dropoutProbability: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Status
    status: {
      type: String,
      enum: [
        "Active",
        "At Risk",
        "Intervention",
        "Dropout",
        "Transferred",
        "Graduated",
      ],
      default: "Active",
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Intervention Tracking
    hasActiveIntervention: {
      type: Boolean,
      default: false,
    },
    interventionCount: {
      type: Number,
      default: 0,
    },
    successfulInterventions: {
      type: Number,
      default: 0,
    },

    // Additional Notes
    remarks: {
      type: String,
    },
    extracurricularActivities: [
      {
        type: String,
      },
    ],
    achievements: [
      {
        title: String,
        description: String,
        date: Date,
      },
    ],

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

// Virtual for full name
studentSchema.virtual("fullName").get(function () {
  return this.middleName
    ? `${this.firstName} ${this.middleName} ${this.lastName}`
    : `${this.firstName} ${this.lastName}`;
});

// Virtual for age
studentSchema.virtual("age").get(function () {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
});

// Virtual for risk color coding
studentSchema.virtual("riskColor").get(function () {
  switch (this.riskLevel) {
    case "Low":
      return "#10B981"; // Green
    case "Medium":
      return "#F59E0B"; // Yellow
    case "High":
      return "#EF4444"; // Red
    case "Critical":
      return "#7C3AED"; // Purple
    default:
      return "#6B7280"; // Gray
  }
});

// Virtual for primary contact
studentSchema.virtual("primaryContact").get(function () {
  return {
    name: this.father.name,
    phone: this.father.phone,
    email: this.father.email,
    relation: "Father",
  };
});

// Indexes for performance (rollNumber and admissionNumber already have unique indexes)
studentSchema.index({ class: 1, section: 1 });
studentSchema.index({ riskLevel: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ "father.phone": 1 });
studentSchema.index({ "mother.phone": 1 });
studentSchema.index({ riskScore: -1 });

// Text index for search
studentSchema.index({
  firstName: "text",
  lastName: "text",
  rollNumber: "text",
  admissionNumber: "text",
});

// Pre-save middleware to update risk level based on risk score
studentSchema.pre("save", function () {
  if (this.isModified("riskScore")) {
    if (this.riskScore < 30) {
      this.riskLevel = "Low";
      this.status = "Active";
    } else if (this.riskScore < 60) {
      this.riskLevel = "Medium";
      this.status = "At Risk";
    } else if (this.riskScore < 80) {
      this.riskLevel = "High";
      this.status = "At Risk";
    } else {
      this.riskLevel = "Critical";
      this.status = "At Risk";
    }
  }
});

const Student = mongoose.model("Student", studentSchema);

export default Student;
