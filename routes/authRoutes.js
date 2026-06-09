// authRoutes.js - Updated version
const express = require('express');
const { login, signup, logout, getProfile, updateProfile, checkTeacherAuthorization, debugToken,
  getStudentDetails, getCombinedStudentProfile, updateStudentProfile, getStudentProfileData
} = require('../controllers/authController');
const authenticateToken = require('../middlewares/authMiddleware');
const Auth = require('../models/authdata'); // Add this import
const router = express.Router();

// PUBLIC ROUTES (no authentication required)
router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', logout);

// PROTECTED ROUTES (authentication required)
router.get('/profile', getProfile);
router.get('/debug-token', debugToken);
router.put('/profile', authenticateToken, updateProfile);
router.get('/check-teacher', authenticateToken, checkTeacherAuthorization);
router.get('/student-details/:email', authenticateToken, getStudentDetails);
router.get('/student-profile/:email', authenticateToken, getCombinedStudentProfile);
router.put('/update-student-profile', authenticateToken, updateStudentProfile);
router.get('/student-profile-data', authenticateToken, getStudentProfileData);

// FIXED: /all-students endpoint
router.get('/all-students', authenticateToken, async (req, res) => {
  try {
    console.log('🔵 /all-students endpoint called');
    console.log('🔵 req.user:', req.user);
    
    // Check if user exists in request
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - User not authenticated'
      });
    }
    
    // Find the requesting user to check role
    const requestingUser = await Auth.findById(req.user.userId);
    
    if (!requestingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    console.log('🔵 Requesting user role:', requestingUser.role);
    
    // Check if user is admin or teacher
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access. Only admins and teachers can view all students.'
      });
    }
    
    // Fetch all students
    const students = await Auth.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${students.length} students`);
    
    res.json({
      success: true,
      students: students,
      count: students.length,
      message: `Successfully fetched ${students.length} students`
    });
    
  } catch (error) {
    console.error('❌ Error fetching students:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug route
router.get('/debug-auth', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token' });
    }

    const decoded = jwt.verify(token, 'mypassword');
    const user = await Auth.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const teacher = await Teacher.findOne({ email: user.email });
    
    res.json({
      tokenData: decoded,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive
      },
      teacherProfile: teacher ? {
        id: teacher._id,
        email: teacher.email,
        status: teacher.status,
        course: teacher.course
      } : null,
      checks: {
        isTeacher: user.role === 'teacher',
        isVerified: user.isVerified,
        isActive: user.isActive,
        hasTeacherProfile: !!teacher,
        teacherStatus: teacher?.status,
        isFullyAuthorized: user.role === 'teacher' && 
                          user.isVerified && 
                          user.isActive && 
                          teacher && 
                          teacher.status === 'active'
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;