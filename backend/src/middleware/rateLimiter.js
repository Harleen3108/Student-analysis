import rateLimit from "express-rate-limit";
import logger from "../utils/logger.js";

// Default rate limiter for general API endpoints
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    status: "error",
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get("User-Agent")}`);
    res.status(429).json({
      status: "error",
      message: "Too many requests from this IP, please try again later.",
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
    });
  },
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    status: "error",
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, Endpoint: ${req.path}`);
    res.status(429).json({
      status: "error",
      message: "Too many authentication attempts, please try again later.",
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
    });
  },
});

// Rate limiter for password reset attempts
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    status: "error",
    message: "Too many password reset attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: "error",
      message: "Too many password reset attempts, please try again later.",
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
    });
  },
});

// Rate limiter for file upload endpoints
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 upload requests per windowMs
  message: {
    status: "error",
    message: "Too many file upload attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: "error",
      message: "Too many file upload attempts, please try again later.",
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
    });
  },
});

// Rate limiter for SMS sending endpoints
export const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 SMS requests per hour
  message: {
    status: "error",
    message: "Too many SMS requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`SMS rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: "error",
      message: "Too many SMS requests, please try again later.",
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
    });
  },
});

// Rate limiter for email sending endpoints
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 email requests per hour
  message: {
    status: "error",
    message: "Too many email requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Email rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: "error",
      message: "Too many email requests, please try again later.",
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
    });
  },
});

// Rate limiter for report generation endpoints
export const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 report generation requests per windowMs
  message: {
    status: "error",
    message: "Too many report generation requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Report generation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: "error",
      message: "Too many report generation requests, please try again later.",
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
    });
  },
});

// Rate limiter for search endpoints
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 search requests per minute
  message: {
    status: "error",
    message: "Too many search requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Search rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: "error",
      message: "Too many search requests, please try again later.",
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
    });
  },
});

// Dynamic rate limiter based on user role
export const createRoleBasedLimiter = (limits) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
      const userRole = req.user?.role || "guest";
      return limits[userRole] || limits.default || 50;
    },
    message: {
      status: "error",
      message: "Rate limit exceeded for your user role.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Remove custom keyGenerator to use default IPv6-compatible one
    handler: (req, res) => {
      const userRole = req.user?.role || "guest";
      logger.warn(`Role-based rate limit exceeded for user: ${req.user?.id || req.ip}, Role: ${userRole}`);
      res.status(429).json({
        status: "error",
        message: "Rate limit exceeded for your user role.",
        retryAfter: Math.round(req.rateLimit.resetTime / 1000),
      });
    },
  });
};

// Rate limiter for admin operations
export const adminLimiter = createRoleBasedLimiter({
  admin: 200,
  counselor: 100,
  teacher: 80,
  parent: 50,
  default: 30,
});

// Rate limiter for bulk operations
export const bulkOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 bulk operations per hour
  message: {
    status: "error",
    message: "Too many bulk operations, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Bulk operation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: "error",
      message: "Too many bulk operations, please try again later.",
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
    });
  },
});

// Custom rate limiter with Redis store (for production)
export const createRedisRateLimiter = (options = {}) => {
  // Redis implementation disabled for now
  // Can be enabled when Redis is properly configured
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || {
      status: "error",
      message: "Too many requests, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });
};

// Rate limiter for API endpoints based on endpoint sensitivity
export const createEndpointLimiter = (endpoint) => {
  const endpointLimits = {
    // Authentication endpoints
    "/auth/login": { windowMs: 15 * 60 * 1000, max: 5 },
    "/auth/register": { windowMs: 60 * 60 * 1000, max: 3 },
    "/auth/forgot-password": { windowMs: 60 * 60 * 1000, max: 3 },
    
    // Data modification endpoints
    "/students": { windowMs: 15 * 60 * 1000, max: 50 },
    "/attendance": { windowMs: 15 * 60 * 1000, max: 100 },
    "/grades": { windowMs: 15 * 60 * 1000, max: 50 },
    
    // Report generation endpoints
    "/reports": { windowMs: 15 * 60 * 1000, max: 5 },
    
    // Notification endpoints
    "/notifications/send": { windowMs: 60 * 60 * 1000, max: 20 },
    
    // Default limits
    default: { windowMs: 15 * 60 * 1000, max: 100 },
  };

  const limits = endpointLimits[endpoint] || endpointLimits.default;

  return rateLimit({
    windowMs: limits.windowMs,
    max: limits.max,
    message: {
      status: "error",
      message: `Rate limit exceeded for ${endpoint}`,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Endpoint rate limit exceeded for ${endpoint}, IP: ${req.ip}`);
      res.status(429).json({
        status: "error",
        message: `Rate limit exceeded for ${endpoint}`,
        retryAfter: Math.round(req.rateLimit.resetTime / 1000),
      });
    },
  });
};

export default {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  uploadLimiter,
  smsLimiter,
  emailLimiter,
  reportLimiter,
  searchLimiter,
  adminLimiter,
  bulkOperationLimiter,
  createRoleBasedLimiter,
  createRedisRateLimiter,
  createEndpointLimiter,
};