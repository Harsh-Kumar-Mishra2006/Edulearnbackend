// config/courseupload.js - UPDATED VERSION
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use absolute path for uploads
const getUploadDir = () => {
  // Always use a consistent directory
  const baseDir = process.cwd();
  const uploadDir = path.join(baseDir, 'uploads');
  
  console.log('📁 Upload directory:', uploadDir);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Created upload directory:', uploadDir);
  }
  
  return uploadDir;
};

const UPLOAD_DIR = getUploadDir();

// Ensure subdirectories exist
const createDirs = () => {
  const dirs = [
    path.join(UPLOAD_DIR, 'courses', 'videos'),
    path.join(UPLOAD_DIR, 'courses', 'documents'),
    path.join(UPLOAD_DIR, 'courses', 'thumbnails')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
};

createDirs();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = UPLOAD_DIR;
    
    if (file.fieldname === 'video') {
      uploadPath = path.join(uploadPath, 'courses', 'videos');
    } else if (file.fieldname === 'document') {
      uploadPath = path.join(uploadPath, 'courses', 'documents');
    } else if (file.fieldname === 'thumbnail') {
      uploadPath = path.join(uploadPath, 'courses', 'thumbnails');
    }
    
    console.log('📂 Destination path:', uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_\-.]/g, '');
    
    const filename = name + '-' + uniqueSuffix + ext;
    console.log(`💾 Saving file as: ${filename}`);
    cb(null, filename);
  }
});

// File filter (same as before)
const fileFilter = (req, file, cb) => {
  const maxSize = 2 * 1024 * 1024 * 1024;

  if (file.size > maxSize) {
    return cb(new Error('File size exceeds 2GB limit'), false);
  }

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
  } else if (file.fieldname === 'document') {
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
  } else if (file.fieldname === 'thumbnail') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for thumbnails!'), false);
    }
  } else {
    cb(new Error('Unexpected file type!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
  fileFilter: fileFilter
});

module.exports = {
  uploadVideo: upload.single('video'),
  uploadDocument: upload.single('document'),
  uploadThumbnail: upload.single('thumbnail'),
  UPLOAD_DIR
};