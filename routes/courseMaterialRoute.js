const express = require('express');
const router = express.Router();
const {
  createCourse,
  uploadVideoToCourse,
  uploadDocumentToCourse,
  getTeacherCourses,
  getCourseDetails,
  updateCourseStatus,
  updateCourseInfo,
  deleteCourseMaterial,
  reorderVideos,
  getCourseMaterials,
  updateVideoInfo,
  updateDocumentInfo,
  addMeetingToCourse,
  updateMeetingInfo,
  getCourseMeetings,
  deleteMeeting,
  reorderMeetings
} = require('../controllers/courseMaterialController');

const { teacherAuth } = require('../middlewares/teacherauthMiddleware');
const { uploadVideo, uploadDocument } = require('../config/cloudinaryStorage')

router.use(teacherAuth);

// Course management
router.post('/courses', createCourse);
router.get('/courses', getTeacherCourses);
router.get('/courses/:course_id', getCourseDetails);
router.put('/courses/:course_id/status', updateCourseStatus);
router.put('/courses/:course_id/info', updateCourseInfo);
router.put('/courses/:course_id/reorder-videos', reorderVideos);

// File uploads - CORRECT ORDER: Multer middleware first, then controller
router.post('/courses/:course_id/videos', uploadVideo, uploadVideoToCourse);
router.post('/courses/:course_id/documents', uploadDocument, uploadDocumentToCourse);

// Materials management
router.get('/courses/:course_id/materials', getCourseMaterials);
router.put('/courses/:course_id/videos/:video_id', updateVideoInfo);
router.put('/courses/:course_id/documents/:document_id', updateDocumentInfo);

// Meeting management - NEW ROUTES
router.post('/courses/:course_id/meetings', addMeetingToCourse);
router.get('/courses/:course_id/meetings', getCourseMeetings);
router.put('/courses/:course_id/meetings/:meeting_id', updateMeetingInfo);
router.delete('/courses/:course_id/meetings/:meeting_id', deleteMeeting);
router.put('/courses/:course_id/reorder-meetings', reorderMeetings);

// Delete materials
router.delete('/courses/:course_id/materials/:material_type/:material_id', deleteCourseMaterial);

// In your routes, add:
router.get('/test-auth', teacherAuth, async (req, res) => {
  res.json({
    success: true,
    message: "Authentication successful",
    user: req.user
  });
});

module.exports = router;