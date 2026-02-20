const express = require('express');
const router = express.Router();
const { upload } = require('../config/multerStorage');
const { teacherAuth } = require('../middlewares/teacherauthMiddleware');
const { studentAuth } = require('../middlewares/studentauthMiddleware');
const {
  uploadDocumentDual,
  downloadDocument,
  getDocumentInfo,
  checkDocumentHealth
} = require('../controllers/documentController');

// ✅ ADD THESE!
const fs = require('fs');
const path = require('path');

// ============ TEACHER ROUTES ============
// Upload document with dual storage
router.post(
  '/courses/:course_id/upload',
  teacherAuth,
  upload.single('document'),
  uploadDocumentDual
);

// ============ STUDENT ROUTES ============
// Smart download (tries Cloudinary first, falls back to local)
router.get(
  '/courses/:course_id/documents/:document_id/download',
  studentAuth,
  downloadDocument
);

// Get document info with storage status
router.get(
  '/courses/:course_id/documents/:document_id/info',
  studentAuth,
  getDocumentInfo
);

// ============ PUBLIC ROUTES ============
// Serve local files directly (for fallback)
router.get('/local/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = `uploads/documents/${filename}`;
  
  if (fs.existsSync(filePath)) {
    res.sendFile(path.resolve(filePath));
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Health check endpoint
router.get('/storage/health', checkDocumentHealth);

module.exports = router;