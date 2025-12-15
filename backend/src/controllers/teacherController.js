import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import AcademicPerformance from '../models/AcademicPerformance.js';
import TeacherObservation from '../models/TeacherObservation.js';
import Communication from '../models/Communication.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { calculateRiskScore } from '../services/riskCalculator.js';
import {
  notifyObservationCreated,
  notifyGradesSubmitted,
  notifyAttendanceMarked,
  notifyHighAbsenceRate,
  notifyObservationUpdated,
  notifyCriticalObservation
} from '../utils/adminNotifications.js';

// Get teacher dashboard data
export const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const teacherEmail = req.user.email;
    
    logger.info(`📊 Dashboard request from teacher: ${teacherEmail} (ID: ${teacherId})`);
    
    // Get teacher details from cache or database
    const teacher = await User.findById(teacherId).select('assignedClasses role email').lean();
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    const assignedClasses = teacher.assignedClasses || [];
    
    // If no classes assigned, return empty dashboard quickly
    if (assignedClasses.length === 0) {
      return res.json({
        success: true,
        data: {
          assignedClasses: [],
          alerts: [],
          summary: {
            totalStudents: 0,
            atRiskStudents: 0,
            averageAttendance: 100,
            averagePerformance: 0
          }
        }
      });
    }

    // Single optimized query with minimal fields
    const allStudents = await Student.find({ 
      section: { $in: assignedClasses },
      isActive: { $ne: false }
    })
    .select('firstName lastName rollNumber section riskLevel attendancePercentage overallPercentage')
    .lean();

    logger.info(`✅ Found ${allStudents.length} students`);

    // Process data in memory (much faster than multiple DB queries)
    const classData = assignedClasses.map(className => {
      const studentsInClass = allStudents.filter(s => s.section === className);
      const totalStudents = studentsInClass.length;
      const atRiskStudents = studentsInClass.filter(s => 
        ['Medium', 'High', 'Critical'].includes(s.riskLevel)
      ).length;
      
      const avgAttendance = totalStudents > 0 
        ? Math.round(studentsInClass.reduce((sum, s) => sum + (s.attendancePercentage || 100), 0) / totalStudents)
        : 100;
      
      const avgPerformance = totalStudents > 0
        ? Math.round(studentsInClass.reduce((sum, s) => sum + (s.overallPercentage || 0), 0) / totalStudents)
        : 0;

      return {
        className,
        totalStudents,
        atRiskStudents,
        averageAttendance: avgAttendance,
        averagePerformance: avgPerformance,
        students: studentsInClass.slice(0, 3).map(s => ({
          _id: s._id.toString(),
          firstName: s.firstName,
          lastName: s.lastName,
          rollNumber: s.rollNumber,
          riskLevel: s.riskLevel
        }))
      };
    });

    // Generate simple alerts from existing data
    const alerts = [];
    const highRiskStudents = allStudents.filter(s => ['High', 'Critical'].includes(s.riskLevel));
    
    if (highRiskStudents.length > 0) {
      alerts.push({
        type: 'risk_increase',
        title: `${highRiskStudents.length} high-risk students need attention`,
        students: highRiskStudents.slice(0, 3).map(student => ({
          name: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber,
          class: student.section,
          observation: `${student.riskLevel} risk level`
        })),
        priority: 'high'
      });
    }

    // Calculate summary
    const summary = {
      totalStudents: allStudents.length,
      atRiskStudents: highRiskStudents.length,
      averageAttendance: allStudents.length > 0
        ? Math.round(allStudents.reduce((sum, s) => sum + (s.attendancePercentage || 100), 0) / allStudents.length)
        : 100,
      averagePerformance: allStudents.length > 0
        ? Math.round(allStudents.reduce((sum, s) => sum + (s.overallPercentage || 0), 0) / allStudents.length)
        : 0
    };

    logger.info(`✅ Dashboard summary: ${summary.totalStudents} students, ${summary.atRiskStudents} at risk`);

    res.json({
      success: true,
      data: {
        assignedClasses: classData,
        alerts,
        summary
      }
    });

  } catch (error) {
    logger.error('❌ Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data'
    });
  }
};

