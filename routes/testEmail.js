// routes/testEmail.js
const express = require('express');
const router = express.Router();
const EmailService = require('../services/emailService');

router.post('/test-email', async (req, res) => {
  try {
    console.log('🧪 TEST: Starting email test...');
    
    const result = await EmailService.sendTemplateEmail(
      'teacher_welcome',
      'test@example.com', // Change to your REAL email for testing
      {
        teacherName: 'John Doe',
        username: 'johndoe@edulearn.com',
        tempPassword: 'Test1234',
        appName: 'EduLearn',
        loginUrl: 'http://localhost:5173/login',
        teacherPortalUrl: 'http://localhost:5173/teacher/dashboard',
        adminName: 'Admin User',
        adminEmail: 'admin@edulearn.com',
        supportEmail: 'support@edulearn.com',
        year: new Date().getFullYear()
      },
      { test: true }
    );
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: result
    });
  } catch (error) {
    console.error('🧪 TEST ERROR:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;