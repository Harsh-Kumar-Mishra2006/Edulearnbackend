// routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getStudentRecords, 
  updatePaymentStatus 
} = require('../controllers/teacherController');

// Get all student payment records
router.get('/student-records', getStudentRecords);

// Update payment status
router.put('/payment/:id/status', updatePaymentStatus);

module.exports = router;