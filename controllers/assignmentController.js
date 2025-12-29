const Assignment = require('../models/assignmentModel');
const AssignmentSubmission = require('../models/assignmentSubmissionModel');
const CourseMaterial = require('../models/courseMaterialdata');
const StudentEnrollment = require('../models/Mylearningmodel');

// Create new daily assignment
const createAssignment = async (req, res) => {
  try {
    const {
      course_id,
      assignment_title,
      assignment_description,
      assignment_topic,
      assignment_date,
      due_date,
      questions,
      settings
    } = req.body;

    // Validation
    if (!course_id || !assignment_title || !assignment_topic || !questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        error: "Course ID, assignment title, topic, and questions are required"
      });
    }

    if (questions.length === 0 || questions.length > 20) {
      return res.status(400).json({
        success: false,
        error: "Assignment must have 1 to 20 questions"
      });
    }

    if (!assignment_date || !due_date) {
      return res.status(400).json({
        success: false,
        error: "Assignment date and due date are required"
      });
    }

    // Verify course exists and belongs to teacher
    const course = await CourseMaterial.findOne({
      _id: course_id,
      teacher_id: req.user.userId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found or access denied"
      });
    }

    // Validate questions structure
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text || !q.options || !q.correct_option) {
        return res.status(400).json({
          success: false,
          error: `Question ${i + 1} is missing required fields`
        });
      }

      if (!['A', 'B', 'C', 'D'].includes(q.correct_option.toUpperCase())) {
        return res.status(400).json({
          success: false,
          error: `Question ${i + 1}: Correct option must be A, B, C, or D`
        });
      }

      // Validate options
      const requiredOptions = ['A', 'B', 'C', 'D'];
      for (const opt of requiredOptions) {
        if (!q.options[opt] || q.options[opt].trim() === '') {
          return res.status(400).json({
            success: false,
            error: `Question ${i + 1}: Option ${opt} is required`
          });
        }
      }

      // Add question number
      q.question_number = i + 1;
      q.question_type = q.question_type || 'mcq';
    }

    // Create assignment
    const assignment = new Assignment({
      teacher_id: req.user.userId,
      teacher_email: req.user.email,
      teacher_name: req.user.name,
      course_id: course_id,
      course_title: course.course_title,
      course_category: course.course_category,
      assignment_title,
      assignment_description,
      assignment_topic,
      assignment_date: new Date(assignment_date),
      due_date: new Date(due_date),
      total_questions: questions.length,
      questions: questions,
      settings: settings || {},
      status: 'published' // Auto-publish daily assignments
    });

    await assignment.save();

    res.status(201).json({
      success: true,
      message: "Daily assignment created successfully",
      data: assignment
    });

  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({
      success: false,
      error: "Error creating assignment: " + error.message
    });
  }
};

const getTeacherAssignments = async (req, res) => {
  try {
    console.log('🟡 [GET TEACHER ASSIGNMENTS] Request received');
    console.log('🟡 User ID:', req.user.userId);
    console.log('🟡 Query params:', req.query);
    
    const { course_id, date, status } = req.query;
    
    let query = { teacher_id: req.user.userId };
    
    if (course_id) query.course_id = course_id;
    if (date) query.assignment_date = new Date(date);
    if (status) query.status = status;

    console.log('🟡 Query:', query);

    const assignments = await Assignment.find(query)
      .populate('course_id', 'course_title course_category')
      .select('-questions')
      .sort({ assignment_date: -1 });

    console.log('🟡 Found assignments:', assignments.length);

    res.json({
      success: true,
      data: assignments,
      total: assignments.length
    });

  } catch (error) {
    console.error('🔴 Get assignments error:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching assignments: " + error.message
    });
  }
};

// Get assignment details with questions (for teacher)
const getAssignmentDetails = async (req, res) => {
  try {
    const { assignment_id } = req.params;

    const assignment = await Assignment.findOne({
      _id: assignment_id,
      teacher_id: req.user.userId
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: "Assignment not found or access denied"
      });
    }

    res.json({
      success: true,
      data: assignment
    });

  } catch (error) {
    console.error('Get assignment details error:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching assignment details: " + error.message
    });
  }
};

