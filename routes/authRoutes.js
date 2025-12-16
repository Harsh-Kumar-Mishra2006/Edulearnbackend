const express = require('express');
const { login, signup, logout, getProfile, updateProfile,checkTeacherAuthorization } = require('../controllers/authController');
const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/check-teacher', checkTeacherAuthorization);
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