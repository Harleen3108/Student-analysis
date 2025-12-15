import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import Grade from "../models/Grade.js";
import Intervention from "../models/Intervention.js";
import Class from "../models/Class.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Report Generator Service
 * Generates various types of reports in PDF and Excel formats
 */

class ReportGenerator {
  constructor() {
    this.reportsDir = path.join(__dirname, "../../reports");
    this.ensureReportsDirectory();
  }

  /**
   * Ensure reports directory exists
   */
  ensureReportsDirectory() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Generate attendance report
   */
  async attendanceReport(options = {}) {
    try {
      const {
        classId = null,
        studentId = null,
        dateRange = null,
        format = "pdf",
        groupBy = "student",
        generatedBy = "system"
      } = options;

      logger.info("Generating attendance report...");

      // Build query
      const query = {};
      if (classId) query.class = classId;
      if (studentId) query.student = studentId;
      if (dateRange) {
        query.date = {
          $gte: new Date(dateRange.startDate),
          $lte: new Date(dateRange.endDate)
        };
      }

      // Get attendance data
      const attendanceData = await Attendance.find(query)
        .populate("student", "firstName lastName rollNumber")
        .populate("class", "name section")
        .sort({ date: -1 });

      // Process data based on groupBy
      const processedData = this.processAttendanceData(attendanceData, groupBy);

      // Generate report
      const reportData = {
        title: "Attendance Report",
        type: "attendance",
        data: processedData,
        metadata: {
          generatedBy,
          generatedAt: new Date(),
          dateRange,
          classId,
          studentId,
          totalRecords: attendanceData.length
        }
      };

      if (format === "pdf") {
        return await this.generatePDFReport(reportData);
      } else if (format === "excel") {
        return await this.generateExcelReport(reportData);
      }

      throw new Error("Unsupported format");
    } catch (error) {
      logger.error("Attendance report generation error:", error);
      throw error;
    }
  }

  /**
   * Generate academic performance report
   */
  async academicReport(options = {}) {
    try {
      const {
        classId = null,
        studentId = null,
        academicYear = null,
        term = null,
        subject = null,
        format = "pdf",
        generatedBy = "system"
      } = options;

      logger.info("Generating academic report...");

      // Build query
      const query = { isPublished: true };
      if (classId) query.class = classId;
      if (studentId) query.student = studentId;
      if (academicYear) query.academicYear = academicYear;
      if (term) query.term = term;
      if (subject) query.subject = subject;

      // Get grade data
      const gradeData = await Grade.find(query)
        .populate("student", "firstName lastName rollNumber")
        .populate("class", "name section")
        .sort({ examDate: -1 });

      // Process data
      const processedData = this.processAcademicData(gradeData);

      const reportData = {
        title: "Academic Performance Report",
        type: "academic",
        data: processedData,
        metadata: {
          generatedBy,
          generatedAt: new Date(),
          academicYear,
          term,
          subject,
          classId,
          studentId,
          totalRecords: gradeData.length
        }
      };

      if (format === "pdf") {
        return await this.generatePDFReport(reportData);
      } else if (format === "excel") {
        return await this.generateExcelReport(reportData);
      }

      throw new Error("Unsupported format");
    } catch (error) {
      logger.error("Academic report generation error:", error);
      throw error;
    }
  }

