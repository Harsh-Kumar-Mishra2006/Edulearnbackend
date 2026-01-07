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
  bulkUpdateCourses,
  getPublishedCoursesForStudents
} = require('../controllers/newCourseController');

const { teacherAuth } = require('../middlewares/teacherauthMiddleware');
const { uploadCourseImage } = require('../config/newCourseImageUpload');

// ============ TEACHER ROUTES ============
router.use('/teacher', teacherAuth); // Apply to all teacher routes

router.post('/teacher', uploadCourseImage, createCourse);
router.get('/teacher', getAllCourses);
router.get('/teacher/stats', getCourseStatistics);
router.get('/teacher/:id', getCourseById);
router.put('/teacher/:id', uploadCourseImage, updateCourse);
router.put('/teacher/:id/status', updateCourseStatus);
router.delete('/teacher/:id', deleteCourse);
router.post('/teacher/bulk-update', bulkUpdateCourses);

module.exports = router;