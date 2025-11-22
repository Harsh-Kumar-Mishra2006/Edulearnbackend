const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Teacher name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  course: {
  type: String,
  required: [true, 'Course is required'],
  trim: true,
  enum: {
    values: [
      'Web Development',
      'Microsoft Office', 
      'Mobile App Development',
      'UI/UX Design',
      'Digital Marketing',
      'Graphic Design'
    ],
    message: 'Please select a valid course from the options'
  }
},
  phone_number: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number']
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    }
  },
  qualification: {
    type: String,
    required: [true, 'Qualification is required'],
    trim: true
  },
  years_of_experience: {
    type: Number,
    required: [true, 'Years of experience is required'],
    min: [0, 'Experience cannot be negative'],
    max: [50, 'Experience seems too high']
  },
  specialization: {
    type: [String],
    default: []
  },
  bio: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  joining_date: {
    type: Date,
    default: Date.now
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auth',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
teacherSchema.index({ email: 1 });
teacherSchema.index({ course_domain: 1 });
teacherSchema.index({ status: 1 });

module.exports = mongoose.model("Teacher", teacherSchema);