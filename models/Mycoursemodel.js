const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  video_url: {
    type: String,
    required: true
  },
  thumbnail_url: {
    type: String,
    default: null
  },
  duration: {
    type: String,
    default: '00:00'
  },
  file_size: {
    type: Number,
    required: true
  },
  is_public: {
    type: Boolean,
    default: true
  },
  video_order: {
    type: Number,
    default: 0
  },
  upload_date: {
    type: Date,
    default: Date.now
  }
});

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  file_url: {
    type: String,
    required: true
  },
  file_type: {
    type: String,
    required: true,
    enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'zip', 'other']
  },
  file_size: {
    type: Number,
    required: true
  },
  is_public: {
    type: Boolean,
    default: true
  },
  document_type: {
    type: String,
    enum: ['notes', 'assignment', 'slides', 'resource', 'other'],
    default: 'notes'
  },
  upload_date: {
    type: Date,
    default: Date.now
  }
});

const courseMaterialSchema = new mongoose.Schema({
  // Course Basic Info
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auth',
    required: true
  },
  teacher_email: {
    type: String,
    required: true
  },
  course_title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true
  },
  course_description: {
    type: String,
    default: ''
  },
  course_category: {
    type: String,
    required: [true, 'Course category is required'],
    enum: [
      'Web Development',
      'Microsoft Office', 
      'C Programming',
      'java',
      'php',
      'DBMS',
      'Digital Marketing',
      'Tally',
      'Microsoft Word',
      'Microsoft Excel',
      'Microsoft PowerPoint',
      'Python',
      'Email & Internet',
      'Canva'
    ]
  },
  
  // Course Settings
  course_settings: {
    is_public: {
      type: Boolean,
      default: true
    },
    allow_downloads: {
      type: Boolean,
      default: true
    },
    enable_comments: {
      type: Boolean,
      default: true
    },
    certificate_available: {
      type: Boolean,
      default: false
    }
  },
  
  // Course Materials
  materials: {
    videos: [videoSchema],
    documents: [documentSchema]
  },
  
  // Course Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  
  // Tags for searchability
  tags: [String],
  
  // Statistics
  total_views: {
    type: Number,
    default: 0
  },
  total_students: {
    type: Number,
    default: 0
  },
  average_rating: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
courseMaterialSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Index for better query performance
courseMaterialSchema.index({ teacher_id: 1, created_at: -1 });
courseMaterialSchema.index({ course_category: 1 });
courseMaterialSchema.index({ status: 1 });

module.exports = mongoose.model('MyCourseMaterial', courseMaterialSchema);