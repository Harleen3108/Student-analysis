import User from '../models/User.js';
import { sendEmail } from './emailService.js';
import { createNotification } from './notificationService.js';
import logger from '../utils/logger.js';
import twilio from 'twilio';

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

/**
 * Send risk alert to parents via Email, SMS, and In-App notification
 * @param {Object} student - Student object with risk information
 * @param {string} previousRiskLevel - Previous risk level (optional)
 */
export const sendRiskAlertToParents = async (student, previousRiskLevel = null) => {
  try {
    // Only send alerts for Medium, High, and Critical risk levels
    const alertLevels = ['Medium', 'High', 'Critical'];
    if (!alertLevels.includes(student.riskLevel)) {
      logger.info(`No alert needed for ${student.firstName} ${student.lastName} - Risk level: ${student.riskLevel}`);
      return;
    }

    // Check if risk level has changed (avoid duplicate alerts)
    if (previousRiskLevel === student.riskLevel) {
      logger.info(`Risk level unchanged for ${student.firstName} ${student.lastName} - Skipping alert`);
      return;
    }

    logger.info(`🚨 Sending risk alert for ${student.firstName} ${student.lastName} - Risk: ${student.riskLevel}`);

    // Find parent account
    const parent = await User.findOne({
      role: 'parent',
      children: student._id,
      isActive: true
    });

    if (!parent) {
      logger.warn(`No active parent account found for student: ${student.firstName} ${student.lastName}`);
      return;
    }

    // Prepare alert message
    const alertData = {
      studentName: `${student.firstName} ${student.lastName}`,
      rollNumber: student.rollNumber,
      section: student.section,
      riskLevel: student.riskLevel,
      riskScore: student.riskScore,
      attendance: student.attendancePercentage,
      academicScore: student.overallPercentage,
      parentName: parent.firstName
    };

    // Send notifications in parallel
    const notifications = [];

    // 1. Send Email
    if (parent.email && parent.notificationPreferences?.email !== false) {
      notifications.push(sendRiskEmail(parent.email, alertData));
    }

    // 2. Send SMS
    if (parent.phone && parent.notificationPreferences?.sms !== false) {
      notifications.push(sendRiskSMS(parent.phone, alertData));
    }

    // 3. Send In-App Notification
    if (parent.notificationPreferences?.inApp !== false) {
      notifications.push(sendInAppNotification(parent._id, student, alertData));
    }

    // Wait for all notifications to complete
    const results = await Promise.allSettled(notifications);
    
    // Log results
    results.forEach((result, index) => {
      const type = ['Email', 'SMS', 'In-App'][index];
      if (result.status === 'fulfilled') {
        logger.info(`✅ ${type} alert sent successfully to ${parent.firstName} ${parent.lastName}`);
      } else {
        logger.error(`❌ ${type} alert failed:`, result.reason);
      }
    });

    return {
      success: true,
      parent: `${parent.firstName} ${parent.lastName}`,
      notifications: results
    };

  } catch (error) {
    logger.error('Error sending risk alert to parents:', error);
    throw error;
  }
};

/**
 * Send risk alert email
 */
