import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PDF Generator utility for creating PDF reports
 */

/**
 * Create a new PDF document with default settings
 */
export const createPDFDocument = (options = {}) => {
  const {
    size = "A4",
    margins = { top: 50, bottom: 50, left: 50, right: 50 },
    info = {}
  } = options;

  const doc = new PDFDocument({
    size,
    margins,
    info: {
      Title: info.title || "Report",
      Author: info.author || "Student Dropout Prevention System",
      Subject: info.subject || "Generated Report",
      Creator: "Student Dropout Prevention System",
      Producer: "Student Dropout Prevention System",
      CreationDate: new Date(),
      ...info
    }
  });

  return doc;
};

/**
 * Add header to PDF
 */
export const addHeader = (doc, title, subtitle = null, logoPath = null) => {
  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;

  // Add logo if provided
  if (logoPath && fs.existsSync(logoPath)) {
    doc.image(logoPath, margin, 30, { width: 50 });
  }

  // Add title
  doc.fontSize(20)
     .font("Helvetica-Bold")
     .fillColor("#1F2937")
     .text(title, logoPath ? margin + 60 : margin, 35, {
       width: pageWidth - (margin * 2) - (logoPath ? 60 : 0),
       align: "center"
     });

  // Add subtitle if provided
  if (subtitle) {
    doc.fontSize(14)
       .font("Helvetica")
       .fillColor("#6B7280")
       .text(subtitle, margin, doc.y + 5, {
         width: pageWidth - (margin * 2),
         align: "center"
       });
  }

  // Add line separator
  doc.moveTo(margin, doc.y + 15)
     .lineTo(pageWidth - margin, doc.y + 15)
     .strokeColor("#E5E7EB")
     .stroke();

  doc.moveDown(1);
  return doc;
};

/**
 * Add footer to PDF
 */
export const addFooter = (doc, text = null) => {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = doc.page.margins.left;

  // Save current position
  const currentY = doc.y;

  // Move to footer position
  doc.y = pageHeight - 50;

  // Add line separator
  doc.moveTo(margin, doc.y)
     .lineTo(pageWidth - margin, doc.y)
     .strokeColor("#E5E7EB")
     .stroke();

  // Add footer text
  const footerText = text || `Generated on ${new Date().toLocaleDateString()} | Student Dropout Prevention System`;
  doc.fontSize(8)
     .font("Helvetica")
     .fillColor("#9CA3AF")
     .text(footerText, margin, doc.y + 10, {
       width: pageWidth - (margin * 2),
       align: "center"
     });

  // Add page number
  doc.text(`Page ${doc.bufferedPageRange().count}`, pageWidth - margin - 50, doc.y - 10, {
    width: 50,
    align: "right"
  });

  // Restore position
  doc.y = currentY;
  return doc;
};

/**
 * Add table to PDF
 */
