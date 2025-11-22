const express = require('express');
const router = express.Router();
const {
  getAvailableCourses,
  issueCertificate,
  bulkIssueCertificates,
  getAllCertificates,
  getCertificateById,
  verifyCertificate,
  revokeCertificate,
  getStudentCertificates,
  getCertificateStats
} = require('../controllers/Certificatecontroller');

const { adminAuth } = require('../middlewares/adminauthMiddleware');

// Public routes
router.get('/verify/:verification_code', verifyCertificate);

// Admin protected routes
router.use(adminAuth);

// Certificate management
router.get('/courses', getAvailableCourses);
router.post('/issue', issueCertificate);
router.post('/bulk-issue', bulkIssueCertificates);
router.get('/', getAllCertificates);
router.get('/stats', getCertificateStats);
router.get('/:id', getCertificateById);
router.put('/:id/revoke', revokeCertificate);
router.get('/student/:student_id', getStudentCertificates);

module.exports = router;