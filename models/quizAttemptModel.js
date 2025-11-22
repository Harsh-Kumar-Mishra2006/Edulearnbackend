const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auth',
    required: true,
    index: true
  },
  student_email: {
    type: String,
    required: true,
    index: true
  },
  student_name: {
    type: String,
    required: true
  },
  quiz_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
    index: true
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
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auth',
    required: true
  },
  attempt_number: {
    type: Number,
    required: true,
    min: 1
  },
  answers: [{
    question_number: {
      type: Number,
      required: true
    },
    selected_option: {
      type: String,
      enum: ['A', 'B', 'C', 'D', null],
      default: null
    },
    is_correct: {
      type: Boolean,
      default: false
    },
    points_earned: {
      type: Number,
      default: 0
    },
    time_taken: { // in seconds
      type: Number,
      default: 0
    }
  }],
  score: {
    total_questions: { type: Number, required: true },
    correct_answers: { type: Number, default: 0 },
    wrong_answers: { type: Number, default: 0 },
    unattempted: { type: Number, default: 0 },
    total_points: { type: Number, default: 0 },
    earned_points: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },
  time_taken: { // in seconds
    type: Number,
    default: 0
  },
  started_at: {
    type: Date,
    default: Date.now
  },
  submitted_at: {
    type: Date
  },
  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'timeout'],
    default: 'in_progress'
  },
  ip_address: String,
  user_agent: String
}, {
  timestamps: true
});

// Calculate score before saving
quizAttemptSchema.pre('save', function(next) {
  if (this.answers && this.answers.length > 0) {
    const correctAnswers = this.answers.filter(answer => answer.is_correct).length;
    const earnedPoints = this.answers.reduce((total, answer) => total + answer.points_earned, 0);
    const totalPoints = this.answers.reduce((total, answer) => total + (answer.points_earned > 0 ? answer.points_earned : 0), 0);
    
    this.score.correct_answers = correctAnswers;
    this.score.wrong_answers = this.answers.filter(answer => answer.selected_option && !answer.is_correct).length;
    this.score.unattempted = this.answers.filter(answer => !answer.selected_option).length;
    this.score.earned_points = earnedPoints;
    this.score.total_points = totalPoints;
    this.score.percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  }
  next();
});

// Indexes for better performance
quizAttemptSchema.index({ student_id: 1, quiz_id: 1 });
quizAttemptSchema.index({ quiz_id: 1, status: 1 });
quizAttemptSchema.index({ course_id: 1 });
quizAttemptSchema.index({ submitted_at: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);