import twilio from 'twilio';
import logger from '../utils/logger.js';

// Initialize Twilio client
let twilioClient = null;

if (process.env.ENABLE_SMS_NOTIFICATIONS === 'true' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    logger.info('✅ Twilio SMS service initialized');
  } catch (error) {
    logger.error('❌ Twilio initialization error:', error.message);
  }
} else {
  logger.info('📱 SMS notifications are disabled or Twilio credentials not configured');
}

/**
 * Send SMS
 */
export const sendSMS = async ({ to, message }) => {
  try {
    // Check if SMS is enabled and configured
    if (!twilioClient) {
      logger.info('SMS service not configured, skipping SMS send');
      return {
        success: false,
        error: 'SMS service not configured'
      };
    }

    // Format phone number (ensure it has country code)
    let formattedPhone = to;
    if (!to.startsWith('+')) {
      // Assume Indian number if no country code
      formattedPhone = `+91${to.replace(/\D/g, '')}`;
    }

    // Twilio has a 160 character limit for SMS
    const truncatedMessage = message.length > 160 
      ? message.substring(0, 157) + '...' 
      : message;

    const result = await twilioClient.messages.create({
      body: truncatedMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    logger.info(`SMS sent successfully to ${formattedPhone}. SID: ${result.sid}`);

    return {
      success: true,
      messageId: result.sid,
      status: result.status
    };

  } catch (error) {
    logger.error('SMS sending error:', {
      error: error.message,
      to: to,
      code: error.code
    });

    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

/**
 * Send bulk SMS
 */
export const sendBulkSMS = async (messages) => {
  try {
    if (!twilioClient) {
      return {
        total: messages.length,
        successful: 0,
        failed: messages.length,
        error: 'SMS service not configured'
      };
    }

    const results = await Promise.allSettled(
      messages.map(msg => sendSMS({ to: msg.to, message: msg.message }))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    logger.info(`Bulk SMS sent: ${successful} successful, ${failed} failed`);

    return {
      total: messages.length,
      successful,
      failed,
      results
    };

  } catch (error) {
    logger.error('Bulk SMS error:', error);
    throw error;
  }
};

/**
 * Send SMS with template
 */
export const sendTemplateSMS = async ({ to, template, variables }) => {
  try {
    const smsTemplates = {
      attendanceAlert: (vars) => 
        `Alert: ${vars.studentName} was absent on ${vars.date}. Total absences: ${vars.totalAbsences}. Contact school if needed.`,
      
      gradeAlert: (vars) => 
        `${vars.studentName} scored ${vars.percentage}% in ${vars.examName}. ${vars.message}`,
      
      riskAlert: (vars) => 
        `URGENT: ${vars.studentName} is at ${vars.riskLevel} risk. Immediate attention required. Contact: ${vars.contactNumber}`,
      
      meetingReminder: (vars) => 
        `Reminder: Parent meeting for ${vars.studentName} on ${vars.date} at ${vars.time}. Venue: ${vars.venue}`,
      
      generalNotification: (vars) => 
        `${vars.message} - ${vars.schoolName}`
    };

    if (!smsTemplates[template]) {
      throw new Error(`SMS template '${template}' not found`);
    }

    const message = smsTemplates[template](variables);

    return await sendSMS({ to, message });

  } catch (error) {
    logger.error('Template SMS error:', error);
    throw error;
  }
};

/**
 * Validate phone number
 */
export const validatePhoneNumber = (phone) => {
  // Basic validation for Indian phone numbers
  const regex = /^(\+91)?[6-9]\d{9}$/;
  return regex.test(phone.replace(/\s/g, ''));
};

/**
 * Check SMS service status
 */
export const checkSMSServiceStatus = () => {
  return {
    enabled: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
    configured: !!twilioClient,
    accountSid: process.env.TWILIO_ACCOUNT_SID ? '***' + process.env.TWILIO_ACCOUNT_SID.slice(-4) : 'Not set',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'Not set'
  };
};

export default {
  sendSMS,
  sendBulkSMS,
  sendTemplateSMS,
  validatePhoneNumber,
  checkSMSServiceStatus
};
