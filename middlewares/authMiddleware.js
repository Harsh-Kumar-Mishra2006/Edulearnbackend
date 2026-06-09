// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const Auth = require('../models/authdata');

const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header or cookie
    let token = req.header('Authorization') || req.headers.authorization;
    
    if (token) {
      token = token.replace('Bearer ', '');
    } else {
      token = req.cookies?.token;
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }
    
    // Clean token
    token = token.trim().replace(/^["']|["']$/g, '');
    
    // Verify token
    const decoded = jwt.verify(token, 'mypassword');
    
    // Set user info in req object - THIS IS CRITICAL
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
      name: decoded.name
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

module.exports = authenticateToken;