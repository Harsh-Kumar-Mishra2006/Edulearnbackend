const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Certificate = require('../models/Certificatemodel');
const Auth = require('../models/authdata');

// ============ CREATE UPLOADS DIRECTORY ============
const uploadDir = 'uploads/certificates/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Uploads directory created:', uploadDir);
}

// ============ MULTER CONFIG ============
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `CERT_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG allowed.'));
    }
  }
});

// ============ CONTROLLERS ============
const {
  uploadCertificate,
  getAllCertificates,
  getCertificateById,
  downloadCertificate,
  revokeCertificate,
  getStats  // ← ADD THIS
} = require('../controllers/Certificatecontroller');

// ============ ROUTES ============

// ⚠️ IMPORTANT: Specific routes MUST come before dynamic routes (/:id)

// Upload certificate
router.post('/upload', upload.single('certificate_file'), uploadCertificate);

// Get statistics
router.get('/stats', getStats);  // ← ADD THIS - MUST BE BEFORE /:id

// Get all certificates
router.get('/', getAllCertificates);

// Student certificates
router.get('/student/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const certificates = await Certificate.find({ student_email: email })
      .select('course_title issue_date certificate_id verification_code certificate_file student_name')
      .sort({ issue_date: -1 });
    res.json({ success: true, data: certificates || [] });
  } catch (error) {
    console.error('Error fetching student certificates:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Public verify route
router.get('/verify/:verification_code', async (req, res) => {
  try {
    const cert = await Certificate.findOne({ verification_code: req.params.verification_code });
    if (!cert || cert.status !== 'issued') {
      return res.status(404).json({ 
        valid: false, 
        message: 'Certificate not found or revoked' 
      });
    }
    res.json({ 
      valid: true, 
      certificate: cert 
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ 
      valid: false, 
      error: err.message 
    });
  }
});

// ⚠️ DYNAMIC ROUTES - MUST COME LAST
// Get certificate by ID
router.get('/:id', getCertificateById);

// Download certificate
router.get('/:id/download', downloadCertificate);

// Revoke certificate
router.put('/:id/revoke', revokeCertificate);

module.exports = router;