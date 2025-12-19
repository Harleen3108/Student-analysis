import Student from '../models/Student.js';
import User from '../models/User.js';
import { sendEmail } from '../services/emailService.js';
import { createNotification } from '../services/notificationService.js';
import logger from '../utils/logger.js';
import twilio from 'twilio';
import PDFDocument from 'pdfkit';

// Initialize Twilio client lazily
const getTwilioClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    logger.warn('⚠️ Twilio credentials not found in environment variables');
    return null;
  }
  
  try {
    return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (error) {
    logger.error('❌ Failed to initialize Twilio:', error);
    return null;
  }
};

/**
 * Send email to parent
 */
export const sendEmailToParent = async (req, res) => {
  try {
    const { studentId, subject, message, includeReport, reportType } = req.body;

    // Get student and parent
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const parent = await User.findOne({ role: 'parent', children: studentId });
    if (!parent || !parent.email) {
      return res.status(404).json({ success: false, message: 'Parent email not found' });
    }

    // Prepare email content
    let emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">Student Dropout Prevention System</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <p>Dear ${parent.firstName} ${parent.lastName},</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="margin-top: 0;">Student Information</h3>
            <p><strong>Name:</strong> ${student.firstName} ${student.lastName}</p>
            <p><strong>Roll Number:</strong> ${student.rollNumber}</p>
            <p><strong>Class:</strong> ${student.section}</p>
            <p><strong>Attendance:</strong> ${student.attendancePercentage}%</p>
            <p><strong>Academic Score:</strong> ${student.overallPercentage}%</p>
          </div>
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            This message was sent by ${req.user.firstName} ${req.user.lastName} (${req.user.role})
          </p>
        </div>
      </div>
    `;

    // Send email
    await sendEmail({
      to: parent.email,
      subject: subject,
      html: emailHTML
    });

    // Create in-app notification
    await createNotification({
      recipientId: parent._id,
      type: 'communication',
      title: subject,
      message: message.substring(0, 200),
      priority: 'normal',
      channels: {
        inApp: { enabled: true },
        email: { enabled: false }, // Already sent
        sms: { enabled: false }
      },
      metadata: {
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`,
        from: `${req.user.firstName} ${req.user.lastName}`,
        type: 'email'
      }
    });

    logger.info(`✅ Email sent to parent: ${parent.email} for student: ${student.rollNumber}`);

    res.json({
      success: true,
      message: 'Email sent successfully to parent'
    });

  } catch (error) {
    logger.error('Error sending email to parent:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send email'
    });
  }
};

/**
 * Send SMS to parent
 */
