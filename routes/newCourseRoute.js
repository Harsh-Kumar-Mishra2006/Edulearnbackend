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

const { adminAuth } = require('../middlewares/adminauthMiddleware');
const { uploadCourseImage } = require('../config/newCourseImageUpload');

// Apply admin authentication to all routes
router.use(adminAuth);

// Course management routes
router.post('/', uploadCourseImage, createCourse);
router.get('/', getAllCourses);
router.get('/stats', getCourseStatistics);
router.get('/:id', getCourseById);
router.put('/:id', uploadCourseImage, updateCourse);
router.put('/:id/status', updateCourseStatus);
router.delete('/:id', deleteCourse);
// Bulk operations
router.post('/bulk-update', bulkUpdateCourses);

module.exports = router;