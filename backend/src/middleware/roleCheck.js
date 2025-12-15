import { AppError } from "./errorHandler.js";
import logger from "../utils/logger.js";

/**
 * Check if user has required role(s)
 * @param {...string} roles - Required roles
 * @returns {Function} Middleware function
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.id} with role ${req.user.role} to endpoint ${req.path}`);
      return next(
        new AppError(
          `Access denied. Required role(s): ${roles.join(", ")}. Your role: ${req.user.role}`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Check if user has admin role
 */
export const requireAdmin = requireRole("admin");

/**
 * Check if user has admin or counselor role
 */
export const requireAdminOrCounselor = requireRole("admin", "counselor");

/**
 * Check if user has admin, counselor, or teacher role
 */
export const requireStaff = requireRole("admin", "counselor", "teacher");

/**
 * Check if user has any authenticated role
 */
export const requireAuth = requireRole("admin", "counselor", "teacher", "parent");

/**
 * Check if user can access student data
 * @param {string} studentIdParam - Parameter name containing student ID
 * @returns {Function} Middleware function
 */
export const canAccessStudent = (studentIdParam = "studentId") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const studentId = req.params[studentIdParam] || req.body[studentIdParam];
      
      if (!studentId) {
        return next(new AppError("Student ID is required", 400));
      }

      // Admin and counselors can access all students
      if (["admin", "counselor"].includes(req.user.role)) {
        return next();
      }

      // Teachers can access students in their assigned classes
      if (req.user.role === "teacher") {
        const Student = (await import("../models/Student.js")).default;
        const student = await Student.findById(studentId).populate("class");
        
        if (!student) {
          return next(new AppError("Student not found", 404));
        }

        // Check if teacher is assigned to student's class
        const hasAccess = 
          student.class.classTeacher.toString() === req.user._id.toString() ||
          req.user.assignedClasses.includes(student.class._id.toString());

        if (!hasAccess) {
          logger.warn(`Teacher ${req.user.id} attempted to access student ${studentId} without permission`);
          return next(new AppError("Access denied to this student", 403));
        }

        return next();
      }

      // Parents can only access their own children
      if (req.user.role === "parent") {
        const hasAccess = req.user.children.some(
          (childId) => childId.toString() === studentId.toString()
        );

        if (!hasAccess) {
          logger.warn(`Parent ${req.user.id} attempted to access student ${studentId} without permission`);
          return next(new AppError("Access denied to this student", 403));
        }

        return next();
      }

      return next(new AppError("Invalid user role", 403));
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user can access class data
 * @param {string} classIdParam - Parameter name containing class ID
 * @returns {Function} Middleware function
 */
export const canAccessClass = (classIdParam = "classId") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const classId = req.params[classIdParam] || req.body[classIdParam];
      
      if (!classId) {
        return next(new AppError("Class ID is required", 400));
      }

      // Admin and counselors can access all classes
      if (["admin", "counselor"].includes(req.user.role)) {
        return next();
      }

      // Teachers can access their assigned classes
      if (req.user.role === "teacher") {
        const Class = (await import("../models/Class.js")).default;
        const classDoc = await Class.findById(classId);
        
        if (!classDoc) {
          return next(new AppError("Class not found", 404));
        }

        // Check if teacher is assigned to this class
        const hasAccess = 
          classDoc.classTeacher.toString() === req.user._id.toString() ||
          req.user.assignedClasses.includes(classId);

        if (!hasAccess) {
          logger.warn(`Teacher ${req.user.id} attempted to access class ${classId} without permission`);
          return next(new AppError("Access denied to this class", 403));
        }

        return next();
      }

      // Parents cannot access class data directly
      if (req.user.role === "parent") {
        return next(new AppError("Parents cannot access class data", 403));
      }

      return next(new AppError("Invalid user role", 403));
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user can access intervention data
 * @param {string} interventionIdParam - Parameter name containing intervention ID
 * @returns {Function} Middleware function
 */
export const canAccessIntervention = (interventionIdParam = "interventionId") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const interventionId = req.params[interventionIdParam] || req.body[interventionIdParam];
      
      if (!interventionId) {
        return next(new AppError("Intervention ID is required", 400));
      }

      // Admin can access all interventions
      if (req.user.role === "admin") {
        return next();
      }

      const Intervention = (await import("../models/Intervention.js")).default;
      const intervention = await Intervention.findById(interventionId);
      
      if (!intervention) {
        return next(new AppError("Intervention not found", 404));
      }

      // Counselors can access interventions they're assigned to or created
      if (req.user.role === "counselor") {
        const hasAccess = 
          intervention.assignedCounselor.toString() === req.user._id.toString() ||
          intervention.createdBy.toString() === req.user._id.toString();

        if (!hasAccess) {
          logger.warn(`Counselor ${req.user.id} attempted to access intervention ${interventionId} without permission`);
          return next(new AppError("Access denied to this intervention", 403));
        }

        return next();
      }

      // Teachers can access interventions they're involved in
      if (req.user.role === "teacher") {
        const hasAccess = intervention.involvedTeachers.some(
          (teacherId) => teacherId.toString() === req.user._id.toString()
        );

        if (!hasAccess) {
          logger.warn(`Teacher ${req.user.id} attempted to access intervention ${interventionId} without permission`);
          return next(new AppError("Access denied to this intervention", 403));
        }

        return next();
      }

      // Parents can access interventions for their children
      if (req.user.role === "parent") {
        const hasAccess = 
          req.user.children.includes(intervention.student.toString()) ||
          intervention.involvedParents.some(
            (parentId) => parentId.toString() === req.user._id.toString()
          );

        if (!hasAccess) {
          logger.warn(`Parent ${req.user.id} attempted to access intervention ${interventionId} without permission`);
          return next(new AppError("Access denied to this intervention", 403));
        }

        return next();
      }

      return next(new AppError("Invalid user role", 403));
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user can modify data (create, update, delete)
 * @param {string} operation - Operation type (create, update, delete)
 * @param {string} resource - Resource type (student, class, intervention, etc.)
 * @returns {Function} Middleware function
 */
