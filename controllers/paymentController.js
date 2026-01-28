// paymentController.js - SIMPLIFIED VERSION
const Payment = require('../models/paymentModel');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const StudentEnrollment = require('../models/Mylearningmodel');
const PersonalInfo = require('../models/formdatapersonal');

// Hardcoded course data ONLY
const courseData = {
  'Web Development': {
    title: "Web Development",
    duration: "14 weeks",
    level: "Beginner to Advanced",
    price: 399,
    category: "Development",
  },
  'Microsoft Office': {
    title: "Microsoft Office",
    duration: "8 weeks",
    level: "All Levels",
    price: 139,
    category: "Productivity",
  },
  'C Programming': {
    title: "C Programming",
    duration: "10 weeks",
    level: "Intermediate",
    price: 199,
    category: "Development",
  },
  'java': {
    title: "java",
    duration: "10 weeks",
    level: "Beginner",
    price: 199,
    category: "Development",
  },
  'php': {
    title: "php",
    duration: "12 weeks",
    level: "All Levels",
    price: 399,
    category: "Development",
  },
  'DBMS': {
    title: "DBMS",
    duration: "10 weeks",
    level: "Advanced",
    price: 229,
    category: "Development",
  },
  'Digital Marketing': {
    title: "Digital Marketing",
    duration: "10 weeks",
    level: "Beginner to Intermediate",
    price: 229,
    category: "Marketing",
  },
  'Tally': {
    title: "Tally",
    duration: "8 weeks",
    level: "Beginner to Intermediate",
    price: 229,
    category: "Productivity",
  },
  'Microsoft Word': {
    title: "Microsoft Word",
    duration: "4 weeks",
    level: "Beginner to Intermediate",
    price: 99,
    category: "Productivity",
  },
  'Microsoft Excel': {
    title: "Microsoft Excel",
    duration: "4 weeks",
    level: "Beginner to Intermediate",
    price: 99,
    category: "Productivity",
  },
  'Microsoft PowerPoint': {
    title: "Microsoft PowerPoint",
    duration: "4 weeks",
    level: "Beginner to Intermediate",
    price: 99,
    category: "Productivity",
  },
  'Python': {
    title: "Python",
    duration: "10 weeks",
    level: "Beginner to Intermediate",
    price: 199,
    category: "Development",
  },
  'Email & Internet': {
    title: "Email & Internet",
    duration: "6 weeks",
    level: "Beginner to Intermediate",
    price: 229,
    category: "Productivity",
  },
  'Canva': {
    title: "Canva",
    duration: "7 weeks",
    level: "Beginner to Advanced",
    price: 179,
    category: "Design",
  },
};

// SIMPLIFIED: Check if course exists in hardcoded data
const getCourse = (courseTitle) => {
  try {
    console.log('🔍 Checking course:', courseTitle);
    
    // Clean the title
    const cleanTitle = String(courseTitle).trim();
    
    // Check hardcoded courses only
    if (courseData[cleanTitle]) {
      console.log('✅ Found in hardcoded data:', cleanTitle);
      return {
        source: 'hardcoded',
        data: courseData[cleanTitle]
      };
    }
    
    console.log('❌ Course not found:', cleanTitle);
    console.log('📋 Available courses:', Object.keys(courseData));
    return null;
    
  } catch (error) {
    console.error('Error in getCourse:', error);
    return null;
  }
};

