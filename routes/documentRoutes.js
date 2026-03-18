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

// Teacher can also view/download their own documents
router.get(
  '/courses/:course_id/documents/:document_id/view',
  teacherAuth,
  serveDocument
);

router.get(
  '/courses/:course_id/documents/:document_id/download',
  teacherAuth,
  downloadDocument
);

// ============ STUDENT ROUTES ============
router.get(
  '/courses/:course_id/documents/:document_id/view',
  studentAuth,
  serveDocument
);

router.get(
  '/courses/:course_id/documents/:document_id/download',
  studentAuth,
  downloadDocument
);

router.get(
  '/courses/:course_id/documents/:document_id/info',
  studentAuth,
  getDocumentInfo
);

// ============ DEBUG ROUTES (Teacher only) ============
router.get('/debug/list-files', teacherAuth, listUploadedFiles);
router.get('/storage/health', checkStorageHealth);

// ============ DIRECT FILE ACCESS (OPTIONAL - REMOVE IF NOT NEEDED) ============
// If you need this, add authentication
// router.get('/local/:filename', teacherAuth, serveDocument);

module.exports = router;