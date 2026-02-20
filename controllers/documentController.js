const CourseMaterial = require('../models/courseMaterialdata');
const { uploadToCloudinary } = require('../config/cloudinaryStorage');
const fs = require('fs');
const path = require('path');

// Upload document with dual storage (Cloudinary + Local)
const uploadDocumentDual = async (req, res) => {
  try {
    const { course_id } = req.params;
    const { title, description, document_type = 'notes', is_public = true } = req.body;

    console.log('📄 Starting dual document upload...');
    
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

    // Prepare document data
    const documentData = {
      title: title || req.file.originalname,
      description: description || '',
      file_type: path.extname(req.file.originalname).substring(1).toLowerCase() || 'unknown',
      file_size: req.file.size,
      original_filename: req.file.originalname,
      is_public: is_public === true || is_public === 'true',
      document_type: document_type,
      upload_date: new Date(),
      
      // Track available storages
      available_storages: ['local'],
      primary_storage: 'local'
    };

    // 1. Store local file info
    documentData.local_file = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      exists: true
    };

    // 2. Try to upload to Cloudinary (but don't fail if it doesn't work)
    try {
      console.log('☁️ Attempting Cloudinary upload...');
      const cloudinaryResult = await uploadToCloudinary(req.file.path, {
        folder: 'course_documents',
        resource_type: 'auto',
        public_id: `doc_${Date.now()}`
      });

      if (cloudinaryResult && cloudinaryResult.secure_url) {
        // Add Cloudinary data
        documentData.cloudinary_data = {
          public_id: cloudinaryResult.public_id,
          url: cloudinaryResult.url,
          secure_url: cloudinaryResult.secure_url,
          format: cloudinaryResult.format,
          bytes: cloudinaryResult.bytes
        };
        
        // Add to available storages
        documentData.available_storages.push('cloudinary');
        documentData.primary_storage = 'cloudinary'; // Prefer Cloudinary
        documentData.file_url = cloudinaryResult.secure_url;
        
        console.log('✅ Cloudinary upload successful');
      }
    } catch (cloudinaryError) {
      console.log('⚠️ Cloudinary upload failed, using local storage only:', cloudinaryError.message);
      // If Cloudinary fails, use local URL
      const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
      documentData.file_url = `${baseUrl}/api/documents/local/${req.file.filename}`;
    }

    // Add document to course
    course.materials.documents.push(documentData);
    await course.save();

    // Get the newly added document
    const newDocument = course.materials.documents[course.materials.documents.length - 1];

   // After saving, before sending response
const cloudinarySuccess = !!(documentData.cloudinary_data && documentData.cloudinary_data.secure_url);

res.status(201).json({
  success: true,
  message: cloudinarySuccess ? 
    "Document uploaded to both Cloudinary and local storage" : 
    "Document uploaded to local storage only",
  data: {
    document: newDocument,
    storage_methods: documentData.available_storages,
    primary_storage: documentData.primary_storage,
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

// Smart download function - tries Cloudinary first, falls back to local
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

    // TRY CLOUDINARY FIRST (if available)
    if (document.cloudinary_data && document.cloudinary_data.secure_url) {
      try {
        console.log('☁️ Attempting Cloudinary download...');
        
        // Test if Cloudinary URL is accessible
        const response = await fetch(document.cloudinary_data.secure_url, { method: 'HEAD' });
        
        if (response.ok) {
          console.log('✅ Cloudinary URL working, redirecting...');
          return res.redirect(document.cloudinary_data.secure_url);
        }
      } catch (cloudinaryError) {
        console.log('⚠️ Cloudinary unavailable, falling back to local:', cloudinaryError.message);
      }
    }

    // FALLBACK TO LOCAL STORAGE
    if (document.local_file && document.local_file.path) {
      console.log('💾 Falling back to local storage...');
      
      const filePath = document.local_file.path;
      
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', document.local_file.mimetype || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${document.local_file.originalName}"`);
        res.setHeader('X-Storage-Source', 'local'); // Custom header to indicate source
        
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
        
        return;
      } else {
        console.log('❌ Local file missing at path:', filePath);
        
        // Try alternate paths
        const filename = document.local_file.filename;
        const alternatePaths = [
          `uploads/documents/${filename}`,
          `uploads/${filename}`,
          `./uploads/documents/${filename}`
        ];
        
        for (const altPath of alternatePaths) {
          if (fs.existsSync(altPath)) {
            console.log('✅ Found file at alternate path:', altPath);
            
            res.setHeader('Content-Type', document.local_file.mimetype || 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${document.local_file.originalName}"`);
            res.setHeader('X-Storage-Source', 'local-alt');
            
            const fileStream = fs.createReadStream(altPath);
            fileStream.pipe(res);
            return;
          }
        }
      }
    }

    // If all attempts fail
    res.status(404).json({
      success: false,
      error: "Document file not available in any storage",
      details: {
        cloudinary: !!document.cloudinary_data,
        local: !!document.local_file,
        local_path_exists: document.local_file ? fs.existsSync(document.local_file.path) : false
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

// Get document info with storage status
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
          cloudinary: !!document.cloudinary_data,
          local: localFileExists,
          available: document.available_storages || [],
          primary: document.primary_storage || 'cloudinary'
        },
        file_url: document.file_url,
        download_url: `/api/courses/${course_id}/documents/${document._id}/download`
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

// Health check endpoint to verify storage
const checkDocumentHealth = async (req, res) => {
  try {
    const stats = {
      cloudinary: { working: false, message: '' },
      local: { working: false, message: '' },
      documents: { total: 0, cloudinary_only: 0, local_only: 0, both: 0 }
    };

    // Check Cloudinary
    try {
      const { cloudinary } = require('../config/cloudinaryConfig');
      const result = await cloudinary.api.ping();
      stats.cloudinary.working = true;
      stats.cloudinary.message = 'Connected';
    } catch (error) {
      stats.cloudinary.message = error.message;
    }

    // Check local storage
    const uploadDir = 'uploads/documents/';
    stats.local.working = fs.existsSync(uploadDir);
    stats.local.message = stats.local.working ? 'Directory exists' : 'Directory missing';

    // Check some documents
    const courses = await CourseMaterial.find({ 'materials.documents.0': { $exists: true } })
      .limit(5)
      .select('materials.documents');

    courses.forEach(course => {
      course.materials.documents.forEach(doc => {
        stats.documents.total++;
        
        const hasCloudinary = !!(doc.cloudinary_data && doc.cloudinary_data.secure_url);
        const hasLocal = !!(doc.local_file && fs.existsSync(doc.local_file.path));
        
        if (hasCloudinary && hasLocal) stats.documents.both++;
        else if (hasCloudinary) stats.documents.cloudinary_only++;
        else if (hasLocal) stats.documents.local_only++;
      });
    });

    res.json({
      success: true,
      timestamp: new Date(),
      storage_stats: stats,
      recommendation: stats.cloudinary.working ? 
        'Cloudinary is working - documents will be served from CDN' :
        'Cloudinary is down - using local storage fallback'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  uploadDocumentDual,
  downloadDocument,
  getDocumentInfo,
  checkDocumentHealth
};