const Payment = require('../models/paymentModel');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const StudentEnrollment = require('../models/Mylearningmodel');
const PersonalInfo = require('../models/formdatapersonal');
const Course = require('../models/newCourseModel'); // ADD THIS IMPORT

// Hardcoded course data (for backward compatibility)
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

// Function to get course from database or hardcoded data
const getCourse = async (courseTitle) => {
  try {
    console.log('🔍 Looking for course:', courseTitle);
    
    // 1. First check hardcoded courses (for backward compatibility)
    if (courseData[courseTitle]) {
      console.log('✅ Found in hardcoded data');
      return {
        source: 'hardcoded',
        data: courseData[courseTitle]
      };
    }
    
    // 2. Check in database for newly created courses
    const dbCourse = await Course.findOne({
      $or: [
        { title: courseTitle },
        { title: { $regex: new RegExp(courseTitle, 'i') } } // Case-insensitive search
      ],
      status: 'published',
      isActive: true
    });
    
    if (dbCourse) {
      console.log('✅ Found in database:', dbCourse.title);
      return {
        source: 'database',
        data: {
          title: dbCourse.title,
          price: dbCourse.price,
          category: dbCourse.category,
          duration: dbCourse.duration,
          level: dbCourse.level,
          description: dbCourse.description,
          isFree: dbCourse.isFree,
          courseId: dbCourse._id // Important: Store course ID for enrollment
        }
      };
    }
    
    console.log('❌ Course not found');
    return null;
    
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
};

// After payment verification, create enrollment - UPDATED
const createStudentEnrollment = async (payment) => {
  try {
    console.log('🟡 Creating enrollment for payment:', payment._id);
    
    // Get course info
    const courseResult = await getCourse(payment.course_track);
    
    if (!courseResult) {
      throw new Error(`Course "${payment.course_track}" not found`);
    }
    
    const course = courseResult.data;
    const courseSource = courseResult.source;
    
    // Course category mapping - UPDATED to handle new categories
    const courseTrackMap = {
      // Hardcoded courses
      'Web Development': 'web-development',
      'Mobile App Development': 'mobile-dev',
      'Digital Marketing': 'marketing',
      'Microsoft Office': 'productivity',
      'UI/UX Design': 'design',
      'Graphic Design': 'design',
      
      // New database courses mapping (you can expand this)
      'Development': 'development',
      'Design': 'design',
      'Marketing': 'marketing',
      'Productivity': 'productivity',
      'Business': 'business',
      'Technology': 'technology',
      'Data Science': 'data-science',
      'Personal Development': 'personal-development',
      'Others': 'others'
    };

    // Use course category from data or default mapping
    let courseCategory;
    if (courseSource === 'database' && course.courseId) {
      // For database courses, use the course ID directly
      courseCategory = course.courseId.toString(); // Use course ID as category for new courses
    } else {
      // For hardcoded courses, use the mapping
      courseCategory = courseTrackMap[payment.course_track] || 
                      courseTrackMap[course.category] || 
                      course.category.toLowerCase().replace(/\s+/g, '-');
    }

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

    // Prepare enrollment data
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
      }
    };

    // Add course-specific data for database courses
    if (courseSource === 'database' && course.courseId) {
      enrollmentData.course_id = course.courseId; // Store course ID
      enrollmentData.course_title = course.title; // Store course title
      enrollmentData.course_type = 'database'; // Mark as database course
    } else {
      enrollmentData.course_type = 'hardcoded'; // Mark as hardcoded course
    }

    // Create enrollment
    const enrollment = new StudentEnrollment(enrollmentData);
    await enrollment.save();
    
    console.log('✅ Student enrollment created:', enrollment._id);
    
    // If it's a database course, increment enrolled students count
    if (courseSource === 'database' && course.courseId) {
      await Course.findByIdAndUpdate(course.courseId, {
        $inc: { studentsEnrolled: 1 }
      });
      console.log('📈 Updated enrolled students count for course:', course.courseId);
    }
    
    return enrollment;
    
  } catch (error) {
    console.error('❌ Error creating student enrollment:', error);
    throw error;
  }
};

// Set up storage for uploaded files (keep as is)
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

// Initialize multer (keep as is)
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

