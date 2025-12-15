import Grade from "../models/Grade.js";
import Student from "../models/Student.js";
import Class from "../models/Class.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { calculateRiskScore } from "../services/riskCalculator.js";
import { createNotification } from "../services/notificationService.js";
import logger from "../utils/logger.js";

// @desc    Create/Enter grades for students
// @route   POST /api/v1/grades
// @access  Private (Teacher, Admin)
export const createGrades = asyncHandler(async (req, res, next) => {
  const {
    classId,
    examName,
    examType,
    examDate,
    term,
    subject,
    subjectCode,
    maxMarks,
    passingMarks,
    grades,
  } = req.body;
  // grades: [{ studentId, marksObtained, remarks, teacherComments }]

  if (
    !classId ||
    !examName ||
    !examType ||
    !subject ||
    !grades ||
    !Array.isArray(grades)
  ) {
    return next(new AppError("All required fields must be provided", 400));
  }

  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    return next(new AppError("Class not found", 404));
  }

  const academicYear = "2024-2025"; // Make this dynamic
  const results = {
    successful: [],
    failed: [],
  };

  for (const gradeData of grades) {
    try {
      const {
        studentId,
        marksObtained,
        remarks,
        teacherComments,
        wasPresent = true,
      } = gradeData;

      // Check if grade already exists
      const existing = await Grade.findOne({
        student: studentId,
        class: classId,
        examName,
        subject,
        academicYear,
      });

      if (existing) {
        // Update existing grade
        existing.marksObtained = marksObtained;
        existing.remarks = remarks;
        existing.teacherComments = teacherComments;
        existing.wasPresent = wasPresent;
        existing.evaluatedBy = req.user._id;

        await existing.save();
        results.successful.push({
          studentId,
          action: "updated",
          gradeId: existing._id,
        });
      } else {
        // Create new grade
        const grade = await Grade.create({
          student: studentId,
          class: classId,
          academicYear,
          examType,
          examName,
          examDate: examDate || new Date(),
          term,
          subject,
          subjectCode,
          marksObtained,
          maxMarks: maxMarks || 100,
          passingMarks: passingMarks || 33,
          remarks,
          teacherComments,
          wasPresent,
          evaluatedBy: req.user._id,
          isPublished: false,
        });

        results.successful.push({
          studentId,
          action: "created",
          gradeId: grade._id,
        });
      }

      // Update student academic metrics
      await updateStudentAcademicMetrics(studentId, academicYear);
    } catch (error) {
      logger.error("Grade entry error:", error);
      results.failed.push({
        studentId: gradeData.studentId,
        error: error.message,
      });
    }
  }

  logger.info(
    `Grades entered for ${subject} - ${examName} by ${req.user.email}`
  );

  res.status(201).json({
    status: "success",
    message: "Grades entered successfully",
    data: {
      results,
      summary: {
        total: grades.length,
        successful: results.successful.length,
        failed: results.failed.length,
      },
    },
  });
});

// @desc    Get grades for a student
// @route   GET /api/v1/grades/student/:studentId
// @access  Private
export const getStudentGrades = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;
  const { academicYear = "2024-2025", term, subject, examType } = req.query;

  const query = {
    student: studentId,
    academicYear,
    isPublished: true,
  };

  if (term) query.term = term;
  if (subject) query.subject = subject;
  if (examType) query.examType = examType;

  const grades = await Grade.find(query)
    .sort({ examDate: -1 })
    .populate("evaluatedBy", "firstName lastName")
    .lean();

  // Get subject-wise performance
  const subjectPerformance = await Grade.getSubjectPerformance(
    studentId,
    academicYear
  );

  res.status(200).json({
    status: "success",
    results: grades.length,
    data: {
      grades,
      subjectPerformance,
    },
  });
});

// @desc    Get class grades for an exam
// @route   GET /api/v1/grades/class/:classId/exam/:examName
// @access  Private (Teacher, Admin)
export const getClassGrades = asyncHandler(async (req, res, next) => {
  const { classId, examName } = req.params;
  const { subject } = req.query;

  const query = {
    class: classId,
    examName,
  };

  if (subject) query.subject = subject;

  const grades = await Grade.find(query)
    .populate("student", "firstName lastName rollNumber photo")
    .sort({ percentage: -1 })
    .lean();

  // Calculate class statistics
  if (subject) {
    const classAverage = await Grade.getClassAverage(
      classId,
      examName,
      subject
    );

    return res.status(200).json({
      status: "success",
      results: grades.length,
      data: {
        grades,
        classAverage,
      },
    });
  }

  res.status(200).json({
    status: "success",
    results: grades.length,
    data: {
      grades,
    },
  });
});

// @desc    Update grade
// @route   PUT /api/v1/grades/:id
// @access  Private (Teacher, Admin)
export const updateGrade = asyncHandler(async (req, res, next) => {
  let grade = await Grade.findById(req.params.id);

  if (!grade) {
    return next(new AppError("Grade not found", 404));
  }

  const { marksObtained, remarks, teacherComments, isPublished } = req.body;

  if (marksObtained !== undefined) grade.marksObtained = marksObtained;
  if (remarks !== undefined) grade.remarks = remarks;
  if (teacherComments !== undefined) grade.teacherComments = teacherComments;
  if (isPublished !== undefined) grade.isPublished = isPublished;

  if (isPublished && !grade.publishedAt) {
    grade.publishedAt = new Date();
  }

  await grade.save();

  // Update student metrics
  await updateStudentAcademicMetrics(grade.student, grade.academicYear);

  logger.info(`Grade updated: ${grade._id} by ${req.user.email}`);

  res.status(200).json({
    status: "success",
    message: "Grade updated successfully",
    data: {
      grade,
    },
  });
});

