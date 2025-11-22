const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads/courses/videos',
    'uploads/courses/documents',
    'uploads/courses/thumbnails'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/courses/';
    
    if (file.fieldname === 'video') {
      uploadPath += 'videos/';
    } else if (file.fieldname === 'document') {
      uploadPath += 'documents/';
    } else if (file.fieldname === 'thumbnail') {
      uploadPath += 'thumbnails/';
    } else {
      uploadPath += 'others/';
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    
    cb(null, name + '-' + uniqueSuffix + ext);
  }
});

// File filter with 2GB limit
const fileFilter = (req, file, cb) => {
  const maxSize = 2 * 1024 * 1024 * 1024; // 2GB

  // Check file size
  if (file.size > maxSize) {
    return cb(new Error('File size exceeds 2GB limit'), false);
  }

  // Videos
  if (file.fieldname === 'video') {
    const allowedVideoTypes = [
      'video/mp4',
      'video/mkv',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/webm',
      'video/quicktime'
    ];
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files (MP4, MKV, AVI, MOV, WMV, WebM) are allowed!'), false);
    }
  }
  // Documents
  else if (file.fieldname === 'document') {
    const allowedDocs = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ];
    if (allowedDocs.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only document files (PDF, DOC, PPT, TXT, ZIP) are allowed!'), false);
    }
  }
  // Thumbnails
  else if (file.fieldname === 'thumbnail') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for thumbnails!'), false);
    }
  }
  else {
    cb(new Error('Unexpected file type!'), false);
  }
};

// Initialize multer with 2GB limit
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB
  },
  fileFilter: fileFilter
});

// FIX: Use .single() instead of .fields() since frontend only sends one file
const uploadVideo = upload.single('video'); // Changed from .fields()
const uploadDocument = upload.single('document');

module.exports = {
  uploadVideo,
  uploadDocument
};