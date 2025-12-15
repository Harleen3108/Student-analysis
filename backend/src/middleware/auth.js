import { verifyAccessToken } from "../config/jwt.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import logger from "../utils/logger.js";
import { findUserByEmail } from "../utils/mockData.js";

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Not authorized to access this route. Please login.",
      });
    }

    try {
      // Verify token
      const decoded = verifyAccessToken(token);

      // Check if MongoDB is connected
      const isMongoConnected = mongoose.connection.readyState === 1;
      
      let user;
      if (isMongoConnected) {
        // Get user from database
        user = await User.findById(decoded.id).select("-password");
      } else {
        // Use mock data
        user = findUserByEmail(decoded.email);
      }

      if (!user) {
        return res.status(401).json({
          status: "error",
          message: "User not found",
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          status: "error",
          message: "User account is deactivated",
        });
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }
  } catch (error) {
    logger.error("Auth middleware error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Authorize specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Check if user owns the resource (for parents accessing their child's data)
export const checkOwnership = (resourceField = "student") => {
  return async (req, res, next) => {
    try {
      // Admins and teachers can access all resources
      if (["admin", "teacher", "counselor"].includes(req.user.role)) {
        return next();
      }

      // For parents, check if they own the student
      if (req.user.role === "parent") {
        const studentId = req.params[resourceField] || req.body[resourceField];

        if (!studentId) {
          return res.status(400).json({
            status: "error",
            message: "Student ID is required",
          });
        }

        // Check if student is in parent's children array
        const isOwner = req.user.children.some(
          (child) => child.toString() === studentId.toString()
        );

        if (!isOwner) {
          return res.status(403).json({
            status: "error",
            message: "You do not have permission to access this resource",
          });
        }
      }

      next();
    } catch (error) {
      logger.error("Ownership check error:", error);
      return res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  };
};

// Optional auth - user may or may not be authenticated
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.id).select("-password");
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid, but continue without user
        logger.warn("Invalid token in optional auth");
      }
    }

    next();
  } catch (error) {
    logger.error("Optional auth middleware error:", error);
    next();
  }
};