// @desc    Publish grades (make visible to students/parents)
// @route   PUT /api/v1/grades/publish
// @access  Private (Teacher, Admin)
export const publishGrades = asyncHandler(async (req, res, next) => {
  const { gradeIds } = req.body;

  if (!gradeIds || !Array.isArray(gradeIds)) {
    return next(new AppError("Grade IDs array is required", 400));
  }

  const result = await Grade.updateMany(
    { _id: { $in: gradeIds } },
    {
      isPublished: true,
      publishedAt: new Date(),
    }
  );

  // Send notifications to parents
  const grades = await Grade.find({ _id: { $in: gradeIds } })
    .populate("student")
    .lean();

  for (const grade of grades) {
    // Send notification (implement based on your needs)
    // await sendGradeNotification(grade);
  }

  logger.info(`${result.modifiedCount} grades published by ${req.user.email}`);

  res.status(200).json({
    status: "success",
    message: `${result.modifiedCount} grades published successfully`,
    data: {
      published: result.modifiedCount,
    },
  });
});

// @desc    Get failed subjects for a student
// @route   GET /api/v1/grades/student/:studentId/failed
// @access  Private
export const getFailedSubjects = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;
  const { academicYear = "2024-2025" } = req.query;

  const failedSubjects = await Grade.getFailedSubjects(studentId, academicYear);

  res.status(200).json({
    status: "success",
    results: failedSubjects.length,
    data: {
      failedSubjects,
    },
  });
});

// @desc    Get grade statistics
// @route   GET /api/v1/grades/statistics
// @access  Private (Admin, Teacher)
export const getGradeStatistics = asyncHandler(async (req, res, next) => {
  const { classId, academicYear = "2024-2025", subject } = req.query;

  const matchStage = { academicYear, isPublished: true };
  if (classId) matchStage.class = classId;
  if (subject) matchStage.subject = subject;

  // Overall statistics
  const statistics = await Grade.aggregate([
    { $match: matchStage },
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
        failedStudents: {
          $sum: { $cond: ["$isPassed", 0, 1] },
        },
      },
    },
  ]);

  // Grade distribution
  const gradeDistribution = await Grade.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$grade",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      statistics: statistics[0] || {},
      gradeDistribution,
    },
  });
});

// @desc    Calculate rankings
// @route   GET /api/v1/grades/rankings
// @access  Private (Admin, Teacher)
export const calculateRankings = asyncHandler(async (req, res, next) => {
  const { classId, examName, academicYear = "2024-2025" } = req.query;

  if (!classId || !examName) {
    return next(new AppError("Class ID and exam name are required", 400));
  }

  // Get all students' total marks for the exam
  const results = await Grade.aggregate([
    {
      $match: {
        class: classId,
        examName,
        academicYear,
        isPublished: true,
      },
    },
    {
      $group: {
        _id: "$student",
        totalMarks: { $sum: "$marksObtained" },
        totalMaxMarks: { $sum: "$maxMarks" },
        subjects: { $sum: 1 },
      },
    },
    {
      $addFields: {
        percentage: {
          $multiply: [{ $divide: ["$totalMarks", "$totalMaxMarks"] }, 100],
        },
      },
    },
    { $sort: { percentage: -1 } },
  ]);

  // Assign ranks
  results.forEach((result, index) => {
    result.rank = index + 1;
  });

  // Populate student details
  await Grade.populate(results, {
    path: "_id",
    select: "firstName lastName rollNumber photo",
  });

  res.status(200).json({
    status: "success",
    results: results.length,
    data: {
      rankings: results,
    },
  });
});

// Helper function to update student academic metrics
const updateStudentAcademicMetrics = async (studentId, academicYear) => {
  try {
    const student = await Student.findById(studentId);
    if (!student) return;

    // Get all published grades for the academic year
    const grades = await Grade.find({
      student: studentId,
      academicYear,
      isPublished: true,
    });

    if (grades.length === 0) return;

    // Calculate overall percentage
    const totalMarks = grades.reduce((sum, g) => sum + g.marksObtained, 0);
    const totalMaxMarks = grades.reduce((sum, g) => sum + g.maxMarks, 0);
    student.overallPercentage = ((totalMarks / totalMaxMarks) * 100).toFixed(2);

    // Count failed subjects
    student.failedSubjectsCount = grades.filter((g) => !g.isPassed).length;

    // Determine academic trend (simple logic - can be improved)
    const recentGrades = grades.slice(-5); // Last 5 grades
    if (recentGrades.length >= 3) {
      const avgRecent =
        recentGrades.reduce((sum, g) => sum + g.percentage, 0) /
        recentGrades.length;
      const avgOlder =
        grades.slice(0, -5).reduce((sum, g) => sum + g.percentage, 0) /
          (grades.length - 5) || avgRecent;

      if (avgRecent > avgOlder + 5) {
        student.academicTrend = "Improving";
      } else if (avgRecent < avgOlder - 5) {
        student.academicTrend = "Declining";
      } else {
        student.academicTrend = "Stable";
      }
    }

    await student.save();

    // Recalculate risk score
    await calculateRiskScore(studentId);
  } catch (error) {
    logger.error("Error updating student academic metrics:", error);
  }
};

export default {
  createGrades,
  getStudentGrades,
  getClassGrades,
  updateGrade,
  publishGrades,
  getFailedSubjects,
  getGradeStatistics,
  calculateRankings,
};
