const mongoose = require('mongoose');

const courseMaterialSchema = new mongoose.Schema({
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auth',
    required: true,
    index: true
  },
  teacher_email: {
    type: String,
    required: true,
    index: true
  },
  course_title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true
  },
  course_description: {
    type: String,
    maxlength: 1000
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
  ],
  default: 'other'
},
  materials: {
    videos: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      description: String,
      video_url: {
        type: String,
        required: true
      },
      thumbnail_url: String,
      duration: String,
      file_size: Number,
      upload_date: {
        type: Date,
        default: Date.now
      },
      is_public: {
        type: Boolean,
        default: true
      },
      video_order: {
        type: Number,
        default: 0
      },
      original_filename: String
    }],
    documents: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      description: String,
      file_url: {
        type: String,
        required: true
      },
      file_type: {
        type: String,
        enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'zip', 'other'],
        default: 'pdf'
      },
      file_size: Number,
      upload_date: {
        type: Date,
        default: Date.now
      },
      is_public: {
        type: Boolean,
        default: true
      },
      document_type: {
        type: String,
        enum: ['notes', 'assignment', 'resource', 'slides', 'other'],
        default: 'notes'
      },
       cloudinary_data: {
        public_id: String,
        url: String,
        secure_url: String,
        format: String,
        bytes: Number
      },
      
      local_file: {
        filename: String,
        originalName: String,
        path: String,
        mimetype: String,
        size: Number,
        exists: { type: Boolean, default: true }
      },
      available_storages: [{
        type: String,
        enum: ['cloudinary', 'local'],
        default: ['cloudinary']
      }],
      
      primary_storage: {
        type: String,
        enum: ['cloudinary', 'local'],
        default: 'cloudinary'
      },
      original_filename: String
    }],
    meetings: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      description: String,
      meeting_url: {
        type: String,
        required: true
      },
      meeting_type: {
        type: String,
        enum: ['zoom', 'google-meet', 'microsoft-teams', 'other'],
        default: 'other'
      },
      scheduled_date: {
        type: Date,
        required: true
      },
      duration: {
        type: Number, // in minutes
        default: 60
      },
      is_recurring: {
        type: Boolean,
        default: false
      },
      recurrence_pattern: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'none'],
        default: 'none'
      },
      meeting_id: String,
      passcode: String,
      status: {
        type: String,
        enum: ['scheduled', 'live', 'completed', 'cancelled'],
        default: 'scheduled'
      },
      created_date: {
        type: Date,
        default: Date.now
      },
      meeting_order: {
        type: Number,
        default: 0
      }
    }]
  },
  course_settings: {
    is_published: {
      type: Boolean,
      default: false
    },
    enrollment_type: {
      type: String,
      enum: ['free', 'paid', 'invite-only'],
      default: 'free'
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    },
    max_students: {
      type: Number,
      default: 100
    },
    start_date: Date,
    end_date: Date,
    difficulty_level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  tags: [String],
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  total_enrollments: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
courseMaterialSchema.index({ teacher_id: 1, status: 1 });
courseMaterialSchema.index({ course_category: 1, status: 1 });
courseMaterialSchema.index({ 'materials.videos.is_public': 1 });
courseMaterialSchema.index({ 'materials.documents.is_public': 1 });
courseMaterialSchema.index({ 'materials.meetings.scheduled_date': 1 });
courseMaterialSchema.index({ 'materials.meetings.status': 1 });

module.exports = mongoose.model("CourseMaterial", courseMaterialSchema);