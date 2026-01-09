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
} = require('../controllers/newCourseController');

const { teacherAuth } = require('../middlewares/teacherauthMiddleware');
const { uploadCourseImage } = require('../config/newCourseImageUpload');

// ✅ Apply teacherAuth to all routes in this file
router.use(teacherAuth);

// ✅ Define routes without duplicate /teacher
router.post('/', uploadCourseImage, createCourse); // POST /api/teacher/courses
router.get('/', getAllCourses); // GET /api/teacher/courses
router.get('/stats', getCourseStatistics); // GET /api/teacher/courses/stats
router.get('/:id', getCourseById); // GET /api/teacher/courses/:id
router.put('/:id', uploadCourseImage, updateCourse); // PUT /api/teacher/courses/:id
router.put('/:id/status', updateCourseStatus); // PUT /api/teacher/courses/:id/status
router.delete('/:id', deleteCourse); // DELETE /api/teacher/courses/:id
router.post('/bulk-update', bulkUpdateCourses); // POST /api/teacher/courses/bulk-update

module.exports = router;