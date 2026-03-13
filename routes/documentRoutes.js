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
  checkStorageHealth
} = require('../controllers/documentController');

// ============ TEACHER ROUTES ============
router.post(
  '/courses/:course_id/upload',
  teacherAuth,
  upload.single('document'),
  uploadDocumentLocal
);

// ============ STUDENT ROUTES - FIXED ============
// View document (with auth check)
router.get(
  '/courses/:course_id/documents/:document_id/view',
  studentAuth,
  serveDocument  // This should serve the file with proper headers
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

// ============ DIRECT FILE ACCESS (NO AUTH) ============
// This should be protected by obfuscated filename only
router.get('/local/:filename', serveDocument);

// Health check endpoint
router.get('/storage/health', checkStorageHealth);

module.exports = router;