// Get student's daily assignments
const getStudentAssignments = async (req, res) => {
  try {
    const student_email = req.user.email;
    const { date } = req.query;
    
    console.log('🟡 [ASSIGNMENT] Fetching assignments for student:', student_email, 'Date:', date);

    // Get student enrollments
    const enrollments = await StudentEnrollment.find({
      student_email,
      payment_status: 'verified',
      enrollment_status: 'active'
    });

    console.log('🟡 [ASSIGNMENT] Student enrollments found:', enrollments.length);

    if (enrollments.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No enrolled courses found'
      });
    }

    const enrolledCategories = enrollments.map(e => e.course_category);
    console.log('🟡 [ASSIGNMENT] Enrolled categories:', enrolledCategories);

    // Build query for assignments
    let query = {
      course_category: { $in: enrolledCategories },
      status: 'published',
      'settings.is_active': true
    };

    // Filter by date if provided
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      query.assignment_date = {
        $gte: targetDate,
        $lt: nextDate
      };
    }

    // Get assignments
    const assignments = await Assignment.find(query)
      .populate('teacher_id', 'name')
      .select('-questions.correct_option -questions.explanation')
      .sort({ assignment_date: -1 });

    console.log('🟡 [ASSIGNMENT] Found assignments:', assignments.length);

    // Check submission status for each assignment
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await AssignmentSubmission.findOne({
          assignment_id: assignment._id,
          student_id: req.user.userId
        }).select('submission_status submitted_at score');

        const now = new Date();
        const isDue = now > new Date(assignment.due_date);
        const canSubmit = assignment.settings.allow_late_submission || !isDue;
        
        let status = 'pending';
        if (submission) {
          status = submission.submission_status;
        } else if (isDue) {
          status = canSubmit ? 'pending_late' : 'missed';
        }

        return {
          ...assignment.toObject(),
          submission_status: status,
          current_submission: submission,
          is_due: isDue,
          can_submit: canSubmit
        };
      })
    );

    res.json({
      success: true,
      data: assignmentsWithStatus,
      total: assignmentsWithStatus.length
    });

  } catch (error) {
    console.error('🔴 [ASSIGNMENT] Get student assignments error:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching student assignments: " + error.message
    });
  }
};

