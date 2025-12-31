const Teacher = require('../models/adminadddata');
const Auth = require('../models/authdata');
const bcryptjs = require('bcryptjs');
const EmailService = require('../services/emailService'); // Import email service

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
      phone_number,
      address,
      qualification,
      years_of_experience,
      specialization,
      bio
    } = req.body;

    // Validation
    if (!name || !email || !course || !phone_number || !qualification || !years_of_experience) {
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
    const tempPassword = generateRandomPassword();
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

    console.log('🟡 4. Generated credentials:', { username, tempPassword });

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(tempPassword, salt);

    console.log('🟢 5. Password hashed');

    // Create user in auth collection
    const newUser = new Auth({
      name: name,
      email: email,
      username: username,
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

    // Create teacher record
    const teacher = new Teacher({
      name,
      email,
      course,
      phone_number,
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
    // ✅ SEND EMAIL WITH CREDENTIALS (IN BACKGROUND)
    if (process.env.NODE_ENV !== 'test') { // Optional: skip in tests
      console.log('📧 Queueing welcome email to teacher...');
      
      const emailVariables = {
        teacherName: name,
        username: username,
        tempPassword: tempPassword,
        appName: process.env.APP_NAME || 'EduLearn',
        loginUrl: process.env.FRONTEND_URL + '/login' || 'http://localhost:5173/login',
        adminName: req.user.name || 'Admin',
        adminEmail: req.user.email || 'admin@edulearn.com',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@edulearn.com',
        teacherPortalUrl: process.env.FRONTEND_URL + '/teacher/dashboard' || 'http://localhost:5173/teacher/dashboard'
      };

      const metadata = {
        userId: newUser._id,
        userType: 'teacher',
        adminId: req.user.id,
        teacherId: teacher._id
      };

      // Send email in background WITHOUT await (don't block response)
      EmailService.sendTemplateEmail('teacher_welcome', email, emailVariables, metadata)
        .then(() => console.log('✅ Welcome email sent successfully'))
        .catch(error => console.error('⚠️ Email sending failed (non-critical):', error.message));
    }

    res.status(201).json({
      success: true,
      message: "Teacher added successfully! Credentials have been sent to teacher's email.",
      data: teacherResponse,
      credentials: {
         username: username,
        tempPassword: tempPassword,
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

// Get all teachers
const getAllTeachers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;

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

    const teachers = await Teacher.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Teacher.countDocuments(query);

    res.json({
      success: true,
      data: teachers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTeachers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
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

module.exports = {
  addTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getTeacherStats
};