import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Excel Generator utility for creating Excel reports and exports
 */

/**
 * Create a new workbook with default styling
 */
export const createWorkbook = (title = "Report", author = "System") => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = author;
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastModifiedBy = author;
  workbook.title = title;
  
  return workbook;
};

/**
 * Apply header styling to a row
 */
export const applyHeaderStyle = (row) => {
  row.eachCell((cell) => {
    cell.font = {
      name: "Arial",
      size: 12,
      bold: true,
      color: { argb: "FFFFFF" }
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4F46E5" }
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center"
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  });
  
  row.height = 25;
  return row;
};

/**
 * Apply data row styling
 */
export const applyDataRowStyle = (row, isEven = false) => {
  row.eachCell((cell) => {
    cell.font = {
      name: "Arial",
      size: 10
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: isEven ? "F9FAFB" : "FFFFFF" }
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "left"
    };
    cell.border = {
      top: { style: "thin", color: { argb: "E5E7EB" } },
      left: { style: "thin", color: { argb: "E5E7EB" } },
      bottom: { style: "thin", color: { argb: "E5E7EB" } },
      right: { style: "thin", color: { argb: "E5E7EB" } }
    };
  });
  
  row.height = 20;
  return row;
};

/**
 * Generate student list Excel
 */
export const generateStudentListExcel = async (students, options = {}) => {
  const {
    includeRiskFactors = true,
    includeContactInfo = true,
    includeAcademics = true,
    filename = "student_list.xlsx"
  } = options;

  const workbook = createWorkbook("Student List", "Student Dropout Prevention System");
  const worksheet = workbook.addWorksheet("Students");

  // Define columns
  const columns = [
    { header: "Roll Number", key: "rollNumber", width: 15 },
    { header: "Name", key: "name", width: 25 },
    { header: "Class", key: "class", width: 10 },
    { header: "Section", key: "section", width: 10 },
    { header: "Gender", key: "gender", width: 10 },
    { header: "Date of Birth", key: "dateOfBirth", width: 15 },
  ];

  if (includeContactInfo) {
    columns.push(
      { header: "Phone", key: "phone", width: 15 },
      { header: "Email", key: "email", width: 25 },
      { header: "Father Name", key: "fatherName", width: 20 },
      { header: "Father Phone", key: "fatherPhone", width: 15 },
      { header: "Mother Name", key: "motherName", width: 20 },
      { header: "Mother Phone", key: "motherPhone", width: 15 }
    );
  }

  if (includeAcademics) {
    columns.push(
      { header: "Attendance %", key: "attendancePercentage", width: 15 },
      { header: "Overall %", key: "overallPercentage", width: 15 },
      { header: "Failed Subjects", key: "failedSubjects", width: 15 }
    );
  }

  if (includeRiskFactors) {
    columns.push(
      { header: "Risk Score", key: "riskScore", width: 12 },
      { header: "Risk Level", key: "riskLevel", width: 12 },
      { header: "Status", key: "status", width: 15 }
    );
  }

  worksheet.columns = columns;

  // Add header row
  const headerRow = worksheet.getRow(1);
  applyHeaderStyle(headerRow);

  // Add data rows
  students.forEach((student, index) => {
    const rowData = {
      rollNumber: student.rollNumber,
      name: student.fullName,
      class: student.class?.name || "N/A",
      section: student.section,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "N/A",
    };

    if (includeContactInfo) {
      rowData.phone = student.phone || "N/A";
      rowData.email = student.email || "N/A";
      rowData.fatherName = student.father?.name || "N/A";
      rowData.fatherPhone = student.father?.phone || "N/A";
      rowData.motherName = student.mother?.name || "N/A";
      rowData.motherPhone = student.mother?.phone || "N/A";
    }

    if (includeAcademics) {
      rowData.attendancePercentage = `${student.attendancePercentage || 0}%`;
      rowData.overallPercentage = `${student.overallPercentage || 0}%`;
      rowData.failedSubjects = student.failedSubjectsCount || 0;
    }

    if (includeRiskFactors) {
      rowData.riskScore = student.riskScore || 0;
      rowData.riskLevel = student.riskLevel || "Low";
      rowData.status = student.status || "Active";
    }

    const row = worksheet.addRow(rowData);
    applyDataRowStyle(row, index % 2 === 0);

    // Apply risk level color coding
    if (includeRiskFactors) {
      const riskCell = row.getCell("riskLevel");
      switch (student.riskLevel) {
        case "Critical":
          riskCell.font = { color: { argb: "7C3AED" }, bold: true };
          break;
        case "High":
          riskCell.font = { color: { argb: "EF4444" }, bold: true };
          break;
        case "Medium":
          riskCell.font = { color: { argb: "F59E0B" }, bold: true };
          break;
        case "Low":
          riskCell.font = { color: { argb: "10B981" }, bold: true };
          break;
      }
    }
  });

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    column.width = Math.max(column.width, 10);
  });

  return { workbook, filename };
};