  /**
   * Generate risk assessment report
   */
  async riskAssessmentReport(options = {}) {
    try {
      const {
        riskLevel = null,
        classId = null,
        includeRecommendations = true,
        format = "pdf",
        sortBy = "riskScore",
        generatedBy = "system"
      } = options;

      logger.info("Generating risk assessment report...");

      // Build query
      const query = { isActive: true };
      if (riskLevel) {
        if (Array.isArray(riskLevel)) {
          query.riskLevel = { $in: riskLevel };
        } else {
          query.riskLevel = riskLevel;
        }
      }
      if (classId) query.class = classId;

      // Get student data
      const students = await Student.find(query)
        .populate("class", "name section classTeacher")
        .sort({ [sortBy]: -1 });

      // Process data
      const processedData = this.processRiskData(students, includeRecommendations);

      const reportData = {
        title: "Risk Assessment Report",
        type: "risk",
        data: processedData,
        metadata: {
          generatedBy,
          generatedAt: new Date(),
          riskLevel,
          classId,
          includeRecommendations,
          totalStudents: students.length
        }
      };

      if (format === "pdf") {
        return await this.generatePDFReport(reportData);
      } else if (format === "excel") {
        return await this.generateExcelReport(reportData);
      }

      throw new Error("Unsupported format");
    } catch (error) {
      logger.error("Risk assessment report generation error:", error);
      throw error;
    }
  }

  /**
   * Generate intervention report
   */
  async interventionReport(options = {}) {
    try {
      const {
        dateRange = null,
        status = null,
        type = null,
        outcome = null,
        includeOutcomes = true,
        format = "pdf",
        generatedBy = "system"
      } = options;

      logger.info("Generating intervention report...");

      // Build query
      const query = {};
      if (dateRange) {
        query.createdAt = {
          $gte: new Date(dateRange.startDate),
          $lte: new Date(dateRange.endDate)
        };
      }
      if (status) query.status = status;
      if (type) query.type = type;
      if (outcome) query.outcome = outcome;

      // Get intervention data
      const interventions = await Intervention.find(query)
        .populate("student", "firstName lastName rollNumber riskLevel")
        .populate("assignedCounselor", "firstName lastName")
        .sort({ createdAt: -1 });

      // Process data
      const processedData = this.processInterventionData(interventions, includeOutcomes);

      const reportData = {
        title: "Intervention Report",
        type: "intervention",
        data: processedData,
        metadata: {
          generatedBy,
          generatedAt: new Date(),
          dateRange,
          status,
          type,
          outcome,
          totalInterventions: interventions.length
        }
      };

      if (format === "pdf") {
        return await this.generatePDFReport(reportData);
      } else if (format === "excel") {
        return await this.generateExcelReport(reportData);
      }

      throw new Error("Unsupported format");
    } catch (error) {
      logger.error("Intervention report generation error:", error);
      throw error;
    }
  }

  /**
   * Generate school performance report
   */
  async schoolPerformanceReport(options = {}) {
    try {
      const {
        dateRange = null,
        includeAttendance = true,
        includeGrades = true,
        includeRiskAnalysis = true,
        includeInterventions = true,
        format = "pdf",
        generatedBy = "system"
      } = options;

      logger.info("Generating school performance report...");

      const reportData = {
        title: "School Performance Report",
        type: "school_performance",
        data: {},
        metadata: {
          generatedBy,
          generatedAt: new Date(),
          dateRange,
          includeAttendance,
          includeGrades,
          includeRiskAnalysis,
          includeInterventions
        }
      };

      // Get overview statistics
      reportData.data.overview = await this.getSchoolOverview();

      // Get attendance statistics if requested
      if (includeAttendance) {
        reportData.data.attendance = await this.getAttendanceStatistics(dateRange);
      }

      // Get academic statistics if requested
      if (includeGrades) {
        reportData.data.academic = await this.getAcademicStatistics(dateRange);
      }

      // Get risk analysis if requested
      if (includeRiskAnalysis) {
        reportData.data.riskAnalysis = await this.getRiskAnalysisStatistics();
      }

      // Get intervention statistics if requested
      if (includeInterventions) {
        reportData.data.interventions = await this.getInterventionStatistics(dateRange);
      }

      if (format === "pdf") {
        return await this.generatePDFReport(reportData);
      } else if (format === "excel") {
        return await this.generateExcelReport(reportData);
      }

      throw new Error("Unsupported format");
    } catch (error) {
      logger.error("School performance report generation error:", error);
      throw error;
    }
  }