export const addTable = (doc, data, options = {}) => {
  const {
    headers,
    columnWidths,
    startY = doc.y,
    headerStyle = {
      fontSize: 10,
      font: "Helvetica-Bold",
      fillColor: "#374151",
      backgroundColor: "#F3F4F6"
    },
    rowStyle = {
      fontSize: 9,
      font: "Helvetica",
      fillColor: "#1F2937"
    },
    alternateRowColor = "#F9FAFB",
    borderColor = "#E5E7EB"
  } = options;

  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;
  const tableWidth = pageWidth - (margin * 2);
  
  // Calculate column widths if not provided
  const numColumns = headers.length;
  const defaultColumnWidth = tableWidth / numColumns;
  const colWidths = columnWidths || Array(numColumns).fill(defaultColumnWidth);

  let currentY = startY;
  const rowHeight = 25;

  // Draw header
  let currentX = margin;
  
  // Header background
  doc.rect(margin, currentY, tableWidth, rowHeight)
     .fillColor(headerStyle.backgroundColor)
     .fill();

  // Header text
  headers.forEach((header, index) => {
    doc.fontSize(headerStyle.fontSize)
       .font(headerStyle.font)
       .fillColor(headerStyle.fillColor)
       .text(header, currentX + 5, currentY + 8, {
         width: colWidths[index] - 10,
         align: "left",
         ellipsis: true
       });
    currentX += colWidths[index];
  });

  currentY += rowHeight;

  // Draw data rows
  data.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      currentY = doc.page.margins.top;
    }

    currentX = margin;

    // Alternate row background
    if (rowIndex % 2 === 1) {
      doc.rect(margin, currentY, tableWidth, rowHeight)
         .fillColor(alternateRowColor)
         .fill();
    }

    // Row data
    Object.values(row).forEach((cell, cellIndex) => {
      if (cellIndex < colWidths.length) {
        doc.fontSize(rowStyle.fontSize)
           .font(rowStyle.font)
           .fillColor(rowStyle.fillColor)
           .text(String(cell || ""), currentX + 5, currentY + 8, {
             width: colWidths[cellIndex] - 10,
             align: "left",
             ellipsis: true
           });
        currentX += colWidths[cellIndex];
      }
    });

    currentY += rowHeight;
  });

  // Draw table borders
  currentY = startY;
  
  // Horizontal lines
  for (let i = 0; i <= data.length + 1; i++) {
    doc.moveTo(margin, currentY)
       .lineTo(margin + tableWidth, currentY)
       .strokeColor(borderColor)
       .stroke();
    currentY += rowHeight;
  }

  // Vertical lines
  currentX = margin;
  for (let i = 0; i <= colWidths.length; i++) {
    doc.moveTo(currentX, startY)
       .lineTo(currentX, startY + (rowHeight * (data.length + 1)))
       .strokeColor(borderColor)
       .stroke();
    if (i < colWidths.length) {
      currentX += colWidths[i];
    }
  }

  doc.y = startY + (rowHeight * (data.length + 1)) + 10;
  return doc;
};

/**
 * Generate student report PDF
 */
export const generateStudentReportPDF = async (student, options = {}) => {
  const {
    includePhoto = true,
    includeRiskFactors = true,
    includeAttendance = true,
    includeGrades = true,
    includeInterventions = true
  } = options;

  const doc = createPDFDocument({
    info: {
      title: `Student Report - ${student.fullName}`,
      subject: `Comprehensive report for ${student.fullName}`
    }
  });

  // Add header
  addHeader(doc, "Student Report", `${student.fullName} (${student.rollNumber})`);

  // Student basic information
  doc.fontSize(14)
     .font("Helvetica-Bold")
     .fillColor("#1F2937")
     .text("Personal Information", { underline: true });

  doc.moveDown(0.5);

  const personalInfo = [
    ["Name", student.fullName],
    ["Roll Number", student.rollNumber],
    ["Class", `${student.class?.name || "N/A"} - ${student.section}`],
    ["Date of Birth", student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "N/A"],
    ["Gender", student.gender],
    ["Phone", student.phone || "N/A"],
    ["Email", student.email || "N/A"]
  ];

  personalInfo.forEach(([label, value]) => {
    doc.fontSize(10)
       .font("Helvetica-Bold")
       .text(`${label}: `, { continued: true })
       .font("Helvetica")
       .text(value);
  });

  doc.moveDown(1);

  // Family information
  doc.fontSize(14)
     .font("Helvetica-Bold")
     .text("Family Information", { underline: true });

  doc.moveDown(0.5);

  const familyInfo = [
    ["Father's Name", student.father?.name || "N/A"],
    ["Father's Phone", student.father?.phone || "N/A"],
    ["Mother's Name", student.mother?.name || "N/A"],
    ["Mother's Phone", student.mother?.phone || "N/A"],
    ["Family Income Level", student.familyIncomeLevel || "N/A"]
  ];

  familyInfo.forEach(([label, value]) => {
    doc.fontSize(10)
       .font("Helvetica-Bold")
       .text(`${label}: `, { continued: true })
       .font("Helvetica")
       .text(value);
  });

  doc.moveDown(1);

  // Academic performance
  if (includeGrades) {
    doc.fontSize(14)
       .font("Helvetica-Bold")
       .text("Academic Performance", { underline: true });

    doc.moveDown(0.5);

    const academicInfo = [
      ["Overall Percentage", `${student.overallPercentage || 0}%`],
      ["Failed Subjects", student.failedSubjectsCount || 0],
      ["Academic Trend", student.academicTrend || "Unknown"]
    ];

    academicInfo.forEach(([label, value]) => {
      doc.fontSize(10)
         .font("Helvetica-Bold")
         .text(`${label}: `, { continued: true })
         .font("Helvetica")
         .text(value);
    });

    doc.moveDown(1);
  }

  // Attendance information
  if (includeAttendance) {
    doc.fontSize(14)
       .font("Helvetica-Bold")
       .text("Attendance Record", { underline: true });

    doc.moveDown(0.5);

    const attendanceInfo = [
      ["Attendance Percentage", `${student.attendancePercentage || 0}%`],
      ["Total Days Present", student.totalDaysPresent || 0],
      ["Total Days Absent", student.totalDaysAbsent || 0],
      ["Consecutive Absences", student.consecutiveAbsences || 0]
    ];

    attendanceInfo.forEach(([label, value]) => {
      doc.fontSize(10)
         .font("Helvetica-Bold")
         .text(`${label}: `, { continued: true })
         .font("Helvetica")
         .text(value);
    });

    doc.moveDown(1);
  }

  // Risk assessment
  if (includeRiskFactors) {
    doc.fontSize(14)
       .font("Helvetica-Bold")
       .text("Risk Assessment", { underline: true });

    doc.moveDown(0.5);

    const riskInfo = [
      ["Risk Score", `${student.riskScore || 0}/100`],
      ["Risk Level", student.riskLevel || "Low"],
      ["Status", student.status || "Active"]
    ];

    riskInfo.forEach(([label, value]) => {
      doc.fontSize(10)
         .font("Helvetica-Bold")
         .text(`${label}: `, { continued: true })
         .font("Helvetica")
         .fillColor(getRiskColor(student.riskLevel))
         .text(value)
         .fillColor("#1F2937");
    });

    doc.moveDown(1);
  }

  // Add footer
  addFooter(doc);

  return doc;
};

