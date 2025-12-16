const express = require('express');
const router = express.Router();
const { 
  processPayment, 
  getPaymentStatus, 
  upload,
  verifyPayment,
  getAvailableCourses
} = require('../controllers/paymentController');

// Process payment with screenshot upload (auto-enrolls student)
router.post('/process', upload.single('screenshot'), processPayment);

// Manual payment verification (admin use)
router.put('/verify/:paymentId', verifyPayment);

// Get payment status
router.get('/status/:student_email', getPaymentStatus);

router.get('/available-courses', getAvailableCourses);


module.exports = router;