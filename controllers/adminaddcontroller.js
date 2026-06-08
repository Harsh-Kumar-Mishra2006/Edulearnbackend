const Teacher = require('../models/adminadddata');
const Auth = require('../models/authdata');
const bcryptjs = require('bcryptjs');
const EmailService = require('../services/emailService'); // Import email service
const jwt = require('jsonwebtoken');
// Generate random password
const generateRandomPassword = () => {
  const length = 8;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Add new teacher with email notification
const addTeacher = async (req, res) => {
  try {
    console.log('=== 🟡 ADD TEACHER PROCESS START ===');
    console.log('Request body:', req.body);
    console.log('Admin user:', req.user);

    const {
      name,
      email,
      course,
      phone, // Accept phone
  phone_number, // Also accept phone_number for compatibility
      address,
      qualification,
      years_of_experience,
      specialization,
      bio,
      password
    } = req.body;

    const phoneValue = phone || phone_number;


    // Validation - update phone field name
    if (!name || !email || !course || !phoneValue || !qualification || !years_of_experience || !password) {
      console.log('🔴 Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        error: "All required fields must be filled"
      });
    }

    // Validate address object
    if (!address || !address.street || !address.city || !address.state || !address.pincode) {
      return res.status(400).json({
        success: false,
        error: "Complete address details are required"
      });
    }

    console.log('🟢 1. All validations passed');

    // Check if teacher already exists with this email
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      console.log('🔴 Teacher already exists with this email');
      return res.status(400).json({
        success: false,
        error: "Teacher with this email already exists"
      });
    }

    console.log('🟢 2. Email is unique');

    // Check if user already exists in auth collection
    const existingUser = await Auth.findOne({ email });
    if (existingUser) {
      console.log('🔴 User already exists with this email in auth system');
      return res.status(400).json({
        success: false,
        error: "User with this email already exists in the system"
      });
    }

    console.log('🟢 3. No existing user in auth system');

    // Generate random password and username
    const adminProvidedPassword = password;  // Password typed by admin
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

    console.log('🟡 4. Admin-Provided credentials:', { username, adminProvidedPassword });

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(adminProvidedPassword, salt);

    console.log('🟢 5. Password hashed');

    // ✅ FIXED: Use phone directly (not phone_number)
    // Create user in auth collection
    const newUser = new Auth({
      name: name,
      email: email,
      username: username,
      phone: phoneValue, // ✅ Use phone (not phone_number)
      password: hashedPassword,
      role: 'teacher',
      profile: {
        specialization: specialization || [],
        experience: `${years_of_experience} years`,
        qualification: qualification
      },
      isVerified: true,
      isActive: true
    });

    console.log('🟡 6. Creating auth user...');
    await newUser.save();
    console.log('🟢 7. Auth user created:', newUser._id);

    // Create teacher record - use phone_number for Teacher model
    const teacher = new Teacher({
      name,
      email,
      course,
      phone_number: phoneValue, // ✅ Map phone to phone_number for Teacher model
      address,
      qualification,
      years_of_experience,
      specialization: specialization || [],
      bio: bio || '',
      created_by: req.user.id // From auth middleware
    });

    console.log('🟡 8. Creating teacher record...');
    await teacher.save();
    console.log('🟢 9. Teacher record created:', teacher._id);

    // Prepare response (don't send password in response)
    const teacherResponse = {
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      course: teacher.course,
      phone_number: teacher.phone_number,
      address: teacher.address,
      qualification: teacher.qualification,
      years_of_experience: teacher.years_of_experience,
      specialization: teacher.specialization,
      bio: teacher.bio,
      status: teacher.status,
      joining_date: teacher.joining_date
    };

    console.log('✅ TEACHER ADDED SUCCESSFULLY');
    
    // ... rest of the code for email sending ...
    
    res.status(201).json({
      success: true,
      message: "Teacher added successfully! Credentials have been sent to teacher's email.",
      data: teacherResponse,
      credentials: {
        username: username,
        tempPassword: adminProvidedPassword,
        loginUrl: process.env.FRONTEND_URL + '/login' || 'http://localhost:5173/login',
        teacherName: name,
        teacherEmail: email,
        note: "These credentials have also been sent to the teacher's email."
      }
    });

  } catch (error) {
    console.error('🔴 ADD TEACHER ERROR:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Duplicate entry. Teacher with this email already exists."
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.error('🔴 Validation errors:', errors);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error: " + error.message
    });
  }
};

