// models/Course.js
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  // Required fields matching CourseData.js
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  image: {
    type: String,
    required: [true, 'Course image is required'],
    default: 'default-course.jpg'
  },
  
  duration: {
    type: String,
    required: [true, 'Course duration is required'],
    default: '8 weeks'
  },
  
  level: {
    type: String,
    required: [true, 'Course level is required'],
    enum: {
      values: ['Beginner', 'Intermediate', 'Advanced', 'All Levels', 'Beginner to Advanced', 'Beginner to Intermediate'],
      message: 'Invalid course level'
    }
  },
  
  price: {
    type: Number,
    required: [true, 'Course price is required'],
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot exceed 5'],
    default: 0
  },
  
  // models/Course.js - Update category enum:
category: {
  type: String,
  required: [true, 'Course category is required'],
  enum: {
    values: ['Development', 'Design', 'Marketing', 'Productivity', 'Business', 'Technology', 'Data Science', 'Personal Development', 'Others'],
    message: 'Invalid category'
  }
},
  // Add these to your courseSchema:

prerequisites: [{
  type: String,
  trim: true
}],

learningOutcomes: [{
  type: String,
  trim: true
}],

targetAudience: [{
  type: String,
  trim: true
}],

metaTitle: {
  type: String,
  trim: true,
  maxlength: [200, 'Meta title cannot exceed 200 characters']
},

metaDescription: {
  type: String,
  trim: true,
  maxlength: [500, 'Meta description cannot exceed 500 characters']
},

keywords: [{
  type: String,
  trim: true
}],

isFeatured: {
  type: Boolean,
  default: false
},

instructor: {
  type: String,
  trim: true
},

isActive: {
  type: Boolean,
  default: true
},

studentsEnrolled: {
  type: Number,
  default: 0
},

totalLessons: {
  type: Number,
  default: 0
},

totalHours: {
  type: Number,
  default: 0
},
  features: [{
    type: String,
    trim: true
  }],
  
  popular: {
    type: Boolean,
    default: false
  },
  
  // Additional fields for management
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  isFree: {
    type: Boolean,
    default: false
  },
  
  discountPrice: {
    type: Number,
    min: 0
  },
  createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Teacher', // or 'User' depending on your user model
  required: true
},

isActive: {
  type: Boolean,
  default: true
},

// Also add this if you want to track updates
updatedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Teacher'
},
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  publishedAt: Date
}, {
  timestamps: true
});

// Generate slug before saving
courseSchema.pre('save', function(next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
  }
  next();
});

// Update updatedAt timestamp
courseSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;