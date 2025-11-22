const Teacher = require('../models/adminadddata');
const Auth = require('../models/authdata');
const bcryptjs = require('bcryptjs');

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

// Add new teacher
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
      created_by: req.user.userId // From auth middleware
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

    res.status(201).json({
      success: true,
      message: "Teacher added successfully! Credentials generated.",
      data: teacherResponse,
      credentials: {
        username: username,
        tempPassword: tempPassword,
        loginUrl: "http://localhost:5173/login",
        note: "Please share these credentials with the teacher. They should change their password after first login."
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
        { course_domain: { $regex: search, $options: 'i' } }
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

// Delete teacher (soft delete)
const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findByIdAndUpdate(
      id,
      { status: 'inactive' },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: "Teacher not found"
      });
    }

    // Also deactivate the auth account
    await Auth.findOneAndUpdate(
      { email: teacher.email },
      { isActive: false }
    );

    res.json({
      success: true,
      message: "Teacher deactivated successfully"
    });

  } catch (error) {
    console.error('Error deleting teacher:', error);
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