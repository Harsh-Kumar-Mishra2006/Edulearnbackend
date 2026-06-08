// authRoutes.js
const express = require('express');
const { login, signup, logout, getProfile, updateProfile, checkTeacherAuthorization,debugToken,
  getStudentDetails, getCombinedStudentProfile, updateStudentProfile, getStudentProfileData
 } = require('../controllers/authController');
const authenticateToken = require('../middlewares/authMiddleware'); // Add this
const router = express.Router();

// PUBLIC ROUTES (no authentication required)
router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', logout);

// PROTECTED ROUTES (authentication required)
router.get('/profile', getProfile);
router.get('/debug-token', debugToken);
router.put('/profile', authenticateToken, updateProfile);
router.get('/check-teacher', authenticateToken, checkTeacherAuthorization); // Also protect this
router.get('/student-details/:email', authenticateToken, getStudentDetails);
router.get('/student-profile/:email', authenticateToken, getCombinedStudentProfile);
router.put('/update-student-profile', authenticateToken, updateStudentProfile);
router.get('/student-profile-data', authenticateToken, getStudentProfileData);
// Debug route (optional, can be public or protected)
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

// Add this to authRoutes.js
router.get('/all-students', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or teacher
    const requestingUser = await Auth.findById(req.user.userId);
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access'
      });
    }
    
    const students = await Auth.find({ role: 'student' }).select('-password');
    
    res.json({
      success: true,
      students: students,
      count: students.length
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;