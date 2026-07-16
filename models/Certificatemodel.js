
const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificate_id: { 
    type: String, 
    unique: true 
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auth',
    required: false  // ← Changed to false - will be set from email
  },
  student_name: { 
    type: String, 
    required: true 
  },
  student_email: { 
    type: String, 
    required: true 
  },
  course_title: { 
    type: String, 
    required: true 
  },
  course_category: { 
    type: String, 
    default: 'General' 
  },
  certificate_file: {
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number
  },
  completion_date: { 
    type: Date, 
    required: true 
  },
  issue_date: { 
    type: Date, 
    default: Date.now 
  },
  status: {
    type: String,
    enum: ['issued', 'pending', 'revoked'],
    default: 'issued'
  },
  issued_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auth',
    required: false  // ← Changed to false
  },
  issuer_name: { 
    type: String, 
    required: false  // ← Changed to false
  },
  verification_code: { 
    type: String, 
    unique: true 
  },
  revoked_at: {
    type: Date,
    default: null
  },
  revocation_reason: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Auto-generate certificate_id and verification_code
certificateSchema.pre('save', function(next) {
  if (!this.certificate_id) {
    this.certificate_id = `CERT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }
  if (!this.verification_code) {
    this.verification_code = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Certificate', certificateSchema);