// controllers/adminaddcontroller.js
const getAllTeachers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', getAll = 'false' } = req.query;

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { course: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    let teachers;
    let total;
    let pagination = null;

    // If getAll is true, return all teachers without pagination
    if (getAll === 'true') {
      teachers = await Teacher.find(query)
        .sort({ createdAt: -1 })
        .select('-__v');
      total = teachers.length;
    } else {
      // Paginated response
      teachers = await Teacher.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .select('-__v');
      
      total = await Teacher.countDocuments(query);
      
      pagination = {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalTeachers: total,
        limit: parseInt(limit),
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      };
    }

    res.json({
      success: true,
      data: teachers,
      total: total,
      ...(pagination && { pagination })
    });

  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching teachers: " + error.message
    });
  }
};

// Get teacher by ID
const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findById(id);
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: "Teacher not found"
      });
    }

    res.json({
      success: true,
      data: teacher
    });

  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching teacher: " + error.message
    });
  }
};

// Update teacher
const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const teacher = await Teacher.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: "Teacher not found"
      });
    }

    res.json({
      success: true,
      message: "Teacher updated successfully",
      data: teacher
    });

  } catch (error) {
    console.error('Error updating teacher:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: "Error updating teacher: " + error.message
    });
  }
};

const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🟡 DELETE BACKEND - Teacher ID to delete:', id);
    console.log('🟡 Request user:', req.user);

    // First, find the teacher to get their email
    const teacher = await Teacher.findById(id);
    
    if (!teacher) {
      console.log('🔴 Teacher not found with ID:', id);
      return res.status(404).json({
        success: false,
        error: "Teacher not found"
      });
    }

    console.log('🟡 Found teacher:', teacher.email);

    // Soft delete - update status to inactive
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      id,
      { status: 'inactive' },
      { new: true }
    );

    console.log('🟡 Teacher soft deleted:', updatedTeacher.status);

    // Also deactivate the auth account
    const authUpdate = await Auth.findOneAndUpdate(
      { email: teacher.email },
      { isActive: false }
    );

    console.log('🟡 Auth account deactivated:', authUpdate ? 'Yes' : 'No');

    res.json({
      success: true,
      message: "Teacher deactivated successfully"
    });

  } catch (error) {
    console.error('🔴 DELETE ERROR:', error);
    res.status(500).json({
      success: false,
      error: "Error deleting teacher: " + error.message
    });
  }
};

// Get teacher statistics
const getTeacherStats = async (req, res) => {
  try {
    const totalTeachers = await Teacher.countDocuments();
    const activeTeachers = await Teacher.countDocuments({ status: 'active' });
    const inactiveTeachers = await Teacher.countDocuments({ status: 'inactive' });
    
    // Count teachers by domain
    const domainStats = await Teacher.aggregate([
      {
        $group: {
          _id: '$course',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        total: totalTeachers,
        active: activeTeachers,
        inactive: inactiveTeachers,
        byDomain: domainStats
      }
    });

  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching teacher statistics: " + error.message
    });
  }
};
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    // Get token from cookie or header
    let token = req.cookies.token;
    if (!token) {
      const authHeader = req.header('Authorization');
      if (authHeader) {
        token = authHeader.replace('Bearer ', '');
      }
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No authentication token found"
      });
    }
    
    const decoded = jwt.verify(token, 'mypassword');
    const user = await Auth.findById(decoded.userId);  // ✅ Use Auth, not auth
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    
    // Verify old password
    const isMatch = await bcryptjs.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect"
      });
    }
    
    // Validate new password length
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 6 characters long"
      });
    }
    
    // Hash and save new password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    
    res.json({
      success: true,
      message: "Password changed successfully"
    });
    
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
module.exports = {
  addTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getTeacherStats,
  changePassword
};