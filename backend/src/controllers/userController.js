import User from "../models/User.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (Admin)
export const getUsers = asyncHandler(async (req, res, next) => {
  const { role, isActive, search, page = 1, limit = 20 } = req.query;

  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === "true";

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password -refreshToken")
      .populate("assignedClasses", "name section")
      .populate("children", "firstName lastName rollNumber")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean(),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    status: "success",
    results: users.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
    data: {
      users,
    },
  });
});

// @desc    Get user by ID
// @route   GET /api/v1/users/:id
// @access  Private (Admin)
export const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select("-password -refreshToken")
    .populate("assignedClasses", "name section standard")
    .populate("children", "firstName lastName rollNumber photo class");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// @desc    Create new user
// @route   POST /api/v1/users
// @access  Private (Admin)
export const createUser = asyncHandler(async (req, res, next) => {
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

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("Email already registered", 400));
  }

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
  user.password = undefined;

  logger.info(
    `New user created: ${user.email} (${user.role}) by ${req.user.email}`
  );

  res.status(201).json({
    status: "success",
    message: "User created successfully",
    data: {
      user,
    },
  });
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private (Admin)
export const updateUser = asyncHandler(async (req, res, next) => {
  const allowedFields = [
    "firstName",
    "lastName",
    "phone",
    "isActive",
    "assignedClasses",
    "subjects",
    "children",
    "specialization",
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).select("-password -refreshToken");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  logger.info(`User updated: ${user.email} by ${req.user.email}`);

  res.status(200).json({
    status: "success",
    message: "User updated successfully",
    data: {
      user,
    },
  });
});

// @desc    Delete user (deactivate)
// @route   DELETE /api/v1/users/:id
// @access  Private (Admin)
export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Prevent deleting admin users
  if (user.role === 'admin') {
    return next(new AppError("Cannot delete admin users", 403));
  }

  // Prevent users from deleting themselves
  if (user._id.toString() === req.user._id.toString()) {
    return next(new AppError("Cannot delete your own account", 403));
  }

  // Hard delete - actually remove from database
  await User.findByIdAndDelete(req.params.id);

  logger.info(`User deleted: ${user.email} by ${req.user.email}`);

  res.status(200).json({
    status: "success",
    message: "User deleted successfully",
  });
});

// @desc    Get user statistics
// @route   GET /api/v1/users/statistics
// @access  Private (Admin)
export const getUserStats = asyncHandler(async (req, res, next) => {
  const statistics = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
        active: {
          $sum: { $cond: ["$isActive", 1, 0] },
        },
        inactive: {
          $sum: { $cond: ["$isActive", 0, 1] },
        },
      },
    },
  ]);

  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });

  res.status(200).json({
    status: "success",
    data: {
      totalUsers,
      activeUsers,
      roleDistribution: statistics,
    },
  });
});

// @desc    Update user profile (self)
// @route   PUT /api/v1/users/profile
// @access  Private (Self)
export const updateProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = [
    "firstName",
    "lastName",
    "phone",
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
  }).select("-password -refreshToken");

  logger.info(`Profile updated: ${user.email}`);

  res.status(200).json({
    status: "success",
    message: "Profile updated successfully",
    data: {
      user,
    },
  });
});

// @desc    Change password (self)
// @route   PUT /api/v1/users/change-password
// @access  Private (Self)
export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  // Check current password
  const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordCorrect) {
    return next(new AppError("Current password is incorrect", 400));
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

// @desc    Deactivate user
// @route   PUT /api/v1/users/:id/deactivate
// @access  Private (Admin)
export const deactivateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  user.isActive = false;
  await user.save();

  logger.info(`User deactivated: ${user.email} by ${req.user.email}`);

  res.status(200).json({
    status: "success",
    message: "User deactivated successfully",
  });
});

// @desc    Activate user
// @route   PUT /api/v1/users/:id/activate
// @access  Private (Admin)
export const activateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  user.isActive = true;
  await user.save();

  logger.info(`User activated: ${user.email} by ${req.user.email}`);

  res.status(200).json({
    status: "success",
    message: "User activated successfully",
  });
});

// @desc    Update user status
// @route   PUT /api/v1/users/:id/status
// @access  Private (Admin)
export const updateUserStatus = asyncHandler(async (req, res, next) => {
  const { isActive } = req.body;
  
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  user.isActive = isActive;
  await user.save();

  logger.info(`User status updated: ${user.email} (${isActive ? 'activated' : 'deactivated'}) by ${req.user.email}`);

  res.status(200).json({
    status: "success",
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      user: {
        id: user._id,
        isActive: user.isActive
      }
    }
  });
});

// @desc    Get user activity log
// @route   GET /api/v1/users/:id/activity
// @access  Private (Admin, Self)
export const getUserActivity = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  
  // This would typically fetch from an audit log
  // For now, return a placeholder response
  res.status(200).json({
    status: "success",
    message: "User activity log - To be implemented",
    data: {
      activities: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0,
      },
    },
  });
});

// @desc    Bulk create users
// @route   POST /api/v1/users/bulk
// @access  Private (Admin)
export const bulkCreateUsers = asyncHandler(async (req, res, next) => {
  const { users } = req.body;

  if (!users || !Array.isArray(users) || users.length === 0) {
    return next(new AppError("Users array is required", 400));
  }

  const results = {
    successful: 0,
    failed: 0,
    errors: [],
  };

  for (const userData of users) {
    try {
      // Check if email already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        results.failed++;
        results.errors.push({
          email: userData.email,
          error: "Email already exists",
        });
        continue;
      }

      await User.create(userData);
      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        email: userData.email,
        error: error.message,
      });
    }
  }

  logger.info(
    `Bulk user creation: ${results.successful} successful, ${results.failed} failed by ${req.user.email}`
  );

  res.status(200).json({
    status: "success",
    message: "Bulk user creation completed",
    data: results,
  });
});

// @desc    Export users data
// @route   GET /api/v1/users/export
// @access  Private (Admin)
export const exportUsers = asyncHandler(async (req, res, next) => {
  const { format = "json", role } = req.query;

  const query = {};
  if (role) query.role = role;

  const users = await User.find(query)
    .select("-password -refreshToken")
    .populate("assignedClasses", "name section")
    .populate("children", "firstName lastName rollNumber")
    .lean();

  if (format === "csv") {
    // For CSV export, you would typically use a CSV library
    // For now, return JSON with a message
    res.status(200).json({
      status: "success",
      message: "CSV export - To be implemented",
      data: { users },
    });
  } else {
    res.status(200).json({
      status: "success",
      data: { users },
    });
  }
});

export default {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateProfile,
  changePassword,
  getUserStats,
  deactivateUser,
  activateUser,
  getUserActivity,
  bulkCreateUsers,
  exportUsers,
};
