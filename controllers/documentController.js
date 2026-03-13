// controllers/documentController.js - LOCAL STORAGE ONLY VERSION
const CourseMaterial = require('../models/courseMaterialdata');
const fs = require('fs');
const path = require('path');
// controllers/documentController.js - ADD THIS HELPER FUNCTION AT THE TOP
const StudentEnrollment = require('../models/Mylearningmodel'); // Add this require

// Helper function to check enrollment
const checkEnrollment = async (student_email, course_category) => {
  try {
    const enrollment = await StudentEnrollment.findOne({
      student_email,
      course_category,
      payment_status: 'verified',
      enrollment_status: 'active'
    });
    return !!enrollment;
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return false;
  }
};

// UPDATE serveDocument function with proper enrollment check
const serveDocument = async (req, res) => {
  try {
    const { filename, course_id, document_id } = req.params;
    
    let targetFilename = filename;
    let filePath;

    // If we have course_id and document_id, get filename from database
    if (course_id && document_id) {
      const course = await CourseMaterial.findOne({
        _id: course_id,
        'materials.documents._id': document_id
      });

      if (!course) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }

      const document = course.materials.documents.id(document_id);
      
      // ✅ FIXED: Proper enrollment check
      const isTeacher = req.user?.userId && course.teacher_id.toString() === req.user.userId;
      
      // Check if user is enrolled student
      let isEnrolled = false;
      if (req.user?.email && req.user?.role === 'student') {
        isEnrolled = await checkEnrollment(req.user.email, course.course_category);
      }
      
      if (!isTeacher && !isEnrolled && !document.is_public) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      // Get filename from document
      targetFilename = document.local_file?.filename || document.original_filename;
      
      if (!targetFilename) {
        return res.status(404).json({ success: false, error: 'File not found' });
      }
    }

    // Security: Prevent directory traversal
    const safeFilename = path.basename(targetFilename);
    
    // Try multiple possible paths
    const possiblePaths = [
      path.join(__dirname, '../uploads/documents/', safeFilename),
      path.join(process.cwd(), 'uploads/documents/', safeFilename),
      path.join(__dirname, '../../uploads/documents/', safeFilename)
    ];

    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        break;
      }
    }

    if (!filePath) {
      console.log('❌ File not found in any location:', safeFilename);
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    console.log('✅ Serving file:', filePath);

    // Get file extension for content type
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.zip': 'application/zip'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    // Set headers for viewing
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fs.statSync(filePath).size);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // For PDFs, allow embedding
    if (ext === '.pdf') {
      res.setHeader('Content-Disposition', 'inline');
    }

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Error serving file' });
      }
    });

  } catch (error) {
    console.error('❌ Error serving file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// UPDATE downloadDocument function with proper enrollment check
const downloadDocument = async (req, res) => {
  try {
    const { course_id, document_id } = req.params;

    const course = await CourseMaterial.findOne({
      _id: course_id,
      'materials.documents._id': document_id
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const document = course.materials.documents.id(document_id);
    
    // ✅ FIXED: Proper enrollment check
    const isTeacher = req.user?.userId && course.teacher_id.toString() === req.user.userId;
    
    // Check if user is enrolled student
    let isEnrolled = false;
    if (req.user?.email && req.user?.role === 'student') {
      isEnrolled = await checkEnrollment(req.user.email, course.course_category);
    }
    
    if (!isTeacher && !isEnrolled && !document.is_public) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Get filename
    let filename = document.local_file?.filename || document.original_filename;
    
    if (!filename) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // Find file path
    const safeFilename = path.basename(filename);
    let filePath = null;
    
    const possiblePaths = [
      path.join(__dirname, '../uploads/documents/', safeFilename),
      path.join(process.cwd(), 'uploads/documents/', safeFilename),
      path.join(__dirname, '../../uploads/documents/', safeFilename)
    ];

    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({ success: false, error: 'File not found on server' });
    }

    // Set headers for download
    const downloadName = document.original_filename || `${document.title}.${document.file_type}`;
    res.setHeader('Content-Type', document.local_file?.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);
    res.setHeader('Cache-Control', 'no-cache');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Keep all other functions unchanged

// Upload document (already working)
const uploadDocumentLocal = async (req, res) => {
  try {
    const { course_id } = req.params;
    const { title, description, document_type = 'notes', is_public = true } = req.body;

    console.log('📄 Starting local document upload...');
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const course = await CourseMaterial.findOne({
      _id: course_id,
      teacher_id: req.user.userId
    });

    if (!course) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, error: "Course not found" });
    }

    // Generate proper file URL - FIXED
    const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
    const fileUrl = `${baseUrl}/api/documents/local/${req.file.filename}`; // FIXED URL

    const documentData = {
      title: title || req.file.originalname,
      description: description || '',
      file_type: path.extname(req.file.originalname).substring(1).toLowerCase(),
      file_size: req.file.size,
      original_filename: req.file.originalname,
      is_public: is_public === true || is_public === 'true',
      document_type: document_type,
      upload_date: new Date(),
      file_url: fileUrl, // FIXED URL
      storage_type: 'local',
      local_file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        exists: true
      }
    };

    course.materials.documents.push(documentData);
    await course.save();

    const newDocument = course.materials.documents[course.materials.documents.length - 1];

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: {
        document: newDocument,
        view_url: `${baseUrl}/api/documents/courses/${course_id}/documents/${newDocument._id}/view`,
        download_url: `${baseUrl}/api/documents/courses/${course_id}/documents/${newDocument._id}/download`,
        file_url: fileUrl
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get document info
const getDocumentInfo = async (req, res) => {
  try {
    const { course_id, document_id } = req.params;

    const course = await CourseMaterial.findOne({
      _id: course_id,
      'materials.documents._id': document_id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Document not found"
      });
    }

    const document = course.materials.documents.id(document_id);
    
    // Check actual file existence
    let localFileExists = false;
    if (document.local_file && document.local_file.path) {
      localFileExists = fs.existsSync(document.local_file.path);
    }

    res.json({
      success: true,
      data: {
        _id: document._id,
        title: document.title,
        description: document.description,
        document_type: document.document_type,
        file_type: document.file_type,
        file_size: document.file_size,
        upload_date: document.upload_date,
        original_filename: document.original_filename,
        storage: {
          type: 'local',
          available: localFileExists
        },
        file_url: document.file_url,
        download_url: `/api/documents/courses/${course_id}/documents/${document._id}/download`,
        view_url: document.file_url // Direct view URL
      }
    });

  } catch (error) {
    console.error('Error getting document info:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching document info: " + error.message
    });
  }
};

// Health check
const checkStorageHealth = async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '../uploads/documents/');
    const dirExists = fs.existsSync(uploadDir);
    
    let fileCount = 0;
    if (dirExists) {
      fileCount = fs.readdirSync(uploadDir).length;
    }

    res.json({
      success: true,
      timestamp: new Date(),
      storage: {
        type: 'local',
        directory: uploadDir,
        exists: dirExists,
        file_count: fileCount,
        status: dirExists ? 'healthy' : 'unhealthy'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  checkEnrollment,
  uploadDocumentLocal,
  serveDocument,
  downloadDocument,
  getDocumentInfo,
  checkStorageHealth
};