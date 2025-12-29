const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
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
  assignment_title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true
  },
  assignment_description: {
    type: String,
    maxlength: 500
  },
  assignment_topic: {
    type: String,
    required: [true, 'Assignment topic is required'],
    trim: true
  },
  assignment_date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  due_date: {
    type: Date,
    required: true
  },
  total_questions: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  total_points: {
    type: Number,
    default: 0
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
    question_type: {
      type: String,
      enum: ['mcq', 'true-false', 'short-answer'],
      default: 'mcq'
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
      max: 5
    }
  }],
  settings: {
    max_attempts: {
      type: Number,
      default: 1,
      min: 1,
      max: 3
    },
    allow_late_submission: {
      type: Boolean,
      default: false
    },
    late_submission_penalty: {
      type: Number,
      default: 0,
      min: 0,
      max: 50
    },
    show_answers_after_due: {
      type: Boolean,
      default: false
    },
    is_active: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  analytics: {
    total_submissions: { type: Number, default: 0 },
    submissions_on_time: { type: Number, default: 0 },
    submissions_late: { type: Number, default: 0 },
    average_score: { type: Number, default: 0 },
    highest_score: { type: Number, default: 0 },
    lowest_score: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Calculate total points before saving
assignmentSchema.pre('save', function(next) {
  this.total_points = this.questions.reduce((total, question) => total + question.points, 0);
  next();
});

// Indexes for better performance
assignmentSchema.index({ teacher_id: 1, status: 1 });
assignmentSchema.index({ course_id: 1, status: 1 });
assignmentSchema.index({ course_category: 1, assignment_date: 1 });
assignmentSchema.index({ assignment_date: 1, 'settings.is_active': 1 });
assignmentSchema.index({ due_date: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);