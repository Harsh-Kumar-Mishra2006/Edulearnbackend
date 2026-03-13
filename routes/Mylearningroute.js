// routes/Mylearingroutes.js - FIXED
const express = require('express');
const router = express.Router();
const {
  getMyLearningCourses,
  getCategoryMaterials,
  markMaterialCompleted,
  getLearningProgress
} = require('../controllers/Mylearningcontroller');

const { downloadVideo } = require('../controllers/studentDownloadController');
const { studentAuth } = require('../middlewares/studentauthMiddleware');

// All routes require student authentication
router.use(studentAuth);

// Get all learning materials
router.get('/courses', getMyLearningCourses);

// Get materials for specific course category
router.get('/courses/:category', getCategoryMaterials);

// Download video ONLY (documents handled by documentRoutes)
router.get('/download/video/:course_id/:video_id', downloadVideo);

// Mark material as completed
router.post('/progress/:category/:material_type/:material_id', markMaterialCompleted);

// Get learning progress
router.get('/progress', getLearningProgress);

module.exports = router;