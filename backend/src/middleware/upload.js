import multer from "multer";
import path from "path";
import { AppError } from "./errorHandler.js";

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|pdf|csv|xlsx|xls/;

  // Check extension
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  // Check mime type
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file type. Only JPEG, PNG, PDF, CSV, and Excel files are allowed",
        400
      )
    );
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: fileFilter,
});

// Middleware to handle multer errors
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(
        new AppError("File size too large. Maximum size is 5MB", 400)
      );
    }
    return next(new AppError(err.message, 400));
  }
  next(err);
};
