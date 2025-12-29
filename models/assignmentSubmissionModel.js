const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
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
  assignment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
    index: true
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseMaterial',
    required: true
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
    time_spent: { // in seconds
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
    percentage: { type: Number, default: 0 },
    late_penalty: { type: Number, default: 0 },
    final_score: { type: Number, default: 0 }
  },
  submission_time: {
    started_at: {
      type: Date,
      default: Date.now
    },
    submitted_at: {
      type: Date
    },
    total_time: { // in seconds
      type: Number,
      default: 0
    }
  },
  submission_status: {
    type: String,
    enum: ['in_progress', 'submitted', 'late', 'missed'],
    default: 'in_progress'
  },
  is_late: {
    type: Boolean,
    default: false
  },
  feedback: {
    teacher_feedback: String,
    teacher_comments: String,
    graded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auth'
    },
    graded_at: Date
  },
  ip_address: String,
  user_agent: String
}, {
  timestamps: true
});

// Calculate score before saving
assignmentSubmissionSchema.pre('save', function(next) {
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
    
    // Apply late penalty if applicable
    if (this.is_late) {
      this.score.late_penalty = this.score.earned_points * (this.late_penalty_percentage || 0) / 100;
      this.score.final_score = Math.max(0, this.score.earned_points - this.score.late_penalty);
    } else {
      this.score.final_score = this.score.earned_points;
    }
  }
  
  // Calculate total time if both dates exist
  if (this.submission_time.started_at && this.submission_time.submitted_at) {
    this.submission_time.total_time = Math.floor(
      (this.submission_time.submitted_at - this.submission_time.started_at) / 1000
    );
  }
  
  next();
});

// Indexes for better performance
assignmentSubmissionSchema.index({ student_id: 1, assignment_id: 1 });
assignmentSubmissionSchema.index({ assignment_id: 1, submission_status: 1 });
assignmentSubmissionSchema.index({ course_id: 1 });
assignmentSubmissionSchema.index({ teacher_id: 1, submitted_at: -1 });
assignmentSubmissionSchema.index({ submitted_at: -1 });

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);