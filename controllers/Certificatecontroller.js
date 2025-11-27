// controllers/Certificatecontroller.js
const Certificate = require('../models/Certificatemodel');
const Student = require('../models/authdata'); // This exports Auth model
const fs = require('fs');
// controllers/Certificatecontroller.js → Replace ONLY this function
const uploadCertificate = async (req, res) => {
  try {
    const { student_email, course_title, completion_date } = req.body;

    if (!student_email || !course_title || !completion_date) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Certificate file is required' });
    }

    if (!req.admin) {
      fs.unlinkSync(req.file.path);
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const Student = require('../models/authdata'); // Auth model
    const student = await Student.findOne({ email: student_email });
    if (!student) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const certificate = new Certificate({
      student_id: student._id,
      student_name: student.name || student.email.split('@')[0],
      student_email: student.email,
      course_title: course_title.trim(),
      completion_date: new Date(completion_date),
      issued_by: req.admin.id,
      issuer_name: req.admin.name || 'Admin',
      certificate_file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });

    // Save first
    await certificate.save();

    // Now fetch fresh document with populate
    const populatedCertificate = await Certificate.findById(certificate._id)
      .populate('student_id', 'name email')
      .populate('issued_by', 'name');

    res.json({
      success: true,
      message: 'Certificate uploaded successfully!',
      data: populatedCertificate
    });

  } catch (error) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    console.error('Upload error:', error.message);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
};

const getAllCertificates = async (req, res) => {
  try {
    const { page = 1, limit = 10, student_email, status } = req.query;
    const filter = {};

    if (student_email) filter.student_email = { $regex: student_email, $options: 'i' };
    if (status) filter.status = status;

    const certificates = await Certificate.find(filter)
      .populate('student_id', 'name email')
      .populate('issued_by', 'name')
      .sort({ issue_date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Certificate.countDocuments(filter);

    res.json({
      success: true,
      data: certificates,
      pagination: { current: Number(page), pages: Math.ceil(total / limit), total }
    });

  } catch (error) {
    console.error('Get certificates error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to load certificates' });
  }
};

const getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('student_id', 'name email phone')
      .populate('issued_by', 'name email');

    if (!certificate) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }

    res.json({ success: true, data: certificate });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const downloadCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate?.certificate_file?.path) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const filePath = certificate.certificate_file.path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File missing on server' });
    }

    res.setHeader('Content-Type', certificate.certificate_file.mimetype || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${certificate.certificate_file.originalName}"`);
    fs.createReadStream(filePath).pipe(res);

  } catch (error) {
    res.status(500).json({ success: false, error: 'Download failed' });
  }
};

const revokeCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      { status: 'revoked', revocation_reason: req.body.reason || 'Revoked by admin' },
      { new: true }
    );

    if (!certificate) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }

    res.json({ success: true, message: 'Certificate revoked', data: certificate });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Revoke failed' });
  }
};

module.exports = {
  uploadCertificate,
  getAllCertificates,
  getCertificateById,
  downloadCertificate,
  revokeCertificate
};