/**
 * Generate attendance report PDF
 */
export const generateAttendanceReportPDF = async (attendanceData, options = {}) => {
  const {
    title = "Attendance Report",
    dateRange,
    className
  } = options;

  const doc = createPDFDocument({
    info: {
      title,
      subject: "Student attendance report"
    }
  });

  // Add header
  const subtitle = className ? `${className} - ${dateRange?.startDate} to ${dateRange?.endDate}` : 
                   `${dateRange?.startDate} to ${dateRange?.endDate}`;
  addHeader(doc, title, subtitle);

  // Prepare table data
  const headers = ["Roll No.", "Student Name", "Class", "Total Days", "Present", "Absent", "Attendance %", "Status"];
  
  const tableData = attendanceData.map(record => ({
    rollNumber: record.student?.rollNumber || "N/A",
    studentName: record.student?.fullName || "N/A",
    class: `${record.student?.class?.name || "N/A"}-${record.student?.section || "N/A"}`,
    totalDays: record.totalDays || 0,
    presentDays: record.presentDays || 0,
    absentDays: record.absentDays || 0,
    attendancePercentage: `${record.attendancePercentage || 0}%`,
    status: record.attendancePercentage >= 75 ? "Good" : record.attendancePercentage >= 60 ? "Average" : "Poor"
  }));

  // Add table
  addTable(doc, tableData, {
    headers,
    columnWidths: [60, 120, 60, 60, 50, 50, 70, 60]
  });

  // Add summary
  doc.moveDown(1);
  doc.fontSize(12)
     .font("Helvetica-Bold")
     .text("Summary", { underline: true });

  const totalStudents = attendanceData.length;
  const goodAttendance = attendanceData.filter(r => r.attendancePercentage >= 75).length;
  const averageAttendance = attendanceData.filter(r => r.attendancePercentage >= 60 && r.attendancePercentage < 75).length;
  const poorAttendance = attendanceData.filter(r => r.attendancePercentage < 60).length;

  doc.moveDown(0.5);
  doc.fontSize(10)
     .font("Helvetica")
     .text(`Total Students: ${totalStudents}`)
     .text(`Good Attendance (≥75%): ${goodAttendance}`)
     .text(`Average Attendance (60-74%): ${averageAttendance}`)
     .text(`Poor Attendance (<60%): ${poorAttendance}`);

  // Add footer
  addFooter(doc);

  return doc;
};

/**
 * Generate risk assessment report PDF
 */
