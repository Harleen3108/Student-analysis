import { v2 as cloudinary } from "cloudinary";
import logger from "../utils/logger.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Test Cloudinary connection
 */
export const testConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    logger.info("✅ Cloudinary connected successfully");
    return { success: true, result };
  } catch (error) {
    logger.error("❌ Cloudinary connection failed:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Upload image to Cloudinary
 */
export const uploadImage = async (file, options = {}) => {
  try {
    const {
      folder = "students",
      width = 500,
      height = 500,
      crop = "limit",
      quality = "auto",
      format = "auto",
    } = options;

    const uploadOptions = {
      folder: `student-dropout/${folder}`,
      resource_type: "auto",
      transformation: [
        { width, height, crop },
        { quality },
        { fetch_format: format },
      ],
      ...options,
    };

    const result = await cloudinary.uploader.upload(file, uploadOptions);

    logger.info(`Image uploaded successfully: ${result.public_id}`);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    logger.error("Cloudinary image upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Upload document to Cloudinary
 */
export const uploadDocument = async (file, options = {}) => {
  try {
    const { folder = "documents" } = options;

    const uploadOptions = {
      folder: `student-dropout/${folder}`,
      resource_type: "raw",
      ...options,
    };

    const result = await cloudinary.uploader.upload(file, uploadOptions);

    logger.info(`Document uploaded successfully: ${result.public_id}`);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    logger.error("Cloudinary document upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Delete file from Cloudinary
 */
export const deleteFile = async (publicId, resourceType = "image") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result === "ok") {
      logger.info(`File deleted successfully: ${publicId}`);
      return { success: true, result };
    } else {
      logger.warn(`File deletion failed: ${publicId}`, result);
      return { success: false, error: "Deletion failed", result };
    }
  } catch (error) {
    logger.error("Cloudinary delete error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get file details from Cloudinary
 */
export const getFileDetails = async (publicId, resourceType = "image") => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
    });

    return {
      success: true,
      details: {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        createdAt: result.created_at,
        tags: result.tags,
      },
    };
  } catch (error) {
    logger.error("Cloudinary get details error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate optimized image URL
 */
export const generateOptimizedUrl = (publicId, options = {}) => {
  try {
    const {
      width = 300,
      height = 300,
      crop = "fill",
      quality = "auto",
      format = "auto",
    } = options;

    const url = cloudinary.url(publicId, {
      transformation: [
        { width, height, crop },
        { quality },
        { fetch_format: format },
      ],
    });

    return { success: true, url };
  } catch (error) {
    logger.error("Cloudinary URL generation error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Upload multiple files
 */
export const uploadMultipleFiles = async (files, options = {}) => {
  try {
    const uploadPromises = files.map((file) => {
      if (file.mimetype.startsWith("image/")) {
        return uploadImage(file.path || file.buffer, options);
      } else {
        return uploadDocument(file.path || file.buffer, options);
      }
    });

    const results = await Promise.allSettled(uploadPromises);

    const successful = results
      .filter((r) => r.status === "fulfilled" && r.value.success)
      .map((r) => r.value);

    const failed = results
      .filter((r) => r.status === "rejected" || !r.value.success)
      .map((r) => r.reason || r.value.error);

    logger.info(
      `Multiple files upload: ${successful.length} successful, ${failed.length} failed`
    );

    return {
      success: true,
      successful,
      failed,
      total: files.length,
    };
  } catch (error) {
    logger.error("Multiple files upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Create image thumbnail
 */
export const createThumbnail = (publicId, options = {}) => {
  try {
    const { width = 150, height = 150, crop = "thumb" } = options;

    const thumbnailUrl = cloudinary.url(publicId, {
      transformation: [
        { width, height, crop },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    return { success: true, thumbnailUrl };
  } catch (error) {
    logger.error("Thumbnail creation error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get folder contents
 */
export const getFolderContents = async (folderPath) => {
  try {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: folderPath,
      max_results: 100,
    });

    return {
      success: true,
      resources: result.resources.map((resource) => ({
        publicId: resource.public_id,
        url: resource.secure_url,
        format: resource.format,
        bytes: resource.bytes,
        createdAt: resource.created_at,
      })),
      total: result.total_count,
    };
  } catch (error) {
    logger.error("Get folder contents error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Add tags to file
 */
export const addTags = async (publicId, tags, resourceType = "image") => {
  try {
    const result = await cloudinary.uploader.add_tag(tags, [publicId], {
      resource_type: resourceType,
    });

    return { success: true, result };
  } catch (error) {
    logger.error("Add tags error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Remove tags from file
 */
export const removeTags = async (publicId, tags, resourceType = "image") => {
  try {
    const result = await cloudinary.uploader.remove_tag(tags, [publicId], {
      resource_type: resourceType,
    });

    return { success: true, result };
  } catch (error) {
    logger.error("Remove tags error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Search files by tags
 */
export const searchByTags = async (tags, resourceType = "image") => {
  try {
    const result = await cloudinary.search
      .expression(`tags:${tags.join(" AND tags:")}`)
      .with_field("tags")
      .with_field("context")
      .max_results(50)
      .execute();

    return {
      success: true,
      resources: result.resources,
      total: result.total_count,
    };
  } catch (error) {
    logger.error("Search by tags error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get storage usage statistics
 */
export const getStorageStats = async () => {
  try {
    const result = await cloudinary.api.usage();

    return {
      success: true,
      stats: {
        totalStorage: result.storage.usage,
        totalCredits: result.credits.usage,
        totalRequests: result.requests.usage,
        bandwidth: result.bandwidth.usage,
      },
    };
  } catch (error) {
    logger.error("Get storage stats error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  testConnection,
  uploadImage,
  uploadDocument,
  deleteFile,
  getFileDetails,
  generateOptimizedUrl,
  uploadMultipleFiles,
  createThumbnail,
  getFolderContents,
  addTags,
  removeTags,
  searchByTags,
  getStorageStats,
};