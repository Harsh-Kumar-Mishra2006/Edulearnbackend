// routes/querryRoutes.js
const express = require('express');
const router = express.Router();
const querryController = require('../controllers/querryController');

// Import your auth middlewares
const { studentAuth } = require('../middlewares/studentauthMiddleware');
const { adminAuth } = require('../middlewares/adminauthMiddleware');

// ============ STUDENT ONLY ROUTES ============
// Submit a new query - only authenticated students
router.post('/submit', studentAuth, querryController.submitQuery);

// ============ ADMIN ONLY ROUTES ============
// Get all queries - admin only
router.get('/all', adminAuth, querryController.getAllQueries);

// Get single query by ID - admin only
router.get('/:id', adminAuth, querryController.getQueryById);

// Delete query - admin only
router.delete('/:id', adminAuth, querryController.deleteQuery);

module.exports = router;// routes/querryRoutes.js