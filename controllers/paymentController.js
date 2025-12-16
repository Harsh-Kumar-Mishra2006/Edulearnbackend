// paymentController.js - Modified version
const Payment = require('../models/paymentModel');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const StudentEnrollment = require('../models/Mylearningmodel');
const PersonalInfo = require('../models/formdatapersonal');

// Hardcoded course data (same as in courseRoutes.js)
const courseData = {
  'Web Development': {
    title: 'Web Development',
    price: 299,
    category: 'Development',
    duration: '12 weeks',
    level: 'Beginner to Advanced'
  },
  'Microsoft Office': {
    title: 'Microsoft Office',
    price: 99,
    category: 'Productivity',
    duration: '6 weeks',
    level: 'All Levels'
  },
  'Mobile App Development': {
    title: 'Mobile App Development',
    price: 349,
    category: 'Development',
    duration: '10 weeks',
    level: 'Intermediate'
  },
  'UI/UX Design': {
    title: 'UI/UX Design',
    price: 249,
    category: 'Design',
    duration: '8 weeks',
    level: 'Beginner'
  },
  'Digital Marketing': {
    title: 'Digital Marketing',
    price: 199,
    category: 'Marketing',
    duration: '7 weeks',
    level: 'All Levels'
  },
  'Graphic Design': {
    title: 'Graphic Design',
    price: 229,
    category: 'Design',
    duration: '9 weeks',
    level: 'Beginner to Intermediate'
  }
};

// After payment verification, create enrollment
const createStudentEnrollment = async (payment) => {
  try {
    // Course category mapping
    const courseTrackMap = {
      'Web Development': 'web-development',
      'Mobile App Development': 'mobile-dev',
      'Digital Marketing': 'marketing',
      'Microsoft Office': 'productivity',
      'UI/UX Design': 'design',
      'Graphic Design': 'design'
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
      console.log('Enrollment already exists for this student and course');
      return existingEnrollment;
    }

    // Create enrollment
    const enrollment = new StudentEnrollment({
      student_email: payment.student_email,
      student_name: studentName,
      course_category: courseCategory,
      payment_status: 'verified',
      payment_id: payment._id
    });

    await enrollment.save();
    console.log('Student enrollment created:', enrollment._id);
    return enrollment;
    
  } catch (error) {
    console.error('Error creating student enrollment:', error);
    throw error;
  }
};

// Set up storage for uploaded files
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

// Initialize multer
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Handle payment with screenshot upload - UPDATED: Uses hardcoded course data
const processPayment = async (req, res) => {
  try {
    console.log('=== 🟡 PAYMENT PROCESSING START ===');
    console.log('1. Payment request received');
    console.log('2. File received:', req.file ? 'Yes' : 'No');
    console.log('3. Request body:', req.body);

    const { student_email, course_track, amount } = req.body;

    // 1. Check course in hardcoded data (NOT from database)
    const course = courseData[course_track];

    if (!course) {
      console.log('🔴 Course not found:', course_track);
      console.log('🟡 Available courses:', Object.keys(courseData));
      return res.status(400).json({ 
        success: false,
        error: "Course not found. Available courses: " + Object.keys(courseData).join(', ')
      });
    }

    console.log('🟢 Course found in hardcoded data:', course.title, 'Price:', course.price);
    const coursePrice = course.price;
    
    // 2. Validate required fields
    if (!student_email || !course_track || !req.file) {
      return res.status(400).json({ 
        success: false,
        error: "All fields are required" 
      });
    }

    console.log('🟢 4. All validations passed');

    // 3. Create payment record
    const payment = new Payment({
      student_email: student_email,
      course_track: course_track,
      amount: coursePrice, // Use price from hardcoded data
      screenshot_path: req.file.path,
      status: 'verified'
    });

    console.log('🟡 5. Saving payment to database...');
    await payment.save();
    console.log('🟢 6. Payment saved successfully:', payment._id);

    // 4. ✅ AUTO-ENROLL STUDENT AFTER PAYMENT
    console.log('🟡 7. Creating student enrollment...');
    
    try {
      // Get student name from personal info
      const personalInfo = await PersonalInfo.findOne({ email: student_email });
      const studentName = personalInfo ? personalInfo.name : 'Student';
      
      // Map course track to category
      let courseCategory = 'other';
if (course_track === 'Web Development') courseCategory = 'web-development';
else if (course_track === 'Mobile App Development') courseCategory = 'mobile-dev';
else if (course_track === 'UI/UX Design' || course_track === 'Graphic Design') courseCategory = 'design';
else if (course_track === 'Digital Marketing') courseCategory = 'marketing';
else if (course_track === 'Microsoft Office') courseCategory = 'productivity';
      
      // Create enrollment
      const enrollment = new StudentEnrollment({
        student_email: student_email,
        student_name: studentName,
        course_category: courseCategory,
        enrollment_status: 'active',
        payment_status: 'verified',
        payment_id: payment._id,
        progress: {
          overall_progress: 0,
          last_accessed: new Date()
        }
      });

      await enrollment.save();
      console.log('✅ 8. Student enrollment created successfully:', enrollment._id);
      
      // Send success response with course details from hardcoded data
      return res.json({
        success: true,
        message: "Payment successful! You are now enrolled in " + course_track,
        course: {
          title: course.title,
          description: "Course description here", // You can add this to courseData if needed
          price: course.price,
          duration: course.duration,
          level: course.level,
          category: course.category
        },
        payment_id: payment._id,
        enrollment_id: enrollment._id,
        enrollment_date: new Date(),
        status: 'enrolled'
      });

    } catch (enrollmentError) {
      console.log('🟡 9. Enrollment creation failed:', enrollmentError.message);
      
      // Even if enrollment fails, payment was successful
      return res.json({
        success: true,
        message: "Payment successful! Please contact admin for enrollment confirmation.",
        payment_id: payment._id,
        status: 'payment_successful'
      });
    }

  } catch (error) {
    console.error('🔴 10. PAYMENT PROCESSING ERROR:', error.message);
    console.error('🔴 Error stack:', error.stack);
    
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

// Get payment status
const getPaymentStatus = async (req, res) => {
  try {
    const { student_email } = req.params;
    
    console.log('🟡 Checking payment status for:', student_email);

    const payments = await Payment.find({ student_email })
      .sort({ createdAt: -1 })
      .limit(1);

    if (payments.length === 0) {
      console.log('🔴 No payment record found for:', student_email);
      return res.status(404).json({
        success: false,
        error: "No payment record found"
      });
    }

    console.log('🟢 Payment status found:', payments[0].status);
    
    res.json({
      success: true,
      payment: payments[0]
    });

  } catch (error) {
    console.error('🔴 Error getting payment status:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Verify payment (admin)
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

    const enrollment = await createStudentEnrollment(payment);

    res.json({
      success: true,
      message: 'Payment verified and student enrolled successfully',
      payment,
      enrollment
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Error verifying payment: ' + error.message
    });
  }
};

// Add a helper function to get all available courses
const getAvailableCourses = (req, res) => {
  res.json({
    success: true,
    courses: Object.values(courseData).map(course => ({
      title: course.title,
      price: course.price,
      category: course.category,
      duration: course.duration,
      level: course.level
    }))
  });
};

module.exports = {
  processPayment,
  getPaymentStatus,
  upload,
  createStudentEnrollment,
  verifyPayment,
  getAvailableCourses 
};