// SIMPLIFIED: Create enrollment for hardcoded courses only
const createStudentEnrollment = async (payment) => {
  try {
    console.log('🟡 Creating enrollment for payment:', payment._id);
    
    // Get course info
    const courseResult = getCourse(payment.course_track);
    
    if (!courseResult) {
      throw new Error(`Course "${payment.course_track}" not found`);
    }
    
    const course = courseResult.data;
    
    // Course category mapping for hardcoded courses
    const courseTrackMap = {
      'Web Development': 'development',
      'C programming': 'development',
      'java': 'development',
      'php': 'development',
      'DBMS': 'development',
      'Python': 'development',
      'Digital Marketing': 'marketing',
      'Microsoft Office': 'productivity',
      'Tally': 'productivity',
      'Microsoft Word': 'productivity',
      'Microsoft Excel': 'productivity',
      'Microsoft PowerPoint': 'productivity',
      'Email & Internet': 'productivity',
      'Canva': 'design'
    };

    const courseCategory = courseTrackMap[payment.course_track] || 'other';

    // Get student name from personal info
    const personalInfo = await PersonalInfo.findOne({ email: payment.student_email });
    const studentName = personalInfo ? personalInfo.name : 'Student';

    // Check if enrollment already exists
    const existingEnrollment = await StudentEnrollment.findOne({
      student_email: payment.student_email,
      course_category: courseCategory,
      payment_status: 'verified'
    });

    if (existingEnrollment) {
      console.log('⚠️ Enrollment already exists');
      return existingEnrollment;
    }

    // Create enrollment data
    const enrollmentData = {
      student_email: payment.student_email,
      student_name: studentName,
      course_category: courseCategory,
      payment_status: 'verified',
      payment_id: payment._id,
      enrollment_status: 'active',
      progress: {
        overall_progress: 0,
        last_accessed: new Date()
      },
      course_type: 'hardcoded',
      course_title: course.title
    };

    // Create enrollment
    const enrollment = new StudentEnrollment(enrollmentData);
    await enrollment.save();
    
    console.log('✅ Student enrollment created:', enrollment._id);
    return enrollment;
    
  } catch (error) {
    console.error('❌ Error creating student enrollment:', error);
    throw error;
  }
};

