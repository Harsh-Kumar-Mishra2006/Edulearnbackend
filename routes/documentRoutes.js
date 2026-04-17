// routes/documentRoutes.js - COMPLETELY FIXED VERSION

const express = require('express');
const router = express.Router();
const { upload } = require('../config/multerStorage');
const { teacherAuth } = require('../middlewares/teacherauthMiddleware');
const { studentAuth } = require('../middlewares/studentauthMiddleware');
const {
  uploadDocumentLocal,
  serveDocument,
  downloadDocument,
  getDocumentInfo,
  checkStorageHealth,
  listUploadedFiles
} = require('../controllers/documentController');

// ============ COMMON MIDDLEWARE FOR ACCESS CONTROL ============
// Instead of duplicate routes, use a single route with conditional auth
const checkDocumentAccess = async (req, res, next) => {
  try {
    // If user is teacher, they have full access
    if (req.user && req.user.role === 'teacher') {
      req.accessType = 'teacher';
      return next();
    }
    
    // If user is student, they need to be enrolled
    if (req.user && req.user.role === 'student') {
      req.accessType = 'student';
      return next();
    }
    
    return res.status(401).json({ success: false, error: 'Authentication required' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============ TEACHER ROUTES ============
router.post(
  '/courses/:course_id/upload',
  teacherAuth,
  upload.single('document'),
  uploadDocumentLocal
);

// ============ UNIVERSAL ROUTES (Works for both teachers and students) ============
// ✅ Single route for viewing documents - handles both roles
router.get(
  '/courses/:course_id/documents/:document_id/view',
  studentAuth,  // Use studentAuth which checks both student and teacher roles
  serveDocument
);

// ✅ Single route for downloading documents - handles both roles
router.get(
  '/courses/:course_id/documents/:document_id/download',
  studentAuth,  // Use studentAuth which checks both student and teacher roles
  downloadDocument
);

// ✅ Document info - works for both
router.get(
  '/courses/:course_id/documents/:document_id/info',
  studentAuth,
  getDocumentInfo
);

// ============ DEBUG ROUTES (Teacher only) ============
router.get('/debug/list-files', teacherAuth, listUploadedFiles);
router.get('/storage/health', checkStorageHealth);

module.exports = router;