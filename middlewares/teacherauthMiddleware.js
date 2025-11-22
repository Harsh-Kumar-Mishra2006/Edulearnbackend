// middlewares/teacherauthMiddleware.js
const jwt = require('jsonwebtoken');
const Auth = require('../models/authdata');
const Teacher = require('../models/adminadddata');

const teacherAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided, access denied"
      });
    }

    // Verify token
    const decoded = jwt.verify(token, 'mypassword');
    
    // Check if user exists and is teacher
    const user = await Auth.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Token is not valid"
      });
    }

    if (user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        error: "Access denied. Teacher privileges required."
      });
    }

    // Check if teacher is registered by admin
    const teacherProfile = await Teacher.findOne({ email: user.email });
    if (!teacherProfile || teacherProfile.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: "Teacher not authorized or inactive"
      });
    }

    // Add user and teacher info to request
    req.user = decoded;
    req.teacher = {
  id: user._id, // ✅ Use Auth user ID instead of Teacher collection ID
  email: user.email, // ✅ Use email from Auth
  name: user.name,
  teacherProfileId: teacherProfile._id // Keep Teacher collection ID separately if needed
};
    
    next();

  } catch (error) {
    console.error('Teacher auth error:', error);
    res.status(401).json({
      success: false,
      error: "Token is not valid"
    });
  }
};

module.exports = { teacherAuth };