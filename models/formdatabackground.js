const mongoose = require('mongoose');

const backgroundformSchema = new mongoose.Schema({
  educationalqualification: {
    type: String,
    required: true,
    trim: true,
  },
  currentstatus:{
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  
  profession: {
    type: String,
    required: true,
  },
  fieldofstudy:{
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("BackgroundInfo", backgroundformSchema);