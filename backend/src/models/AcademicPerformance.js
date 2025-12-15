import mongoose from "mongoose";

const academicPerformanceSchema = new mongoose.Schema(
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
    examType: {
      type: String,
      enum: [
        "Monthly Test",
        "Unit Test",
        "Mid Term",
        "Final Exam",
        "Assignment",
        "Project",
        "Quiz",
        "Practical"
      ],
      required: [true, "Exam type is required"],
    },
    examDate: {
      type: Date,
      required: [true, "Exam date is required"],
    },
    subjects: [{
      name: {
        type: String,
        required: true,
      },
      maxMarks: {
        type: Number,
        required: true,
        min: 1,
      },
      obtainedMarks: {
        type: Number,
        required: true,
        min: 0,
      },
      percentage: {
        type: Number,
        min: 0,
        max: 100,
      },
      grade: {
        type: String,
        enum: ["A+", "A", "B+", "B", "C+", "C", "D", "F"],
      },
      isPassing: {
        type: Boolean,
        default: true,
      },
    }],
    overallMarks: {
      total: {
        type: Number,
        required: true,
      },
      obtained: {
        type: Number,
        required: true,
      },
      percentage: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    overallGrade: {
      type: String,
      enum: ["A+", "A", "B+", "B", "C+", "C", "D", "F"],
    },
    rank: {
      type: Number,
      min: 1,
    },
    totalStudents: {
      type: Number,
      min: 1,
    },
    remarks: {
      type: String,
      maxlength: 500,
    },
    // Performance indicators
    isImprovement: {
      type: Boolean,
      default: null, // null for first entry
    },
    improvementPercentage: {
      type: Number, // Positive for improvement, negative for decline
    },
    failedSubjects: [{
      type: String,
    }],
    // Flags for risk assessment
    isAtRisk: {
      type: Boolean,
      default: false,
    },
    riskFactors: [{
      type: String,
      enum: [
        "Multiple Failures",
        "Declining Trend",
        "Below Average",
        "Poor Attendance Impact",
        "Behavioral Issues"
      ],
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
academicPerformanceSchema.index({ student: 1, examDate: -1 });
academicPerformanceSchema.index({ teacher: 1, examDate: -1 });
academicPerformanceSchema.index({ class: 1, examDate: -1 });
academicPerformanceSchema.index({ examType: 1 });
academicPerformanceSchema.index({ "overallMarks.percentage": -1 });

// Virtual for performance trend
academicPerformanceSchema.virtual("trend").get(function () {
  if (this.isImprovement === null) return "First Entry";
  if (this.isImprovement) return "Improving";
  return "Declining";
});

// Static method to get student performance summary
academicPerformanceSchema.statics.getStudentSummary = async function (studentId, months = 6) {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const pipeline = [
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          examDate: { $gte: startDate },
        },
      },
      {
        $sort: { examDate: -1 },
      },
      {
        $group: {
          _id: null,
          totalExams: { $sum: 1 },
          averagePercentage: { $avg: "$overallMarks.percentage" },
          bestPercentage: { $max: "$overallMarks.percentage" },
          worstPercentage: { $min: "$overallMarks.percentage" },
          recentExams: { $push: "$$ROOT" },
          failedExamsCount: {
            $sum: {
              $cond: [{ $lt: ["$overallMarks.percentage", 40] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalExams: 1,
          averagePercentage: { $round: ["$averagePercentage", 2] },
          bestPercentage: 1,
          worstPercentage: 1,
          failedExamsCount: 1,
          recentExams: { $slice: ["$recentExams", 5] },
          passingRate: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ["$totalExams", "$failedExamsCount"] },
                      "$totalExams",
                    ],
                  },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
    ];

    const result = await this.aggregate(pipeline);
    return result[0] || {
      totalExams: 0,
      averagePercentage: 0,
      bestPercentage: 0,
      worstPercentage: 0,
      failedExamsCount: 0,
      recentExams: [],
      passingRate: 0,
    };
  } catch (error) {
    throw new Error(`Error getting student performance summary: ${error.message}`);
  }
};

// Static method to get class performance
academicPerformanceSchema.statics.getClassPerformance = async function (className, examType, examDate) {
  try {
    const startOfDay = new Date(examDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(examDate);
    endOfDay.setHours(23, 59, 59, 999);

    const pipeline = [
      {
        $match: {
          class: className,
          examType: examType,
          examDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
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
      {
        $project: {
          student: "$studentInfo",
          overallMarks: 1,
          overallGrade: 1,
          rank: 1,
          subjects: 1,
          failedSubjects: 1,
          isAtRisk: 1,
        },
      },
      {
        $sort: { "overallMarks.percentage": -1 },
      },
    ];

    return await this.aggregate(pipeline);
  } catch (error) {
    throw new Error(`Error getting class performance: ${error.message}`);
  }
};

// Static method to get performance trends
academicPerformanceSchema.statics.getPerformanceTrends = async function (studentId, months = 12) {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return await this.find({
      student: studentId,
      examDate: { $gte: startDate },
    })
      .select("examType examDate overallMarks overallGrade isImprovement")
      .sort({ examDate: 1 });
  } catch (error) {
    throw new Error(`Error getting performance trends: ${error.message}`);
  }
};

// Pre-save middleware to calculate grades and improvements
academicPerformanceSchema.pre("save", async function (next) {
  // Calculate subject percentages and grades
  this.subjects.forEach(subject => {
    subject.percentage = Math.round((subject.obtainedMarks / subject.maxMarks) * 100);
    subject.isPassing = subject.percentage >= 40;
    
    // Assign grade based on percentage
    if (subject.percentage >= 90) subject.grade = "A+";
    else if (subject.percentage >= 80) subject.grade = "A";
    else if (subject.percentage >= 70) subject.grade = "B+";
    else if (subject.percentage >= 60) subject.grade = "B";
    else if (subject.percentage >= 50) subject.grade = "C+";
    else if (subject.percentage >= 40) subject.grade = "C";
    else if (subject.percentage >= 33) subject.grade = "D";
    else subject.grade = "F";
  });

  // Calculate overall percentage
  this.overallMarks.percentage = Math.round(
    (this.overallMarks.obtained / this.overallMarks.total) * 100
  );

  // Assign overall grade
  const percentage = this.overallMarks.percentage;
  if (percentage >= 90) this.overallGrade = "A+";
  else if (percentage >= 80) this.overallGrade = "A";
  else if (percentage >= 70) this.overallGrade = "B+";
  else if (percentage >= 60) this.overallGrade = "B";
  else if (percentage >= 50) this.overallGrade = "C+";
  else if (percentage >= 40) this.overallGrade = "C";
  else if (percentage >= 33) this.overallGrade = "D";
  else this.overallGrade = "F";

  // Identify failed subjects
  this.failedSubjects = this.subjects
    .filter(subject => !subject.isPassing)
    .map(subject => subject.name);

  // Check for improvement (compare with previous performance)
  if (!this.isNew) {
    const previousPerformance = await this.constructor
      .findOne({
        student: this.student,
        examDate: { $lt: this.examDate },
      })
      .sort({ examDate: -1 });

    if (previousPerformance) {
      const currentPercentage = this.overallMarks.percentage;
      const previousPercentage = previousPerformance.overallMarks.percentage;
      
      this.improvementPercentage = Math.round(
        ((currentPercentage - previousPercentage) / previousPercentage) * 100
      );
      
      this.isImprovement = currentPercentage > previousPercentage;
    }
  }

  // Determine risk factors
  this.riskFactors = [];
  if (this.failedSubjects.length >= 2) {
    this.riskFactors.push("Multiple Failures");
  }
  if (this.overallMarks.percentage < 50) {
    this.riskFactors.push("Below Average");
  }
  if (this.isImprovement === false && this.improvementPercentage < -10) {
    this.riskFactors.push("Declining Trend");
  }

  this.isAtRisk = this.riskFactors.length > 0;
});

// Post-save middleware to update student academic metrics
academicPerformanceSchema.post("save", async function () {
  try {
    const Student = mongoose.model("Student");
    
    // Get recent performance summary
    const summary = await this.constructor.getStudentSummary(this.student, 6);
    
    // Update student record
    await Student.findByIdAndUpdate(this.student, {
      overallPercentage: summary.averagePercentage,
      failedSubjectsCount: this.failedSubjects.length,
      academicTrend: this.isImprovement === null ? "Unknown" : 
                    this.isImprovement ? "Improving" : "Declining",
    });
  } catch (error) {
    console.error("Error updating student academic metrics:", error);
  }
});

const AcademicPerformance = mongoose.model("AcademicPerformance", academicPerformanceSchema);

export default AcademicPerformance;