const sendRiskEmail = async (email, alertData) => {
  const { studentName, rollNumber, section, riskLevel, riskScore, attendance, academicScore, parentName } = alertData;

  const riskColors = {
    Medium: { color: '#f59e0b', bg: '#fef3c7' },
    High: { color: '#f97316', bg: '#fed7aa' },
    Critical: { color: '#dc2626', bg: '#fecaca' }
  };

  const riskColor = riskColors[riskLevel] || riskColors.Medium;

  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .alert-box { background: ${riskColor.bg}; border-left: 4px solid ${riskColor.color}; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .alert-title { color: ${riskColor.color}; font-size: 24px; font-weight: bold; margin: 0 0 10px 0; }
        .content { background: #f9fafb; padding: 30px; }
        .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .info-label { font-weight: 600; color: #6b7280; }
        .info-value { color: #111827; font-weight: 500; }
        .recommendations { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
        .rec-title { font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 15px; }
        .rec-item { padding: 10px 0; padding-left: 20px; position: relative; }
        .rec-item:before { content: "•"; position: absolute; left: 0; color: #3b82f6; font-size: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">⚠️ Student Risk Alert</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Student Dropout Prevention System</p>
        </div>
        
        <div class="content">
          <p>Dear ${parentName},</p>
          
          <div class="alert-box">
            <div class="alert-title">${riskLevel} Risk Level Detected</div>
            <p style="margin: 5px 0 0 0;">We need your attention regarding your child's academic progress.</p>
          </div>

          <h3 style="color: #111827; margin-top: 30px;">Student Information</h3>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div class="info-row">
              <span class="info-label">Student Name:</span>
              <span class="info-value">${studentName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Roll Number:</span>
              <span class="info-value">${rollNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Class/Section:</span>
              <span class="info-value">${section}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Risk Score:</span>
              <span class="info-value" style="color: ${riskColor.color}; font-weight: bold;">${riskScore}%</span>
            </div>
            <div class="info-row">
              <span class="info-label">Attendance:</span>
              <span class="info-value">${attendance}%</span>
            </div>
            <div class="info-row" style="border-bottom: none;">
              <span class="info-label">Academic Score:</span>
              <span class="info-value">${academicScore}%</span>
            </div>
          </div>

          <div class="recommendations">
            <div class="rec-title">Recommended Actions</div>
            ${getRiskRecommendations(riskLevel, attendance, academicScore)}
          </div>

          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/parent/dashboard" class="button">
              View Full Details
            </a>
          </div>

          <p style="margin-top: 30px; color: #6b7280;">
            Please log in to your parent portal to view detailed information and communicate with teachers.
          </p>
        </div>

        <div class="footer">
          <p>This is an automated alert from the Student Dropout Prevention System.</p>
          <p>If you have any questions, please contact the school administration.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `⚠️ ${riskLevel} Risk Alert: ${studentName} - Immediate Attention Required`,
    html: emailHTML
  });
};

/**
 * Send risk alert SMS
 */
const sendRiskSMS = async (phone, alertData) => {
  if (!twilioClient) {
    logger.warn('Twilio not configured - SMS not sent');
    return;
  }

  const { studentName, riskLevel, riskScore, attendance, academicScore } = alertData;

  const message = `
🚨 RISK ALERT: ${riskLevel} Risk Detected

Student: ${studentName}
Risk Score: ${riskScore}%
Attendance: ${attendance}%
Academic: ${academicScore}%

Please check your parent portal for details and recommended actions.

- Student Dropout Prevention System
  `.trim();

  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    logger.info(`📱 SMS sent to ${phone}`);
  } catch (error) {
    logger.error(`Failed to send SMS to ${phone}:`, error.message);
    throw error;
  }
};

/**
 * Send in-app notification
 */
const sendInAppNotification = async (parentId, student, alertData) => {
  const { riskLevel, riskScore } = alertData;

  await createNotification({
    recipientId: parentId,
    type: 'risk_alert',
    title: `${riskLevel} Risk Alert: ${student.firstName} ${student.lastName}`,
    message: `Your child has been identified as ${riskLevel} risk (${riskScore}%). Please review the details and take necessary actions.`,
    priority: riskLevel === 'Critical' ? 'urgent' : 'high',
    channels: {
      inApp: { enabled: true },
      email: { enabled: false }, // Already sent separately
      sms: { enabled: false } // Already sent separately
    },
    metadata: {
      studentId: student._id,
      studentName: `${student.firstName} ${student.lastName}`,
      riskLevel: riskLevel,
      riskScore: riskScore,
      actionUrl: '/parent/risk'
    }
  });
};

/**
 * Get recommendations based on risk level and metrics
 */
const getRiskRecommendations = (riskLevel, attendance, academicScore) => {
  const recommendations = [];

  if (attendance < 75) {
    recommendations.push('Ensure regular school attendance - Current attendance is below acceptable level');
  }

  if (academicScore < 50) {
    recommendations.push('Arrange additional tutoring or study support');
    recommendations.push('Meet with teachers to discuss academic challenges');
  }

  if (riskLevel === 'Critical') {
    recommendations.push('Schedule an urgent meeting with school counselor');
    recommendations.push('Discuss intervention strategies with teachers');
  }

  if (riskLevel === 'High' || riskLevel === 'Critical') {
    recommendations.push('Monitor homework completion daily');
    recommendations.push('Create a structured study schedule at home');
  }

  recommendations.push('Maintain regular communication with teachers');
  recommendations.push('Check the parent portal regularly for updates');

  return recommendations.map(rec => `<div class="rec-item">${rec}</div>`).join('');
};

export default {
  sendRiskAlertToParents
};
