import twilio from "twilio";
import logger from "../utils/logger.js";

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;

// Create Twilio client if credentials are provided
if (accountSid && authToken) {
  try {
    client = twilio(accountSid, authToken);
    logger.info("✅ Twilio client initialized successfully");
  } catch (error) {
    logger.error("❌ Twilio client initialization failed:", error.message);
  }
} else {
  logger.warn("⚠️ Twilio credentials not provided. SMS functionality will be disabled.");
}

// Test Twilio connection
export const testTwilioConnection = async () => {
  if (!client) {
    return { success: false, error: "Twilio client not initialized" };
  }

  try {
    // Test by fetching account details
    const account = await client.api.accounts(accountSid).fetch();
    logger.info("✅ Twilio connection verified successfully");
    return { 
      success: true, 
      accountSid: account.sid,
      status: account.status 
    };
  } catch (error) {
    logger.error("❌ Twilio connection test failed:", error.message);
    return { success: false, error: error.message };
  }
};

// Validate phone number format
export const validatePhoneNumber = (phoneNumber) => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "");
  
  // Check if it's a valid Indian mobile number (10 digits starting with 6-9)
  const indianMobileRegex = /^[6-9]\d{9}$/;
  
  if (indianMobileRegex.test(cleaned)) {
    return { valid: true, formatted: `+91${cleaned}` };
  }
  
  // Check if it already has country code
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    const number = cleaned.substring(2);
    if (indianMobileRegex.test(number)) {
      return { valid: true, formatted: `+${cleaned}` };
    }
  }
  
  return { valid: false, error: "Invalid phone number format" };
};

// Format phone number for Twilio
export const formatPhoneNumber = (phoneNumber) => {
  const validation = validatePhoneNumber(phoneNumber);
  if (validation.valid) {
    return validation.formatted;
  }
  throw new Error(validation.error);
};

// Check if SMS is enabled
export const isSMSEnabled = () => {
  return process.env.ENABLE_SMS_NOTIFICATIONS === "true" && client !== null;
};

export { client, phoneNumber };
export default client;