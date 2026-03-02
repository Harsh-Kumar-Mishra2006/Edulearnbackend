// routes/documentRoutes.js - LOCAL STORAGE ONLY VERSION
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
// Upload document to local storage
router.post(
  '/courses/:course_id/upload',
  teacherAuth,
  upload.single('document'),
  uploadDocumentLocal
);

// ============ STUDENT ROUTES ============
// Download document
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

// ============ PUBLIC ROUTES ============
// Serve local files directly (no auth needed for viewing - but file URL is obfuscated)
router.get('/local/:filename', serveDocument);

// Health check endpoint
router.get('/storage/health', checkStorageHealth);

module.exports = router;