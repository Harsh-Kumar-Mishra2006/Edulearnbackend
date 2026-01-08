// In config/courseupload.js - simplified version
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Determine upload directory based on environment
const getUploadDir = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Render: use /tmp directory
    const tmpDir = path.join('/tmp', 'uploads');
    console.log('🚀 PRODUCTION: Using upload directory:', tmpDir);
    return tmpDir;
  } else {
    // Local: use project uploads directory
    const localDir = path.join(__dirname, '..', 'uploads');
    console.log('💻 LOCAL: Using upload directory:', localDir);
    return localDir;
  }
};

const UPLOAD_DIR = getUploadDir();

// Ensure directories exist
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
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_\-.]/g, '');
    
    const filename = name + '-' + uniqueSuffix + ext;
    console.log(`💾 Saving ${file.fieldname} as: ${filename}`);
    cb(null, filename);
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
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
  fileFilter: fileFilter
});


module.exports = {
  uploadVideo: upload.single('video'),
  uploadDocument: upload.single('document'),
  UPLOAD_DIR
};