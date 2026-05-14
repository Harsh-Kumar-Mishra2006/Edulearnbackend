// paymentController.js - UPDATED with Cloudinary
const Payment = require('../models/paymentModel');
const StudentEnrollment = require('../models/Mylearningmodel');
const PersonalInfo = require('../models/formdatapersonal');
const { cloudinary } = require('../config/cloudinary');

// Hardcoded course data (keep as before)
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

// Helper function to get course
const getCourse = (courseTitle) => {
  try {
    console.log('🔍 Checking course:', courseTitle);
    const cleanTitle = String(courseTitle).trim();
    
    if (courseData[cleanTitle]) {
      console.log('✅ Found in hardcoded data:', cleanTitle);
      return {
        source: 'hardcoded',
        data: courseData[cleanTitle]
      };
    }
    
    // Case-insensitive match
    const courseKey = Object.keys(courseData).find(key => 
      key.toLowerCase() === cleanTitle.toLowerCase()
    );
    
    if (courseKey) {
      console.log('✅ Case-insensitive match found:', courseKey);
      return {
        source: 'hardcoded',
        data: courseData[courseKey]
      };
    }
    
    console.log('❌ Course not found:', cleanTitle);
    return null;
    
  } catch (error) {
    console.error('Error in getCourse:', error);
    return null;
  }
};

// Create student enrollment
const createStudentEnrollment = async (payment, screenshotUrl) => {
  try {
    console.log('🟡 Creating enrollment for payment:', payment._id);
    
    const courseResult = getCourse(payment.course_track);
    
    if (!courseResult) {
      throw new Error(`Course "${payment.course_track}" not found`);
    }
    
    const course = courseResult.data;
    const courseCategory = course.title;

    const personalInfo = await PersonalInfo.findOne({ email: payment.student_email });
    const studentName = personalInfo ? personalInfo.name : 'Student';

    const existingEnrollment = await StudentEnrollment.findOne({
      student_email: payment.student_email,
      course_category: courseCategory,
      payment_status: 'verified'
    });

    if (existingEnrollment) {
      console.log('⚠️ Enrollment already exists');
      return existingEnrollment;
    }

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
      course_title: course.title,
      screenshot_url: screenshotUrl // Store screenshot URL in enrollment too
    };

    const enrollment = new StudentEnrollment(enrollmentData);
    await enrollment.save();
    
    console.log('✅ Student enrollment created:', enrollment._id);
    return enrollment;
    
  } catch (error) {
    console.error('❌ Error creating student enrollment:', error);
    throw error;
  }
};

// Process payment with Cloudinary
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
    
    // Validation
    if (!student_email) {
      return res.status(400).json({ 
        success: false,
        error: "Student email is required" 
      });
    }
    
    if (!course_track) {
      return res.status(400).json({ 
        success: false,
        error: "Course track is required" 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: "Payment screenshot is required" 
      });
    }
    
    // Get course details
    const courseResult = getCourse(course_track);
    
    if (!courseResult) {
      return res.status(400).json({ 
        success: false,
        error: `Course "${course_track}" not found`,
        availableCourses: Object.keys(courseData)
      });
    }

    const course = courseResult.data;
    const foundKey = Object.keys(courseData).find(key => 
      key.toLowerCase() === String(course_track).trim().toLowerCase()
    ) || course_track;

    // ✅ File is already uploaded to Cloudinary by multer-storage-cloudinary
    // The file URL is available in req.file.path
    const screenshotUrl = req.file.path;
    const screenshotPublicId = req.file.filename;

    console.log('✅ Screenshot uploaded to Cloudinary:', screenshotUrl);

    // Create payment record with Cloudinary URL
    const payment = new Payment({
      student_email: student_email,
      course_track: foundKey,
      amount: course.price,
      screenshot_path: screenshotUrl, // Cloudinary URL
      screenshot_public_id: screenshotPublicId,
      status: 'pending',
      course_source: 'hardcoded'
    });

    console.log('🟡 Saving payment to database...');
    await payment.save();
    console.log('✅ Payment saved:', payment._id);

    // Create enrollment
    try {
      const enrollment = await createStudentEnrollment(payment, screenshotUrl);
      
      return res.json({
        success: true,
        message: `Payment recorded! You are now enrolled in ${course.title}`,
        course: {
          title: course.title,
          price: course.price,
          duration: course.duration,
          level: course.level,
          category: course.category
        },
        payment_id: payment._id,
        enrollment_id: enrollment._id,
        screenshot_url: screenshotUrl,
        enrollment_date: new Date(),
        status: 'enrolled'
      });

    } catch (enrollmentError) {
      console.log('⚠️ Enrollment failed:', enrollmentError.message);
      
      return res.json({
        success: true,
        message: "Payment recorded! Please contact admin for enrollment confirmation.",
        payment_id: payment._id,
        screenshot_url: screenshotUrl,
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
    
    res.status(500).json({ 
      success: false,
      error: "Error processing payment: " + error.message 
    });
  }
};

// Get available courses
const getAvailableCourses = async (req, res) => {
  try {
    const hardcodedCourses = Object.values(courseData).map(course => ({
      title: course.title,
      price: course.price,
      category: course.category,
      duration: course.duration,
      level: course.level,
      source: 'hardcoded'
    }));
    
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

module.exports = {
  processPayment,
  getPaymentStatus,
  verifyPayment,
  getAvailableCourses,
  createStudentEnrollment
};