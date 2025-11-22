const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auth',
    required: true,
    index: true
  },
  teacher_email: {
    type: String,
    required: true,
    index: true
  },
  teacher_name: {
    type: String,
    required: true
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
    required: true
  },
  quiz_title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true
  },
  quiz_description: {
    type: String,
    maxlength: 500
  },
  quiz_topic: {
    type: String,
    required: [true, 'Quiz topic is required'],
    trim: true
  },
  total_questions: {
    type: Number,
    required: true,
    min: 1,
    max: 50
  },
  questions: [{
    question_number: {
      type: Number,
      required: true
    },
    question_text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true
    },
    options: {
      A: { type: String, required: true, trim: true },
      B: { type: String, required: true, trim: true },
      C: { type: String, required: true, trim: true },
      D: { type: String, required: true, trim: true }
    },
    correct_option: {
      type: String,
      required: [true, 'Correct option is required'],
      enum: ['A', 'B', 'C', 'D'],
      uppercase: true
    },
    explanation: {
      type: String,
      trim: true
    },
    points: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    }
  }],
  quiz_settings: {
    time_limit: {
      type: Number, // in minutes
      default: 30,
      min: 5,
      max: 180
    },
    max_attempts: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    },
    show_results: {
      type: Boolean,
      default: true
    },
    is_active: {
      type: Boolean,
      default: true
    },
    start_date: {
      type: Date,
      default: Date.now
    },
    end_date: Date
  },
  total_points: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  analytics: {
    total_attempts: { type: Number, default: 0 },
    average_score: { type: Number, default: 0 },
    highest_score: { type: Number, default: 0 },
    lowest_score: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Calculate total points before saving
questionSchema.pre('save', function(next) {
  this.total_points = this.questions.reduce((total, question) => total + question.points, 0);
  next();
});

// Indexes for better performance
questionSchema.index({ teacher_id: 1, status: 1 });
questionSchema.index({ course_id: 1, status: 1 });
questionSchema.index({ course_category: 1 });
questionSchema.index({ 'quiz_settings.is_active': 1 });

module.exports = mongoose.model('Question', questionSchema);