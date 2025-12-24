// routes/adminCourseRoutes.js
const express = require('express');
const router = express.Router();
const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  updateCourseStatus,
  deleteCourse,
  getCourseStatistics,
  bulkUpdateCourses
} = require('../controllers/newCourseController');

const { adminAuth } = require('../middlewares/adminAuthMiddleware');
const { uploadCourseImage } = require('../config/newCourseImageUpload');

// Apply admin authentication to all routes
router.use(adminAuth);

// Course management routes
router.post('/courses', uploadCourseImage, createCourse);
router.get('/courses', getAllCourses);
router.get('/courses/stats', getCourseStatistics);
router.get('/courses/:id', getCourseById);
router.put('/courses/:id', uploadCourseImage, updateCourse);
router.put('/courses/:id/status', updateCourseStatus);
router.delete('/courses/:id', deleteCourse);

// Bulk operations
router.post('/courses/bulk-update', bulkUpdateCourses);

module.exports = router;