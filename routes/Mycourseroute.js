const express = require('express');
const router = express.Router();
const {
  getMyCourses,
  getCourseWithMaterials,
  getCourseMaterialsByType,
  getCourseStatistics,
  deleteCourse
} = require('../controllers/Mycoursecontroller');

const { teacherAuth } = require('../middlewares/teacherauthMiddleware');

// Apply teacher auth middleware to all routes
router.use(teacherAuth);

// My Courses routes
router.get('/', getMyCourses);
router.get('/statistics', getCourseStatistics);
router.get('/:course_id', getCourseWithMaterials);
router.get('/:course_id/materials/:material_type', getCourseMaterialsByType);
router.delete('/:course_id', deleteCourse);

module.exports = router;