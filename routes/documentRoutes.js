// routes/documentRoutes.js - FIXED VERSION

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

// ============ TEACHER ROUTES ============
router.post(
  '/courses/:course_id/upload',
  teacherAuth,
  upload.single('document'),
  uploadDocumentLocal
);

// ============ STUDENT ROUTES ============
// View document (with auth check) - FIXED: Use document_id, not filename
router.get(
  '/courses/:course_id/documents/:document_id/view',
  studentAuth,
  serveDocument
);

// Download document (with auth check)
router.get(
  '/courses/:course_id/documents/:document_id/download',
  studentAuth,
  downloadDocument
);

// Get document info
router.get(
  '/courses/:course_id/documents/:document_id/info',
  studentAuth,
  getDocumentInfo
);


// Add to routes
router.get('/debug/list-files', teacherAuth, listUploadedFiles);

// ============ DIRECT FILE ACCESS (BY FILENAME) ============
// This route should be used for files referenced directly by filename
// Note: This route doesn't have authentication - security through obscurity
router.get('/local/:filename', serveDocument);

// Health check endpoint
router.get('/storage/health', checkStorageHealth);

module.exports = router;