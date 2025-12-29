const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { adminAuth } = require('../middlewares/adminauthMiddleware');
const { validateEmailRequest } = require('../middlewares/validationMiddleware');

// Public routes
router.post('/send', validateEmailRequest, emailController.sendEmail);

// Admin protected routes
router.post('/bulk', adminAuth, emailController.sendBulkEmails);
router.get('/stats', adminAuth, emailController.getEmailStats);
router.get('/logs', adminAuth, emailController.getEmailLogs);
router.post('/templates/initialize', adminAuth, emailController.initializeTemplates);
router.put('/templates/:id', adminAuth, emailController.updateTemplate);

module.exports = router;