// Multer setup (keep as is)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/payments/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const processPayment = async (req, res) => {
  console.log('🚀 Payment endpoint called - START');
  console.log('📦 Request body:', req.body);
  console.log('📁 File received:', req.file ? 'Yes' : 'No');

  try {
    const { student_email, course_track, amount } = req.body;
    
    console.log('🔍 Parsed fields:');
    console.log('  - student_email:', student_email);
    console.log('  - course_track:', course_track);
    console.log('  - amount:', amount);
    
    // Debug: Show exact course_track
    console.log('🔍 DETAILED COURSE CHECK:');
    console.log('  - Raw course_track:', `"${course_track}"`);
    console.log('  - Length:', course_track.length);
    console.log('  - Character codes:', [...course_track].map(c => c.charCodeAt(0)));
    
    // Show all available courses
    console.log('📋 AVAILABLE COURSES IN courseData:');
    Object.keys(courseData).forEach((key, i) => {
      console.log(`  ${i+1}. "${key}" (price: ₹${courseData[key].price})`);
    });
    
    // Quick validation
    if (!student_email) {
      console.log('❌ Missing student_email');
      return res.status(400).json({ 
        success: false,
        error: "Student email is required" 
      });
    }
    
    if (!course_track) {
      console.log('❌ Missing course_track');
      return res.status(400).json({ 
        success: false,
        error: "Course track is required" 
      });
    }
    
    if (!req.file) {
      console.log('❌ Missing screenshot file');
      return res.status(400).json({ 
        success: false,
        error: "Payment screenshot is required" 
      });
    }
    
    // Clean the course title
    const normalizedCourseTrack = String(course_track).trim();
    console.log(`🔄 Normalized course: "${normalizedCourseTrack}"`);
    
    // Check if course exists with multiple methods
    let foundCourse = null;
    let foundKey = null;
    
    // Method 1: Exact match
    if (courseData[normalizedCourseTrack]) {
      foundCourse = courseData[normalizedCourseTrack];
      foundKey = normalizedCourseTrack;
      console.log(`✅ Exact match found: "${foundKey}"`);
    } 
    // Method 2: Case-insensitive match
    else {
      const courseKey = Object.keys(courseData).find(key => 
        key.toLowerCase() === normalizedCourseTrack.toLowerCase()
      );
      
      if (courseKey) {
        foundCourse = courseData[courseKey];
        foundKey = courseKey;
        console.log(`✅ Case-insensitive match found: "${foundKey}" (was looking for: "${normalizedCourseTrack}")`);
      }
    }
    
    if (!foundCourse) {
      console.log(`❌ Course not found: "${normalizedCourseTrack}"`);
      console.log('📋 Available courses:', Object.keys(courseData));
      
      return res.status(400).json({ 
        success: false,
        error: `Course "${normalizedCourseTrack}" not found. Please check the course name.`,
        availableCourses: Object.keys(courseData),
        debug: {
          received: normalizedCourseTrack,
          available: Object.keys(courseData),
          suggestion: "Check for typos or case differences"
        }
      });
    }
    
    console.log('✅ Course found:', foundCourse);
    
    // 3. Create payment record
    const payment = new Payment({
      student_email: student_email,
      course_track: foundKey,  // Use the found key, not the original
      amount: foundCourse.price,
      screenshot_path: req.file.path,
      status: 'verified',
      course_source: 'hardcoded'
    });

    console.log('🟡 Saving payment to database...');
    await payment.save();
    console.log('✅ Payment saved:', payment._id);

    // 4. Create enrollment
    try {
      const enrollment = await createStudentEnrollment(payment);
      
      console.log('✅ Enrollment created:', enrollment._id);
      
      // Success response
      return res.json({
        success: true,
        message: `Payment successful! You are now enrolled in ${foundCourse.title}`,
        course: {
          title: foundCourse.title,
          price: foundCourse.price,
          duration: foundCourse.duration,
          level: foundCourse.level,
          category: foundCourse.category
        },
        payment_id: payment._id,
        enrollment_id: enrollment._id,
        enrollment_date: new Date(),
        status: 'enrolled'
      });

    } catch (enrollmentError) {
      console.log('⚠️ Enrollment failed:', enrollmentError.message);
      
      // Payment succeeded even if enrollment failed
      return res.json({
        success: true,
        message: "Payment successful! Please contact admin for enrollment confirmation.",
        payment_id: payment._id,
        warning: "Enrollment pending"
      });
    }

  } catch (error) {
    console.error('❌ Payment processing error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        error: "Duplicate payment detected" 
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        error: "Validation error: " + errors.join(', ')
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: "Error processing payment: " + error.message 
    });
  }
};

// SIMPLIFIED: Get available courses
const getAvailableCourses = async (req, res) => {
  try {
    console.log('🟡 Fetching hardcoded courses...');
    
    const hardcodedCourses = Object.values(courseData).map(course => ({
      title: course.title,
      price: course.price,
      category: course.category,
      duration: course.duration,
      level: course.level,
      source: 'hardcoded'
    }));
    
    console.log(`✅ Found ${hardcodedCourses.length} hardcoded courses`);
    
    res.json({
      success: true,
      count: hardcodedCourses.length,
      courses: hardcodedCourses,
      message: 'Hardcoded courses only'
    });
    
  } catch (error) {
    console.error('❌ Error fetching courses:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching courses'
    });
  }
};

// Keep other functions simple
const getPaymentStatus = async (req, res) => {
  try {
    const { student_email } = req.params;
    
    const payments = await Payment.find({ student_email })
      .sort({ createdAt: -1 })
      .limit(1);

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No payment record found"
      });
    }
    
    res.json({
      success: true,
      payment: payments[0]
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { status: 'verified' },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error verifying payment'
    });
  }
};

// REMOVE database-related functions
// Remove: getCourseDetails, database searching, Course model imports

module.exports = {
  processPayment,
  getPaymentStatus,
  upload,
  verifyPayment,
  getAvailableCourses,
  createStudentEnrollment
};