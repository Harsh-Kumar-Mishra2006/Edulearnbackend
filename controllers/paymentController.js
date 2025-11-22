const Payment = require('../models/paymentModel');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const StudentEnrollment = require('../models/Mylearningmodel');
const PersonalInfo = require('../models/formdatapersonal'); // Add this import

// After payment verification, create enrollment
const createStudentEnrollment = async (payment) => {
  try {
    // CORRECTED course category mapping
    const courseTrackMap = {
      'Web Development': 'web-development',
      'Mobile App Development': 'mobile-dev', // Changed from 'app-development'
      'Digital Marketing': 'digital-marketing', // This doesn't exist in CourseMaterial model
      'Microsoft Office': 'microsoft-office', // This doesn't exist in CourseMaterial model
      'UI/UX Design': 'design', // Changed from 'ui-ux-design'
      'Business': 'business',
      'Graphic Design': 'design' // Map Graphic Design to design
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
    // Create directory if it doesn't exist
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

// Handle payment with screenshot upload - UPDATED TO AUTO-ENROLL
const processPayment = async (req, res) => {
  try {
    console.log('=== 🟡 PAYMENT PROCESSING START ===');
    console.log('1. Payment request received');
    console.log('2. File received:', req.file ? 'Yes' : 'No');
    console.log('3. Request body:', req.body);

    const { student_email, course_track, amount } = req.body;
    
    // Validate required fields
    if (!student_email) {
      console.log('🔴 4. Validation failed: Student email missing');
      return res.status(400).json({ 
        success: false,
        error: "Student email is required" 
      });
    }

    if (!course_track) {
      console.log('🔴 5. Validation failed: Course track missing');
      return res.status(400).json({ 
        success: false,
        error: "Course track is required" 
      });
    }

    if (!req.file) {
      console.log('🔴 6. Validation failed: Screenshot missing');
      return res.status(400).json({ 
        success: false,
        error: "Payment screenshot is required" 
      });
    }

    console.log('🟢 7. All validations passed');

    // Create payment record
    const payment = new Payment({
      student_email: student_email,
      course_track: course_track,
      amount: amount || 499,
      screenshot_path: req.file.path,
      status: 'verified' // Changed from 'pending' to 'verified' for auto-enrollment
    });

    console.log('🟡 8. Saving payment to database...');
    await payment.save();
    console.log('🟢 9. Payment saved successfully:', payment._id);

    // ✅ AUTO-ENROLL STUDENT AFTER PAYMENT
    console.log('🟡 10. Creating student enrollment...');
    let enrollment;
    try {
      enrollment = await createStudentEnrollment(payment);
      console.log('🟢 11. Student enrollment created:', enrollment._id);
    } catch (enrollmentError) {
      console.log('🟡 12. Enrollment creation failed, but payment was successful');
      // Continue even if enrollment fails
    }

    res.json({
      success: true,
      message: "Payment successful! You are now enrolled in the course.",
      payment_id: payment._id,
      enrollment_id: enrollment?._id,
      status: 'enrolled' // Changed from 'pending_verification'
    });

  } catch (error) {
    console.error('🔴 13. PAYMENT PROCESSING ERROR:', error);
    console.error('🔴 14. Error details:', error.message);
    
    // Handle specific errors
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

// Add a manual verification endpoint for admin
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

    // Create enrollment after manual verification
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

module.exports = {
  processPayment,
  getPaymentStatus,
  upload,
  createStudentEnrollment,
  verifyPayment // Add this export
};