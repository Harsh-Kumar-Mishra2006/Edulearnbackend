// config/cloudinaryStorage.js - FIXED VERSION
const cloudinary = require('./cloudinaryConfig');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Video storage (unchanged)
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: (req) => {
      const courseId = req.params.course_id || 'general';
      return `edulearn/courses/${courseId}/videos`;
    },
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'webm'],
    format: 'mp4',
    public_id: (req, file) => {
      const timestamp = Date.now();
      const name = file.originalname.replace(/\.[^/.]+$/, "");
      const safeName = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      return `${safeName}_${timestamp}`;
    }
  }
});

// **FIXED: Document storage for viewable files**
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const courseId = req.params.course_id || 'general';
    const timestamp = Date.now();
    const name = file.originalname.replace(/\.[^/.]+$/, "");
    const safeName = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    
    // Determine file type
    const ext = file.originalname.split('.').pop().toLowerCase();
    
    // For PDFs: upload as image resource to make them viewable
    if (ext === 'pdf') {
      return {
        folder: `edulearn/courses/${courseId}/documents`,
        resource_type: 'image', // PDFs can be treated as images for viewing
        format: 'pdf', // Keep as PDF
        public_id: `${safeName}_${timestamp}`,
        pages: true // Enable multi-page for PDFs
      };
    }
    
    // For images (jpg, png, etc.): upload as images
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return {
        folder: `edulearn/courses/${courseId}/documents`,
        resource_type: 'image',
        public_id: `${safeName}_${timestamp}`
      };
    }
    
    // For other documents (doc, ppt, txt, zip): upload as raw
    return {
      folder: `edulearn/courses/${courseId}/documents`,
      resource_type: 'raw',
      public_id: `${safeName}_${timestamp}`
    };
  }
});

// File filter middleware (unchanged)
const fileFilter = (allowedTypes, maxSize = 100 * 1024 * 1024) => {
  return (req, file, cb) => {
    if (!file) {
      return cb(new Error('No file provided'), false);
    }
    
    const actualMaxSize = file.fieldname === 'video' ? 2 * 1024 * 1024 * 1024 : maxSize;
    
    if (file.size > actualMaxSize) {
      return cb(new Error(`File size exceeds ${actualMaxSize / (1024 * 1024)}MB limit`), false);
    }

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`), false);
    }
  };
};

// Create multer upload instances
const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: fileFilter([
    'video/mp4',
    'video/x-msvideo',
    'video/quicktime',
    'video/x-ms-wmv',
    'video/x-flv',
    'video/x-matroska',
    'video/webm'
  ], 2 * 1024 * 1024 * 1024)
}).single('video');

const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: fileFilter([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ], 50 * 1024 * 1024)
}).single('document');

// **NEW: Helper to generate viewable URLs**
const getViewableUrl = (publicId, fileType) => {
  try {
    const cloudName = cloudinary.config().cloud_name;
    
    // For PDFs: use special viewer URL
    if (fileType === 'pdf') {
      return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}.pdf`;
    }
    
    // For images: standard image URL
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
    }
    
    // For other files: raw URL (will download, not view)
    return `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}`;
    
  } catch (error) {
    console.error('Error generating viewable URL:', error);
    throw error;
  }
};

// **NEW: Helper to generate downloadable URLs**
const getDownloadableUrl = (publicId, fileType, originalName) => {
  try {
    const cloudName = cloudinary.config().cloud_name;
    
    // Add fl_attachment flag to force download
    if (fileType === 'pdf') {
      return `https://res.cloudinary.com/${cloudName}/image/upload/fl_attachment:${encodeURIComponent(originalName)}/${publicId}.pdf`;
    }
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/fl_attachment:${encodeURIComponent(originalName)}/${publicId}`;
    }
    
    return `https://res.cloudinary.com/${cloudName}/raw/upload/fl_attachment:${encodeURIComponent(originalName)}/${publicId}`;
    
  } catch (error) {
    console.error('Error generating downloadable URL:', error);
    throw error;
  }
};

const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true
    });
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

module.exports = {
  cloudinary,
  uploadVideo,
  uploadDocument,
  getViewableUrl,
  getDownloadableUrl,
  deleteFile
};