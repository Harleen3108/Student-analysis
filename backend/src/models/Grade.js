import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class reference is required"],
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
    },

    // Exam Information
    examType: {
      type: String,
      enum: [
        "Unit Test",
        "Monthly Test",
        "Mid Term",
        "Final",
        "Quarterly",
        "Half Yearly",
        "Annual",
        "Assignment",
        "Project",
        "Other",
      ],
      required: [true, "Exam type is required"],
    },
    examName: {
      type: String,
      required: [true, "Exam name is required"],
      trim: true,
    },
    examDate: {
      type: Date,
      required: [true, "Exam date is required"],
    },
    term: {
      type: String,
      enum: ["Term 1", "Term 2", "Term 3"],
      required: [true, "Term is required"],
    },

    // Subject and Marks
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    subjectCode: {
      type: String,
      uppercase: true,
      trim: true,
    },
    marksObtained: {
      type: Number,
      required: [true, "Marks obtained is required"],
      min: 0,
    },
    maxMarks: {
      type: Number,
      required: [true, "Maximum marks is required"],
      min: 1,
    },
    passingMarks: {
      type: Number,
      required: [true, "Passing marks is required"],
    },

    // Calculated Fields
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
      enum: ["A+", "A", "B+", "B", "C+", "C", "D", "E", "F"],
      default: "F",
    },
    isPassed: {
      type: Boolean,
      default: false,
    },

    // Additional Details
    remarks: {
      type: String,
      trim: true,
    },
    teacherComments: {
      type: String,
      trim: true,
    },

    // Teacher Information
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Evaluated by is required"],
    },

    // Attendance during exam
    wasPresent: {
      type: Boolean,
      default: true,
    },

    // Rank in class
    rankInClass: {
      type: Number,
    },
    totalStudents: {
      type: Number,
    },

    // Comparison with previous performance
    improvementFromLast: {
      type: Number, // Percentage change
    },

    // Status
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
gradeSchema.index({ student: 1, examType: 1, subject: 1, academicYear: 1 });
gradeSchema.index({ class: 1, examName: 1 });
gradeSchema.index({ academicYear: 1, term: 1 });
gradeSchema.index({ subject: 1 });
gradeSchema.index({ percentage: -1 });

// Pre-save middleware to calculate percentage and grade
gradeSchema.pre("save", function (next) {
  // Calculate percentage
  this.percentage = ((this.marksObtained / this.maxMarks) * 100).toFixed(2);

  // Determine if passed
  this.isPassed = this.marksObtained >= this.passingMarks;

  // Calculate grade
  const percentage = this.percentage;
  if (percentage >= 90) {
    this.grade = "A+";
  } else if (percentage >= 80) {
    this.grade = "A";
  } else if (percentage >= 70) {
    this.grade = "B+";
  } else if (percentage >= 60) {
    this.grade = "B";
  } else if (percentage >= 50) {
    this.grade = "C+";
  } else if (percentage >= 40) {
    this.grade = "C";
  } else if (percentage >= 33) {
    this.grade = "D";
  } else if (percentage >= 25) {
    this.grade = "E";
  } else {
    this.grade = "F";
  }

  next();
});

// Static method to get student's subject-wise performance
gradeSchema.statics.getSubjectPerformance = async function (
  studentId,
  academicYear
) {
  return await this.aggregate([
    {
      $match: {
        student: mongoose.Types.ObjectId(studentId),
        academicYear,
        isPublished: true,
      },
    },
    {
      $group: {
        _id: "$subject",
        averagePercentage: { $avg: "$percentage" },
        totalExams: { $sum: 1 },
        passedExams: {
          $sum: { $cond: ["$isPassed", 1, 0] },
        },
        highestMarks: { $max: "$marksObtained" },
        lowestMarks: { $min: "$marksObtained" },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);
};

// Static method to get class average for an exam
gradeSchema.statics.getClassAverage = async function (
  classId,
  examName,
  subject
) {
  const result = await this.aggregate([
    {
      $match: {
        class: mongoose.Types.ObjectId(classId),
        examName,
        subject,
        isPublished: true,
      },
    },
    {
      $group: {
        _id: null,
        averagePercentage: { $avg: "$percentage" },
        highestMarks: { $max: "$marksObtained" },
        lowestMarks: { $min: "$marksObtained" },
        totalStudents: { $sum: 1 },
        passedStudents: {
          $sum: { $cond: ["$isPassed", 1, 0] },
        },
      },
    },
  ]);

  return result[0] || null;
};

// Static method to get failed subjects for a student
gradeSchema.statics.getFailedSubjects = async function (
  studentId,
  academicYear
) {
  return await this.find({
    student: studentId,
    academicYear,
    isPassed: false,
    isPublished: true,
  }).select("subject examName marksObtained passingMarks percentage");
};

const Grade = mongoose.model("Grade", gradeSchema);

export default Grade;
