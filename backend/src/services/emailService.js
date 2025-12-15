import nodemailer from "nodemailer";
import logger from "../utils/logger.js";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter configuration only if email is enabled
if (process.env.ENABLE_EMAIL_NOTIFICATIONS === "true") {
  transporter.verify((error, success) => {
    if (error) {
      logger.error("Email transporter configuration error:", error);
    } else {
      logger.info("✅ Email service is ready to send messages");
    }
  });
}

/**
 * Send email
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  attachments = [],
}) => {
  try {
    // Check if email is enabled
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== "true") {
      logger.info("Email notifications are disabled");
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(
      `Email sent successfully to ${to}. Message ID: ${info.messageId}`
    );

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    logger.error("Email sending error:", {
      error: error.message,
      to: to,
    });

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send bulk emails
 */
export const sendBulkEmails = async (emails) => {
  try {
    const results = await Promise.allSettled(
      emails.map((email) =>
        sendEmail({
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
        })
      )
    );

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.length - successful;

    logger.info(`Bulk emails sent: ${successful} successful, ${failed} failed`);

    return {
      total: emails.length,
      successful,
      failed,
      results,
    };
  } catch (error) {
    logger.error("Bulk email error:", error);
    throw error;
  }
};

/**
 * Send email with template
 */
export const sendTemplateEmail = async ({ to, template, variables }) => {
  try {
    const emailTemplates = {
      welcome: {
        subject: "Welcome to Student Dropout Prevention System",
        html: (vars) => `
          <h2>Welcome ${vars.userName}!</h2>
          <p>Your account has been successfully created.</p>
          <p>Role: ${vars.role}</p>
          <p>Login to get started: <a href="${vars.loginUrl}">Login Here</a></p>
        `,
      },

      attendanceReport: {
        subject: "Weekly Attendance Report - {studentName}",
        html: (vars) => `
          <h2>Attendance Report</h2>
          <p>Student: ${vars.studentName} (${vars.rollNumber})</p>
          <p>Week: ${vars.week}</p>
          <p>Present: ${vars.present} days</p>
          <p>Absent: ${vars.absent} days</p>
          <p>Attendance Percentage: ${vars.percentage}%</p>
        `,
      },

      gradeReport: {
        subject: "Academic Performance Report - {studentName}",
        html: (vars) => `
          <h2>Academic Performance Report</h2>
          <p>Student: ${vars.studentName} (${vars.rollNumber})</p>
          <p>Exam: ${vars.examName}</p>
          <p>Overall Percentage: ${vars.percentage}%</p>
          <p>Grade: ${vars.grade}</p>
          <p>Detailed report is attached.</p>
        `,
      },

      riskAlert: {
        subject: "URGENT: Student At-Risk Alert - {studentName}",
        html: (vars) => `
          <h2 style="color: #DC2626;">⚠️ Student At-Risk Alert</h2>
          <p>Student: <strong>${vars.studentName}</strong> (${
          vars.rollNumber
        })</p>
          <p>Current Risk Level: <strong style="color: ${vars.riskColor};">${
          vars.riskLevel
        }</strong></p>
          <p>Risk Score: ${vars.riskScore}/100</p>
          <p>Primary Concerns:</p>
          <ul>
            ${vars.concerns.map((c) => `<li>${c}</li>`).join("")}
          </ul>
          <p>Immediate action required. Please contact the school counselor.</p>
        `,
      },

      interventionScheduled: {
        subject: "Intervention Session Scheduled - {studentName}",
        html: (vars) => `
          <h2>Intervention Session Scheduled</h2>
          <p>Dear ${vars.parentName},</p>
          <p>A ${vars.interventionType} session has been scheduled for ${vars.studentName}.</p>
          <p><strong>Date:</strong> ${vars.date}</p>
          <p><strong>Time:</strong> ${vars.time}</p>
          <p><strong>Location:</strong> ${vars.location}</p>
          <p><strong>Counselor:</strong> ${vars.counselorName}</p>
          <p>Your presence is required. Please confirm attendance.</p>
        `,
      },

      parentMeeting: {
        subject: "Parent Meeting Request - {studentName}",
        html: (vars) => `
          <h2>Parent Meeting Request</h2>
          <p>Dear Parent,</p>
          <p>We would like to schedule a meeting to discuss ${vars.studentName}'s progress.</p>
          <p><strong>Date:</strong> ${vars.date}</p>
          <p><strong>Time:</strong> ${vars.time}</p>
          <p><strong>Venue:</strong> ${vars.venue}</p>
          <p><strong>Agenda:</strong> ${vars.agenda}</p>
          <p>Your attendance is important. Please confirm.</p>
          <p>Contact: ${vars.contactNumber}</p>
        `,
      },
    };

    if (!emailTemplates[template]) {
      throw new Error(`Template '${template}' not found`);
    }

    const templateData = emailTemplates[template];
    let subject = templateData.subject;

    // Replace variables in subject
    for (const [key, value] of Object.entries(variables)) {
      subject = subject.replace(`{${key}}`, value);
    }

    const html = templateData.html(variables);

    return await sendEmail({
      to,
      subject,
      html,
      text: html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
    });
  } catch (error) {
    logger.error("Template email error:", error);
    throw error;
  }
};

/**
 * Send email with PDF attachment
 */
export const sendEmailWithPDF = async ({
  to,
  subject,
  message,
  pdfBuffer,
  pdfFilename,
}) => {
  try {
    return await sendEmail({
      to,
      subject,
      html: message,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
  } catch (error) {
    logger.error("Email with PDF error:", error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async ({ to, resetUrl, userName }) => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { color: #DC2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>Hello ${userName},</p>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p class="warning">If you didn't request this, please ignore this email.</p>
          <p>For security reasons, do not share this link with anyone.</p>
        </div>
      </body>
      </html>
    `;

    return await sendEmail({
      to,
      subject: "Password Reset Request",
      html,
      text: `Reset your password: ${resetUrl}`,
    });
  } catch (error) {
    logger.error("Password reset email error:", error);
    throw error;
  }
};

/**
 * Validate email address
 */
export const validateEmail = (email) => {
  const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return regex.test(email);
};

export default {
  sendEmail,
  sendBulkEmails,
  sendTemplateEmail,
  sendEmailWithPDF,
  sendPasswordResetEmail,
  validateEmail,
};