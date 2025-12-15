import mongoose from "mongoose";

const riskFactorSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
    },

    // Risk Calculation Date
    calculatedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
    },

    // Overall Risk Score (0-100)
    totalRiskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      required: true,
    },

    // Individual Risk Factor Scores (0-100 each)
    attendanceRisk: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      weight: {
        type: Number,
        default: 0.25, // 25%
      },
      details: {
        attendancePercentage: Number,
        consecutiveAbsences: Number,
        lateComingCount: Number,
        level: {
          type: String,
          enum: ["Excellent", "Good", "Fair", "Poor", "Critical"],
        },
      },
    },

    academicRisk: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      weight: {
        type: Number,
        default: 0.25, // 25%
      },
      details: {
        overallPercentage: Number,
        failedSubjects: Number,
        trend: {
          type: String,
          enum: ["Improving", "Stable", "Declining", "Unknown"],
        },
        level: {
          type: String,
          enum: ["Excellent", "Good", "Fair", "Poor", "Critical"],
        },
      },
    },

    financialRisk: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      weight: {
        type: Number,
        default: 0.15, // 15%
      },
      details: {
        incomeLevel: {
          type: String,
          enum: [
            "Below Poverty Line",
            "Low Income",
            "Middle Income",
            "High Income",
          ],
        },
        hasEconomicDistress: Boolean,
        parentEducationLevel: String,
      },
    },

    behavioralRisk: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      weight: {
        type: Number,
        default: 0.1, // 10%
      },
      details: {
        hasBehavioralIssues: Boolean,
        behavioralDetails: String,
        lateComingFrequency: Number,
        previousDropoutAttempts: Number,
      },
    },

    healthRisk: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      weight: {
        type: Number,
        default: 0.1, // 10%
      },
      details: {
        hasHealthIssues: Boolean,
        healthDetails: String,
        impactsAttendance: Boolean,
      },
    },

    distanceRisk: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      weight: {
        type: Number,
        default: 0.1, // 10%
      },
      details: {
        distance: Number, // in km
        transportMode: {
          type: String,
          enum: [
            "Walk",
            "Bicycle",
            "School Bus",
            "Public Transport",
            "Private Vehicle",
          ],
        },
        transportationChallenges: Boolean,
      },
    },

    familyRisk: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      weight: {
        type: Number,
        default: 0.05, // 5%
      },
      details: {
        hasFamilyProblems: Boolean,
        familyProblemDetails: String,
        siblingsCount: Number,
        parentSupport: {
          type: String,
          enum: ["High", "Medium", "Low", "None"],
        },
      },
    },

    // Prediction Results
    dropoutPrediction: {
      probability: {
        type: Number,
        min: 0,
        max: 100,
      },
      timeline: {
        type: String,
        enum: ["1-3 months", "3-6 months", "6-12 months", "Low risk"],
      },
      urgency: {
        type: String,
        enum: ["Low", "Medium", "High", "Critical"],
      },
    },

    // AI/ML Model Information
    modelVersion: {
      type: String,
      default: "1.0",
    },
    modelAccuracy: {
      type: Number,
      min: 0,
      max: 100,
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Recommendations Generated
    recommendations: [
      {
        priority: {
          type: String,
          enum: ["Low", "Medium", "High", "Critical"],
        },
        category: {
          type: String,
          enum: [
            "Attendance",
            "Academic",
            "Financial",
            "Behavioral",
            "Health",
            "Family",
            "Transportation",
          ],
        },
        action: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        estimatedImpact: {
          type: String,
          enum: ["Low", "Medium", "High"],
        },
        implementationDifficulty: {
          type: String,
          enum: ["Easy", "Medium", "Hard"],
        },
      },
    ],

    // Historical Comparison
    previousRiskScore: Number,
    riskTrend: {
      type: String,
      enum: ["Improving", "Stable", "Worsening"],
    },
    changeFromPrevious: Number, // Percentage change

    // Intervention Impact
    activeInterventions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Intervention",
      },
    ],
    interventionImpact: {
      type: String,
      enum: ["Positive", "Neutral", "Negative", "Unknown"],
      default: "Unknown",
    },

    // Validation and Quality
    isValidated: {
      type: Boolean,
      default: false,
    },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    validatedAt: Date,
    validationNotes: String,

    // Data Quality Indicators
    dataCompleteness: {
      type: Number,
      min: 0,
      max: 100,
    },
    dataQualityScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    missingDataFields: [String],

    // Metadata
    calculatedBy: {
      type: String,
      enum: ["System", "Manual", "ML Model"],
      default: "System",
    },
    calculationMethod: {
      type: String,
      default: "Weighted Average",
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
riskFactorSchema.index({ student: 1, calculatedAt: -1 });
riskFactorSchema.index({ riskLevel: 1 });
riskFactorSchema.index({ totalRiskScore: -1 });
riskFactorSchema.index({ academicYear: 1 });
riskFactorSchema.index({ "dropoutPrediction.urgency": 1 });

// Static method to get latest risk assessment for student
riskFactorSchema.statics.getLatestRisk = async function (studentId) {
  return await this.findOne({ student: studentId })
    .sort({ calculatedAt: -1 })
    .populate("student", "firstName lastName rollNumber");
};

// Static method to get risk trend for student
riskFactorSchema.statics.getRiskTrend = async function (studentId, months = 6) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  return await this.find({
    student: studentId,
    calculatedAt: { $gte: startDate, $lte: endDate },
  })
    .sort({ calculatedAt: 1 })
    .select("totalRiskScore riskLevel calculatedAt");
};

