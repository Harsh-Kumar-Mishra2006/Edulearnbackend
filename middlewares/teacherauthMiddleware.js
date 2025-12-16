const jwt = require('jsonwebtoken');
const Auth = require('../models/authdata');
const Teacher = require('../models/adminadddata');

const teacherAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('🟡 TEACHER AUTH - Token received');
    
    if (!token) {
      console.log('❌ No token');
      return res.status(401).json({
        success: false,
        error: "No token provided, access denied"
      });
    }

    // Verify token
    const decoded = jwt.verify(token, 'mypassword');
    console.log('🟡 Decoded userId:', decoded.userId);
    
    // Check if user exists and is teacher
    const user = await Auth.findById(decoded.userId);
    
    if (!user) {
      console.log('❌ User not found in Auth collection');
      return res.status(401).json({
        success: false,
        error: "Token is not valid - User not found"
      });
    }

    console.log('🟡 User found:', {
      id: user._id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive
    });

    if (user.role !== 'teacher') {
      console.log('❌ User role is not teacher, it is:', user.role);
      return res.status(403).json({
        success: false,
        error: "Access denied. Teacher privileges required."
      });
    }

    // Check if teacher is verified and active
    if (!user.isVerified) {
      console.log('❌ User is not verified');
      return res.status(403).json({
        success: false,
        error: "Teacher account not verified"
      });
    }

    if (!user.isActive) {
      console.log('❌ User is not active');
      return res.status(403).json({
        success: false,
        error: "Teacher account inactive"
      });
    }

    // Check if teacher is registered by admin
    const teacherProfile = await Teacher.findOne({ email: user.email });
    
    if (!teacherProfile) {
      console.log('❌ Teacher profile not found for email:', user.email);
      return res.status(403).json({
        success: false,
        error: "Teacher profile not found"
      });
    }

    console.log('🟡 Teacher profile found:', {
      id: teacherProfile._id,
      email: teacherProfile.email,
      status: teacherProfile.status
    });

    if (teacherProfile.status !== 'active') {
      console.log('❌ Teacher profile status is:', teacherProfile.status);
      return res.status(403).json({
        success: false,
        error: "Teacher profile inactive (status: " + teacherProfile.status + ")"
      });
    }

    // All checks passed
    console.log('✅ All teacher auth checks passed!');
    
    req.user = {
      userId: user._id.toString(),
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      teacherProfileId: teacherProfile._id
    };
    
    next();

  } catch (error) {
    console.error('❌ TEACHER AUTH ERROR:', error.message);
    console.error('Teacher auth error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: "Invalid authentication token"
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: "Token expired, please login again"
      });
    }
    
    res.status(401).json({
      success: false,
      error: "Authentication failed: " + error.message
    });
  }
};
  

module.exports = { teacherAuth };