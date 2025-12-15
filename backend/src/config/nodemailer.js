import nodemailer from "nodemailer";
import logger from "../utils/logger.js";

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === "465", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // For development
    },
  });

  return transporter;
};

// Initialize transporter
const transporter = createTransporter();

// Verify SMTP connection configuration
export const verifyConnection = async () => {
  try {
    // Log the configuration being used
    logger.info("Attempting SMTP connection with:", {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER
    });
    
    await transporter.verify();
    logger.info("✅ SMTP server connection verified successfully");
    return true;
  } catch (error) {
    logger.error("❌ SMTP server connection failed:", error.message);
    logger.error("Full error:", error);
    return false;
  }
};

// Test email configuration on startup only if email notifications are enabled
if (process.env.ENABLE_EMAIL_NOTIFICATIONS === "true") {
  verifyConnection();
} else {
  logger.info("📧 Email notifications are disabled");
}

export default transporter;