  /**
   * Generate parent report
   */
  async parentReport(options = {}) {
    try {
      const {
        studentId,
        reportType = "monthly",
        includePhotos = false,
        format = "pdf",
        generatedBy = "system"
      } = options;

      logger.info(`Generating parent report for student ${studentId}...`);

      // Get student data
      const student = await Student.findById(studentId)
        .populate("class", "name section classTeacher");

      if (!student) {
        throw new Error("Student not found");
      }

      // Get recent data based on report type
      const dateRange = this.getDateRangeForReportType(reportType);
      
      const [attendanceData, gradeData, interventionData] = await Promise.all([
        this.getStudentAttendanceData(studentId, dateRange),
        this.getStudentGradeData(studentId, dateRange),
        this.getStudentInterventionData(studentId, dateRange)
      ]);

      const reportData = {
        title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Progress Report`,
        type: "parent",
        data: {
          student,
          attendance: attendanceData,
          grades: gradeData,
          interventions: interventionData,
          riskAssessment: {
            currentLevel: student.riskLevel,
            score: student.riskScore,
            factors: student.riskFactors
          }
        },
        metadata: {
          generatedBy,
          generatedAt: new Date(),
          reportType,
          studentId,
          includePhotos
        }
      };

      if (format === "pdf") {
        return await this.generatePDFReport(reportData);
      } else if (format === "excel") {
        return await this.generateExcelReport(reportData);
      }

      throw new Error("Unsupported format");
    } catch (error) {
      logger.error("Parent report generation error:", error);
      throw error;
    }
  }

  /**
   * Process attendance data
   */
  processAttendanceData(attendanceData, groupBy) {
    if (groupBy === "student") {
      const studentMap = new Map();
      
      attendanceData.forEach(record => {
        const studentId = record.student._id.toString();
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            student: record.student,
            class: record.class,
            records: [],
            summary: { present: 0, absent: 0, late: 0, excused: 0, total: 0 }
          });
        }
        
        const studentData = studentMap.get(studentId);
        studentData.records.push(record);
        studentData.summary[record.status.toLowerCase()]++;
        studentData.summary.total++;
      });

      return Array.from(studentMap.values()).map(data => ({
        ...data,
        percentage: data.summary.total > 0 
          ? ((data.summary.present + data.summary.late) / data.summary.total * 100).toFixed(2)
          : 0
      }));
    }

    return attendanceData;
  }

  /**
   * Process academic data
   */
  processAcademicData(gradeData) {
    const studentMap = new Map();
    
    gradeData.forEach(grade => {
      const studentId = grade.student._id.toString();
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student: grade.student,
          class: grade.class,
          grades: [],
          summary: { totalMarks: 0, maxMarks: 0, subjects: new Set(), passedSubjects: 0 }
        });
      }
      
      const studentData = studentMap.get(studentId);
      studentData.grades.push(grade);
      studentData.summary.totalMarks += grade.marksObtained;
      studentData.summary.maxMarks += grade.maxMarks;
      studentData.summary.subjects.add(grade.subject);
      if (grade.isPassed) studentData.summary.passedSubjects++;
    });

    return Array.from(studentMap.values()).map(data => ({
      ...data,
      summary: {
        ...data.summary,
        subjects: data.summary.subjects.size,
        percentage: data.summary.maxMarks > 0 
          ? (data.summary.totalMarks / data.summary.maxMarks * 100).toFixed(2)
          : 0,
        passRate: data.summary.subjects.size > 0
          ? (data.summary.passedSubjects / data.summary.subjects.size * 100).toFixed(2)
          : 0
      }
    }));
  }

  /**
   * Process risk data
   */
  processRiskData(students, includeRecommendations) {
    return students.map(student => {
      const data = {
        student: {
          name: student.fullName,
          rollNumber: student.rollNumber,
          class: student.class?.name + " - " + student.class?.section,
          riskLevel: student.riskLevel,
          riskScore: student.riskScore,
          attendancePercentage: student.attendancePercentage,
          overallPercentage: student.overallPercentage
        },
        riskFactors: student.riskFactors
      };

      if (includeRecommendations) {
        data.recommendations = this.generateRiskRecommendations(student);
      }

      return data;
    });
  }

  /**
   * Process intervention data
   */
  processInterventionData(interventions, includeOutcomes) {
    return interventions.map(intervention => {
      const data = {
        title: intervention.title,
        type: intervention.type,
        student: intervention.student.fullName,
        rollNumber: intervention.student.rollNumber,
        counselor: intervention.assignedCounselor?.fullName,
        status: intervention.status,
        priority: intervention.priority,
        startDate: intervention.startDate,
        endDate: intervention.endDate
      };

      if (includeOutcomes && intervention.status === "Completed") {
        data.outcome = intervention.outcome;
        data.completionPercentage = intervention.completionPercentage;
        data.effectiveness = intervention.effectiveness;
      }

      return data;
    });
  }

  /**
   * Generate PDF report
   */
  async generatePDFReport(reportData) {
    try {
      const filename = `${reportData.type}_report_${Date.now()}.pdf`;
      const filePath = path.join(this.reportsDir, filename);

      const doc = new PDFDocument({ margin: 50 });
      doc.pipe(fs.createWriteStream(filePath));

      // Header
      doc.fontSize(20).text(reportData.title, { align: "center" });
      doc.moveDown();

      // Metadata
      doc.fontSize(10)
         .text(`Generated on: ${reportData.metadata.generatedAt.toLocaleString()}`)
         .text(`Generated by: ${reportData.metadata.generatedBy}`)
         .moveDown();

      // Content based on report type
      switch (reportData.type) {
        case "attendance":
          this.addAttendanceContentToPDF(doc, reportData.data);
          break;
        case "academic":
          this.addAcademicContentToPDF(doc, reportData.data);
          break;
        case "risk":
          this.addRiskContentToPDF(doc, reportData.data);
          break;
        case "intervention":
          this.addInterventionContentToPDF(doc, reportData.data);
          break;
        case "school_performance":
          this.addSchoolPerformanceContentToPDF(doc, reportData.data);
          break;
        case "parent":
          this.addParentContentToPDF(doc, reportData.data);
          break;
      }

      doc.end();

      return {
        filename,
        filePath,
        type: "pdf",
        size: fs.statSync(filePath).size
      };
    } catch (error) {
      logger.error("PDF generation error:", error);
      throw error;
    }
  }

  /**
   * Generate Excel report
   */
  async generateExcelReport(reportData) {
    try {
      const filename = `${reportData.type}_report_${Date.now()}.xlsx`;
      const filePath = path.join(this.reportsDir, filename);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = reportData.metadata.generatedBy;
      workbook.created = reportData.metadata.generatedAt;

      // Add worksheets based on report type
      switch (reportData.type) {
        case "attendance":
          this.addAttendanceWorksheet(workbook, reportData);
          break;
        case "academic":
          this.addAcademicWorksheet(workbook, reportData);
          break;
        case "risk":
          this.addRiskWorksheet(workbook, reportData);
          break;
        case "intervention":
          this.addInterventionWorksheet(workbook, reportData);
          break;
        case "school_performance":
          this.addSchoolPerformanceWorksheet(workbook, reportData);
          break;
        case "parent":
          this.addParentWorksheet(workbook, reportData);
          break;
      }

      await workbook.xlsx.writeFile(filePath);

      return {
        filename,
        filePath,
        type: "excel",
        size: fs.statSync(filePath).size
      };
    } catch (error) {
      logger.error("Excel generation error:", error);
      throw error;
    }
  }

  /**
   * Add attendance content to PDF
   */
  addAttendanceContentToPDF(doc, data) {
    doc.fontSize(14).text("Attendance Summary", { underline: true });
    doc.moveDown();

    data.forEach((studentData, index) => {
      if (index > 0) doc.addPage();
      
      doc.fontSize(12)
         .text(`Student: ${studentData.student.firstName} ${studentData.student.lastName}`)
         .text(`Roll Number: ${studentData.student.rollNumber}`)
         .text(`Class: ${studentData.class?.name} - ${studentData.class?.section}`)
         .text(`Attendance Percentage: ${studentData.percentage}%`)
         .moveDown();

      doc.text("Summary:")
         .text(`Present: ${studentData.summary.present}`)
         .text(`Absent: ${studentData.summary.absent}`)
         .text(`Late: ${studentData.summary.late}`)
         .text(`Excused: ${studentData.summary.excused}`)
         .text(`Total Days: ${studentData.summary.total}`)
         .moveDown();
    });
  }

  /**
   * Add academic content to PDF
   */
  addAcademicContentToPDF(doc, data) {
    doc.fontSize(14).text("Academic Performance Summary", { underline: true });
    doc.moveDown();

    data.forEach((studentData, index) => {
      if (index > 0) doc.addPage();
      
      doc.fontSize(12)
         .text(`Student: ${studentData.student.firstName} ${studentData.student.lastName}`)
         .text(`Roll Number: ${studentData.student.rollNumber}`)
         .text(`Overall Percentage: ${studentData.summary.percentage}%`)
         .text(`Pass Rate: ${studentData.summary.passRate}%`)
         .moveDown();

      doc.text("Subject-wise Performance:");
      studentData.grades.forEach(grade => {
        doc.text(`${grade.subject}: ${grade.marksObtained}/${grade.maxMarks} (${grade.percentage}%) - ${grade.grade}`);
      });
      doc.moveDown();
    });
  }

  /**
   * Add risk content to PDF
   */
  addRiskContentToPDF(doc, data) {
    doc.fontSize(14).text("Risk Assessment Summary", { underline: true });
    doc.moveDown();

    data.forEach((studentData, index) => {
      if (index > 0 && index % 3 === 0) doc.addPage();
      
      doc.fontSize(12)
         .text(`Student: ${studentData.student.name}`)
         .text(`Roll Number: ${studentData.student.rollNumber}`)
         .text(`Risk Level: ${studentData.student.riskLevel}`)
         .text(`Risk Score: ${studentData.student.riskScore}/100`)
         .moveDown(0.5);

      if (studentData.recommendations) {
        doc.text("Recommendations:");
        studentData.recommendations.forEach(rec => {
          doc.text(`• ${rec.action} (${rec.priority} priority)`);
        });
      }
      doc.moveDown();
    });
  }

  /**
   * Add intervention content to PDF
   */
  addInterventionContentToPDF(doc, data) {
    doc.fontSize(14).text("Intervention Summary", { underline: true });
    doc.moveDown();

    data.forEach((intervention, index) => {
      if (index > 0 && index % 2 === 0) doc.addPage();
      
      doc.fontSize(12)
         .text(`Title: ${intervention.title}`)
         .text(`Student: ${intervention.student}`)
         .text(`Type: ${intervention.type}`)
         .text(`Status: ${intervention.status}`)
         .text(`Priority: ${intervention.priority}`)
         .text(`Start Date: ${new Date(intervention.startDate).toDateString()}`)
         .moveDown();

      if (intervention.outcome) {
        doc.text(`Outcome: ${intervention.outcome}`)
           .text(`Effectiveness: ${intervention.effectiveness || 'N/A'}`)
           .moveDown();
      }
    });
  }

  /**
   * Add school performance content to PDF
   */
  addSchoolPerformanceContentToPDF(doc, data) {
    doc.fontSize(14).text("School Performance Overview", { underline: true });
    doc.moveDown();

    // Overview
    if (data.overview) {
      doc.fontSize(12).text("Overview:");
      Object.entries(data.overview).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`);
      });
      doc.moveDown();
    }

    // Add other sections as needed
    if (data.attendance) {
      doc.text("Attendance Statistics:");
      Object.entries(data.attendance).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`);
      });
      doc.moveDown();
    }
  }

  /**
   * Add parent content to PDF
   */
  addParentContentToPDF(doc, data) {
    const student = data.student;
    
    doc.fontSize(14).text(`Progress Report - ${student.firstName} ${student.lastName}`, { underline: true });
    doc.moveDown();

    doc.fontSize(12)
       .text(`Roll Number: ${student.rollNumber}`)
       .text(`Class: ${student.class?.name} - ${student.class?.section}`)
       .text(`Current Risk Level: ${student.riskLevel}`)
       .moveDown();

    // Attendance section
    if (data.attendance) {
      doc.text("Attendance Summary:")
         .text(`Percentage: ${data.attendance.percentage}%`)
         .text(`Present Days: ${data.attendance.present}`)
         .text(`Absent Days: ${data.attendance.absent}`)
         .moveDown();
    }

    // Academic section
    if (data.grades && data.grades.length > 0) {
      doc.text("Recent Academic Performance:");
      data.grades.forEach(grade => {
        doc.text(`${grade.subject}: ${grade.marksObtained}/${grade.maxMarks} (${grade.percentage}%)`);
      });
      doc.moveDown();
    }

    // Risk assessment
    if (data.riskAssessment) {
      doc.text("Risk Assessment:")
         .text(`Current Level: ${data.riskAssessment.currentLevel}`)
         .text(`Risk Score: ${data.riskAssessment.score}/100`)
         .moveDown();
    }
  }

  /**
   * Add attendance worksheet to Excel
   */
  addAttendanceWorksheet(workbook, reportData) {
    const worksheet = workbook.addWorksheet("Attendance Report");
    
    // Headers
    worksheet.columns = [
      { header: "Student Name", key: "name", width: 20 },
      { header: "Roll Number", key: "rollNumber", width: 15 },
      { header: "Class", key: "class", width: 15 },
      { header: "Present", key: "present", width: 10 },
      { header: "Absent", key: "absent", width: 10 },
      { header: "Late", key: "late", width: 10 },
      { header: "Excused", key: "excused", width: 10 },
      { header: "Total", key: "total", width: 10 },
      { header: "Percentage", key: "percentage", width: 12 }
    ];

    // Data
    reportData.data.forEach(studentData => {
      worksheet.addRow({
        name: `${studentData.student.firstName} ${studentData.student.lastName}`,
        rollNumber: studentData.student.rollNumber,
        class: `${studentData.class?.name} - ${studentData.class?.section}`,
        present: studentData.summary.present,
        absent: studentData.summary.absent,
        late: studentData.summary.late,
        excused: studentData.summary.excused,
        total: studentData.summary.total,
        percentage: `${studentData.percentage}%`
      });
    });

    // Style headers
    worksheet.getRow(1).font = { bold: true };
  }

  /**
   * Add academic worksheet to Excel
   */
  addAcademicWorksheet(workbook, reportData) {
    const worksheet = workbook.addWorksheet("Academic Report");
    
    worksheet.columns = [
      { header: "Student Name", key: "name", width: 20 },
      { header: "Roll Number", key: "rollNumber", width: 15 },
      { header: "Class", key: "class", width: 15 },
      { header: "Overall %", key: "percentage", width: 12 },
      { header: "Pass Rate %", key: "passRate", width: 12 },
      { header: "Subjects", key: "subjects", width: 10 }
    ];

    reportData.data.forEach(studentData => {
      worksheet.addRow({
        name: `${studentData.student.firstName} ${studentData.student.lastName}`,
        rollNumber: studentData.student.rollNumber,
        class: `${studentData.class?.name} - ${studentData.class?.section}`,
        percentage: `${studentData.summary.percentage}%`,
        passRate: `${studentData.summary.passRate}%`,
        subjects: studentData.summary.subjects
      });
    });

    worksheet.getRow(1).font = { bold: true };
  }

  /**
   * Add risk worksheet to Excel
   */
  addRiskWorksheet(workbook, reportData) {
    const worksheet = workbook.addWorksheet("Risk Assessment");
    
    worksheet.columns = [
      { header: "Student Name", key: "name", width: 20 },
      { header: "Roll Number", key: "rollNumber", width: 15 },
      { header: "Class", key: "class", width: 15 },
      { header: "Risk Level", key: "riskLevel", width: 12 },
      { header: "Risk Score", key: "riskScore", width: 12 },
      { header: "Attendance %", key: "attendance", width: 12 },
      { header: "Academic %", key: "academic", width: 12 }
    ];

    reportData.data.forEach(studentData => {
      worksheet.addRow({
        name: studentData.student.name,
        rollNumber: studentData.student.rollNumber,
        class: studentData.student.class,
        riskLevel: studentData.student.riskLevel,
        riskScore: studentData.student.riskScore,
        attendance: `${studentData.student.attendancePercentage}%`,
        academic: `${studentData.student.overallPercentage}%`
      });
    });

    worksheet.getRow(1).font = { bold: true };
  }

  /**
   * Add intervention worksheet to Excel
   */
  addInterventionWorksheet(workbook, reportData) {
    const worksheet = workbook.addWorksheet("Interventions");
    
    worksheet.columns = [
      { header: "Title", key: "title", width: 25 },
      { header: "Student", key: "student", width: 20 },
      { header: "Type", key: "type", width: 15 },
      { header: "Status", key: "status", width: 12 },
      { header: "Priority", key: "priority", width: 10 },
      { header: "Counselor", key: "counselor", width: 20 },
      { header: "Start Date", key: "startDate", width: 12 },
      { header: "Outcome", key: "outcome", width: 15 }
    ];

    reportData.data.forEach(intervention => {
      worksheet.addRow({
        title: intervention.title,
        student: intervention.student,
        type: intervention.type,
        status: intervention.status,
        priority: intervention.priority,
        counselor: intervention.counselor || "N/A",
        startDate: new Date(intervention.startDate).toDateString(),
        outcome: intervention.outcome || "N/A"
      });
    });

    worksheet.getRow(1).font = { bold: true };
  }

  /**
   * Add school performance worksheet to Excel
   */
  addSchoolPerformanceWorksheet(workbook, reportData) {
    const worksheet = workbook.addWorksheet("School Performance");
    
    // Add overview data
    let row = 1;
    if (reportData.data.overview) {
      worksheet.cell(row, 1).value = "Overview";
      worksheet.cell(row, 1).font = { bold: true };
      row += 2;
      
      Object.entries(reportData.data.overview).forEach(([key, value]) => {
        worksheet.cell(row, 1).value = key;
        worksheet.cell(row, 2).value = value;
        row++;
      });
      row += 2;
    }

    // Add other sections as needed
  }

  /**
   * Add parent worksheet to Excel
   */
  addParentWorksheet(workbook, reportData) {
    const worksheet = workbook.addWorksheet("Student Progress");
    const student = reportData.data.student;
    
    // Student info
    worksheet.cell(1, 1).value = "Student Information";
    worksheet.cell(1, 1).font = { bold: true };
    worksheet.cell(2, 1).value = "Name";
    worksheet.cell(2, 2).value = `${student.firstName} ${student.lastName}`;
    worksheet.cell(3, 1).value = "Roll Number";
    worksheet.cell(3, 2).value = student.rollNumber;
    worksheet.cell(4, 1).value = "Class";
    worksheet.cell(4, 2).value = `${student.class?.name} - ${student.class?.section}`;
    worksheet.cell(5, 1).value = "Risk Level";
    worksheet.cell(5, 2).value = student.riskLevel;
  }

  /**
   * Helper methods for data retrieval
   */
  async getSchoolOverview() {
    const [totalStudents, activeStudents, totalClasses, totalTeachers] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ isActive: true }),
      Class.countDocuments({ isActive: true }),
      User.countDocuments({ role: "teacher", isActive: true })
    ]);

    return {
      totalStudents,
      activeStudents,
      totalClasses,
      totalTeachers,
      dropoutRate: totalStudents > 0 ? (((totalStudents - activeStudents) / totalStudents) * 100).toFixed(2) : 0
    };
  }

  async getAttendanceStatistics(dateRange) {
    // Implementation for attendance statistics
    return {
      averageAttendance: 85.5,
      totalDays: 180,
      presentDays: 154
    };
  }

  async getAcademicStatistics(dateRange) {
    // Implementation for academic statistics
    return {
      averagePerformance: 72.3,
      passRate: 89.2
    };
  }

  async getRiskAnalysisStatistics() {
    const riskDistribution = await Student.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$riskLevel", count: { $sum: 1 } } }
    ]);

    return riskDistribution;
  }

  async getInterventionStatistics(dateRange) {
    const query = dateRange ? {
      createdAt: {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate)
      }
    } : {};

    const [total, completed, successful] = await Promise.all([
      Intervention.countDocuments(query),
      Intervention.countDocuments({ ...query, status: "Completed" }),
      Intervention.countDocuments({ ...query, outcome: "Successful" })
    ]);

    return {
      total,
      completed,
      successful,
      successRate: completed > 0 ? ((successful / completed) * 100).toFixed(2) : 0
    };
  }

  getDateRangeForReportType(reportType) {
    const endDate = new Date();
    const startDate = new Date();

    switch (reportType) {
      case "weekly":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "monthly":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "quarterly":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "yearly":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    return { startDate, endDate };
  }

  async getStudentAttendanceData(studentId, dateRange) {
    return await Attendance.getStudentSummary(studentId, dateRange.startDate, dateRange.endDate);
  }

  async getStudentGradeData(studentId, dateRange) {
    return await Grade.find({
      student: studentId,
      examDate: { $gte: dateRange.startDate, $lte: dateRange.endDate },
      isPublished: true
    }).sort({ examDate: -1 });
  }

  async getStudentInterventionData(studentId, dateRange) {
    return await Intervention.find({
      student: studentId,
      createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate }
    }).sort({ createdAt: -1 });
  }

  generateRiskRecommendations(student) {
    const recommendations = [];

    if (student.attendancePercentage < 75) {
      recommendations.push({
        priority: "High",
        action: "Improve Attendance",
        description: "Implement daily attendance monitoring and parent communication"
      });
    }

    if (student.overallPercentage < 60) {
      recommendations.push({
        priority: "High",
        action: "Academic Support",
        description: "Provide remedial classes and peer tutoring"
      });
    }

    if (student.hasEconomicDistress) {
      recommendations.push({
        priority: "Medium",
        action: "Financial Aid",
        description: "Assess eligibility for scholarships and financial assistance"
      });
    }

    return recommendations;
  }
}

// Create singleton instance
const reportGenerator = new ReportGenerator();

// Export the report generation functions
export const generateReport = {
  attendanceReport: (options) => reportGenerator.attendanceReport(options),
  academicReport: (options) => reportGenerator.academicReport(options),
  riskAssessmentReport: (options) => reportGenerator.riskAssessmentReport(options),
  interventionReport: (options) => reportGenerator.interventionReport(options),
  schoolPerformanceReport: (options) => reportGenerator.schoolPerformanceReport(options),
  parentReport: (options) => reportGenerator.parentReport(options)
};

export default reportGenerator;