// Get students for a specific class
export const getClassStudents = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { className } = req.params;
    
    logger.info(`📚 Getting students for class: ${className} by teacher: ${teacherId}`);
    
    const teacher = await User.findById(teacherId);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    // Check if teacher is assigned to this class
    if (!teacher.assignedClasses || !teacher.assignedClasses.includes(className)) {
      logger.warn(`⚠️ Teacher ${teacher.email} not assigned to class ${className}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not assigned to this class.'
      });
    }

    const students = await Student.find({ 
      section: className,
      isActive: { $ne: false }
    })
    .select('firstName lastName rollNumber attendancePercentage overallPercentage riskLevel riskScore email phone')
    .sort({ rollNumber: 1 })
    .lean()
    .exec();

    logger.info(`✅ Found ${students.length} students in class ${className}`);

    res.json({
      success: true,
      data: {
        className,
        students: students.map(s => ({
          ...s,
          id: s._id.toString(),
          _id: undefined
        })),
        total: students.length
      }
    });

  } catch (error) {
    logger.error('❌ Error getting class students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load class students',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get at-risk students for teacher
export const getAtRiskStudents = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    logger.info(`⚠️ Getting at-risk students for teacher: ${teacherId}`);
    
    const teacher = await User.findById(teacherId);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    const assignedClasses = teacher.assignedClasses || [];
    
    if (assignedClasses.length === 0) {
      logger.warn(`⚠️ Teacher ${teacher.email} has no assigned classes`);
      return res.json({
        success: true,
        data: {
          students: [],
          total: 0
        }
      });
    }

    // Get at-risk students from assigned classes
    const students = await Student.find({
      section: { $in: assignedClasses },
      riskLevel: { $in: ['Medium', 'High', 'Critical'] },
      isActive: { $ne: false }
    })
    .select('firstName lastName rollNumber section attendancePercentage overallPercentage riskLevel riskScore')
    .sort({ riskScore: -1 })
    .lean()
    .exec();

    logger.info(`✅ Found ${students.length} at-risk students`);

    // Get recent observations for these students
    const studentsWithObservations = await Promise.all(
      students.map(async (student) => {
        try {
          const recentObservations = await TeacherObservation.find({
            student: student._id,
            teacher: teacherId
          })
          .sort({ createdAt: -1 })
          .limit(3)
          .lean()
          .exec();

          return {
            ...student,
            id: student._id.toString(),
            _id: undefined,
            recentObservations: recentObservations.map(obs => ({
              type: obs.observationType,
              title: obs.title,
              severity: obs.severity,
              date: obs.createdAt
            }))
          };
        } catch (obsError) {
          logger.error(`❌ Error fetching observations for student ${student._id}:`, obsError);
          return {
            ...student,
            id: student._id.toString(),
            _id: undefined,
            recentObservations: []
          };
        }
      })
    );

    res.json({
      success: true,
      data: {
        students: studentsWithObservations,
        total: studentsWithObservations.length
      }
    });

  } catch (error) {
    logger.error('❌ Error getting at-risk students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load at-risk students',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get student profile for teacher
export const getStudentProfile = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { studentId } = req.params;
    
    logger.info(`👤 Getting profile for student: ${studentId} by teacher: ${teacherId}`);
    
    const teacher = await User.findById(teacherId);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    const student = await Student.findById(studentId).lean().exec();
    
    if (!student) {
      logger.warn(`⚠️ Student not found: ${studentId}`);
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if teacher has access to this student
    if (!teacher.assignedClasses || !teacher.assignedClasses.includes(student.section)) {
      logger.warn(`⚠️ Teacher ${teacher.email} not authorized for student in class ${student.section}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student not in your assigned classes.'
      });
    }

    // Get attendance summary (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    let attendanceSummary = {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      excusedDays: 0,
      percentage: "100.00"
    };

    try {
      attendanceSummary = await Attendance.getStudentSummary(
        studentId,
        sixMonthsAgo,
        new Date()
      );
    } catch (attError) {
      logger.error('❌ Error fetching attendance summary:', attError);
    }

    // Get attendance trends
    let attendanceTrends = [];
    try {
      attendanceTrends = await Attendance.getAttendanceTrends(studentId, 6);
    } catch (trendError) {
      logger.error('❌ Error fetching attendance trends:', trendError);
    }

    // Get academic performance summary
    let academicSummary = {
      totalExams: 0,
      averagePercentage: 0,
      bestPercentage: 0,
      worstPercentage: 0,
      failedExamsCount: 0,
      passingRate: 0
    };

    try {
      academicSummary = await AcademicPerformance.getStudentSummary(studentId, 6);
    } catch (acadError) {
      logger.error('❌ Error fetching academic summary:', acadError);
    }

    // Get recent academic performance records
    let performanceTrends = [];
    try {
      performanceTrends = await AcademicPerformance.getPerformanceTrends(studentId, 6);
    } catch (perfError) {
      logger.error('❌ Error fetching performance trends:', perfError);
    }

    // Get teacher observations
    let observations = [];
    try {
      observations = await TeacherObservation.find({
        student: studentId,
        teacher: teacherId
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .exec();
    } catch (obsError) {
      logger.error('❌ Error fetching observations:', obsError);
    }

    logger.info(`✅ Successfully retrieved profile for student: ${studentId}`);

    res.json({
      success: true,
      data: {
        student: {
          id: student._id.toString(),
          firstName: student.firstName,
          lastName: student.lastName,
          rollNumber: student.rollNumber,
          section: student.section,
          email: student.email,
          phone: student.phone,
          riskLevel: student.riskLevel,
          riskScore: student.riskScore,
          attendancePercentage: student.attendancePercentage,
          overallPercentage: student.overallPercentage
        },
        attendanceSummary,
        attendanceTrends,
        academicSummary,
        performanceTrends: performanceTrends.map(p => ({
          examType: p.examType,
          examDate: p.examDate,
          percentage: p.overallMarks?.percentage || 0,
          grade: p.overallGrade,
          isImprovement: p.isImprovement
        })),
        observations: observations.map(obs => ({
          id: obs._id.toString(),
          type: obs.observationType,
          title: obs.title,
          description: obs.description,
          severity: obs.severity,
          status: obs.status,
          date: obs.createdAt,
          followUpRequired: obs.followUpRequired,
          followUpDate: obs.followUpDate
        }))
      }
    });

  } catch (error) {
    logger.error('❌ Error getting student profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load student profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};


// Submit academic grades for a class
export const submitAcademicGrades = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { className, subject, examType, examName, examDate, maxMarks, passingMarks, grades } = req.body;

    logger.info(`📝 Submitting grades for ${className} - ${subject} by teacher: ${teacherId}`);

    // Validate required fields
    if (!className || !subject || !examType || !examName || !examDate || !maxMarks || !grades || !Array.isArray(grades)) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Verify teacher has access to this class
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    if (!teacher.assignedClasses || !teacher.assignedClasses.includes(className)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not assigned to this class.'
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    // Process each student's grade
    for (const gradeData of grades) {
      try {
        const { studentId, marksObtained } = gradeData;

        // Verify student exists and is in the class
        const student = await Student.findById(studentId);
        if (!student || student.section !== className) {
          results.failed.push({
            studentId,
            error: 'Student not found or not in this class'
          });
          continue;
        }

        // Calculate percentage and grade
        const percentage = Math.round((marksObtained / maxMarks) * 100);
        let grade;
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B+';
        else if (percentage >= 60) grade = 'B';
        else if (percentage >= 50) grade = 'C+';
        else if (percentage >= 40) grade = 'C';
        else if (percentage >= 33) grade = 'D';
        else grade = 'F';

        const isPassing = marksObtained >= (passingMarks || 40);

        // Create or update academic performance record
        const performanceData = {
          student: studentId,
          teacher: teacherId,
          class: className,
          examType,
          examDate: new Date(examDate),
          subjects: [{
            name: subject,
            maxMarks: parseFloat(maxMarks),
            obtainedMarks: parseFloat(marksObtained),
            percentage,
            grade,
            isPassing
          }],
          overallMarks: {
            total: parseFloat(maxMarks),
            obtained: parseFloat(marksObtained),
            percentage
          },
          overallGrade: grade,
          failedSubjects: isPassing ? [] : [subject]
        };

        // Check if performance record already exists for this exam
        const existingPerformance = await AcademicPerformance.findOne({
          student: studentId,
          class: className,
          examType,
          examDate: {
            $gte: new Date(new Date(examDate).setHours(0, 0, 0, 0)),
            $lte: new Date(new Date(examDate).setHours(23, 59, 59, 999))
          },
          'subjects.name': subject
        });

        let performance;
        if (existingPerformance) {
          // Update existing subject in the performance record
          const subjectIndex = existingPerformance.subjects.findIndex(s => s.name === subject);
          if (subjectIndex >= 0) {
            existingPerformance.subjects[subjectIndex] = performanceData.subjects[0];
          } else {
            existingPerformance.subjects.push(performanceData.subjects[0]);
          }

          // Recalculate overall marks
          const totalMax = existingPerformance.subjects.reduce((sum, s) => sum + s.maxMarks, 0);
          const totalObtained = existingPerformance.subjects.reduce((sum, s) => sum + s.obtainedMarks, 0);
          existingPerformance.overallMarks = {
            total: totalMax,
            obtained: totalObtained,
            percentage: Math.round((totalObtained / totalMax) * 100)
          };

          // Update failed subjects
          existingPerformance.failedSubjects = existingPerformance.subjects
            .filter(s => !s.isPassing)
            .map(s => s.name);

          performance = await existingPerformance.save();
        } else {
          // Create new performance record
          performance = await AcademicPerformance.create(performanceData);
        }

        // Update student's overall percentage (average of all exams)
        const allPerformances = await AcademicPerformance.find({ student: studentId })
          .sort({ examDate: -1 })
          .limit(10)
          .lean();

        if (allPerformances.length > 0) {
          const avgPercentage = Math.round(
            allPerformances.reduce((sum, p) => sum + p.overallMarks.percentage, 0) / allPerformances.length
          );
          student.overallPercentage = avgPercentage;
          await student.save();
        }

        // Recalculate risk score
        try {
          await calculateRiskScore(studentId);
        } catch (riskError) {
          logger.error(`❌ Error calculating risk score for student ${studentId}:`, riskError);
        }

        results.successful.push({
          studentId,
          performanceId: performance._id.toString(),
          percentage,
          grade
        });

      } catch (error) {
        logger.error(`❌ Error processing grade for student ${gradeData.studentId}:`, error);
        results.failed.push({
          studentId: gradeData.studentId,
          error: error.message
        });
      }
    }

    logger.info(`✅ Grades submitted: ${results.successful.length} successful, ${results.failed.length} failed`);

    // Send notification to admins
    if (results.successful.length > 0) {
      try {
        await notifyGradesSubmitted(className, subject, examType, examName, results.successful.length, teacher);
      } catch (notifError) {
        logger.error('Error sending grades notification:', notifError);
      }
    }

    res.json({
      success: true,
      message: `Grades submitted successfully for ${results.successful.length} students`,
      data: {
        results,
        summary: {
          total: grades.length,
          successful: results.successful.length,
          failed: results.failed.length
        }
      }
    });

  } catch (error) {
    logger.error('❌ Error submitting academic grades:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit grades',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};


// Get saved exams for teacher
export const getSavedExams = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    logger.info(`📚 Getting saved exams for teacher: ${teacherId}`);
    
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    const assignedClasses = teacher.assignedClasses || [];
    
    // Get unique exams (grouped by class, subject, examType, examName, examDate)
    const exams = await AcademicPerformance.aggregate([
      {
        $match: {
          teacher: teacher._id,
          class: { $in: assignedClasses }
        }
      },
      {
        $group: {
          _id: {
            class: '$class',
            examType: '$examType',
            examDate: '$examDate'
          },
          examId: { $first: '$_id' },
          subjects: { $addToSet: { $arrayElemAt: ['$subjects.name', 0] } },
          studentsCount: { $sum: 1 },
          avgPercentage: { $avg: '$overallMarks.percentage' },
          createdAt: { $first: '$createdAt' }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 50
      }
    ]);

    const formattedExams = exams.map(exam => ({
      examId: exam.examId.toString(),
      className: exam._id.class,
      examType: exam._id.examType,
      examDate: exam._id.examDate,
      subjects: exam.subjects,
      studentsGraded: exam.studentsCount,
      avgPercentage: Math.round(exam.avgPercentage),
      savedAt: exam.createdAt
    }));

    logger.info(`✅ Found ${formattedExams.length} saved exams`);

    res.json({
      success: true,
      data: {
        exams: formattedExams,
        total: formattedExams.length
      }
    });

  } catch (error) {
    logger.error('❌ Error getting saved exams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load saved exams',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get exam details with all student grades
export const getExamDetails = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { examId } = req.params;
    
    logger.info(`📋 Getting exam details: ${examId} for teacher: ${teacherId}`);
    
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    // Get the exam record
    const exam = await AcademicPerformance.findById(examId)
      .populate('student', 'firstName lastName rollNumber section')
      .lean();

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Verify teacher has access
    if (exam.teacher.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have access to this exam.'
      });
    }

    // Get all students' performance for this exam
    const allPerformances = await AcademicPerformance.find({
      class: exam.class,
      examType: exam.examType,
      examDate: exam.examDate
    })
    .populate('student', 'firstName lastName rollNumber section')
    .sort({ 'student.rollNumber': 1 })
    .lean();

    // Format the data
    const studentsGrades = allPerformances.map(perf => ({
      studentId: perf.student._id.toString(),
      firstName: perf.student.firstName,
      lastName: perf.student.lastName,
      rollNumber: perf.student.rollNumber,
      subjects: perf.subjects.map(sub => ({
        name: sub.name,
        maxMarks: sub.maxMarks,
        obtainedMarks: sub.obtainedMarks,
        percentage: sub.percentage,
        grade: sub.grade,
        isPassing: sub.isPassing
      })),
      overallMarks: perf.overallMarks,
      overallGrade: perf.overallGrade
    }));

    logger.info(`✅ Found ${studentsGrades.length} student grades for exam`);

    res.json({
      success: true,
      data: {
        exam: {
          examId: exam._id.toString(),
          className: exam.class,
          examType: exam.examType,
          examDate: exam.examDate,
          createdAt: exam.createdAt
        },
        students: studentsGrades,
        summary: {
          totalStudents: studentsGrades.length,
          avgPercentage: Math.round(
            studentsGrades.reduce((sum, s) => sum + s.overallMarks.percentage, 0) / studentsGrades.length
          ),
          passCount: studentsGrades.filter(s => s.overallMarks.percentage >= 40).length,
          failCount: studentsGrades.filter(s => s.overallMarks.percentage < 40).length
        }
      }
    });

  } catch (error) {
    logger.error('❌ Error getting exam details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load exam details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};


// Get all observations for teacher
export const getObservations = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { className, observationType, severity, status } = req.query;
    
    logger.info(`📝 Getting observations for teacher: ${teacherId}`);
    
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    const query = { teacher: teacherId };
    if (className) query.class = className;
    if (observationType) query.observationType = observationType;
    if (severity) query.severity = severity;
    if (status) query.status = status;

    const observations = await TeacherObservation.find(query)
      .populate('student', 'firstName lastName rollNumber section')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    logger.info(`✅ Found ${observations.length} observations`);

    res.json({
      success: true,
      data: {
        observations: observations.map(obs => ({
          ...obs,
          id: obs._id.toString(),
          _id: undefined
        })),
        total: observations.length
      }
    });

  } catch (error) {
    logger.error('❌ Error getting observations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load observations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Create new observation
export const createObservation = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const {
      studentId,
      className,
      observationType,
      severity,
      title,
      description,
      actionTaken,
      followUpRequired,
      followUpDate,
      tags,
      isPrivate
    } = req.body;

    logger.info(`📝 Creating observation for student: ${studentId} by teacher: ${teacherId}`);

    // Validate required fields
    if (!studentId || !className || !observationType || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    // Verify student exists and teacher has access
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (!teacher.assignedClasses || !teacher.assignedClasses.includes(className)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not assigned to this class.'
      });
    }

    // Create observation
    const observation = await TeacherObservation.create({
      student: studentId,
      teacher: teacherId,
      class: className,
      observationType,
      severity: severity || 'Medium',
      title,
      description,
      actionTaken,
      followUpRequired: followUpRequired || false,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      tags: tags || [],
      isPrivate: isPrivate || false,
      status: 'Active'
    });

    const populatedObservation = await TeacherObservation.findById(observation._id)
      .populate('student', 'firstName lastName rollNumber section')
      .lean();

    logger.info(`✅ Observation created: ${observation._id}`);

    // Send notification to admins
    try {
      if (observation.severity === 'Critical') {
        await notifyCriticalObservation(populatedObservation, teacher);
      } else {
        await notifyObservationCreated(populatedObservation, teacher);
      }
    } catch (notifError) {
      logger.error('Error sending observation notification:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Observation created successfully',
      data: {
        observation: {
          ...populatedObservation,
          id: populatedObservation._id.toString(),
          _id: undefined
        }
      }
    });

  } catch (error) {
    logger.error('❌ Error creating observation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create observation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update observation
export const updateObservation = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { observationId } = req.params;
    const updates = req.body;

    logger.info(`📝 Updating observation: ${observationId} by teacher: ${teacherId}`);

    const observation = await TeacherObservation.findById(observationId);
    if (!observation) {
      return res.status(404).json({
        success: false,
        message: 'Observation not found'
      });
    }

    // Verify teacher owns this observation
    if (observation.teacher.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own observations.'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'observationType', 'severity', 'title', 'description', 
      'actionTaken', 'followUpRequired', 'followUpDate', 
      'followUpNotes', 'tags', 'isPrivate', 'status'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        observation[field] = updates[field];
      }
    });

    await observation.save();

    const updatedObservation = await TeacherObservation.findById(observationId)
      .populate('student', 'firstName lastName rollNumber section')
      .lean();

    logger.info(`✅ Observation updated: ${observationId}`);

    res.json({
      success: true,
      message: 'Observation updated successfully',
      data: {
        observation: {
          ...updatedObservation,
          id: updatedObservation._id.toString(),
          _id: undefined
        }
      }
    });

  } catch (error) {
    logger.error('❌ Error updating observation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update observation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete observation
export const deleteObservation = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { observationId } = req.params;

    logger.info(`🗑️ Deleting observation: ${observationId} by teacher: ${teacherId}`);

    const observation = await TeacherObservation.findById(observationId);
    if (!observation) {
      return res.status(404).json({
        success: false,
        message: 'Observation not found'
      });
    }

    // Verify teacher owns this observation
    if (observation.teacher.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own observations.'
      });
    }

    await TeacherObservation.findByIdAndDelete(observationId);

    logger.info(`✅ Observation deleted: ${observationId}`);

    res.json({
      success: true,
      message: 'Observation deleted successfully'
    });

  } catch (error) {
    logger.error('❌ Error deleting observation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete observation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get observations for a specific student
export const getStudentObservations = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { studentId } = req.params;

    logger.info(`📝 Getting observations for student: ${studentId} by teacher: ${teacherId}`);

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Verify teacher has access to this student
    if (!teacher.assignedClasses || !teacher.assignedClasses.includes(student.section)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student not in your assigned classes.'
      });
    }

    const observations = await TeacherObservation.find({
      student: studentId,
      teacher: teacherId
    })
      .sort({ createdAt: -1 })
      .lean();

    logger.info(`✅ Found ${observations.length} observations for student`);

    res.json({
      success: true,
      data: {
        observations: observations.map(obs => ({
          ...obs,
          id: obs._id.toString(),
          _id: undefined
        })),
        total: observations.length
      }
    });

  } catch (error) {
    logger.error('❌ Error getting student observations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load student observations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};


// Get observations for teacher


// ==================== COMMUNICATIONS ====================

// Get all communications for teacher
export const getCommunications = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { type, status, priority, studentId } = req.query;

    logger.info(`📧 Getting communications for teacher: ${teacherId}`);

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    const filters = { type, status, priority, studentId };
    const communications = await Communication.getTeacherCommunications(teacherId, filters);

    logger.info(`✅ Found ${communications.length} communications`);

    res.json({
      success: true,
      data: {
        communications: communications.map(comm => ({
          ...comm.toObject(),
          id: comm._id.toString(),
          _id: undefined
        })),
        total: communications.length
      }
    });

  } catch (error) {
    logger.error('❌ Error getting communications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load communications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Send new communication
export const sendCommunication = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const {
      studentId,
      recipient,
      subject,
      message,
      type,
      priority,
      method,
      followUpRequired,
      followUpDate,
      tags
    } = req.body;

    logger.info(`📧 Sending communication from teacher: ${teacherId} to student: ${studentId}`);

    // Validate required fields
    if (!studentId || !recipient || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    // Verify student exists and teacher has access
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (!teacher.assignedClasses || !teacher.assignedClasses.includes(student.section)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student not in your assigned classes.'
      });
    }

    // Create communication record
    const communication = await Communication.create({
      sender: teacherId,
      senderRole: 'teacher',
      recipient,
      student: studentId,
      subject,
      message,
      type: type || 'General',
      priority: priority || 'Normal',
      method: method || 'Email',
      status: 'Sent',
      sentAt: new Date(),
      followUpRequired: followUpRequired || false,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      tags: tags || []
    });

    const populatedCommunication = await Communication.findById(communication._id)
      .populate('student', 'firstName lastName rollNumber section email phone father mother')
      .lean();

    logger.info(`✅ Communication record created: ${communication._id}`);

    // Actually send the communication based on method
    let deliveryStatus = 'Sent';
    const deliveryResults = [];

    try {
      // Determine recipients
      const recipients = [];
      if (recipient === 'parent' || recipient === 'both') {
        if (student.father?.email) recipients.push({ type: 'parent', email: student.father.email, phone: student.father.phone, name: student.father.name });
        if (student.mother?.email) recipients.push({ type: 'parent', email: student.mother.email, phone: student.mother.phone, name: student.mother.name });
      }
      if (recipient === 'student' || recipient === 'both') {
        if (student.email) recipients.push({ type: 'student', email: student.email, phone: student.phone, name: `${student.firstName} ${student.lastName}` });
      }

      // Send via Email
      if (method === 'Email' && process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
        const { sendEmail } = await import('../services/emailService.js');
        
        for (const recip of recipients) {
          if (recip.email) {
            const emailHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
                  .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
                  .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 5px 5px; }
                  .priority-${priority.toLowerCase()} { border-left: 4px solid ${priority === 'Urgent' ? '#DC2626' : priority === 'High' ? '#F59E0B' : '#3B82F6'}; padding-left: 15px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h2>📧 Message from ${teacher.firstName} ${teacher.lastName}</h2>
                    <p style="margin: 0;">Teacher - ${student.section}</p>
                  </div>
                  <div class="content priority-${priority.toLowerCase()}">
                    <p><strong>To:</strong> ${recip.name} (${recip.type})</p>
                    <p><strong>Regarding:</strong> ${student.firstName} ${student.lastName} (${student.rollNumber})</p>
                    <p><strong>Type:</strong> ${type} | <strong>Priority:</strong> ${priority}</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
                    <h3>${subject}</h3>
                    <p style="white-space: pre-wrap;">${message}</p>
                    ${followUpRequired ? `<p style="background-color: #FEF3C7; padding: 10px; border-radius: 5px; margin-top: 15px;"><strong>⏰ Follow-up Required:</strong> ${followUpDate ? new Date(followUpDate).toLocaleDateString() : 'Soon'}</p>` : ''}
                  </div>
                  <div class="footer">
                    <p>This is an automated message from Student Dropout Prevention System</p>
                    <p>Please do not reply to this email. Contact the school directly for responses.</p>
                  </div>
                </div>
              </body>
              </html>
            `;

            const emailResult = await sendEmail({
              to: recip.email,
              subject: `[${priority}] ${subject} - ${student.firstName} ${student.lastName}`,
              html: emailHtml,
              text: `${subject}\n\n${message}\n\nFrom: ${teacher.firstName} ${teacher.lastName}\nRegarding: ${student.firstName} ${student.lastName} (${student.rollNumber})`
            });

            deliveryResults.push({
              recipient: recip.email,
              method: 'Email',
              success: emailResult.success,
              messageId: emailResult.messageId
            });

            if (emailResult.success) {
              deliveryStatus = 'Delivered';
              logger.info(`✅ Email sent to ${recip.email}`);
            } else {
              logger.error(`❌ Email failed to ${recip.email}: ${emailResult.error}`);
            }
          }
        }
      }

      // Send via SMS
      if (method === 'SMS' && process.env.ENABLE_SMS_NOTIFICATIONS === 'true') {
        const { sendSMS } = await import('../services/smsService.js');
        
        for (const recip of recipients) {
          if (recip.phone) {
            // SMS has 160 char limit, so create a concise message
            const smsMessage = `[${priority}] ${subject.substring(0, 30)}\n${message.substring(0, 100)}...\nFrom: ${teacher.firstName} ${teacher.lastName}\nRe: ${student.firstName}`;
            
            const smsResult = await sendSMS({
              to: recip.phone,
              message: smsMessage
            });

            deliveryResults.push({
              recipient: recip.phone,
              method: 'SMS',
              success: smsResult.success,
              messageId: smsResult.messageId,
              error: smsResult.error
            });

            if (smsResult.success) {
              deliveryStatus = 'Delivered';
              logger.info(`✅ SMS sent to ${recip.phone}`);
            } else {
              logger.error(`❌ SMS failed to ${recip.phone}: ${smsResult.error}`);
            }
          }
        }
      }

      // Send via App Notification (Socket.IO)
      if (method === 'App' || method === 'Email') {
        try {
          const { getIO } = await import('../socket/socketHandler.js');
          const io = getIO();
          
          if (io) {
            // Emit to parent/student if they're connected
            io.emit('new-communication', {
              communicationId: communication._id,
              studentId: student._id,
              subject,
              message: message.substring(0, 200),
              type,
              priority,
              from: `${teacher.firstName} ${teacher.lastName}`,
              timestamp: new Date()
            });

            deliveryResults.push({
              recipient: 'App Users',
              method: 'App Notification',
              success: true,
              note: 'Sent via Socket.IO'
            });

            logger.info(`✅ App notification sent via Socket.IO`);
          }
        } catch (socketError) {
          logger.error('❌ Socket.IO notification error:', socketError);
        }
      }

      // Update communication status
      if (deliveryResults.some(r => r.success)) {
        await Communication.findByIdAndUpdate(communication._id, {
          status: deliveryStatus,
          deliveredAt: new Date()
        });
      } else if (deliveryResults.length > 0 && deliveryResults.every(r => !r.success)) {
        await Communication.findByIdAndUpdate(communication._id, {
          status: 'Failed'
        });
      }

    } catch (deliveryError) {
      logger.error('❌ Communication delivery error:', deliveryError);
      // Don't fail the request, just log the error
      await Communication.findByIdAndUpdate(communication._id, {
        status: 'Failed'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Communication sent successfully',
      data: {
        communication: {
          ...populatedCommunication,
          id: populatedCommunication._id.toString(),
          _id: undefined
        },
        deliveryResults
      }
    });

  } catch (error) {
    logger.error('❌ Error sending communication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send communication',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get communication history for a student
export const getStudentCommunicationHistory = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { studentId } = req.params;

    logger.info(`📧 Getting communication history for student: ${studentId}`);

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (!teacher.assignedClasses || !teacher.assignedClasses.includes(student.section)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student not in your assigned classes.'
      });
    }

    const communications = await Communication.getStudentHistory(studentId);

    logger.info(`✅ Found ${communications.length} communications for student`);

    res.json({
      success: true,
      data: {
        communications: communications.map(comm => ({
          ...comm.toObject(),
          id: comm._id.toString(),
          _id: undefined
        })),
        total: communications.length
      }
    });

  } catch (error) {
    logger.error('❌ Error getting student communication history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load communication history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update communication status
export const updateCommunicationStatus = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { communicationId } = req.params;
    const { status, parentResponse } = req.body;

    logger.info(`📧 Updating communication status: ${communicationId}`);

    const communication = await Communication.findById(communicationId);
    if (!communication) {
      return res.status(404).json({
        success: false,
        message: 'Communication not found'
      });
    }

    // Verify teacher owns this communication
    if (communication.sender.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own communications.'
      });
    }

    if (status) {
      communication.status = status;
      if (status === 'Delivered') communication.deliveredAt = new Date();
      if (status === 'Read') communication.readAt = new Date();
    }

    if (parentResponse) {
      communication.parentResponse = {
        message: parentResponse,
        receivedAt: new Date()
      };
      communication.status = 'Replied';
      communication.repliedAt = new Date();
    }

    await communication.save();

    logger.info(`✅ Communication status updated: ${communicationId}`);

    res.json({
      success: true,
      message: 'Communication updated successfully',
      data: {
        communication: {
          ...communication.toObject(),
          id: communication._id.toString(),
          _id: undefined
        }
      }
    });

  } catch (error) {
    logger.error('❌ Error updating communication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update communication',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
