const auth = require('../models/authdata');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
// Add to authController.js
const Teacher = require('../models/adminadddata');

// Check if user is authorized teacher
const checkTeacherAuthorization = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided"
      });
    }

    const decoded = jwt.verify(token, 'mypassword');
    const user = await auth.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found"
      });
    }

    // Check if user is a teacher registered by admin
    const teacher = await Teacher.findOne({ 
      email: user.email,
      status: 'active'
    });

    if (teacher && user.role === 'teacher') {
      return res.json({
        success: true,
        isAuthorized: true,
        teacher: {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          course_domain: teacher.course_domain
        }
      });
    }

    res.json({
      success: true,
      isAuthorized: false,
      message: 'Not an authorized teacher'
    });

  } catch (error) {
    console.error('Teacher auth check error:', error);
    res.status(500).json({
      success: false,
      error: "Error checking teacher authorization"
    });
  }
};

// Signup controller with role support
const signup = async (req, res) => {
  let { name, email, username,phone, password, role = 'student', profile = {} } = req.body;

  if (!name || !email || !password || !username || !phone) {
    return res.status(400).json({ 
      success: false,
      error: 'Name, email, username, phone number and password are required' 
    });
  }

  // Validate role
  const validRoles = ['student', 'teacher', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid role. Must be student, teacher, or admin'
    });
  }

  try {
    // Check if user already exists
    const existingUser = await auth.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email or username already registered' 
      });
    }

    // Hash password and create user
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(password, salt);
    
    const createuser = await auth.create({ 
      name,
      email, 
      username, 
      phone,
      password: hash,
      role,
      profile
    });

    res.status(201).json({
      success: true,
      data: {
        id: createuser._id,
        name: createuser.name,
        email: createuser.email,
        username: createuser.username,
        phone: createuser.phone,
        role: createuser.role,
        profile: createuser.profile
      },
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`
    });

  } catch (err) {
    console.log("Error occurred: ", err);
    res.status(400).json({
      success: false,
      error: "Failed to create profile: " + err.message
    });
  }
};

// Update login function in authController.js
const login = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if ((!email && !username) || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email/username and password are required'
      });
    }

    let user = await auth.findOne({
      $or: [
        { email: email || '' },
        { username: username || '' }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email/username or password'
      });
    }

    // Check if user is active
    if (user.isActive === false) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated. Please contact admin.'
      });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email/username or password'
      });
    }

    // For teachers: Check if they're registered by admin
    if (user.role === 'teacher') {
      const teacherProfile = await Teacher.findOne({ 
        email: user.email,
        status: 'active'
      });

      if (!teacherProfile) {
        return res.status(403).json({
          success: false,
          error: 'Teacher account not authorized. Please contact admin.'
        });
      }
    }

    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        username: user.username,
        role: user.role,
        name: user.name
      }, 
      'mypassword', 
      { expiresIn: '30d' }
    );

    // Set cookie
    res.cookie('token', token, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.json({
      success: true,
      data: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        profile: user.profile
      },
      message: `Welcome back, ${user.name}!`,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// Get current user profile
const getProfile = async (req, res) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, 'mypassword');
    const user = await auth.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        profile: user.profile,
        isVerified: user.isVerified
      }
    });

  } catch (err) {
    console.log(err);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, profile } = req.body;
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, 'mypassword');
    const user = await auth.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (profile) user.profile = { ...user.profile, ...profile };

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        profile: user.profile
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
};

// Logout controller
const logout = async (req, res) => {
  try {
    res.cookie('token', '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
    
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Error during logout"
    });
  }
};

module.exports = {
  signup,
  login,
  logout,
  getProfile,
  updateProfile,
  checkTeacherAuthorization
};