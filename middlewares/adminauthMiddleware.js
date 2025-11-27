// middleware/adminAuthMiddleware.js
const jwt = require('jsonwebtoken');
const Auth = require('../models/authdata');

const adminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('🔐 Admin Auth - Token received:', token ? 'Yes' : 'No');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided, access denied"
      });
    }

    // Verify token
    const decoded = jwt.verify(token, 'mypassword');
    console.log('🔐 Admin Auth - Decoded token:', decoded);
    
    // Check if user exists and is admin
    const user = await Auth.findById(decoded.userId);
    
    if (!user) {
      console.log('🔐 Admin Auth - User not found with ID:', decoded.userId);
      return res.status(401).json({
        success: false,
        error: "User not found"
      });
    }

    console.log('🔐 Admin Auth - User role:', user.role);
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Access denied. Admin privileges required."
      });
    }

    // Add user to request
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    req.admin = {
      id: user._id,
      name: user.name
    };
    
    console.log('🔐 Admin Auth - Success! User:', req.user.name);
    next();

  } catch (error) {
    console.error('🔐 Admin Auth Error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: "Invalid token"
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: "Token expired"
      });
    }
    
    res.status(401).json({
      success: false,
      error: "Authentication failed"
    });
  }
};

module.exports = { adminAuth };