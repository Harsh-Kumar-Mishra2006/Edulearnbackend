const mongoose = require('mongoose');

const studentEnrollmentSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    index: true
  },
  student_email: {
    type: String,
    required: true,
    index: true
  },
  student_name: {
    type: String,
    required: true,
  },
  course_category: {
    type: String,
    required: true,
    enum: [
      'web-development','mobile-dev','design', 'business', 
      'marketing', 'productivity', 'other'
    ],
    default: 'other'
  },
  enrollment_date: {
    type: Date,
    default: Date.now
  },
  enrollment_status: {
    type: String,
    enum: ['active', 'completed', 'dropped'],
    default: 'active'
  },
  payment_status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  payment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  progress: {
    completed_videos: [{
      video_id: {
        type: mongoose.Schema.Types.ObjectId
      },
      completed_at: {
        type: Date,
        default: Date.now
      },
      watch_time: Number
    }],
    completed_documents: [{
      document_id: {
        type: mongoose.Schema.Types.ObjectId
      },
      completed_at: {
        type: Date,
        default: Date.now
      }
    }],
    completed_meetings: [{
      meeting_id: {
        type: mongoose.Schema.Types.ObjectId
      },
      attended_at: {
        type: Date,
        default: Date.now
      }
    }],
    overall_progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    last_accessed: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Update overall progress
studentEnrollmentSchema.methods.updateProgress = function() {
  const totalMaterials = this.progress.completed_videos.length + 
                        this.progress.completed_documents.length + 
                        this.progress.completed_meetings.length;
  
  this.progress.overall_progress = Math.min(totalMaterials * 10, 100);
  this.progress.last_accessed = new Date();
};

// Indexes
studentEnrollmentSchema.index({ student_email: 1, course_category: 1 });
studentEnrollmentSchema.index({ payment_status: 1 });

module.exports = mongoose.model('StudentEnrollment', studentEnrollmentSchema);