// Static method to get high-risk students
riskFactorSchema.statics.getHighRiskStudents = async function (limit = 50) {
  // Get latest risk assessment for each student
  const pipeline = [
    {
      $sort: { student: 1, calculatedAt: -1 },
    },
    {
      $group: {
        _id: "$student",
        latestRisk: { $first: "$$ROOT" },
      },
    },
    {
      $replaceRoot: { newRoot: "$latestRisk" },
    },
    {
      $match: {
        riskLevel: { $in: ["High", "Critical"] },
      },
    },
    {
      $sort: { totalRiskScore: -1 },
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from: "students",
        localField: "student",
        foreignField: "_id",
        as: "studentInfo",
      },
    },
    {
      $unwind: "$studentInfo",
    },
  ];

  return await this.aggregate(pipeline);
};

// Static method to get risk distribution
riskFactorSchema.statics.getRiskDistribution = async function () {
  const pipeline = [
    {
      $sort: { student: 1, calculatedAt: -1 },
    },
    {
      $group: {
        _id: "$student",
        latestRisk: { $first: "$$ROOT" },
      },
    },
    {
      $replaceRoot: { newRoot: "$latestRisk" },
    },
    {
      $group: {
        _id: "$riskLevel",
        count: { $sum: 1 },
        averageScore: { $avg: "$totalRiskScore" },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ];

  return await this.aggregate(pipeline);
};

// Method to generate risk summary
riskFactorSchema.methods.getRiskSummary = function () {
  const factors = [
    { name: "Attendance", score: this.attendanceRisk.score, weight: this.attendanceRisk.weight },
    { name: "Academic", score: this.academicRisk.score, weight: this.academicRisk.weight },
    { name: "Financial", score: this.financialRisk.score, weight: this.financialRisk.weight },
    { name: "Behavioral", score: this.behavioralRisk.score, weight: this.behavioralRisk.weight },
    { name: "Health", score: this.healthRisk.score, weight: this.healthRisk.weight },
    { name: "Distance", score: this.distanceRisk.score, weight: this.distanceRisk.weight },
    { name: "Family", score: this.familyRisk.score, weight: this.familyRisk.weight },
  ];

  // Sort by contribution to total risk
  factors.forEach(factor => {
    factor.contribution = (factor.score * factor.weight).toFixed(2);
  });

  factors.sort((a, b) => b.contribution - a.contribution);

  return {
    totalScore: this.totalRiskScore,
    level: this.riskLevel,
    topRiskFactors: factors.slice(0, 3),
    allFactors: factors,
    prediction: this.dropoutPrediction,
    recommendations: this.recommendations.filter(r => r.priority === "High" || r.priority === "Critical"),
  };
};

const RiskFactor = mongoose.model("RiskFactor", riskFactorSchema);

export default RiskFactor;