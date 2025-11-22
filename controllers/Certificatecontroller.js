const Certificate = require('../models/Certificatemodel');
const CourseMaterial = require('../models/courseMaterialdata');
const Admin = require('../models/adminadddata');
const path = require('path');
const fs = require('fs');

// Generate certificate PDF (simplified version)
const generateCertificatePDF = async (certificateData) => {
  const certificateNumber = certificateData.certificate_id;
  const fileName = `certificate_${certificateNumber}.pdf`;
  const filePath = path.join(__dirname, '../uploads/certificates', fileName);
  
  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, '../uploads/certificates');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Create a placeholder file (in production, generate actual PDF)
  fs.writeFileSync(filePath, 'Certificate PDF will be generated here');
  
  return `/uploads/certificates/${fileName}`;
};

// Get all available courses for certificate issuance
const getAvailableCourses = async (req, res) => {
  try {
    const courses = await CourseMaterial.find({ status: 'published' })
      .select('_id course_title course_category course_description')
      .sort({ course_title: 1 });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching courses: ' + error.message
    });
  }
};

// Issue new certificate
const issueCertificate = async (req, res) => {
  try {
    const {
      student_id,
      student_name,
      student_email,
      course_id,
      completion_date,
      certificate_template,
      percentage,
      grade,
      remarks
    } = req.body;

    // Validate required fields
    if (!student_id || !student_name || !student_email || !course_id || !completion_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: student_id, student_name, student_email, course_id, completion_date'
      });
    }

    // Check if course exists
    const course = await CourseMaterial.findById(course_id);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Check if certificate already exists for this student and course
    const existingCertificate = await Certificate.findOne({
      student_id,
      course_id,
      status: { $in: ['issued', 'pending'] }
    });

    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        error: 'Certificate already issued for this student and course'
      });
    }

    // Generate certificate
    const certificateUrl = await generateCertificatePDF({
      student_name,
      course_title: course.course_title,
      completion_date
    });

    // Create certificate
    const certificate = new Certificate({
      student_id,
      student_name,
      student_email,
      course_id,
      course_title: course.course_title,
      course_category: course.course_category,
      completion_date: new Date(completion_date),
      certificate_template: certificate_template || 'default',
      certificate_url: certificateUrl,
      issued_by: req.admin.id,
      issuer_name: req.admin.name,
      grades: {
        percentage: percentage || null,
        grade: grade || null,
        remarks: remarks || ''
      },
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      status: 'issued'
    });

    await certificate.save();

    // Populate the saved certificate for response
    const populatedCertificate = await Certificate.findById(certificate._id)
      .populate('course_id', 'course_title course_category');

    res.status(201).json({
      success: true,
      message: 'Certificate issued successfully',
      data: populatedCertificate
    });

  } catch (error) {
    console.error('Issue certificate error:', error);
    res.status(500).json({
      success: false,
      error: 'Error issuing certificate: ' + error.message
    });
  }
};

