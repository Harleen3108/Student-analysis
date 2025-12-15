import { v2 as cloudinary } from "cloudinary";
import logger from "../utils/logger.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Test connection
export const testCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    logger.info("✅ Cloudinary connected successfully");
    return result;
  } catch (error) {
    logger.error("❌ Cloudinary connection failed:", error.message);
    return null;
  }
};

// Upload image
export const uploadImage = async (file, folder = "students") => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: `student-dropout/${folder}`,
      resource_type: "auto",
      transformation: [
        { width: 500, height: 500, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    logger.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
};

// Delete image
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete image");
  }
};

// Upload PDF/Document
export const uploadDocument = async (file, folder = "documents") => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: `student-dropout/${folder}`,
      resource_type: "raw",
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    logger.error("Cloudinary document upload error:", error);
    throw new Error("Failed to upload document");
  }
};

export default cloudinary;
