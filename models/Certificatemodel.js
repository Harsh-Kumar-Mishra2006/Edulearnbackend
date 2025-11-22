const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificate_id: {
    type: String,
    unique: true,
    required: true
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    //required: true,
    index: true
  },
  student_name: {
    type: String,
    required: true
  },
  student_email: {
    type: String,
    required: true,
    index: true
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseMaterial',
    required: true,
    index: true
  },
  course_title: {
    type: String,
    required: true
  },
  course_category: {
    type: String,
    required: true,
    enum: ['web-development', 'app-development', 'digital-marketing', 'microsoft-office', 'ui-ux-design', 'business', 'other']
  },
  issue_date: {
    type: Date,
    default: Date.now,
    required: true
  },
  completion_date: {
    type: Date,
    required: true
  },
  certificate_template: {
    type: String,
    default: 'default',
    enum: ['default', 'premium', 'minimal']
  },
  certificate_url: {
    type: String,
    required: true
  },
  verification_code: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['issued', 'pending', 'revoked'],
    default: 'issued'
  },
  issued_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  issuer_name: {
    type: String,
    required: true
  },
  grades: {
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']
    },
    remarks: String
  },
  expires_at: {
    type: Date
  },
  revocation_reason: {
    type: String
  }
}, {
  timestamps: true
});

// Generate certificate ID before saving
certificateSchema.pre('save', async function(next) {
  if (!this.certificate_id) {
    const count = await mongoose.model('Certificate').countDocuments();
    this.certificate_id = `CERT-${Date.now()}-${count + 1}`;
  }
  
  if (!this.verification_code) {
    this.verification_code = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  
  next();
});

// Index for better query performance
certificateSchema.index({ student_id: 1, course_id: 1 });
certificateSchema.index({ verification_code: 1 });
certificateSchema.index({ issue_date: 1 });
certificateSchema.index({ status: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);