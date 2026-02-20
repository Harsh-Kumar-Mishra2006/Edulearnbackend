const mongoose = require('mongoose');

const querryformSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
  },
  phone: { 
    type: String, 
    required: true 
  },
  issue: {
    type: String,
    required: true
  },
  suggestion: {
    type: String,
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auth'
  }
}, {
  timestamps: true  
});

module.exports = mongoose.model('QuerryForm', querryformSchema);