export const canModify = (operation, resource) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    const permissions = {
      admin: {
        student: ["create", "update", "delete"],
        class: ["create", "update", "delete"],
        intervention: ["create", "update", "delete", "approve"],
        user: ["create", "update", "delete"],
        grade: ["create", "update", "delete"],
        attendance: ["create", "update", "delete"],
        report: ["create", "update", "delete"],
        notification: ["create", "update", "delete"],
      },
      counselor: {
        student: ["update"],
        intervention: ["create", "update"],
        session: ["create", "update", "delete"],
        grade: ["view"],
        attendance: ["view"],
        report: ["create"],
        notification: ["create"],
      },
      teacher: {
        student: ["update"],
        grade: ["create", "update"],
        attendance: ["create", "update"],
        intervention: ["create"],
        report: ["create"],
        notification: ["create"],
      },
      parent: {
        student: ["view"],
        grade: ["view"],
        attendance: ["view"],
        intervention: ["view"],
        report: ["view"],
      },
    };

    const userPermissions = permissions[req.user.role];
    
    if (!userPermissions || !userPermissions[resource]) {
      logger.warn(`User ${req.user.id} with role ${req.user.role} attempted ${operation} on ${resource} without permission`);
      return next(new AppError(`Access denied for ${operation} operation on ${resource}`, 403));
    }

    if (!userPermissions[resource].includes(operation)) {
      logger.warn(`User ${req.user.id} with role ${req.user.role} attempted ${operation} on ${resource} without permission`);
      return next(new AppError(`Access denied for ${operation} operation on ${resource}`, 403));
    }

    next();
  };
};

/**
 * Check if user can approve interventions
 */
export const canApproveIntervention = requireRole("admin");

/**
 * Check if user can access analytics
 */
export const canAccessAnalytics = requireRole("admin", "counselor", "teacher");

/**
 * Check if user can generate reports
 */
export const canGenerateReports = requireRole("admin", "counselor", "teacher");

/**
 * Check if user can send notifications
 */
export const canSendNotifications = requireRole("admin", "counselor", "teacher");

/**
 * Check if user can access system settings
 */
export const canAccessSettings = requireRole("admin");

/**
 * Check if user can perform bulk operations
 */
export const canPerformBulkOperations = requireRole("admin", "counselor");

/**
 * Dynamic permission checker based on resource ownership
 * @param {string} resourceModel - Mongoose model name
 * @param {string} ownerField - Field name that contains the owner ID
 * @param {string} resourceIdParam - Parameter name containing resource ID
 * @returns {Function} Middleware function
 */
export const checkResourceOwnership = (resourceModel, ownerField = "createdBy", resourceIdParam = "id") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      // Admin can access everything
      if (req.user.role === "admin") {
        return next();
      }

      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        return next(new AppError("Resource ID is required", 400));
      }

      const Model = (await import(`../models/${resourceModel}.js`)).default;
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return next(new AppError("Resource not found", 404));
      }

      // Check ownership
      const ownerId = resource[ownerField];
      if (ownerId && ownerId.toString() !== req.user._id.toString()) {
        logger.warn(`User ${req.user.id} attempted to access resource ${resourceId} owned by ${ownerId}`);
        return next(new AppError("Access denied to this resource", 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user is accessing their own data
 * @param {string} userIdParam - Parameter name containing user ID
 * @returns {Function} Middleware function
 */
export const isSelfOrAdmin = (userIdParam = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    const targetUserId = req.params[userIdParam] || req.body[userIdParam];
    
    // Admin can access any user data
    if (req.user.role === "admin") {
      return next();
    }

    // User can access their own data
    if (req.user._id.toString() === targetUserId) {
      return next();
    }

    logger.warn(`User ${req.user.id} attempted to access data for user ${targetUserId}`);
    return next(new AppError("Access denied", 403));
  };
};

export default {
  requireRole,
  requireAdmin,
  requireAdminOrCounselor,
  requireStaff,
  requireAuth,
  canAccessStudent,
  canAccessClass,
  canAccessIntervention,
  canModify,
  canApproveIntervention,
  canAccessAnalytics,
  canGenerateReports,
  canSendNotifications,
  canAccessSettings,
  canPerformBulkOperations,
  checkResourceOwnership,
  isSelfOrAdmin,
};