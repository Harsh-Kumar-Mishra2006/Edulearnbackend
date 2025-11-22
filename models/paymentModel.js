const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student_email: {
    type: String,
    required: true
  },
  course_track: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  },
  payment_method: {
    type: String,
    default: "QR Payment"
  },
  screenshot_path: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  payment_date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Payment", paymentSchema);