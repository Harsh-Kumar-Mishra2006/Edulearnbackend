// routes/Certificateroute.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Certificate = require('../models/Certificatemodel');
// REMOVE adminAuth import - we won't use it
// const { adminAuth } = require('../middlewares/adminauthMiddleware');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/certificates/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `CERT_${Date.now()}_${Math.floor(Math.random() * 10000)}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'));
  }
});

// Controllers
const {
  uploadCertificate,
  getAllCertificates,
  getCertificateById,
  downloadCertificate,
  revokeCertificate
} = require('../controllers/Certificatecontroller');

// ==================== PUBLIC ROUTES (No Auth Required) ====================

// Upload certificate - NO AUTH REQUIRED
router.post('/upload', upload.single('certificate_file'), uploadCertificate);

// Get all certificates - NO AUTH REQUIRED
router.get('/', getAllCertificates);

// Get certificate by ID - NO AUTH REQUIRED
router.get('/:id', getCertificateById);

// Download certificate - NO AUTH REQUIRED
router.get('/:id/download', downloadCertificate);

// Revoke certificate - NO AUTH REQUIRED
router.put('/:id/revoke', revokeCertificate);

// Student certificates - NO AUTH REQUIRED
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
      return res.status(404).json({ valid: false });
    }
    res.json({ valid: true, certificate: cert });
  } catch (err) {
    res.status(500).json({ valid: false });
  }
});

module.exports = router;