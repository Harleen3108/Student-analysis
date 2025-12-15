import cron from "node-cron";
import { generateReport } from "../services/reportGenerator.js";
import { sendEmail } from "../services/emailService.js";
import Student from "../models/Student.js";
import Class from "../models/Class.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";

/**
 * Generate and send weekly attendance reports
 */
export const generateWeeklyAttendanceReports = async () => {
  try {
    logger.info("Starting weekly attendance report generation...");
    
    // Get all active classes
    const classes = await Class.find({ isActive: true })
      .populate("classTeacher", "firstName lastName email");

    let reportsGenerated = 0;
    let reportsFailed = 0;

    for (const classDoc of classes) {
      try {
        // Calculate date range for the past week
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        // Generate attendance report for the class
        const report = await generateReport.attendanceReport({
          classId: classDoc._id,
          dateRange: { startDate, endDate },
          format: "pdf",
          groupBy: "student",
          generatedBy: "system",
        });

        // Send report to class teacher
        if (classDoc.classTeacher && classDoc.classTeacher.email) {
          await sendEmail({
            to: classDoc.classTeacher.email,
            subject: `Weekly Attendance Report - ${classDoc.name} ${classDoc.section}`,
            html: generateAttendanceReportEmail(classDoc, report, startDate, endDate),
            attachments: [
              {
                filename: report.filename,
                path: report.filePath,
                contentType: "application/pdf",
              },
            ],
          });

          logger.info(`Weekly attendance report sent to ${classDoc.classTeacher.email} for class ${classDoc.name}-${classDoc.section}`);
        }

        reportsGenerated++;
      } catch (error) {
        reportsFailed++;
        logger.error(`Failed to generate weekly attendance report for class ${classDoc.name}-${classDoc.section}:`, error);
      }
    }

    logger.info(`Weekly attendance reports completed: ${reportsGenerated} generated, ${reportsFailed} failed`);
    
    return { reportsGenerated, reportsFailed };
  } catch (error) {
    logger.error("Error in weekly attendance report generation:", error);
    throw error;
  }
};

/**
 * Generate and send monthly performance reports
 */
