import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { validateUserLogin } from '../middleware/validation.js';
import logger from '../utils/logger.js';
import { mockUsers, findUserByEmail } from '../utils/mockData.js';

const router = express.Router();

// Generate JWT token
const generateToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    logger.info(`Login attempt for email: ${email}`);
    
    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;
    
    let user;
    let isPasswordCorrect = false;
    
    if (isMongoConnected) {
      // Use MongoDB
      user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        logger.warn(`Login failed - user not found: ${email}`);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Check if user is active
      if (!user.isActive) {
        logger.warn(`Login failed - user inactive: ${email}`);
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact administrator.'
        });
      }
      
      // Check password
      isPasswordCorrect = await user.comparePassword(password);
      
      if (isPasswordCorrect) {
        // Update last login
        user.lastLogin = new Date();
        await user.save();
      }
    } else {
      // Use mock data
      logger.warn(`Using mock authentication for: ${email}`);
      user = findUserByEmail(email);
      
      if (!user) {
        logger.warn(`Login failed - mock user not found: ${email}`);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Simple password check for mock data
      const validPasswords = {
        'admin@school.com': 'admin123',
        'teacher@school.com': 'teacher123',
        'harleen@gmail.com': 'teacher123'
      };
      
      isPasswordCorrect = validPasswords[email] === password;
    }
    
    if (!isPasswordCorrect) {
      logger.warn(`Login failed - invalid password: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = generateToken(user._id, user.email);
    
    logger.info(`Login successful: ${email} (${user.role})`);
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        assignedClasses: user.assignedClasses,
        lastLogin: user.lastLogin || new Date()
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @desc    Register user (Admin only)
// @route   POST /api/v1/auth/register
// @access  Private (Admin)
router.post('/register', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can register new users'
      });
    }
    
    const { firstName, lastName, email, phone, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: role || 'teacher'
    });
    
    // Generate token
    const token = generateToken(user._id);
    
    // Remove password from response
    user.password = undefined;
    
    logger.info(`User registered: ${email} (${role}) by ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @desc    Get current user profile
// @route   GET /api/v1/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        assignedClasses: user.assignedClasses || [],
        subjects: user.subjects || [],
        lastLogin: user.lastLogin,
        isActive: user.isActive
      }
    });
  } catch (error) {
    logger.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    // In a real app, you might want to blacklist the token
    // For now, we'll just send a success response
    logger.info(`User logged out: ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});



// @desc    Create teacher user (Development only)
// @route   POST /api/v1/auth/create-teacher
// @access  Public (Development only)
router.post('/create-teacher', async (req, res) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only available in development mode'
      });
    }
    
    // Check if teacher already exists
    const existingTeacher = await User.findOne({ email: 'teacher@school.com' });
    if (existingTeacher) {
      return res.status(200).json({
        success: true,
        message: 'Teacher user already exists',
        credentials: {
          email: 'teacher@school.com',
          password: 'teacher123'
        }
      });
    }
    
    // Create teacher user
    const teacherUser = await User.create({
      firstName: 'John',
      lastName: 'Teacher',
      email: 'teacher@school.com',
      phone: '9876543210',
      password: 'teacher123',
      role: 'teacher',
      assignedClasses: ['10A', '10B'],
      subjects: ['Mathematics', 'Physics'],
      isActive: true,
      isEmailVerified: true
    });
    
    logger.info('Teacher user created');
    
    res.status(201).json({
      success: true,
      message: 'Teacher user created successfully',
      credentials: {
        email: 'teacher@school.com',
        password: 'teacher123'
      },
      user: {
        id: teacherUser._id,
        firstName: teacherUser.firstName,
        lastName: teacherUser.lastName,
        email: teacherUser.email,
        role: teacherUser.role,
        assignedClasses: teacherUser.assignedClasses
      }
    });
  } catch (error) {
    logger.error('Create teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating teacher user'
    });
  }
});

// @desc    Create default admin user (Development only)
// @route   POST /api/v1/auth/create-admin
// @access  Public (Development only)
router.post('/create-admin', async (req, res) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only available in development mode'
      });
    }
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@school.com' });
    if (existingAdmin) {
      // If admin exists but is inactive, activate it
      if (!existingAdmin.isActive) {
        existingAdmin.isActive = true;
        await existingAdmin.save();
        logger.info('Admin user activated');
        
        return res.status(200).json({
          success: true,
          message: 'Admin user activated successfully',
          credentials: {
            email: 'admin@school.com',
            password: 'admin123'
          }
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Admin user already exists and is active',
        credentials: {
          email: 'admin@school.com',
          password: 'admin123'
        }
      });
    }
    
    // Create admin user
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@school.com',
      phone: '9999999999',
      password: 'admin123',
      role: 'admin',
      isActive: true,
      isEmailVerified: true
    });
    
    logger.info('Default admin user created');
    
    res.status(201).json({
      success: true,
      message: 'Default admin user created successfully',
      credentials: {
        email: 'admin@school.com',
        password: 'admin123'
      },
      user: {
        id: adminUser._id,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    logger.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating admin user'
    });
  }
});

export default router;