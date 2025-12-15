import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../config/jwt.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public (or Admin only - you can restrict this)
export const register = asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    role,
    assignedClasses,
    subjects,
    children,
    specialization,
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("Email already registered", 400));
  }

  // Create user
  const userData = {
    firstName,
    lastName,
    email,
    phone,
    password,
    role,
  };

  // Add role-specific fields
  if (role === "teacher") {
    userData.assignedClasses = assignedClasses || [];
    userData.subjects = subjects || [];
  } else if (role === "parent") {
    userData.children = children || [];
  } else if (role === "counselor") {
    userData.specialization = specialization || "general";
  }

  const user = await User.create(userData);

  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to database
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Remove password from output
  user.password = undefined;

  logger.info(`New user registered: ${user.email} (${user.role})`);

  res.status(201).json({
    status: "success",
    message: "User registered successfully",
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password provided
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  // Check if user exists and get password
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new AppError("Invalid email or password", 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError("Your account has been deactivated", 401));
  }

  // Check if password matches
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    return next(new AppError("Invalid email or password", 401));
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Update last login and refresh token
  user.lastLogin = Date.now();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Remove password from output
  user.password = undefined;

  logger.info(`User logged in: ${user.email} (${user.role})`);

  res.status(200).json({
    status: "success",
    message: "Login successful",
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res, next) => {
  // Clear refresh token from database
  await User.findByIdAndUpdate(req.user._id, {
    refreshToken: null,
  });

  logger.info(`User logged out: ${req.user.email}`);

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
export const refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError("Refresh token is required", 400));
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user and check if refresh token matches
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return next(new AppError("Invalid refresh token", 401));
    }

    if (!user.isActive) {
      return next(new AppError("User account is deactivated", 401));
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id, user.role);

    res.status(200).json({
      status: "success",
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    return next(new AppError("Invalid or expired refresh token", 401));
  }
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res, next) => {
  // req.user is already available from auth middleware
  const user = await User.findById(req.user._id)
    .populate("assignedClasses", "name standard section")
    .populate("children", "firstName lastName photo rollNumber class");

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// @desc    Update user profile
// @route   PUT /api/v1/auth/update-profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = [
    "firstName",
    "lastName",
    "phone",
    "avatar",
    "notificationPreferences",
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  logger.info(`User profile updated: ${user.email}`);

  res.status(200).json({
    status: "success",
    message: "Profile updated successfully",
    data: {
      user,
    },
  });
});

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError("Please provide current and new password", 400));
  }

  // Get user with password
  const user = await User.findById(req.user._id).select("+password");

  // Check if current password is correct
  const isPasswordCorrect = await user.comparePassword(currentPassword);

  if (!isPasswordCorrect) {
    return next(new AppError("Current password is incorrect", 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  logger.info(`Password changed: ${user.email}`);

  res.status(200).json({
    status: "success",
    message: "Password changed successfully",
  });
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Please provide email", 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("User not found with this email", 404));
  }

  // Generate reset token (implement email sending logic)
  // For now, just return success
  // TODO: Implement email service for password reset

  logger.info(`Password reset requested: ${email}`);

  res.status(200).json({
    status: "success",
    message: "Password reset email sent (not implemented yet)",
  });
});

// @desc    Verify email
// @route   GET /api/v1/auth/verify-email/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req, res, next) => {
  // TODO: Implement email verification logic

  res.status(200).json({
    status: "success",
    message: "Email verification (not implemented yet)",
  });
});