// Start assignment attempt
const startAssignmentAttempt = async (req, res) => {
  try {
    const { assignment_id } = req.params;

    // Get assignment details
    const assignment = await Assignment.findOne({
      _id: assignment_id,
      status: 'published',
      'settings.is_active': true
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: "Assignment not found or not available"
      });
    }

    // Check if due date has passed
    const now = new Date();
    const isDue = now > new Date(assignment.due_date);
    
    if (isDue && !assignment.settings.allow_late_submission) {
      return res.status(400).json({
        success: false,
        error: "Assignment due date has passed and late submissions are not allowed"
      });
    }

    // Check previous attempts
    const previousSubmissions = await AssignmentSubmission.find({
      assignment_id,
      student_id: req.user.userId
    });

    if (previousSubmissions.length >= assignment.settings.max_attempts) {
      return res.status(400).json({
        success: false,
        error: `Maximum attempts (${assignment.settings.max_attempts}) reached for this assignment`
      });
    }

    // Check if already submitted today
    if (previousSubmissions.some(sub => sub.submission_status === 'submitted' || sub.submission_status === 'late')) {
      return res.status(400).json({
        success: false,
        error: "Assignment already submitted"
      });
    }

    // Create new submission
    const submission = new AssignmentSubmission({
      student_id: req.user.userId,
      student_email: req.user.email,
      student_name: req.user.name,
      assignment_id: assignment_id,
      course_id: assignment.course_id,
      course_title: assignment.course_title,
      course_category: assignment.course_category,
      teacher_id: assignment.teacher_id,
      attempt_number: previousSubmissions.length + 1,
      answers: assignment.questions.map(q => ({
        question_number: q.question_number,
        selected_option: null,
        is_correct: false,
        points_earned: 0
      })),
      score: {
        total_questions: assignment.total_questions
      },
      is_late: isDue,
      late_penalty_percentage: isDue ? assignment.settings.late_submission_penalty : 0,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    await submission.save();

    // Return assignment without correct answers
    const assignmentForStudent = {
      _id: assignment._id,
      assignment_title: assignment.assignment_title,
      assignment_description: assignment.assignment_description,
      assignment_topic: assignment.assignment_topic,
      assignment_date: assignment.assignment_date,
      due_date: assignment.due_date,
      total_questions: assignment.total_questions,
      total_points: assignment.total_points,
      settings: assignment.settings,
      questions: assignment.questions.map(q => ({
        question_number: q.question_number,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        points: q.points
        // Don't send correct_option or explanation
      }))
    };

    res.json({
      success: true,
      data: {
        assignment: assignmentForStudent,
        submission_id: submission._id,
        is_late: isDue,
        due_date: assignment.due_date
      }
    });

  } catch (error) {
    console.error('Start assignment attempt error:', error);
    res.status(500).json({
      success: false,
      error: "Error starting assignment attempt: " + error.message
    });
  }
};

// Submit assignment attempt
const submitAssignmentAttempt = async (req, res) => {
  try {
    const { submission_id } = req.params;
    const { answers } = req.body;

    const submission = await AssignmentSubmission.findOne({
      _id: submission_id,
      student_id: req.user.userId,
      $or: [
        { submission_status: 'in_progress' },
        { submission_status: 'pending_late' }
      ]
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: "Submission not found or already submitted"
      });
    }

    // Get assignment to check correct answers
    const assignment = await Assignment.findById(submission.assignment_id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: "Assignment not found"
      });
    }

    // Check if still within due date (with grace period)
    const now = new Date();
    const isLate = now > new Date(assignment.due_date);
    
    if (isLate && !assignment.settings.allow_late_submission) {
      return res.status(400).json({
        success: false,
        error: "Late submissions are not allowed for this assignment"
      });
    }

    // Validate and grade answers
    const gradedAnswers = answers.map(answer => {
      const question = assignment.questions.find(q => q.question_number === answer.question_number);
      if (!question) return answer;

      const is_correct = answer.selected_option === question.correct_option;
      const points_earned = is_correct ? question.points : 0;

      return {
        ...answer,
        is_correct,
        points_earned
      };
    });

    // Update submission
    submission.answers = gradedAnswers;
    submission.submission_time.submitted_at = now;
    submission.submission_status = isLate ? 'late' : 'submitted';
    submission.is_late = isLate;

    await submission.save();

    // Update assignment analytics
    await updateAssignmentAnalytics(assignment._id);

    // Return results
    const results = {
      score: submission.score,
      correct_answers: assignment.questions.map(q => ({
        question_number: q.question_number,
        correct_option: q.correct_option,
        explanation: q.explanation
      }))
    };

    res.json({
      success: true,
      message: `Assignment submitted ${isLate ? 'late' : 'successfully'}`,
      data: results
    });

  } catch (error) {
    console.error('Submit assignment attempt error:', error);
    res.status(500).json({
      success: false,
      error: "Error submitting assignment attempt: " + error.message
    });
  }
};

// Get student's assignment submission
const getStudentSubmission = async (req, res) => {
  try {
    const { assignment_id } = req.params;

    const submission = await AssignmentSubmission.findOne({
      assignment_id,
      student_id: req.user.userId
    }).populate('assignment_id');

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: "No submission found for this assignment"
      });
    }

    res.json({
      success: true,
      data: submission
    });

  } catch (error) {
    console.error('Get student submission error:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching submission: " + error.message
    });
  }
};

// Get all submissions for a specific assignment (teacher view)
const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignment_id } = req.params;

    // Verify assignment belongs to teacher
    const assignment = await Assignment.findOne({
      _id: assignment_id,
      teacher_id: req.user.userId
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: "Assignment not found or access denied"
      });
    }

    const submissions = await AssignmentSubmission.find({ assignment_id })
      .populate('student_id', 'name email')
      .sort({ submitted_at: -1 });

    // Calculate statistics
    const stats = {
      total_submissions: submissions.length,
      submissions_on_time: submissions.filter(s => !s.is_late).length,
      submissions_late: submissions.filter(s => s.is_late).length,
      average_score: submissions.reduce((sum, sub) => sum + sub.score.percentage, 0) / submissions.length || 0,
      highest_score: Math.max(...submissions.map(sub => sub.score.percentage), 0),
      lowest_score: Math.min(...submissions.map(sub => sub.score.percentage), 0)
    };

    res.json({
      success: true,
      data: {
        assignment: {
          title: assignment.assignment_title,
          topic: assignment.assignment_topic,
          total_questions: assignment.total_questions,
          total_points: assignment.total_points,
          due_date: assignment.due_date
        },
        submissions,
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Get assignment submissions error:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching assignment submissions: " + error.message
    });
  }
};

