// middleware/adminAuthMiddleware.js
const jwt = require('jsonwebtoken');
const Auth = require('../models/authdata');

const adminAuth = async (req, res, next) => {
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
    const decoded = jwt.verify(token, 'mypassword'); // Use your JWT secret
    
    // Check if user exists and is admin
    const user = await Auth.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Token is not valid"
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Access denied. Admin privileges required."
      });
    }

    // Add user to request
    req.user = decoded;
    next();

  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({
      success: false,
      error: "Token is not valid"
    });
  }
};

module.exports = { adminAuth };