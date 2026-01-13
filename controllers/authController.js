const auth = require('../models/authdata');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
// Add to authController.js
const Teacher = require('../models/adminadddata');

// Check if user is authorized teacher
// Check if user is authorized teacher
const checkTeacherAuthorization = async (req, res) => {
  try {
    console.log('🔵 [1] /check-teacher endpoint called');
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('🔵 [2] Token exists:', token ? 'Yes' : 'No');
    
    if (!token) {
      console.log('❌ [3] No token provided');
      return res.status(401).json({
        success: false,
        error: "No token provided"
      });
    }

    const decoded = jwt.verify(token, 'mypassword');
    console.log('🔵 [4] Decoded token userId:', decoded.userId);
    console.log('🔵 [5] Decoded token email:', decoded.email);
    
    const user = await auth.findById(decoded.userId);
    console.log('🔵 [6] User found in DB:', user ? `Yes (${user.email})` : 'No');
    
    if (!user) {
      console.log('❌ [7] User not found in database');
      return res.status(401).json({
        success: false,
        error: "User not found"
      });
    }

    console.log('🔵 [8] User details:', {
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive
    });

    // ✅ ADD THESE CRITICAL CHECKS:
    if (user.role !== 'teacher') {
      console.log('❌ [9] FAIL: User role is not teacher. Role is:', user.role);
      return res.json({
        success: true,
        isAuthorized: false,
        message: 'User is not a teacher'
      });
    }

    if (!user.isVerified) {
      console.log('❌ [10] FAIL: User is not verified');
      return res.json({
        success: true,
        isAuthorized: false,
        message: 'Teacher account not verified'
      });
    }

    if (!user.isActive) {
      console.log('❌ [11] FAIL: User is not active');
      return res.json({
        success: true,
        isAuthorized: false,
        message: 'Teacher account inactive'
      });
    }

    // Check if teacher is registered by admin
    console.log('🔵 [12] Searching for teacher profile with email:', user.email);
    const teacher = await Teacher.findOne({ 
      email: user.email,
      status: 'active'
    });

    console.log('🔵 [13] Teacher profile found:', teacher ? 'Yes' : 'No');
    
    if (teacher) {
      console.log('✅ [14] SUCCESS: Teacher fully authorized!');
      console.log('   Teacher details:', {
        id: teacher._id,
        name: teacher.name,
        course: teacher.course,
        status: teacher.status
      });
      return res.json({
        success: true,
        isAuthorized: true,
        teacher: {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          course: teacher.course
        }
      });
    }

    console.log('❌ [15] FAIL: Teacher not registered by admin or status not active');
    res.json({
      success: true,
      isAuthorized: false,
      message: 'Teacher not registered by admin'
    });

  } catch (error) {
    console.error('❌ [ERROR] Teacher auth check error:', error.message);
    res.status(500).json({
      success: false,
      error: "Error checking teacher authorization: " + error.message
    });
  }
};

// Update signup controller to save profile data
const signup = async (req, res) => {
  let { name, email, username, phone, password, role = 'student', profile = {} } = req.body;

  // Extract additional profile fields
  const { age, gender, dob } = req.body;

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
    
    // Prepare profile data for students
    const studentProfile = role === 'student' ? {
      ...profile,
      age: age || '',
      gender: gender || '',
      dob: dob || ''
    } : profile;
    
    const createuser = await auth.create({ 
      name,
      email, 
      username, 
      phone,
      password: hash,
      role,
      profile: studentProfile
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
// In authController.js - Update getProfile function
// In authController.js - getProfile function
const getProfile = async (req, res) => {
  try {
    console.log('=== GET PROFILE ===');
    console.log('Headers:', req.headers);
    
    // Try multiple ways to get token
    let token = req.header('Authorization') || req.headers.authorization;
    
    if (token) {
      token = token.replace('Bearer ', '');
      console.log('Token from Authorization header:', token.substring(0, 50) + '...');
    } else {
      token = req.cookies?.token;
      console.log('Token from cookie:', token ? 'Yes' : 'No');
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    console.log('Token length:', token.length);
    
    // Clean token - remove quotes and whitespace
    token = token.trim().replace(/^["']|["']$/g, '');
    console.log('Cleaned token (first 50):', token.substring(0, 50) + '...');
    
    try {
      // Try to verify
      const decoded = jwt.verify(token, 'mypassword');
      console.log('✅ Token verified for user:', decoded.userId);
      
      const user = await auth.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      console.log('✅ User found:', user.email);
      
      return res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          phone: user.phone,
          role: user.role,
          profile: user.profile,
          isVerified: user.isVerified
        }
      });
      
    } catch (jwtError) {
      console.log('❌ JWT Error:', jwtError.message);
      
      // Try to decode without verification to see what's wrong
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          console.log('JWT payload (without verification):', payload);
          
          // Maybe the token is expired or has wrong signature
          return res.status(401).json({
            success: false,
            error: `Token error: ${jwtError.message}`,
            decodedPayload: payload
          });
        } else {
          console.log('Token is not a JWT format');
          return res.status(401).json({
            success: false,
            error: 'Token is not a valid JWT format'
          });
        }
      } catch (decodeError) {
        console.log('Cannot decode token at all:', decodeError.message);
        return res.status(401).json({
          success: false,
          error: `Invalid token: ${decodeError.message}`
        });
      }
    }
    
  } catch (err) {
    console.log('Server error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// In authController.js - debugToken function
const debugToken = async (req, res) => {
  try {
    console.log('=== DEBUG TOKEN ENDPOINT HIT ===');
    
    let token = req.header('Authorization') || req.headers.authorization;
    
    if (token) {
      token = token.replace('Bearer ', '');
    } else {
      token = req.cookies?.token;
    }
    
    if (!token) {
      return res.json({
        success: false,
        error: 'No token provided',
        message: 'Please send token in Authorization header'
      });
    }
    
    // Clean token
    token = token.trim().replace(/^["']|["']$/g, '');
    
    const result = {
      success: true,
      tokenInfo: {
        length: token.length,
        first50Chars: token.substring(0, 50),
        last50Chars: token.substring(token.length - 50),
        isJWTFormat: token.split('.').length === 3
      }
    };
    
    // Try to decode
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        result.tokenInfo.decoded = {
          header,
          payload
        };
        
        // Try to verify
        try {
          const verified = jwt.verify(token, 'mypassword');
          result.tokenInfo.verified = true;
          result.tokenInfo.verificationResult = verified;
        } catch (verifyError) {
          result.tokenInfo.verified = false;
          result.tokenInfo.verificationError = verifyError.message;
        }
        
      } catch (decodeError) {
        result.tokenInfo.decodeError = decodeError.message;
      }
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update updateProfile controller
const updateProfile = async (req, res) => {
  try {
    const { name, profile, age, gender, dob, phone } = req.body;
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

    // Update basic fields
    if (name) user.name = name;
    if (phone) user.phone = phone;

    // Update profile fields (especially for students)
    const updatedProfile = { ...user.profile };
    
    if (profile) {
      Object.assign(updatedProfile, profile);
    }
    
    // Update specific student profile fields
    if (user.role === 'student') {
      if (age !== undefined) updatedProfile.age = age;
      if (gender) updatedProfile.gender = gender;
      if (dob) updatedProfile.dob = dob;
    }

    user.profile = updatedProfile;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
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
  debugToken,
  updateProfile,
  checkTeacherAuthorization
};