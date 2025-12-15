import express from 'express';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Debug endpoint to check parent data
router.get('/check-parent', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    
    console.log('🔍 Debug - User ID:', userId);
    console.log('🔍 Debug - User Email:', userEmail);
    console.log('🔍 Debug - User Role:', req.user.role);
    
    // Get full user data
    const user = await User.findById(userId).lean();
    
    console.log('🔍 Debug - User from DB:', JSON.stringify(user, null, 2));
    
    if (!user) {
      return res.json({
        success: false,
        message: 'User not found',
        userId,
        userEmail
      });
    }
    
    // Get children
    const children = user.children || [];
    console.log('🔍 Debug - Children IDs:', children);
    
    // Get students
    const students = await Student.find({
      _id: { $in: children }
    }).lean();
    
    console.log('🔍 Debug - Students found:', students.length);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          childrenCount: children.length,
          childrenIds: children
        },
        students: students.map(s => ({
          id: s._id,
          name: `${s.firstName} ${s.lastName}`,
          rollNumber: s.rollNumber,
          section: s.section,
          isActive: s.isActive
        }))
      }
    });
    
  } catch (error) {
    console.error('🔍 Debug error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
});

export default router;
