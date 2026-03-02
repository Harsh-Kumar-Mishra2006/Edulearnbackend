// controllers/documentController.js - LOCAL STORAGE ONLY VERSION
const CourseMaterial = require('../models/courseMaterialdata');
const fs = require('fs');
const path = require('path');

// Upload document to local storage only
const uploadDocumentLocal = async (req, res) => {
  try {
    const { course_id } = req.params;
    const { title, description, document_type = 'notes', is_public = true } = req.body;

    console.log('📄 Starting local document upload...');
    
    // Check if file was uploaded via multer
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded"
      });
    }

    // Find the course
    const course = await CourseMaterial.findOne({
      _id: course_id,
      teacher_id: req.user.userId
    });

    if (!course) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        error: "Course not found or access denied"
      });
    }

    console.log('✅ Course found, processing file...');

    // Generate file URL
    const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
    const fileUrl = `${baseUrl}/api/documents/local/${req.file.filename}`;

    // Prepare document data - LOCAL STORAGE ONLY
    const documentData = {
      title: title || req.file.originalname,
      description: description || '',
      file_type: path.extname(req.file.originalname).substring(1).toLowerCase() || 'unknown',
      file_size: req.file.size,
      original_filename: req.file.originalname,
      is_public: is_public === true || is_public === 'true',
      document_type: document_type,
      upload_date: new Date(),
      
      // Local storage only
      file_url: fileUrl,
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

    console.log('✅ Document data prepared:', documentData);

    // Add document to course
    course.materials.documents.push(documentData);
    await course.save();

    // Get the newly added document
    const newDocument = course.materials.documents[course.materials.documents.length - 1];

    res.status(201).json({
      success: true,
      message: "Document uploaded to local storage successfully",
      data: {
        document: newDocument,
        storage_type: 'local',
        course: {
          id: course._id,
          title: course.course_title,
          total_documents: course.materials.documents.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Document upload error:', error);
    
    // Clean up file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: "Error uploading document: " + error.message
    });
  }
};

// Serve document from local storage
const serveDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Security: Prevent directory traversal attacks
    const safeFilename = path.basename(filename);
    const filePath = path.join(__dirname, '../uploads/documents/', safeFilename);
    
    console.log('📂 Serving local file:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('❌ File not found:', filePath);
      
      // Try alternate paths
      const alternatePaths = [
        `uploads/documents/${safeFilename}`,
        `uploads/${safeFilename}`,
        `./uploads/documents/${safeFilename}`
      ];
      
      for (const altPath of alternatePaths) {
        const fullPath = path.resolve(altPath);
        if (fs.existsSync(fullPath)) {
          console.log('✅ Found file at alternate path:', fullPath);
          return res.sendFile(fullPath);
        }
      }
      
      return res.status(404).json({ 
        success: false, 
        error: 'File not found' 
      });
    }
    
    // Send the file
    res.sendFile(filePath);
    
  } catch (error) {
    console.error('❌ Error serving file:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error serving file: ' + error.message 
    });
  }
};

// Download document (forces download)
const downloadDocument = async (req, res) => {
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
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found"
      });
    }

    // Check if user is authorized (teacher or enrolled student)
    const isTeacher = course.teacher_id.toString() === req.user.userId;
    const isEnrolled = req.user.role === 'student'; // Add proper enrollment check
    
    if (!isTeacher && !isEnrolled) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    // Get file path
    let filePath = document.local_file?.path;
    
    if (!filePath || !fs.existsSync(filePath)) {
      // Try to find file by filename
      const filename = document.local_file?.filename || document.original_filename;
      const possiblePaths = [
        path.join(__dirname, '../uploads/documents/', filename),
        path.join(process.cwd(), 'uploads/documents/', filename),
        `./uploads/documents/${filename}`
      ];
      
      for (const altPath of possiblePaths) {
        if (fs.existsSync(altPath)) {
          filePath = altPath;
          break;
        }
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: "Document file not available"
      });
    }

    // Set headers for download
    const filename = document.original_filename || `${document.title}.${document.file_type}`;
    res.setHeader('Content-Type', document.local_file?.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Storage-Source', 'local');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Error downloading file"
        });
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      error: "Error downloading document: " + error.message
    });
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
  uploadDocumentLocal,
  serveDocument,
  downloadDocument,
  getDocumentInfo,
  checkStorageHealth
};