// routes/Mylearingroutes.js - UPDATED VERSION
const express = require('express');
const router = express.Router();
const {
  getMyLearningCourses,
  getCategoryMaterials,
  markMaterialCompleted,
  getLearningProgress,
  debugStudentData
} = require('../controllers/Mylearningcontroller');

const { 
  downloadVideo, 
  downloadDocument, 
  viewFile 
} = require('../controllers/studentDownloadController');

const { studentAuth } = require('../middlewares/studentauthMiddleware');

// All routes require student authentication
router.use(studentAuth);

// Get all learning materials for enrolled courses
router.get('/courses', getMyLearningCourses);

// Get materials for specific course category
router.get('/courses/:category', getCategoryMaterials);

// Download endpoints
router.get('/download/video/:course_id/:video_id', downloadVideo);
router.get('/download/document/:course_id/:document_id', downloadDocument);
router.get('/view/:public_id', viewFile);

// Mark material as completed
router.post('/progress/:category/:material_type/:material_id', markMaterialCompleted);

// Get learning progress
router.get('/progress', getLearningProgress);
router.get('/debug', debugStudentData);

// Test endpoint for Cloudinary URLs
router.get('/test-cloudinary/:public_id', async (req, res) => {
  try {
    const { public_id } = req.params;
    const cloudinary = require('../config/cloudinaryConfig');
    
    const resourceInfo = await cloudinary.api.resource(public_id, {
      resource_type: 'auto'
    });
    
    res.json({
      success: true,
      public_id,
      url: `https://res.cloudinary.com/dpsssv5tg/${resourceInfo.resource_type}/upload/${public_id}`,
      resource_type: resourceInfo.resource_type,
      format: resourceInfo.format,
      bytes: resourceInfo.bytes,
      secure_url: resourceInfo.secure_url
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;