/**
 * Generate attendance report Excel
 */
export const generateAttendanceReportExcel = async (attendanceData, options = {}) => {
  const {
    dateRange,
    className,
    filename = "attendance_report.xlsx"
  } = options;

  const workbook = createWorkbook("Attendance Report", "Student Dropout Prevention System");
  const worksheet = workbook.addWorksheet("Attendance");

  // Add title and date range
  worksheet.mergeCells("A1:F1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = `Attendance Report - ${className || "All Classes"}`;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: "center" };

  if (dateRange) {
    worksheet.mergeCells("A2:F2");
    const dateCell = worksheet.getCell("A2");
    dateCell.value = `Period: ${dateRange.startDate} to ${dateRange.endDate}`;
    dateCell.font = { size: 12 };
    dateCell.alignment = { horizontal: "center" };
  }

  // Define columns
  worksheet.columns = [
    { header: "Roll Number", key: "rollNumber", width: 15 },
    { header: "Student Name", key: "studentName", width: 25 },
    { header: "Class", key: "class", width: 10 },
    { header: "Total Days", key: "totalDays", width: 12 },
    { header: "Present Days", key: "presentDays", width: 12 },
    { header: "Absent Days", key: "absentDays", width: 12 },
    { header: "Attendance %", key: "attendancePercentage", width: 15 },
    { header: "Status", key: "status", width: 15 }
  ];

  // Add header row (starting from row 4)
  const headerRow = worksheet.getRow(4);
  headerRow.values = worksheet.columns.map(col => col.header);
  applyHeaderStyle(headerRow);

  // Add data rows
  attendanceData.forEach((record, index) => {
    const rowData = {
      rollNumber: record.student?.rollNumber || "N/A",
      studentName: record.student?.fullName || "N/A",
      class: `${record.student?.class?.name || "N/A"} - ${record.student?.section || "N/A"}`,
      totalDays: record.totalDays || 0,
      presentDays: record.presentDays || 0,
      absentDays: record.absentDays || 0,
      attendancePercentage: `${record.attendancePercentage || 0}%`,
      status: record.attendancePercentage >= 75 ? "Good" : record.attendancePercentage >= 60 ? "Average" : "Poor"
    };

    const row = worksheet.addRow(rowData);
    applyDataRowStyle(row, index % 2 === 0);

    // Color code attendance percentage
    const percentageCell = row.getCell("attendancePercentage");
    const statusCell = row.getCell("status");
    
    if (record.attendancePercentage >= 75) {
      percentageCell.font = { color: { argb: "10B981" }, bold: true };
      statusCell.font = { color: { argb: "10B981" }, bold: true };
    } else if (record.attendancePercentage >= 60) {
      percentageCell.font = { color: { argb: "F59E0B" }, bold: true };
      statusCell.font = { color: { argb: "F59E0B" }, bold: true };
    } else {
      percentageCell.font = { color: { argb: "EF4444" }, bold: true };
      statusCell.font = { color: { argb: "EF4444" }, bold: true };
    }
  });

  return { workbook, filename };
};

/**
 * Generate grade report Excel
 */
export const generateGradeReportExcel = async (gradeData, options = {}) => {
  const {
    examName,
    className,
    filename = "grade_report.xlsx"
  } = options;

  const workbook = createWorkbook("Grade Report", "Student Dropout Prevention System");
  const worksheet = workbook.addWorksheet("Grades");

  // Add title
  worksheet.mergeCells("A1:H1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = `Grade Report - ${examName || "Exam"} - ${className || "All Classes"}`;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: "center" };

  // Define columns
  worksheet.columns = [
    { header: "Roll Number", key: "rollNumber", width: 15 },
    { header: "Student Name", key: "studentName", width: 25 },
    { header: "Class", key: "class", width: 10 },
    { header: "Subject", key: "subject", width: 15 },
    { header: "Marks Obtained", key: "marksObtained", width: 15 },
    { header: "Max Marks", key: "maxMarks", width: 12 },
    { header: "Percentage", key: "percentage", width: 12 },
    { header: "Grade", key: "grade", width: 10 },
    { header: "Status", key: "status", width: 12 }
  ];

  // Add header row (starting from row 3)
  const headerRow = worksheet.getRow(3);
  headerRow.values = worksheet.columns.map(col => col.header);
  applyHeaderStyle(headerRow);

  // Add data rows
  gradeData.forEach((record, index) => {
    const rowData = {
      rollNumber: record.student?.rollNumber || "N/A",
      studentName: record.student?.fullName || "N/A",
      class: `${record.class?.name || "N/A"} - ${record.class?.section || "N/A"}`,
      subject: record.subject || "N/A",
      marksObtained: record.marksObtained || 0,
      maxMarks: record.maxMarks || 0,
      percentage: `${record.percentage || 0}%`,
      grade: record.grade || "F",
      status: record.isPassed ? "Pass" : "Fail"
    };

    const row = worksheet.addRow(rowData);
    applyDataRowStyle(row, index % 2 === 0);

    // Color code grades and status
    const gradeCell = row.getCell("grade");
    const statusCell = row.getCell("status");
    
    if (record.isPassed) {
      gradeCell.font = { color: { argb: "10B981" }, bold: true };
      statusCell.font = { color: { argb: "10B981" }, bold: true };
    } else {
      gradeCell.font = { color: { argb: "EF4444" }, bold: true };
      statusCell.font = { color: { argb: "EF4444" }, bold: true };
    }
  });

  return { workbook, filename };
};

/**
 * Generate risk assessment Excel
 */
export const generateRiskAssessmentExcel = async (riskData, options = {}) => {
  const {
    filename = "risk_assessment.xlsx"
  } = options;

  const workbook = createWorkbook("Risk Assessment Report", "Student Dropout Prevention System");
  const worksheet = workbook.addWorksheet("Risk Assessment");

  // Add title
  worksheet.mergeCells("A1:J1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "Student Risk Assessment Report";
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: "center" };

  // Define columns
  worksheet.columns = [
    { header: "Roll Number", key: "rollNumber", width: 15 },
    { header: "Student Name", key: "studentName", width: 25 },
    { header: "Class", key: "class", width: 10 },
    { header: "Risk Score", key: "riskScore", width: 12 },
    { header: "Risk Level", key: "riskLevel", width: 12 },
    { header: "Attendance Risk", key: "attendanceRisk", width: 15 },
    { header: "Academic Risk", key: "academicRisk", width: 15 },
    { header: "Financial Risk", key: "financialRisk", width: 15 },
    { header: "Behavioral Risk", key: "behavioralRisk", width: 15 },
    { header: "Recommendations", key: "recommendations", width: 30 }
  ];

  // Add header row (starting from row 3)
  const headerRow = worksheet.getRow(3);
  headerRow.values = worksheet.columns.map(col => col.header);
  applyHeaderStyle(headerRow);

  // Add data rows
  riskData.forEach((record, index) => {
    const student = record.student || record;
    const riskFactors = record.riskFactors || {};
    
    const rowData = {
      rollNumber: student.rollNumber || "N/A",
      studentName: student.fullName || "N/A",
      class: `${student.class?.name || "N/A"} - ${student.section || "N/A"}`,
      riskScore: record.totalRiskScore || student.riskScore || 0,
      riskLevel: record.riskLevel || student.riskLevel || "Low",
      attendanceRisk: riskFactors.attendance || 0,
      academicRisk: riskFactors.academic || 0,
      financialRisk: riskFactors.financial || 0,
      behavioralRisk: riskFactors.behavioral || 0,
      recommendations: record.recommendations?.slice(0, 2).map(r => r.action).join("; ") || "None"
    };

    const row = worksheet.addRow(rowData);
    applyDataRowStyle(row, index % 2 === 0);

    // Color code risk levels
    const riskLevelCell = row.getCell("riskLevel");
    const riskScoreCell = row.getCell("riskScore");
    
    switch (record.riskLevel || student.riskLevel) {
      case "Critical":
        riskLevelCell.font = { color: { argb: "7C3AED" }, bold: true };
        riskScoreCell.font = { color: { argb: "7C3AED" }, bold: true };
        break;
      case "High":
        riskLevelCell.font = { color: { argb: "EF4444" }, bold: true };
        riskScoreCell.font = { color: { argb: "EF4444" }, bold: true };
        break;
      case "Medium":
        riskLevelCell.font = { color: { argb: "F59E0B" }, bold: true };
        riskScoreCell.font = { color: { argb: "F59E0B" }, bold: true };
        break;
      case "Low":
        riskLevelCell.font = { color: { argb: "10B981" }, bold: true };
        riskScoreCell.font = { color: { argb: "10B981" }, bold: true };
        break;
    }
  });

  return { workbook, filename };
};

/**
 * Generate intervention report Excel
 */
export const generateInterventionReportExcel = async (interventionData, options = {}) => {
  const {
    filename = "intervention_report.xlsx"
  } = options;

  const workbook = createWorkbook("Intervention Report", "Student Dropout Prevention System");
  const worksheet = workbook.addWorksheet("Interventions");

  // Add title
  worksheet.mergeCells("A1:I1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "Student Intervention Report";
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: "center" };

  // Define columns
  worksheet.columns = [
    { header: "Student Name", key: "studentName", width: 25 },
    { header: "Roll Number", key: "rollNumber", width: 15 },
    { header: "Intervention Type", key: "interventionType", width: 20 },
    { header: "Title", key: "title", width: 25 },
    { header: "Start Date", key: "startDate", width: 15 },
    { header: "End Date", key: "endDate", width: 15 },
    { header: "Status", key: "status", width: 15 },
    { header: "Outcome", key: "outcome", width: 15 },
    { header: "Effectiveness", key: "effectiveness", width: 15 }
  ];

  // Add header row (starting from row 3)
  const headerRow = worksheet.getRow(3);
  headerRow.values = worksheet.columns.map(col => col.header);
  applyHeaderStyle(headerRow);

  // Add data rows
  interventionData.forEach((intervention, index) => {
    const rowData = {
      studentName: intervention.student?.fullName || "N/A",
      rollNumber: intervention.student?.rollNumber || "N/A",
      interventionType: intervention.type || "N/A",
      title: intervention.title || "N/A",
      startDate: intervention.startDate ? new Date(intervention.startDate).toLocaleDateString() : "N/A",
      endDate: intervention.endDate ? new Date(intervention.endDate).toLocaleDateString() : "N/A",
      status: intervention.status || "N/A",
      outcome: intervention.outcome || "Not Evaluated",
      effectiveness: intervention.effectiveness ? `${intervention.effectiveness}%` : "N/A"
    };

    const row = worksheet.addRow(rowData);
    applyDataRowStyle(row, index % 2 === 0);

    // Color code status and outcome
    const statusCell = row.getCell("status");
    const outcomeCell = row.getCell("outcome");
    
    switch (intervention.status) {
      case "Completed":
        statusCell.font = { color: { argb: "10B981" }, bold: true };
        break;
      case "In Progress":
        statusCell.font = { color: { argb: "3B82F6" }, bold: true };
        break;
      case "Cancelled":
      case "Failed":
        statusCell.font = { color: { argb: "EF4444" }, bold: true };
        break;
    }

    switch (intervention.outcome) {
      case "Successful":
        outcomeCell.font = { color: { argb: "10B981" }, bold: true };
        break;
      case "Partially Successful":
        outcomeCell.font = { color: { argb: "F59E0B" }, bold: true };
        break;
      case "Not Successful":
        outcomeCell.font = { color: { argb: "EF4444" }, bold: true };
        break;
    }
  });

  return { workbook, filename };
};

/**
 * Save workbook to buffer
 */
export const saveWorkbookToBuffer = async (workbook) => {
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * Save workbook to file
 */
export const saveWorkbookToFile = async (workbook, filePath) => {
  await workbook.xlsx.writeFile(filePath);
  return filePath;
};

export default {
  createWorkbook,
  applyHeaderStyle,
  applyDataRowStyle,
  generateStudentListExcel,
  generateAttendanceReportExcel,
  generateGradeReportExcel,
  generateRiskAssessmentExcel,
  generateInterventionReportExcel,
  saveWorkbookToBuffer,
  saveWorkbookToFile
};