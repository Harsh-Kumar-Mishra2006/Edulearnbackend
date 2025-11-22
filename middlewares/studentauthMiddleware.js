const jwt = require('jsonwebtoken');
const Student = require('../models/Mylearningmodel'); // You might need to create this model

const studentAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // ✅ FIX: Use the SAME secret as auth controller
    const decoded = jwt.verify(token, 'mypassword');
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || 'student'
    };

    console.log('🟢 Student authenticated:', req.user.email);
    next();
  } catch (error) {
    console.error('🔴 Student auth error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid token: ' + error.message
    });
  }
};

module.exports = { studentAuth };