// middlewares/studentauthMiddleware.js
const jwt = require('jsonwebtoken');

const studentAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mypassword');
    
    // ✅ FIX: Allow both students AND teachers
    if (decoded.role !== 'student' && decoded.role !== 'teacher') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Student or Teacher privileges required.' 
      });
    }
    
    req.user = {
      userId: decoded.id || decoded.userId || decoded._id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

module.exports = { studentAuth };