export const generateMonthlyPerformanceReports = async () => {
  try {
    logger.info("Starting monthly performance report generation...");
    
    // Get all administrators
    const admins = await User.find({ role: "admin", isActive: true });
    
    // Calculate date range for the past month
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    let reportsGenerated = 0;
    let reportsFailed = 0;

    for (const admin of admins) {
      try {
        // Generate comprehensive school performance report
        const report = await generateReport.schoolPerformanceReport({
          dateRange: { startDate, endDate },
          format: "pdf",
          includeAttendance: true,
          includeGrades: true,
          includeRiskAnalysis: true,
          includeInterventions: true,
          generatedBy: "system",
        });

        // Send report to admin
        await sendEmail({
          to: admin.email,
          subject: `Monthly School Performance Report - ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
          html: generatePerformanceReportEmail(admin, report, startDate, endDate),
          attachments: [
            {
              filename: report.filename,
              path: report.filePath,
              contentType: "application/pdf",
            },
          ],
        });

        logger.info(`Monthly performance report sent to ${admin.email}`);
        reportsGenerated++;
      } catch (error) {
        reportsFailed++;
        logger.error(`Failed to generate monthly performance report for admin ${admin.email}:`, error);
      }
    }

    logger.info(`Monthly performance reports completed: ${reportsGenerated} generated, ${reportsFailed} failed`);
    
    return { reportsGenerated, reportsFailed };
  } catch (error) {
    logger.error("Error in monthly performance report generation:", error);
    throw error;
  }
};

/**
 * Generate and send parent progress reports
 */
export const generateParentProgressReports = async () => {
  try {
    logger.info("Starting parent progress report generation...");
    
    // Get all parents with children
    const parents = await User.find({ 
      role: "parent", 
      isActive: true,
      children: { $exists: true, $not: { $size: 0 } }
    }).populate("children", "firstName lastName rollNumber riskLevel");

    let reportsGenerated = 0;
    let reportsFailed = 0;

    for (const parent of parents) {
      try {
        for (const child of parent.children) {
          // Generate individual student report for parent
          const report = await generateReport.parentReport({
            studentId: child._id,
            reportType: "monthly",
            format: "pdf",
            includePhotos: false,
            generatedBy: "system",
          });

          // Send report to parent
          await sendEmail({
            to: parent.email,
            subject: `Monthly Progress Report - ${child.firstName} ${child.lastName}`,
            html: generateParentReportEmail(parent, child, report),
            attachments: [
              {
                filename: report.filename,
                path: report.filePath,
                contentType: "application/pdf",
              },
            ],
          });

          logger.info(`Parent progress report sent to ${parent.email} for child ${child.firstName} ${child.lastName}`);
        }
        
        reportsGenerated++;
      } catch (error) {
        reportsFailed++;
        logger.error(`Failed to generate parent progress report for ${parent.email}:`, error);
      }
    }

    logger.info(`Parent progress reports completed: ${reportsGenerated} generated, ${reportsFailed} failed`);
    
    return { reportsGenerated, reportsFailed };
  } catch (error) {
    logger.error("Error in parent progress report generation:", error);
    throw error;
  }
};

/**
 * Generate and send risk assessment alerts
 */
export const generateRiskAssessmentAlerts = async () => {
  try {
    logger.info("Starting risk assessment alert generation...");
    
    // Get high-risk and critical students
    const highRiskStudents = await Student.find({
      riskLevel: { $in: ["High", "Critical"] },
      isActive: true,
    }).populate("class", "name section classTeacher");

    if (highRiskStudents.length === 0) {
      logger.info("No high-risk students found for alerts");
      return { alertsSent: 0 };
    }

    // Get all counselors and admins
    const recipients = await User.find({
      role: { $in: ["admin", "counselor"] },
      isActive: true,
    });

    // Generate risk assessment report
    const report = await generateReport.riskAssessmentReport({
      riskLevel: ["High", "Critical"],
      includeRecommendations: true,
      format: "pdf",
      sortBy: "riskScore",
      generatedBy: "system",
    });

    let alertsSent = 0;

    for (const recipient of recipients) {
      try {
        await sendEmail({
          to: recipient.email,
          subject: `⚠️ High-Risk Students Alert - ${highRiskStudents.length} Students Need Attention`,
          html: generateRiskAlertEmail(recipient, highRiskStudents, report),
          attachments: [
            {
              filename: report.filename,
              path: report.filePath,
              contentType: "application/pdf",
            },
          ],
        });

        alertsSent++;
        logger.info(`Risk assessment alert sent to ${recipient.email}`);
      } catch (error) {
        logger.error(`Failed to send risk alert to ${recipient.email}:`, error);
      }
    }

    logger.info(`Risk assessment alerts completed: ${alertsSent} alerts sent`);
    
    return { alertsSent, highRiskCount: highRiskStudents.length };
  } catch (error) {
    logger.error("Error in risk assessment alert generation:", error);
    throw error;
  }
};

/**
 * Generate and send intervention effectiveness reports
 */
export const generateInterventionEffectivenessReports = async () => {
  try {
    logger.info("Starting intervention effectiveness report generation...");
    
    // Get all counselors and admins
    const recipients = await User.find({
      role: { $in: ["admin", "counselor"] },
      isActive: true,
    });

    // Calculate date range for the past quarter
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);

    // Generate intervention effectiveness report
    const report = await generateReport.interventionReport({
      dateRange: { startDate, endDate },
      format: "pdf",
      includeOutcomes: true,
      generatedBy: "system",
    });

    let reportsGenerated = 0;

    for (const recipient of recipients) {
      try {
        await sendEmail({
          to: recipient.email,
          subject: `Quarterly Intervention Effectiveness Report`,
          html: generateInterventionReportEmail(recipient, report, startDate, endDate),
          attachments: [
            {
              filename: report.filename,
              path: report.filePath,
              contentType: "application/pdf",
            },
          ],
        });

        reportsGenerated++;
        logger.info(`Intervention effectiveness report sent to ${recipient.email}`);
      } catch (error) {
        logger.error(`Failed to send intervention report to ${recipient.email}:`, error);
      }
    }

    logger.info(`Intervention effectiveness reports completed: ${reportsGenerated} reports sent`);
    
    return { reportsGenerated };
  } catch (error) {
    logger.error("Error in intervention effectiveness report generation:", error);
    throw error;
  }
};

// Email template generators
const generateAttendanceReportEmail = (classDoc, report, startDate, endDate) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Weekly Attendance Report</h2>
        </div>
        <div class="content">
          <p>Dear ${classDoc.classTeacher.firstName} ${classDoc.classTeacher.lastName},</p>
          <p>Please find attached the weekly attendance report for your class <strong>${classDoc.name} - ${classDoc.section}</strong>.</p>
          <p><strong>Report Period:</strong> ${startDate.toDateString()} to ${endDate.toDateString()}</p>
          <p>This report includes detailed attendance information for all students in your class.</p>
          <p>Please review the report and take necessary actions for students with poor attendance.</p>
        </div>
        <div class="footer">
          <p>This is an automated report from Student Dropout Prevention System.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generatePerformanceReportEmail = (admin, report, startDate, endDate) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Monthly School Performance Report</h2>
        </div>
        <div class="content">
          <p>Dear ${admin.firstName} ${admin.lastName},</p>
          <p>Please find attached the monthly school performance report.</p>
          <p><strong>Report Period:</strong> ${startDate.toDateString()} to ${endDate.toDateString()}</p>
          <p>This comprehensive report includes:</p>
          <ul>
            <li>Overall attendance statistics</li>
            <li>Academic performance trends</li>
            <li>Risk assessment summary</li>
            <li>Intervention effectiveness</li>
            <li>Key performance indicators</li>
          </ul>
        </div>
        <div class="footer">
          <p>This is an automated report from Student Dropout Prevention System.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateParentReportEmail = (parent, child, report) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .risk-low { color: #10B981; }
        .risk-medium { color: #F59E0B; }
        .risk-high { color: #EF4444; }
        .risk-critical { color: #7C3AED; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Monthly Progress Report</h2>
        </div>
        <div class="content">
          <p>Dear ${parent.firstName} ${parent.lastName},</p>
          <p>Please find attached the monthly progress report for your child <strong>${child.firstName} ${child.lastName}</strong> (Roll No: ${child.rollNumber}).</p>
          <p><strong>Current Risk Level:</strong> <span class="risk-${child.riskLevel.toLowerCase()}">${child.riskLevel}</span></p>
          <p>This report includes detailed information about your child's:</p>
          <ul>
            <li>Attendance record</li>
            <li>Academic performance</li>
            <li>Behavioral observations</li>
            <li>Risk assessment</li>
            <li>Recommendations for improvement</li>
          </ul>
          <p>If you have any questions or concerns, please contact the school.</p>
        </div>
        <div class="footer">
          <p>This is an automated report from Student Dropout Prevention System.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateRiskAlertEmail = (recipient, highRiskStudents, report) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .alert { background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>⚠️ High-Risk Students Alert</h2>
        </div>
        <div class="content">
          <p>Dear ${recipient.firstName} ${recipient.lastName},</p>
          <div class="alert">
            <strong>URGENT ATTENTION REQUIRED:</strong> ${highRiskStudents.length} students are currently classified as high-risk or critical for dropout.
          </div>
          <p>Please find attached the detailed risk assessment report with:</p>
          <ul>
            <li>Complete list of high-risk students</li>
            <li>Risk factor analysis</li>
            <li>Recommended interventions</li>
            <li>Priority action items</li>
          </ul>
          <p><strong>Immediate action is recommended</strong> to prevent potential dropouts.</p>
        </div>
        <div class="footer">
          <p>This is an automated alert from Student Dropout Prevention System.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateInterventionReportEmail = (recipient, report, startDate, endDate) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Quarterly Intervention Effectiveness Report</h2>
        </div>
        <div class="content">
          <p>Dear ${recipient.firstName} ${recipient.lastName},</p>
          <p>Please find attached the quarterly intervention effectiveness report.</p>
          <p><strong>Report Period:</strong> ${startDate.toDateString()} to ${endDate.toDateString()}</p>
          <p>This report provides insights into:</p>
          <ul>
            <li>Intervention success rates</li>
            <li>Student outcome improvements</li>
            <li>Cost-effectiveness analysis</li>
            <li>Best practices and recommendations</li>
          </ul>
        </div>
        <div class="footer">
          <p>This is an automated report from Student Dropout Prevention System.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Schedule all report generation jobs
export const scheduleReportJobs = () => {
  // Weekly attendance reports - Every Monday at 8 AM
  cron.schedule("0 8 * * 1", async () => {
    if (process.env.ENABLE_CRON_JOBS === "true") {
      try {
        await generateWeeklyAttendanceReports();
      } catch (error) {
        logger.error("Weekly attendance report job failed:", error);
      }
    }
  });

  // Monthly performance reports - First day of month at 9 AM
  cron.schedule("0 9 1 * *", async () => {
    if (process.env.ENABLE_CRON_JOBS === "true") {
      try {
        await generateMonthlyPerformanceReports();
      } catch (error) {
        logger.error("Monthly performance report job failed:", error);
      }
    }
  });

  // Parent progress reports - 15th of every month at 10 AM
  cron.schedule("0 10 15 * *", async () => {
    if (process.env.ENABLE_CRON_JOBS === "true") {
      try {
        await generateParentProgressReports();
      } catch (error) {
        logger.error("Parent progress report job failed:", error);
      }
    }
  });

  // Risk assessment alerts - Every day at 7 AM
  cron.schedule("0 7 * * *", async () => {
    if (process.env.ENABLE_CRON_JOBS === "true") {
      try {
        await generateRiskAssessmentAlerts();
      } catch (error) {
        logger.error("Risk assessment alert job failed:", error);
      }
    }
  });

  // Intervention effectiveness reports - First day of quarter at 11 AM
  cron.schedule("0 11 1 1,4,7,10 *", async () => {
    if (process.env.ENABLE_CRON_JOBS === "true") {
      try {
        await generateInterventionEffectivenessReports();
      } catch (error) {
        logger.error("Intervention effectiveness report job failed:", error);
      }
    }
  });

  logger.info("Scheduled report jobs initialized");
};

export default {
  generateWeeklyAttendanceReports,
  generateMonthlyPerformanceReports,
  generateParentProgressReports,
  generateRiskAssessmentAlerts,
  generateInterventionEffectivenessReports,
  scheduleReportJobs,
};