const mongoose = require('mongoose');

const personalformSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true }, // Changed to String
  dob: { type: String, required: true }    // Changed to String
}, {
  timestamps: true,
});

module.exports = mongoose.model("PersonalInfo", personalformSchema);