// Provide feedback on submission (teacher)
const provideFeedback = async (req, res) => {
  try {
    const { submission_id } = req.params;
    const { teacher_feedback, teacher_comments } = req.body;

    // Find the assignment to verify teacher ownership
    const submission = await AssignmentSubmission.findById(submission_id)
      .populate('assignment_id');
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: "Submission not found"
      });
    }

    // Check if teacher owns the assignment
    const assignment = await Assignment.findOne({
      _id: submission.assignment_id,
      teacher_id: req.user.userId
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You don't own this assignment"
      });
    }

    // Update feedback
    submission.feedback = {
      teacher_feedback,
      teacher_comments,
      graded_by: req.user.userId,
      graded_at: new Date()
    };

    await submission.save();

    res.json({
      success: true,
      message: "Feedback provided successfully",
      data: submission
    });

  } catch (error) {
    console.error('Provide feedback error:', error);
    res.status(500).json({
      success: false,
      error: "Error providing feedback: " + error.message
    });
  }
};

// Helper function to update assignment analytics
const updateAssignmentAnalytics = async (assignmentId) => {
  try {
    const submissions = await AssignmentSubmission.find({ 
      assignment_id: assignmentId,
      $or: [
        { submission_status: 'submitted' },
        { submission_status: 'late' }
      ]
    });

    const analytics = {
      total_submissions: submissions.length,
      submissions_on_time: submissions.filter(s => !s.is_late).length,
      submissions_late: submissions.filter(s => s.is_late).length,
      average_score: submissions.reduce((sum, sub) => sum + sub.score.percentage, 0) / submissions.length || 0,
      highest_score: Math.max(...submissions.map(sub => sub.score.percentage), 0),
      lowest_score: Math.min(...submissions.map(sub => sub.score.percentage), 0)
    };

    await Assignment.findByIdAndUpdate(assignmentId, { analytics });

  } catch (error) {
    console.error('Update assignment analytics error:', error);
  }
};

// Get today's assignments summary for student dashboard
const getTodayAssignmentsSummary = async (req, res) => {
  try {
    const student_email = req.user.email;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get student enrollments
    const enrollments = await StudentEnrollment.find({
      student_email,
      payment_status: 'verified',
      enrollment_status: 'active'
    });

    if (enrollments.length === 0) {
      return res.json({
        success: true,
        data: {
          pending: 0,
          completed: 0,
          due_today: 0,
          upcoming: 0,
          assignments: []
        }
      });
    }

    const enrolledCategories = enrollments.map(e => e.course_category);

    // Get today's assignments
    const assignments = await Assignment.find({
      course_category: { $in: enrolledCategories },
      assignment_date: {
        $gte: today,
        $lt: tomorrow
      },
      status: 'published',
      'settings.is_active': true
    }).select('_id assignment_title course_title due_date');

    // Get submissions for these assignments
    const assignmentIds = assignments.map(a => a._id);
    const submissions = await AssignmentSubmission.find({
      assignment_id: { $in: assignmentIds },
      student_id: req.user.userId,
      $or: [
        { submission_status: 'submitted' },
        { submission_status: 'late' }
      ]
    });

    const submittedIds = new Set(submissions.map(s => s.assignment_id.toString()));

    const assignmentsWithStatus = assignments.map(assignment => {
      const isSubmitted = submittedIds.has(assignment._id.toString());
      const isDueToday = new Date(assignment.due_date) <= tomorrow && new Date(assignment.due_date) >= today;

      return {
        ...assignment.toObject(),
        status: isSubmitted ? 'completed' : isDueToday ? 'due_today' : 'upcoming'
      };
    });

    const summary = {
      pending: assignmentsWithStatus.filter(a => a.status === 'due_today').length,
      completed: assignmentsWithStatus.filter(a => a.status === 'completed').length,
      due_today: assignmentsWithStatus.filter(a => a.status === 'due_today').length,
      upcoming: assignmentsWithStatus.filter(a => a.status === 'upcoming').length,
      assignments: assignmentsWithStatus
    };

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Get today assignments summary error:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching assignments summary: " + error.message
    });
  }
};

module.exports = {
  createAssignment,
  getTeacherAssignments,
  getAssignmentDetails,
  getStudentAssignments,
  startAssignmentAttempt,
  submitAssignmentAttempt,
  getStudentSubmission,
  getAssignmentSubmissions,
  provideFeedback,
  getTodayAssignmentsSummary
};