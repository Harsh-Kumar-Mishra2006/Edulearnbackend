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

// controllers/documentController.js - FIXED serveDocument

// controllers/documentController.js - FIXED serveDocument

const serveDocument = async (req, res) => {
  try {
    const { filename, course_id, document_id } = req.params;
    
    console.log('📄 Serving document request:', { filename, course_id, document_id });
    
    let targetFilename = filename;
    let filePath;
    let document;
    let course;

    // Case 1: We have course_id and document_id (authenticated access)
    if (course_id && document_id) {
      course = await CourseMaterial.findOne({
        _id: course_id,
        'materials.documents._id': document_id
      });

      if (!course) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }

      document = course.materials.documents.id(document_id);
      
      // Check access permissions (skip for teacher routes or if already authenticated)
      if (req.user) {
        const isTeacher = req.user?.userId && course.teacher_id.toString() === req.user.userId;
        
        // Check if user is enrolled student
        let isEnrolled = false;
        if (req.user?.email && req.user?.role === 'student') {
          isEnrolled = await checkEnrollment(req.user.email, course.course_category);
        }
        
        // Allow access if: teacher, enrolled student, or public document
        if (!isTeacher && !isEnrolled && !document.is_public) {
          return res.status(403).json({ success: false, error: 'Access denied' });
        }
      }

      // Get filename from document
      targetFilename = document.local_file?.filename || document.original_filename;
      
      if (!targetFilename) {
        return res.status(404).json({ success: false, error: 'File not found in database' });
      }
    }
    
    // Case 2: We only have filename (direct access)
    else if (filename) {
      targetFilename = filename;
      // No authentication check for direct filename access (security through obscurity)
    }
    
    // Case 3: No identifier provided
    else {
      return res.status(400).json({ success: false, error: 'No file identifier provided' });
    }

    // Security: Prevent directory traversal
    const safeFilename = path.basename(targetFilename);
    
    // Define the absolute upload directory path
    const uploadDir = path.join(__dirname, '../uploads/documents/');
    
    // Construct the full file path
    filePath = path.join(uploadDir, safeFilename);

    console.log('🔍 Looking for file at:', filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('❌ File not found at:', filePath);
      
      // Try alternative paths as fallback
      const altPaths = [
        path.join(process.cwd(), 'uploads/documents/', safeFilename),
        path.join(__dirname, '../../uploads/documents/', safeFilename)
      ];
      
      for (const altPath of altPaths) {
        if (fs.existsSync(altPath)) {
          filePath = altPath;
          console.log('✅ Found at alternative path:', filePath);
          break;
        }
      }
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: 'File not found on server' });
      }
    }

    // Get file stats
    const stat = fs.statSync(filePath);
    
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
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // For PDFs, allow embedding
    if (ext === '.pdf') {
      const filename = encodeURIComponent(document?.original_filename || safeFilename);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    } else {
      const filename = encodeURIComponent(document?.original_filename || safeFilename);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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

const downloadDocument = async (req, res) => {
  try {
    const { course_id, document_id } = req.params;

    console.log('📥 Download request:', { course_id, document_id });

    const course = await CourseMaterial.findOne({
      _id: course_id,
      'materials.documents._id': document_id
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const document = course.materials.documents.id(document_id);
    
    // ✅ Check access permissions
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
      return res.status(404).json({ success: false, error: 'File not found in database' });
    }

    // Find file path
    const safeFilename = path.basename(filename);
    const uploadDir = path.join(__dirname, '../uploads/documents/');
    let filePath = path.join(uploadDir, safeFilename);

    console.log('🔍 Looking for file at:', filePath);

    if (!fs.existsSync(filePath)) {
      // Try alternative paths
      const altPaths = [
        path.join(process.cwd(), 'uploads/documents/', safeFilename),
        path.join(__dirname, '../../uploads/documents/', safeFilename)
      ];
      
      let found = false;
      for (const altPath of altPaths) {
        if (fs.existsSync(altPath)) {
          filePath = altPath;
          found = true;
          console.log('✅ Found at alternative path:', filePath);
          break;
        }
      }
      
      if (!found) {
        return res.status(404).json({ success: false, error: 'File not found on server' });
      }
    }

    // Get file stats
    const stat = fs.statSync(filePath);

    // Set headers for download
    const downloadName = document.original_filename || `${document.title}.${document.file_type}`;
    res.setHeader('Content-Type', document.local_file?.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'no-cache');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file for download:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Error downloading file' });
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// Upload document (already working)
// controllers/documentController.js - FIXED uploadDocumentLocal

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
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ success: false, error: "Course not found" });
    }

    // First create the document data WITHOUT the URL
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
      local_file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        exists: true
      }
    };

    // Add document to course to get the _id
    course.materials.documents.push(documentData);
    await course.save();

    // Get the newly created document with its _id
    const newDocument = course.materials.documents[course.materials.documents.length - 1];

    // Generate the URL using the document's _id (NOT the filename)
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const viewUrl = `${baseUrl}/api/documents/courses/${course_id}/documents/${newDocument._id}/view`;
    const downloadUrl = `${baseUrl}/api/documents/courses/${course_id}/documents/${newDocument._id}/download`;

    // Update the document with the URLs
    newDocument.file_url = viewUrl;
    await course.save();

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: {
        document: newDocument,
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


module.exports = {
  checkEnrollment,
  uploadDocumentLocal,
  serveDocument,
  downloadDocument,
  getDocumentInfo,
  checkStorageHealth,
  listUploadedFiles
};