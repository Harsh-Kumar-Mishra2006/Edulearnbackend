// config/cloudinaryStorage.js - FIXED
const cloudinary = require('./cloudinaryConfig');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

// Debug Cloudinary configuration
console.log('🔄 Initializing Cloudinary Storage...');
console.log('Cloud Name:', cloudinary.config().cloud_name);

// Video storage configuration
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const courseId = req.params.course_id || 'general';
    const timestamp = Date.now();
    const originalName = file.originalname;
    const nameWithoutExt = path.parse(originalName).name;
    const safeName = nameWithoutExt.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    
    return {
      folder: `edulearn/courses/${courseId}/videos`,
      resource_type: 'video',
      allowed_formats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'webm'],
      format: async (req, file) => path.parse(file.originalname).ext.substring(1) || 'mp4',
      public_id: `${safeName}_${timestamp}`,
      chunk_size: 6000000, // 6MB chunks for better upload
      use_filename: true,
      unique_filename: false,
      overwrite: false,
      return_delete_token: true,
      eager: [
        { format: 'mp4', quality: 'auto' }
      ]
    };
  }
});

// Document storage configuration
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const courseId = req.params.course_id || 'general';
    const timestamp = Date.now();
    const originalName = file.originalname;
    const nameWithoutExt = path.parse(originalName).name;
    const safeName = nameWithoutExt.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const ext = path.parse(originalName).ext.substring(1).toLowerCase();
    
    // Determine resource type
    let resourceType = 'raw';
    let format = ext;
    
    // PDFs as images for preview
    if (ext === 'pdf') {
      resourceType = 'image';
      format = 'pdf';
    }
    
    // Images as images
    else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
      resourceType = 'image';
    }
    
    return {
      folder: `edulearn/courses/${courseId}/documents`,
      resource_type: resourceType,
      public_id: `${safeName}_${timestamp}`,
      format: format,
      allowed_formats: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'zip', 'jpg', 'jpeg', 'png', 'gif', 'webp'],
      // For PDFs, enable multi-page
      ...(ext === 'pdf' ? { pages: true } : {})
    };
  }
});

// File filter function
const createFileFilter = (allowedMimeTypes, maxSizeMB) => {
  return (req, file, cb) => {
    // Check file existence
    if (!file) {
      return cb(new Error('No file provided'), false);
    }
    
    // Check file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return cb(new Error(`File size exceeds ${maxSizeMB}MB limit`), false);
    }
    
    // Check MIME type
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`), false);
    }
  };
};

// Video upload middleware
const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: createFileFilter([
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/x-flv',
    'video/x-matroska',
    'video/webm'
  ], 500), // 500MB limit for videos
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  }
}).single('video');

// Document upload middleware
const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: createFileFilter([
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
    'image/webp',
    'image/bmp'
  ], 50), // 50MB limit for documents
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
}).single('document');

// Helper function to get Cloudinary URL
const getCloudinaryUrl = (publicId, resourceType = 'video', transformation = '') => {
  const cloudName = cloudinary.config().cloud_name;
  let url = '';
  
  switch(resourceType) {
    case 'video':
      url = `https://res.cloudinary.com/${cloudName}/video/upload/${transformation}${publicId}`;
      break;
    case 'image':
      url = `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}${publicId}`;
      break;
    case 'raw':
      url = `https://res.cloudinary.com/${cloudName}/raw/upload/${transformation}${publicId}`;
      break;
    default:
      url = `https://res.cloudinary.com/${cloudName}/raw/upload/${transformation}${publicId}`;
  }
  
  return url;
};

// Helper function to get thumbnail URL for videos
const getVideoThumbnail = (publicId, time = '00:00:01') => {
  const cloudName = cloudinary.config().cloud_name;
  return `https://res.cloudinary.com/${cloudName}/video/upload/so_${time},w_300,h_200,c_fill/${publicId}.jpg`;
};

// Delete file from Cloudinary
const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    console.log('🗑️ Deleting from Cloudinary:', { publicId, resourceType });
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true
    });
    
    console.log('✅ Delete result:', result);
    return result.result === 'ok';
  } catch (error) {
    console.error('❌ Error deleting from Cloudinary:', error);
    return false;
  }
};

// Test Cloudinary connection
const testCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection test:', result);
    return result.status === 'ok';
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    return false;
  }
};
const uploadToCloudinary = (filePath, options = {}) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        folder: options.folder || 'course_materials',
        resource_type: options.resource_type || 'auto',
        public_id: options.public_id,
        ...options
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });
};
module.exports = {
  cloudinary,
  uploadVideo,
  uploadDocument,
  getCloudinaryUrl,
  getVideoThumbnail,
  deleteFile,
  testCloudinaryConnection,
  uploadToCloudinary
};