export const sendSMSToParent = async (req, res) => {
  try {
    logger.info('📱 SMS request received:', { studentId: req.body.studentId, user: req.user?.email });
    const { studentId, message } = req.body;

    // Validate required fields
    if (!studentId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and message are required'
      });
    }

    // Get Twilio client
    const twilioClient = getTwilioClient();
    if (!twilioClient) {
      logger.warn('⚠️ Twilio not configured');
      return res.status(503).json({
        success: false,
        message: 'SMS service not configured. Please contact administrator.'
      });
    }

    // Get student and parent
    const student = await Student.findById(studentId);
    if (!student) {
      logger.error('❌ Student not found:', studentId);
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const parent = await User.findOne({ role: 'parent', children: studentId });
    if (!parent || !parent.phone) {
      logger.error('❌ Parent phone not found for student:', studentId);
      return res.status(404).json({ success: false, message: 'Parent phone not found' });
    }

    // Send SMS
    const smsMessage = `
${message}

Student: ${student.firstName} ${student.lastName}
From: ${req.user.firstName} ${req.user.lastName}
- Student Dropout Prevention System
    `.trim();

    logger.info(`📱 Sending SMS to ${parent.phone}...`);
    
    await twilioClient.messages.create({
      body: smsMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: parent.phone
    });

    // Create in-app notification
    await createNotification({
      recipientId: parent._id,
      type: 'communication',
      title: 'SMS Message Received',
      message: message.substring(0, 200),
      priority: 'normal',
      channels: {
        inApp: { enabled: true },
        email: { enabled: false },
        sms: { enabled: false } // Already sent
      },
      metadata: {
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`,
        from: `${req.user.firstName} ${req.user.lastName}`,
        type: 'sms'
      }
    });

    logger.info(`✅ SMS sent to parent: ${parent.phone} for student: ${student.rollNumber}`);

    res.json({
      success: true,
      message: 'SMS sent successfully to parent'
    });

  } catch (error) {
    logger.error('Error sending SMS to parent:', error);
    
    // Check if it's a Twilio authentication error
    if (error.code === 20003 || error.status === 401) {
      return res.status(503).json({
        success: false,
        message: 'SMS service authentication failed. Please check Twilio credentials or use email instead.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send SMS'
    });
  }
};

/**
 * Send report to parent
 */
export const sendReportToParent = async (req, res) => {
  try {
    logger.info('📄 Report request received:', { studentId: req.body.studentId, reportType: req.body.reportType, user: req.user?.email });
    const { studentId, reportType, message } = req.body;

    // Validate required fields
    if (!studentId || !reportType) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and report type are required'
      });
    }

    // Get student and parent
    const student = await Student.findById(studentId);
    if (!student) {
      logger.error('❌ Student not found:', studentId);
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const parent = await User.findOne({ role: 'parent', children: studentId });
    if (!parent || !parent.email) {
      return res.status(404).json({ success: false, message: 'Parent email not found' });
    }

    // Generate report title
    const reportTitles = {
      progress: 'Complete Progress Report',
      attendance: 'Attendance Report',
      academic: 'Academic Performance Report',
      risk: 'Risk Analysis Report',
      behavioral: 'Behavioral Report'
    };

    const reportTitle = reportTitles[reportType] || 'Student Report';

    // Send email with report info
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">${reportTitle}</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <p>Dear ${parent.firstName} ${parent.lastName},</p>
          ${message ? `<div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">${message.replace(/\n/g, '<br>')}</div>` : ''}
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="margin-top: 0;">Student: ${student.firstName} ${student.lastName}</h3>
            <p><strong>Roll Number:</strong> ${student.rollNumber}</p>
            <p><strong>Class:</strong> ${student.section}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <h4>Report Summary</h4>
            <p><strong>Attendance:</strong> ${student.attendancePercentage}%</p>
            <p><strong>Academic Score:</strong> ${student.overallPercentage}%</p>
            <p><strong>Risk Level:</strong> ${student.riskLevel}</p>
            <p><strong>Risk Score:</strong> ${student.riskScore}%</p>
          </div>
          <p style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/parent/dashboard" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
              View Full Report in Portal
            </a>
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      to: parent.email,
      subject: `${reportTitle} - ${student.firstName} ${student.lastName}`,
      html: emailHTML
    });

    // Create in-app notification
    await createNotification({
      recipientId: parent._id,
      type: 'report',
      title: `${reportTitle} Available`,
      message: `A new ${reportTitle.toLowerCase()} for ${student.firstName} ${student.lastName} is available.`,
      priority: 'normal',
      channels: {
        inApp: { enabled: true },
        email: { enabled: false }, // Already sent
        sms: { enabled: false }
      },
      metadata: {
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`,
        reportType: reportType,
        from: `${req.user.firstName} ${req.user.lastName}`
      }
    });

    logger.info(`✅ Report sent to parent: ${parent.email} for student: ${student.rollNumber}`);

    res.json({
      success: true,
      message: 'Report sent successfully to parent'
    });

  } catch (error) {
    logger.error('Error sending report to parent:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send report'
    });
  }
};

/**
 * Get communication history for a student
 */
export const getCommunicationHistory = async (req, res) => {
  try {
    const { studentId } = req.params;

    // This would fetch from a communications collection if you have one
    // For now, return empty array
    res.json({
      success: true,
      data: []
    });

  } catch (error) {
    logger.error('Error fetching communication history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch communication history'
    });
  }
};