export const generateRiskAssessmentReportPDF = async (riskData, options = {}) => {
  const {
    title = "Risk Assessment Report"
  } = options;

  const doc = createPDFDocument({
    info: {
      title,
      subject: "Student risk assessment report"
    }
  });

  // Add header
  addHeader(doc, title, "Student Dropout Risk Analysis");

  // Prepare table data
  const headers = ["Roll No.", "Student Name", "Class", "Risk Score", "Risk Level", "Primary Concerns"];
  
  const tableData = riskData.map(record => {
    const student = record.student || record;
    const primaryConcerns = [];
    
    if (record.riskFactors) {
      const factors = record.riskFactors;
      if (factors.attendance > 50) primaryConcerns.push("Attendance");
      if (factors.academic > 50) primaryConcerns.push("Academic");
      if (factors.financial > 50) primaryConcerns.push("Financial");
      if (factors.behavioral > 50) primaryConcerns.push("Behavioral");
    }

    return {
      rollNumber: student.rollNumber || "N/A",
      studentName: student.fullName || "N/A",
      class: `${student.class?.name || "N/A"}-${student.section || "N/A"}`,
      riskScore: `${record.totalRiskScore || student.riskScore || 0}/100`,
      riskLevel: record.riskLevel || student.riskLevel || "Low",
      primaryConcerns: primaryConcerns.join(", ") || "None"
    };
  });

  // Add table
  addTable(doc, tableData, {
    headers,
    columnWidths: [60, 120, 60, 70, 70, 150]
  });

  // Add summary
  doc.moveDown(1);
  doc.fontSize(12)
     .font("Helvetica-Bold")
     .text("Risk Distribution", { underline: true });

  const totalStudents = riskData.length;
  const criticalRisk = riskData.filter(r => (r.riskLevel || r.student?.riskLevel) === "Critical").length;
  const highRisk = riskData.filter(r => (r.riskLevel || r.student?.riskLevel) === "High").length;
  const mediumRisk = riskData.filter(r => (r.riskLevel || r.student?.riskLevel) === "Medium").length;
  const lowRisk = riskData.filter(r => (r.riskLevel || r.student?.riskLevel) === "Low").length;

  doc.moveDown(0.5);
  doc.fontSize(10)
     .font("Helvetica")
     .text(`Total Students: ${totalStudents}`)
     .fillColor("#7C3AED").text(`Critical Risk: ${criticalRisk}`, { continued: true })
     .fillColor("#1F2937").text(` (${((criticalRisk/totalStudents)*100).toFixed(1)}%)`)
     .fillColor("#EF4444").text(`High Risk: ${highRisk}`, { continued: true })
     .fillColor("#1F2937").text(` (${((highRisk/totalStudents)*100).toFixed(1)}%)`)
     .fillColor("#F59E0B").text(`Medium Risk: ${mediumRisk}`, { continued: true })
     .fillColor("#1F2937").text(` (${((mediumRisk/totalStudents)*100).toFixed(1)}%)`)
     .fillColor("#10B981").text(`Low Risk: ${lowRisk}`, { continued: true })
     .fillColor("#1F2937").text(` (${((lowRisk/totalStudents)*100).toFixed(1)}%)`);

  // Add footer
  addFooter(doc);

  return doc;
};

/**
 * Save PDF to buffer
 */
export const savePDFToBuffer = (doc) => {
  return new Promise((resolve, reject) => {
    const buffers = [];
    
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on("error", reject);
    
    doc.end();
  });
};

/**
 * Save PDF to file
 */
export const savePDFToFile = (doc, filePath) => {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    
    doc.pipe(stream);
    
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
    
    doc.end();
  });
};

/**
 * Get risk color based on risk level
 */
const getRiskColor = (riskLevel) => {
  switch (riskLevel) {
    case "Critical": return "#7C3AED";
    case "High": return "#EF4444";
    case "Medium": return "#F59E0B";
    case "Low": return "#10B981";
    default: return "#6B7280";
  }
};

export default {
  createPDFDocument,
  addHeader,
  addFooter,
  addTable,
  generateStudentReportPDF,
  generateAttendanceReportPDF,
  generateRiskAssessmentReportPDF,
  savePDFToBuffer,
  savePDFToFile
};