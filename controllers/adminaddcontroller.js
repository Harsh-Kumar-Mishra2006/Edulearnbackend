// controllers/adminaddcontroller.js
const Teacher = require('../models/adminadddata');
const Auth = require('../models/authdata');
const bcryptjs = require('bcryptjs');
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

// Add new teacher
const addTeacher = async (req, res) => {
  try {
    console.log('=== 🟡 ADD TEACHER PROCESS START ===');
    console.log('Request body:', req.body);

    const {
      name,
      email,
      course,
      phone,
      phone_number,
      address,
      qualification,
      years_of_experience,
      specialization,
      bio,
      password
    } = req.body;

    const phoneValue = phone || phone_number;

    if (!name || !email || !course || !phoneValue || !qualification || !years_of_experience || !password) {
      return res.status(400).json({
        success: false,
        error: "All required fields must be filled"
      });
    }

    if (!address || !address.street || !address.city || !address.state || !address.pincode) {
      return res.status(400).json({
        success: false,
        error: "Complete address details are required"
      });
    }

    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        error: "Teacher with this email already exists"
      });
    }

    const existingUser = await Auth.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User with this email already exists in the system"
      });
    }

    const adminProvidedPassword = password;
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(adminProvidedPassword, salt);

    const newUser = new Auth({
      name: name,
      email: email,
      username: username,
      phone: phoneValue,
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

    await newUser.save();

    const teacher = new Teacher({
      name,
      email,
      course,
      phone_number: phoneValue,
      address,
      qualification,
      years_of_experience,
      specialization: specialization || [],
      bio: bio || '',
      created_by: req.user?.id || req.user?.userId
    });

    await teacher.save();

    const teacherResponse = {
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      username: username,
      password: adminProvidedPassword,
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

    res.status(201).json({
      success: true,
      message: "Teacher added successfully!",
      data: teacherResponse,
      credentials: {
        username: username,
        tempPassword: adminProvidedPassword,
        teacherName: name,
        teacherEmail: email
      }
    });

  } catch (error) {
    console.error('🔴 ADD TEACHER ERROR:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Duplicate entry. Teacher with this email already exists."
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
    const { page = 1, limit = 10, search = '', status = '', getAll = 'false' } = req.query;

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

    if (getAll === 'true') {
      teachers = await Teacher.find(query).sort({ createdAt: -1 });
      total = teachers.length;
    } else {
      teachers = await Teacher.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
      
      total = await Teacher.countDocuments(query);
    }

    // Fetch auth data for each teacher
    const teachersWithDetails = await Promise.all(teachers.map(async (teacher) => {
      const authUser = await Auth.findOne({ email: teacher.email });
      return {
        ...teacher.toObject(),
        username: authUser ? authUser.username : teacher.email.split('@')[0],
        password: '••••••••', // Placeholder - actual password is hashed
        phone: teacher.phone_number
      };
    }));

    res.json({
      success: true,
      data: teachersWithDetails,
      total: total
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

    const teacher = await Teacher.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

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
    
    const teacher = await Teacher.findById(id);
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: "Teacher not found"
      });
    }

    await Teacher.findByIdAndUpdate(id, { status: 'inactive' });
    await Auth.findOneAndUpdate({ email: teacher.email }, { isActive: false });

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
    
    const domainStats = await Teacher.aggregate([
      { $group: { _id: '$course', count: { $sum: 1 } } },
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

// Change password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
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
    const user = await Auth.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    
    const isMatch = await bcryptjs.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect"
      });
    }
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 6 characters long"
      });
    }
    
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

// Get teacher password (admin only)
const getTeacherPassword = async (req, res) => {
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
      message: "Use password reset feature to set new password",
      resetLink: `${process.env.FRONTEND_URL}/reset-password?email=${teacher.email}`
    });
    
  } catch (error) {
    console.error('Error getting teacher password:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// controllers/adminaddcontroller.js - Update these functions

// Get all students (basic) - FIXED
const getAllStudents = async (req, res) => {
  try {
    console.log('🔵 getAllStudents called');
    console.log('🔵 req.user:', req.user);
    
    // Check for both possible user ID locations
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - User not authenticated'
      });
    }
    
    const requestingUser = await Auth.findById(userId);
    
    if (!requestingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    console.log('🔵 Requesting user role:', requestingUser.role);
    
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized. Only admins and teachers can view students.'
      });
    }
    
    const students = await Auth.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${students.length} students`);
    
    res.json({
      success: true,
      students: students,
      total: students.length
    });
    
  } catch (error) {
    console.error('Error in getAllStudents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all students with details - FIXED
const getAllStudentsWithDetails = async (req, res) => {
  try {
    console.log('🔵 getAllStudentsWithDetails called');
    console.log('🔵 req.user:', req.user);
    
    // Check for both possible user ID locations
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - User not authenticated'
      });
    }
    
    const requestingUser = await Auth.findById(userId);
    
    if (!requestingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    console.log('🔵 Requesting user role:', requestingUser.role);
    
    if (requestingUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized. Only admins can view student details.'
      });
    }
    
    const students = await Auth.find({ role: 'student' }).sort({ createdAt: -1 });
    
    const formattedStudents = students.map(student => ({
      _id: student._id,
      name: student.name,
      email: student.email,
      username: student.username,
      phone: student.phone,
      password: 'Student@123', // Show default password for demo
      age: student.profile?.age || 'N/A',
      gender: student.profile?.gender || 'N/A',
      dob: student.profile?.dob || 'N/A',
      role: student.role,
      isActive: student.isActive,
      createdAt: student.createdAt
    }));
    
    console.log(`✅ Found ${formattedStudents.length} students with details`);
    
    res.json({
      success: true,
      students: formattedStudents,
      total: formattedStudents.length
    });
    
  } catch (error) {
    console.error('Error in getAllStudentsWithDetails:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get teacher credentials (admin only)
const getTeacherCredentials = async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }
    
    const authUser = await Auth.findOne({ email: teacher.email });
    if (!authUser) {
      return res.status(404).json({
        success: false,
        error: 'Auth user not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        username: authUser.username,
        email: teacher.email
      }
    });
    
  } catch (error) {
    console.error('Error fetching teacher credentials:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Reset student password (admin only)
const resetStudentPassword = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { newPassword } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const student = await Auth.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
    
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(newPassword, salt);
    student.password = hashedPassword;
    await student.save();
    
    res.json({
      success: true,
      message: 'Student password reset successfully',
      newPassword: newPassword
    });
    
  } catch (error) {
    console.error('Error resetting student password:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Reset teacher password (admin only)
const resetTeacherPassword = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { newPassword } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }
    
    const authUser = await Auth.findOne({ email: teacher.email });
    if (!authUser) {
      return res.status(404).json({
        success: false,
        error: 'Auth user not found'
      });
    }
    
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(newPassword, salt);
    authUser.password = hashedPassword;
    await authUser.save();
    
    res.json({
      success: true,
      message: 'Teacher password reset successfully',
      newPassword: newPassword
    });
    
  } catch (error) {
    console.error('Error resetting teacher password:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Export all functions
module.exports = {
  addTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getTeacherStats,
  changePassword,
  getTeacherPassword,
  getAllStudents,
  getAllStudentsWithDetails,
  getTeacherCredentials,
  resetStudentPassword,
  resetTeacherPassword
};