// Handle payment with screenshot upload - UPDATED
const processPayment = async (req, res) => {
  try {
    console.log('=== 🟡 PAYMENT PROCESSING START ===');
    console.log('1. Payment request received');
    console.log('2. File received:', req.file ? 'Yes' : 'No');
    console.log('3. Request body:', req.body);

    const { student_email, course_track, amount } = req.body;

    // 1. Get course from database OR hardcoded data
    console.log('🔍 Looking up course:', course_track);
    const courseResult = await getCourse(course_track);

    if (!courseResult) {
      console.log('❌ Course not found:', course_track);
      return res.status(400).json({ 
        success: false,
        error: `Course "${course_track}" not found. Please check the course name.`
      });
    }

    const course = courseResult.data;
    const courseSource = courseResult.source;
    
    console.log('✅ Course found via', courseSource, ':', course.title, 'Price:', course.price);
    
    // Handle free courses
    if (course.isFree) {
      console.log('🎉 This is a free course');
      // For free courses, skip payment processing and create enrollment directly
      const payment = new Payment({
        student_email: student_email,
        course_track: course_track,
        amount: 0,
        screenshot_path: 'free-course',
        status: 'verified',
        is_free_course: true
      });

      await payment.save();
      console.log('✅ Free course payment record created');

      // Create enrollment for free course
      const enrollment = await createStudentEnrollment(payment);
      
      return res.json({
        success: true,
        message: `Successfully enrolled in free course: ${course.title}`,
        course: {
          title: course.title,
          description: course.description || "Course description",
          price: 0,
          duration: course.duration,
          level: course.level,
          category: course.category,
          isFree: true
        },
        payment_id: payment._id,
        enrollment_id: enrollment._id,
        enrollment_date: new Date(),
        status: 'enrolled_free'
      });
    }

    const coursePrice = course.price;
    
    // 2. Validate required fields
    if (!student_email || !course_track || !req.file) {
      return res.status(400).json({ 
        success: false,
        error: "All fields are required" 
      });
    }

    console.log('✅ 4. All validations passed');

    // 3. Create payment record
    const payment = new Payment({
      student_email: student_email,
      course_track: course_track,
      amount: coursePrice,
      screenshot_path: req.file.path,
      status: 'verified',
      course_source: courseSource,
      course_id: course.courseId || null
    });

    console.log('🟡 5. Saving payment to database...');
    await payment.save();
    console.log('✅ 6. Payment saved successfully:', payment._id);

    // 4. ✅ AUTO-ENROLL STUDENT AFTER PAYMENT
    console.log('🟡 7. Creating student enrollment...');
    
    try {
      const enrollment = await createStudentEnrollment(payment);
      
      console.log('✅ 8. Student enrollment created successfully:', enrollment._id);
      
      // Send success response
      return res.json({
        success: true,
        message: `Payment successful! You are now enrolled in ${course.title}`,
        course: {
          title: course.title,
          description: course.description || "Course description",
          price: course.price,
          duration: course.duration,
          level: course.level,
          category: course.category,
          isFree: course.isFree || false
        },
        payment_id: payment._id,
        enrollment_id: enrollment._id,
        enrollment_date: new Date(),
        status: 'enrolled'
      });

    } catch (enrollmentError) {
      console.log('⚠️ Enrollment creation failed:', enrollmentError.message);
      
      // Even if enrollment fails, payment was successful
      return res.json({
        success: true,
        message: "Payment successful! Please contact admin for enrollment confirmation.",
        payment_id: payment._id,
        course_info: {
          title: course.title,
          price: course.price
        },
        status: 'payment_successful_enrollment_pending'
      });
    }

  } catch (error) {
    console.error('❌ PAYMENT PROCESSING ERROR:', error.message);
    console.error('❌ Error stack:', error.stack);
    
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

// Get payment status (keep as is)
const getPaymentStatus = async (req, res) => {
  try {
    const { student_email } = req.params;
    
    console.log('🟡 Checking payment status for:', student_email);

    const payments = await Payment.find({ student_email })
      .sort({ createdAt: -1 })
      .limit(1);

    if (payments.length === 0) {
      console.log('❌ No payment record found');
      return res.status(404).json({
        success: false,
        error: "No payment record found"
      });
    }

    console.log('✅ Payment status found:', payments[0].status);
    
    res.json({
      success: true,
      payment: payments[0]
    });

  } catch (error) {
    console.error('❌ Error getting payment status:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Verify payment (admin) - UPDATED
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

    // Create enrollment after verification
    const enrollment = await createStudentEnrollment(payment);

    res.json({
      success: true,
      message: 'Payment verified and student enrolled successfully',
      payment,
      enrollment
    });

  } catch (error) {
    console.error('❌ Verify payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Error verifying payment: ' + error.message
    });
  }
};

// Get all available courses - UPDATED
const getAvailableCourses = async (req, res) => {
  try {
    console.log('🟡 Fetching available courses...');
    
    // Get hardcoded courses
    const hardcodedCourses = Object.values(courseData).map(course => ({
      title: course.title,
      price: course.price,
      category: course.category,
      duration: course.duration,
      level: course.level,
      source: 'hardcoded',
      type: 'original'
    }));
    
    // Get database courses (published and active)
    const dbCourses = await Course.find({
      status: 'published',
      isActive: true
    }).select('title price category duration level description isFree studentsEnrolled');
    
    const transformedDbCourses = dbCourses.map(course => ({
      title: course.title,
      price: course.isFree ? 0 : course.price,
      category: course.category,
      duration: course.duration,
      level: course.level,
      description: course.description,
      isFree: course.isFree,
      enrolledStudents: course.studentsEnrolled || 0,
      source: 'database',
      type: 'new',
      courseId: course._id
    }));
    
    // Combine both lists
    const allCourses = [...hardcodedCourses, ...transformedDbCourses];
    
    console.log(`✅ Found ${allCourses.length} total courses (${hardcodedCourses.length} hardcoded + ${transformedDbCourses.length} from database)`);
    
    res.json({
      success: true,
      count: allCourses.length,
      hardcoded: hardcodedCourses.length,
      database: transformedDbCourses.length,
      courses: allCourses
    });
    
  } catch (error) {
    console.error('❌ Error fetching available courses:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching courses: ' + error.message
    });
  }
};

// New function: Get course details for enrollment
const getCourseDetails = async (req, res) => {
  try {
    const { courseTitle } = req.params;
    
    console.log('🔍 Getting details for course:', courseTitle);
    
    const courseResult = await getCourse(courseTitle);
    
    if (!courseResult) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    const course = courseResult.data;
    
    res.json({
      success: true,
      course: {
        title: course.title,
        price: course.price,
        category: course.category,
        duration: course.duration,
        level: course.level,
        description: course.description,
        isFree: course.isFree || false,
        source: courseResult.source,
        courseId: course.courseId || null
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting course details:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching course details: ' + error.message
    });
  }
};

module.exports = {
  processPayment,
  getPaymentStatus,
  upload,
  createStudentEnrollment,
  verifyPayment,
  getAvailableCourses,
  getCourseDetails // Add this new function
};