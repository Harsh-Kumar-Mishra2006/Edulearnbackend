const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  to: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true
  },
  template: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'delivered', 'opened'],
    default: 'pending'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  messageId: {
  type: String
},
  openedAt: Date,
  error: String,
  metadata: {
    userId: mongoose.Schema.Types.ObjectId,
    userType: {
      type: String,
      enum: ['student', 'admin', 'instructor']
    },
    courseId: mongoose.Schema.Types.ObjectId,
    paymentId: mongoose.Schema.Types.ObjectId,
    enrollmentId: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: true
});

// Index for faster queries
emailLogSchema.index({ to: 1, status: 1 });
emailLogSchema.index({ sentAt: -1 });
emailLogSchema.index({ 'metadata.userId': 1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);