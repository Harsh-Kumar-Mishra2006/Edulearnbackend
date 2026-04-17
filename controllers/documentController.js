// controllers/documentController.js - LOCAL STORAGE ONLY VERSION
const mongoose = require('mongoose');
const CourseMaterial = require('../models/courseMaterialdata');
const fs = require('fs');
const path = require('path');
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

// controllers/documentController.js - FIXED serveDocument

// controllers/documentController.js - FIXED serveDocument

// controllers/documentController.js - FIXED SERVE FUNCTION

const serveDocument = async (req, res) => {
  try {
    const { course_id, document_id } = req.params;
    
    console.log('📄 Serving document:', { course_id, document_id });

    // Find the course and document
    const course = await CourseMaterial.findOne({
      _id: course_id,
      'materials.documents._id': document_id
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const document = course.materials.documents.id(document_id);
    
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    // Check access permissions
    if (req.user) {
      const isTeacher = req.user.userId && course.teacher_id.toString() === req.user.userId;
      
      let isEnrolled = false;
      if (req.user.role === 'student') {
        const StudentEnrollment = require('../models/Mylearningmodel');
        const enrollment = await StudentEnrollment.findOne({
          student_email: req.user.email,
          course_category: course.course_category,
          payment_status: 'verified',
          enrollment_status: 'active'
        });
        isEnrolled = !!enrollment;
      }
      
      if (!isTeacher && !isEnrolled && !document.is_public) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    // Get filename from document
    const filename = document.local_file?.filename || document.original_filename;
    
    if (!filename) {
      return res.status(404).json({ success: false, error: 'File not found in database' });
    }

    // Security: Prevent directory traversal
    const safeFilename = path.basename(filename);
    
    // Find the file
    const possiblePaths = [
      path.join(__dirname, '../uploads/documents/', safeFilename),
      path.join(process.cwd(), 'uploads/documents/', safeFilename),
      document.local_file?.path
    ];

    let filePath = null;
    for (const p of possiblePaths) {
      if (p && fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (!filePath) {
      console.error('❌ File not found:', safeFilename);
      return res.status(404).json({ success: false, error: 'File not found on server' });
    }

    // Get file stats
    const stat = fs.statSync(filePath);
    
    // Set content type based on file extension
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

    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Accept-Ranges', 'bytes');
    
    // For PDFs, allow embedding
    if (ext === '.pdf') {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.original_filename || safeFilename)}"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.original_filename || safeFilename)}"`);
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
// controllers/documentController.js - FIXED downloadDocument
// controllers/documentController.js - FIXED DOWNLOAD FUNCTION

const downloadDocument = async (req, res) => {
  try {
    const { course_id, document_id } = req.params;

    console.log('📥 Download request:', { course_id, document_id });

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(course_id) || !mongoose.Types.ObjectId.isValid(document_id)) {
      return res.status(400).json({ success: false, error: 'Invalid ID format' });
    }

    const course = await CourseMaterial.findOne({
      _id: course_id,
      'materials.documents._id': document_id
    });

    if (!course) {
      console.log('❌ Course not found:', course_id);
      return res.status(404).json({ success: false, error: 'Course or document not found' });
    }

    const document = course.materials.documents.id(document_id);
    
    if (!document) {
      console.log('❌ Document not found in course:', document_id);
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    console.log('📄 Found document:', {
      title: document.title,
      filename: document.local_file?.filename,
      original: document.original_filename,
      path: document.local_file?.path
    });

    // Check access permissions
    const isTeacher = req.user?.userId && course.teacher_id.toString() === req.user.userId;
    
    let isEnrolled = false;
    if (req.user?.email && req.user?.role === 'student') {
      const StudentEnrollment = require('../models/Mylearningmodel');
      const enrollment = await StudentEnrollment.findOne({
        student_email: req.user.email,
        course_category: course.course_category,
        payment_status: 'verified',
        enrollment_status: 'active'
      });
      isEnrolled = !!enrollment;
    }
    
    if (!isTeacher && !isEnrolled && !document.is_public) {
      console.log('❌ Access denied');
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Get filename - try multiple sources
    let filename = null;
    if (document.local_file?.filename) {
      filename = document.local_file.filename;
    } else if (document.original_filename) {
      filename = document.original_filename;
    } else if (document.title) {
      filename = document.title;
    }
    
    if (!filename) {
      console.log('❌ No filename found in document');
      return res.status(404).json({ success: false, error: 'File not found in database' });
    }

    // Security: Prevent directory traversal
    const safeFilename = path.basename(filename);
    
    // Find the file - expanded search paths
    const possiblePaths = [
      path.join(__dirname, '../uploads/documents/', safeFilename),
      path.join(__dirname, '../../uploads/documents/', safeFilename),
      path.join(process.cwd(), 'uploads/documents/', safeFilename),
      path.join(process.cwd(), '../uploads/documents/', safeFilename),
      document.local_file?.path
    ];

    console.log('🔍 Searching for file:', safeFilename);
    console.log('📁 Possible paths:', possiblePaths);

    let filePath = null;
    for (const p of possiblePaths) {
      if (p && fs.existsSync(p)) {
        filePath = p;
        console.log('✅ Found file at:', p);
        break;
      }
    }

    if (!filePath) {
      console.error('❌ File not found on server:', safeFilename);
      
      // List files in upload directory for debugging
      const uploadDir = path.join(__dirname, '../uploads/documents/');
      if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        console.log('📁 Available files in uploads:', files);
      }
      
      return res.status(404).json({ 
        success: false, 
        error: 'File not found on server',
        debug: {
          filename: safeFilename,
          uploadDir: path.join(__dirname, '../uploads/documents/'),
          dirExists: fs.existsSync(path.join(__dirname, '../uploads/documents/'))
        }
      });
    }

    // Get file stats
    const stat = fs.statSync(filePath);
    const downloadName = document.original_filename || `${document.title}.${document.file_type}`;

    console.log('📤 Streaming file:', {
      name: downloadName,
      size: stat.size,
      path: filePath
    });

    // Set headers for download
    res.setHeader('Content-Type', document.local_file?.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'no-cache');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('❌ Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Error downloading file' });
      }
    });

  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// Upload document (already working)
// controllers/documentController.js - FIXED uploadDocumentLocal

// controllers/documentController.js - FIXED uploadDocumentLocal
// controllers/documentController.js - FIXED UPLOAD FUNCTION

// controllers/documentController.js - FIXED uploadDocumentLocal
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
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ success: false, error: "Course not found" });
    }

    // Create document with a temporary file_url (will be updated after save)
    const documentData = {
      title: title || req.file.originalname,
      description: description || '',
      file_type: path.extname(req.file.originalname).substring(1).toLowerCase(),
      file_size: req.file.size,
      original_filename: req.file.originalname,
      is_public: is_public === true || is_public === 'true',
      document_type: document_type,
      upload_date: new Date(),
      storage_type: 'local',
      file_url: 'pending', // ← Add this temporarily to pass validation
      local_file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        exists: true
      }
    };

    // Add document to course
    course.materials.documents.push(documentData);
    await course.save();

    // Get the newly created document with its MongoDB _id
    const newDocument = course.materials.documents[course.materials.documents.length - 1];
    
    // Generate proper URLs with the actual document ID
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const viewUrl = `${baseUrl}/api/documents/courses/${course_id}/documents/${newDocument._id}/view`;
    const downloadUrl = `${baseUrl}/api/documents/courses/${course_id}/documents/${newDocument._id}/download`;
    
    // Update the document with correct URLs
    newDocument.file_url = viewUrl;
    await course.save();

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: {
        document: {
          _id: newDocument._id,
          title: newDocument.title,
          description: newDocument.description,
          document_type: newDocument.document_type,
          file_type: newDocument.file_type,
          file_size: newDocument.file_size,
          upload_date: newDocument.upload_date,
          original_filename: newDocument.original_filename,
          is_public: newDocument.is_public
        },
        view_url: viewUrl,
        download_url: downloadUrl,
        file_url: viewUrl
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

// Add this to documentController.js
const listUploadedFiles = async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '../uploads/documents/');
    
    if (!fs.existsSync(uploadDir)) {
      return res.json({
        success: true,
        directory_exists: false,
        files: []
      });
    }
    
    const files = fs.readdirSync(uploadDir);
    
    // Get file details
    const fileDetails = files.map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        path: filePath
      };
    });
    
    res.json({
      success: true,
      directory: uploadDir,
      directory_exists: true,
      file_count: files.length,
      files: fileDetails
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add this function to documentController.js
const testFileAccess = async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '../uploads/documents/');
    const results = {
      upload_dir_exists: fs.existsSync(uploadDir),
      upload_dir_path: uploadDir,
      files: []
    };
    
    if (results.upload_dir_exists) {
      const files = fs.readdirSync(uploadDir);
      for (const file of files) {
        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);
        results.files.push({
          name: file,
          size: stats.size,
          path: filePath,
          readable: fs.accessSync(filePath, fs.constants.R_OK) === undefined
        });
      }
    }
    
    // Check a specific document if ID provided
    if (req.params.document_id) {
      const { course_id, document_id } = req.params;
      const course = await CourseMaterial.findOne({
        _id: course_id,
        'materials.documents._id': document_id
      });
      
      if (course) {
        const doc = course.materials.documents.id(document_id);
        results.document_info = {
          found: true,
          title: doc.title,
          filename: doc.local_file?.filename,
          original_filename: doc.original_filename,
          file_url: doc.file_url,
          path_in_db: doc.local_file?.path
        };
      }
    }
    
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add to module.exports
module.exports = {
  checkEnrollment,
  uploadDocumentLocal,
  serveDocument,
  downloadDocument,
  getDocumentInfo,
  checkStorageHealth,
  listUploadedFiles,
  testFileAccess  // Add this
};