// middlewares/adminauthMiddleware.js
const jwt = require('jsonwebtoken');
const Auth = require('../models/authdata');

const adminAuth = async (req, res, next) => {
  try {
    // Get token from header
    let token = req.header('Authorization') || req.headers.authorization;
    
    if (token) {
      token = token.replace('Bearer ', '');
    } else {
      token = req.cookies?.token;
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Please login.'
      });
    }
    
    // Clean token
    token = token.trim().replace(/^["']|["']$/g, '');
    
    // Verify token
    const decoded = jwt.verify(token, 'mypassword');
    console.log('✅ Token verified for user:', decoded.userId);
    
    // Find user
    const user = await Auth.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    // Set both formats for compatibility
    req.user = {
      id: user._id,
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    };
    
    next();
    
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

module.exports = { adminAuth };