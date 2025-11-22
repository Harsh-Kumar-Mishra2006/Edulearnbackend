const express = require('express');
const router = express.Router();
const {
  getMyLearningCourses,
  getCategoryMaterials,
  markMaterialCompleted,
  getLearningProgress,
  debugStudentData
} = require('../controllers/Mylearningcontroller');

const { studentAuth } = require('../middlewares/studentauthMiddleware');

// All routes require student authentication
router.use(studentAuth);

// Get all learning materials for enrolled courses
router.get('/courses', getMyLearningCourses);

// Get materials for specific course category
router.get('/courses/:category', getCategoryMaterials);

// Mark material as completed
router.post('/progress/:category/:material_type/:material_id', markMaterialCompleted);

// Get learning progress
router.get('/progress', getLearningProgress);
router.get('/debug', debugStudentData);

module.exports = router;