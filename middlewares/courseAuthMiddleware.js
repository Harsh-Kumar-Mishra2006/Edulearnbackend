// middlewares/courseAuthMiddleware.js
const jwt = require('jsonwebtoken');

// Middleware that allows ALL authenticated users (students, teachers, admins) to view courses
const courseViewAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // For GET requests, token is optional (allow public viewing)
    if (req.method === 'GET' && !token) {
      console.log('📚 Public course view request');
      req.user = null; // No user info for public access
      return next();
    }
    
    if (token) {
      // Verify token
      const decoded = jwt.verify(token, 'mypassword');
      
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role || 'user'
      };
      
      console.log('✅ Course view authenticated:', req.user.email, 'role:', req.user.role);
    }
    
    next();
  } catch (error) {
    console.error('Course view auth error:', error.message);
    
    // For GET requests, still allow access even if token is invalid
    if (req.method === 'GET') {
      console.log('⚠️ Invalid token but allowing public course view');
      req.user = null;
      return next();
    }
    
    res.status(401).json({
      success: false,
      error: "Authentication error: " + error.message
    });
  }
};

module.exports = { courseViewAuth };