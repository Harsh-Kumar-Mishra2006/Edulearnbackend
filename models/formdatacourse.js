const mongoose = require('mongoose');

const courseformSchema = new mongoose.Schema({
  currentskills: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
  },
  fieldofstudy: {
    type: String,  // ✅ CHANGED from Number to String
    required: true,
  },
  language: {
    type: String,  // ✅ CHANGED from Number to String
    required: true, 
  },
  goals: {
    type: String,  // ✅ CHANGED from Number to String
    required: true,
  },
  background: {
    type: String,  // ✅ CHANGED from Number to String
    required: true, 
  },
  timecommitment: {  // ✅ FIXED TYPO: timecommitement → timecommitment
    type: String,    // ✅ CHANGED from Number to String
    required: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model("CourseInfo", courseformSchema);