// Bulk issue certificates
const bulkIssueCertificates = async (req, res) => {
  try {
    const { certificates } = req.body;

    if (!certificates || !Array.isArray(certificates)) {
      return res.status(400).json({
        success: false,
        error: 'Certificates array is required'
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const certData of certificates) {
      try {
        const {
          student_id,
          student_name,
          student_email,
          course_id,
          completion_date,
          certificate_template,
          percentage,
          grade,
          remarks
        } = certData;

        // Validate required fields
        if (!student_id || !student_name || !student_email || !course_id || !completion_date) {
          results.failed.push({
            student_email,
            error: 'Missing required fields'
          });
          continue;
        }

        // Check if course exists
        const course = await CourseMaterial.findById(course_id);
        if (!course) {
          results.failed.push({
            student_email,
            error: 'Course not found'
          });
          continue;
        }

        // Check if certificate already exists
        const existingCertificate = await Certificate.findOne({
          student_id,
          course_id,
          status: { $in: ['issued', 'pending'] }
        });

        if (existingCertificate) {
          results.failed.push({
            student_email,
            error: 'Certificate already exists'
          });
          continue;
        }

        // Generate certificate
        const certificateUrl = await generateCertificatePDF({
          student_name,
          course_title: course.course_title,
          completion_date
        });

        // Create certificate
        const certificate = new Certificate({
          student_id,
          student_name,
          student_email,
          course_id,
          course_title: course.course_title,
          course_category: course.course_category,
          completion_date: new Date(completion_date),
          certificate_template: certificate_template || 'default',
          certificate_url: certificateUrl,
          issued_by: req.admin.id,
          issuer_name: req.admin.name,
          grades: {
            percentage: percentage || null,
            grade: grade || null,
            remarks: remarks || ''
          },
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'issued'
        });

        await certificate.save();
        results.successful.push({
          student_email,
          certificate_id: certificate.certificate_id,
          student_name: certificate.student_name,
          course_title: certificate.course_title
        });

      } catch (error) {
        results.failed.push({
          student_email: certData.student_email,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk certificate issuance completed. Successful: ${results.successful.length}, Failed: ${results.failed.length}`,
      data: results
    });

  } catch (error) {
    console.error('Bulk issue certificates error:', error);
    res.status(500).json({
      success: false,
      error: 'Error in bulk certificate issuance: ' + error.message
    });
  }
};

// Get all certificates with filtering
const getAllCertificates = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      course_id,
      student_email,
      status,
      start_date,
      end_date,
      course_category
    } = req.query;

    const filter = {};

    if (course_id) filter.course_id = course_id;
    if (student_email) filter.student_email = { $regex: student_email, $options: 'i' };
    if (status) filter.status = status;
    if (course_category) filter.course_category = course_category;
    
    if (start_date || end_date) {
      filter.issue_date = {};
      if (start_date) filter.issue_date.$gte = new Date(start_date);
      if (end_date) filter.issue_date.$lte = new Date(end_date);
    }

    const certificates = await Certificate.find(filter)
      .populate('course_id', 'course_title course_category')
      .populate('student_id', 'name email')
      .sort({ issue_date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Certificate.countDocuments(filter);

    res.json({
      success: true,
      data: certificates,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching certificates: ' + error.message
    });
  }
};

// Get certificate by ID
const getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;

    const certificate = await Certificate.findById(id)
      .populate('course_id', 'course_title course_category description')
      .populate('student_id', 'name email phone')
      .populate('issued_by', 'name email');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found'
      });
    }

    res.json({
      success: true,
      data: certificate
    });

  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching certificate: ' + error.message
    });
  }
};

// Verify certificate
const verifyCertificate = async (req, res) => {
  try {
    const { verification_code } = req.params;

    const certificate = await Certificate.findOne({ verification_code })
      .populate('course_id', 'course_title course_category')
      .populate('student_id', 'name email');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found or invalid verification code'
      });
    }

    if (certificate.status !== 'issued') {
      return res.status(400).json({
        success: false,
        error: `Certificate is ${certificate.status}`
      });
    }

    if (certificate.expires_at && certificate.expires_at < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Certificate has expired'
      });
    }

    res.json({
      success: true,
      message: 'Certificate is valid',
      data: {
        certificate_id: certificate.certificate_id,
        student_name: certificate.student_name,
        course_title: certificate.course_title,
        issue_date: certificate.issue_date,
        verification_code: certificate.verification_code,
        status: certificate.status
      }
    });

  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({
      success: false,
      error: 'Error verifying certificate: ' + error.message
    });
  }
};

// Revoke certificate
const revokeCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const certificate = await Certificate.findByIdAndUpdate(
      id,
      { 
        status: 'revoked',
        revocation_reason: reason || 'No reason provided'
      },
      { new: true }
    );

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found'
      });
    }

    res.json({
      success: true,
      message: 'Certificate revoked successfully',
      data: certificate
    });

  } catch (error) {
    console.error('Revoke certificate error:', error);
    res.status(500).json({
      success: false,
      error: 'Error revoking certificate: ' + error.message
    });
  }
};

// Get certificates by student
const getStudentCertificates = async (req, res) => {
  try {
    const { student_id } = req.params;

    const certificates = await Certificate.find({ student_id, status: 'issued' })
      .populate('course_id', 'course_title course_category')
      .sort({ issue_date: -1 });

    res.json({
      success: true,
      data: certificates
    });

  } catch (error) {
    console.error('Get student certificates error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching student certificates: ' + error.message
    });
  }
};

// Get certificate statistics
const getCertificateStats = async (req, res) => {
  try {
    const totalCertificates = await Certificate.countDocuments();
    const issuedCertificates = await Certificate.countDocuments({ status: 'issued' });
    const revokedCertificates = await Certificate.countDocuments({ status: 'revoked' });
    const pendingCertificates = await Certificate.countDocuments({ status: 'pending' });
    
    const certificatesByCourse = await Certificate.aggregate([
      {
        $group: {
          _id: '$course_category',
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyIssued = await Certificate.aggregate([
      {
        $match: {
          issue_date: {
            $gte: new Date(new Date().getFullYear(), 0, 1) // Current year
          }
        }
      },
      {
        $group: {
          _id: { $month: '$issue_date' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        total: totalCertificates,
        issued: issuedCertificates,
        revoked: revokedCertificates,
        pending: pendingCertificates,
        by_course: certificatesByCourse,
        monthly_issued: monthlyIssued
      }
    });

  } catch (error) {
    console.error('Get certificate stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching certificate statistics: ' + error.message
    });
  }
};

module.exports = {
  getAvailableCourses,
  issueCertificate,
  bulkIssueCertificates,
  getAllCertificates,
  getCertificateById,
  verifyCertificate,
  revokeCertificate,
  getStudentCertificates,
  getCertificateStats
};