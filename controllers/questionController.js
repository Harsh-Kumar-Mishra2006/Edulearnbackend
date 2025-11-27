const Question = require('../models/questionModel');
const QuizAttempt = require('../models/quizAttemptModel');
const CourseMaterial = require('../models/courseMaterialdata');
// Get student's enrolled courses
const StudentEnrollment = require('../models/Mylearningmodel');
// Create new quiz
const createQuiz = async (req, res) => {
  try {
    const {
      course_id,
      quiz_title,
      quiz_description,
      quiz_topic,
      questions,
      quiz_settings
    } = req.body;

    // Validation
    if (!course_id || !quiz_title || !quiz_topic || !questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        error: "Course ID, quiz title, topic, and questions are required"
      });
    }

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one question is required"
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

      // Add question number
      q.question_number = i + 1;
    }

    // Create quiz
    const quiz = new Question({
      teacher_id: req.user.userId,
      teacher_email: req.user.email,
      teacher_name: req.user.name,
      course_id: course_id,
      course_title: course.course_title,
      course_category: course.course_category,
      quiz_title,
      quiz_description,
      quiz_topic,
      total_questions: questions.length,
      questions: questions,
      quiz_settings: quiz_settings || {}
    });

    await quiz.save();

    res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      data: quiz
    });

  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({
      success: false,
      error: "Error creating quiz: " + error.message
    });
  }
};

// Get teacher's quizzes
const getTeacherQuizzes = async (req, res) => {
  try {
    const { course_id, status } = req.query;
    
    let query = { teacher_id: req.user.userId };
    
    if (course_id) query.course_id = course_id;
    if (status) query.status = status;

    const quizzes = await Question.find(query)
      .populate('course_id', 'course_title course_category')
      .select('-questions')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: quizzes,
      total: quizzes.length
    });

  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching quizzes: " + error.message
    });
  }
};

// Get quiz details with questions
const getQuizDetails = async (req, res) => {
  try {
    const { quiz_id } = req.params;

    const quiz = await Question.findOne({
      _id: quiz_id,
      teacher_id: req.user.userId
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: "Quiz not found or access denied"
      });
    }

    res.json({
      success: true,
      data: quiz
    });

  } catch (error) {
    console.error('Get quiz details error:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching quiz details: " + error.message
    });
  }
};

// Update quiz status
const updateQuizStatus = async (req, res) => {
  try {
    const { quiz_id } = req.params;
    const { status } = req.body;

    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status"
      });
    }

    const quiz = await Question.findOneAndUpdate(
      { _id: quiz_id, teacher_id: req.user.userId },
      { status },
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: "Quiz not found or access denied"
      });
    }

    res.json({
      success: true,
      message: `Quiz ${status} successfully`,
      data: quiz
    });

  } catch (error) {
    console.error('Update quiz status error:', error);
    res.status(500).json({
      success: false,
      error: "Error updating quiz status: " + error.message
    });
  }
};

// Update quiz settings
const updateQuizSettings = async (req, res) => {
  try {
    const { quiz_id } = req.params;
    const { quiz_settings } = req.body;

    const quiz = await Question.findOneAndUpdate(
      { _id: quiz_id, teacher_id: req.user.userId },
      { quiz_settings },
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: "Quiz not found or access denied"
      });
    }

    res.json({
      success: true,
      message: "Quiz settings updated successfully",
      data: quiz
    });

  } catch (error) {
    console.error('Update quiz settings error:', error);
    res.status(500).json({
      success: false,
      error: "Error updating quiz settings: " + error.message
    });
  }
};

// Get quiz attempts for a quiz
const getQuizAttempts = async (req, res) => {
  try {
    const { quiz_id } = req.params;

    // Verify quiz belongs to teacher
    const quiz = await Question.findOne({
      _id: quiz_id,
      teacher_id: req.user.userId
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: "Quiz not found or access denied"
      });
    }

    const attempts = await QuizAttempt.find({ quiz_id })
      .populate('student_id', 'name email')
      .sort({ submitted_at: -1 });

    // Calculate statistics
    const stats = {
      total_attempts: attempts.length,
      average_score: attempts.reduce((sum, attempt) => sum + attempt.score.percentage, 0) / attempts.length || 0,
      highest_score: Math.max(...attempts.map(attempt => attempt.score.percentage), 0),
      lowest_score: Math.min(...attempts.map(attempt => attempt.score.percentage), 0)
    };

    res.json({
      success: true,
      data: {
        quiz: {
          title: quiz.quiz_title,
          topic: quiz.quiz_topic,
          total_questions: quiz.total_questions,
          total_points: quiz.total_points
        },
        attempts,
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Get quiz attempts error:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching quiz attempts: " + error.message
    });
  }
};

// Get student's available quizzes - DEBUG VERSION
const getStudentQuizzes = async (req, res) => {
  try {
    const student_email = req.user.email;
    console.log('🟡 [DEBUG] Fetching quizzes for student:', student_email);

    // Get student enrollments
    const enrollments = await StudentEnrollment.find({
      student_email,
      payment_status: 'verified',
      enrollment_status: 'active'
    });

    console.log('🟡 [DEBUG] Student enrollments found:', enrollments.length);
    console.log('🟡 [DEBUG] Enrollment details:', JSON.stringify(enrollments.map(e => ({
      course_title: e.course_title,
      course_category: e.course_category,
      payment_status: e.payment_status,
      enrollment_status: e.enrollment_status
    })), null, 2));

    if (enrollments.length === 0) {
      console.log('🔴 [DEBUG] No active enrollments found for student');
      return res.json({
        success: true,
        data: [],
        message: 'No enrolled courses found'
      });
    }

    const enrolledCategories = enrollments.map(e => e.course_category);
    console.log('🟡 [DEBUG] Enrolled categories:', enrolledCategories);

    // Get ALL quizzes first to see what exists
    const allQuizzes = await Question.find({})
      .populate('teacher_id', 'name')
      .sort({ createdAt: -1 });

    console.log('🟡 [DEBUG] ALL quizzes in database:', allQuizzes.length);
    console.log('🟡 [DEBUG] All quiz details:', JSON.stringify(allQuizzes.map(q => ({
      quiz_title: q.quiz_title,
      course_category: q.course_category,
      status: q.status,
      is_active: q.quiz_settings?.is_active,
      course_title: q.course_title
    })), null, 2));

    // Now get quizzes for enrolled categories
    const quizzes = await Question.find({
      course_category: { $in: enrolledCategories },
      //status: 'published',
      'quiz_settings.is_active': true
    })
    .populate('teacher_id', 'name')
    .sort({ createdAt: -1 });

    console.log('🟡 [DEBUG] Filtered quizzes found:', quizzes.length);
    console.log('🟡 [DEBUG] Filtered quiz details:', JSON.stringify(quizzes.map(q => ({
      quiz_title: q.quiz_title,
      course_category: q.course_category,
      status: q.status
    })), null, 2));

    const availableQuizzes = quizzes;   // ← YES, JUST THIS LINE
    console.log('🟡 [DEBUG] Available quizzes after date filter:', availableQuizzes.length);
    console.log(`✅ [DEBUG] Final result: Found ${availableQuizzes.length} quizzes for student ${student_email}`);
    
    res.json({
      success: true,
      data: availableQuizzes
    });

  } catch (error) {
    console.error('🔴 [DEBUG] Get student quizzes error:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching student quizzes: " + error.message
    });
  }
};
// Start quiz attempt
const startQuizAttempt = async (req, res) => {
  try {
    const { quiz_id } = req.params;

    // Get quiz details
    const quiz = await Question.findOne({
      _id: quiz_id,
      //status: 'published',
      'quiz_settings.is_active': true
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: "Quiz not found or not available"
      });
    }

    // Check if quiz has ended
    if (quiz.quiz_settings.end_date && new Date(quiz.quiz_settings.end_date) < new Date()) {
      return res.status(400).json({
        success: false,
        error: "This quiz has ended"
      });
    }

    // Check previous attempts
    const previousAttempts = await QuizAttempt.find({
      quiz_id,
      student_id: req.user.userId
    });

    if (previousAttempts.length >= quiz.quiz_settings.max_attempts) {
      return res.status(400).json({
        success: false,
        error: `Maximum attempts (${quiz.quiz_settings.max_attempts}) reached for this quiz`
      });
    }

    // Create new attempt
    const attempt = new QuizAttempt({
      student_id: req.user.userId,
      student_email: req.user.email,
      student_name: req.user.name,
      quiz_id: quiz_id,
      course_id: quiz.course_id,
      course_title: quiz.course_title,
      course_category: quiz.course_category,
      teacher_id: quiz.teacher_id,
      attempt_number: previousAttempts.length + 1,
      answers: quiz.questions.map(q => ({
        question_number: q.question_number,
        selected_option: null,
        is_correct: false,
        points_earned: 0
      })),
      score: {
        total_questions: quiz.total_questions
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    await attempt.save();

    // Return quiz without correct answers
    const quizForStudent = {
      _id: quiz._id,
      quiz_title: quiz.quiz_title,
      quiz_description: quiz.quiz_description,
      quiz_topic: quiz.quiz_topic,
      total_questions: quiz.total_questions,
      total_points: quiz.total_points,
      quiz_settings: quiz.quiz_settings,
      questions: quiz.questions.map(q => ({
        question_number: q.question_number,
        question_text: q.question_text,
        options: q.options,
        points: q.points
        // Don't send correct_option or explanation
      }))
    };

    res.json({
      success: true,
      data: {
        quiz: quizForStudent,
        attempt_id: attempt._id,
        time_limit: quiz.quiz_settings.time_limit
      }
    });

  } catch (error) {
    console.error('Start quiz attempt error:', error);
    res.status(500).json({
      success: false,
      error: "Error starting quiz attempt: " + error.message
    });
  }
};

// Submit quiz attempt
const submitQuizAttempt = async (req, res) => {
  try {
    const { attempt_id } = req.params;
    const { answers, time_taken } = req.body;

    const attempt = await QuizAttempt.findOne({
      _id: attempt_id,
      student_id: req.user.userId,
      status: 'in_progress'
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: "Attempt not found or already submitted"
      });
    }

    // Get quiz to check correct answers
    const quiz = await Question.findById(attempt.quiz_id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: "Quiz not found"
      });
    }

    // Validate and grade answers
    const gradedAnswers = answers.map(answer => {
      const question = quiz.questions.find(q => q.question_number === answer.question_number);
      if (!question) return answer;

      const is_correct = answer.selected_option === question.correct_option;
      const points_earned = is_correct ? question.points : 0;

      return {
        ...answer,
        is_correct,
        points_earned
      };
    });

    // Update attempt
    attempt.answers = gradedAnswers;
    attempt.time_taken = time_taken;
    attempt.submitted_at = new Date();
    attempt.status = 'submitted';

    await attempt.save();

    // Update quiz analytics
    await updateQuizAnalytics(quiz._id);

    // Return results
    const results = {
      score: attempt.score,
      correct_answers: quiz.questions.map(q => ({
        question_number: q.question_number,
        correct_option: q.correct_option,
        explanation: q.explanation
      }))
    };

    res.json({
      success: true,
      message: "Quiz submitted successfully",
      data: results
    });

  } catch (error) {
    console.error('Submit quiz attempt error:', error);
    res.status(500).json({
      success: false,
      error: "Error submitting quiz attempt: " + error.message
    });
  }
};

// Helper function to update quiz analytics
const updateQuizAnalytics = async (quizId) => {
  try {
    const attempts = await QuizAttempt.find({ 
      quiz_id: quizId, 
      status: 'submitted' 
    });

    const analytics = {
      total_attempts: attempts.length,
      average_score: attempts.reduce((sum, attempt) => sum + attempt.score.percentage, 0) / attempts.length || 0,
      highest_score: Math.max(...attempts.map(attempt => attempt.score.percentage), 0),
      lowest_score: Math.min(...attempts.map(attempt => attempt.score.percentage), 0)
    };

    await Question.findByIdAndUpdate(quizId, { analytics });

  } catch (error) {
    console.error('Update quiz analytics error:', error);
  }
};
// GET quiz attempt details for student (THIS WAS MISSING!)
const getQuizAttempt = async (req, res) => {
  try {
    const { attempt_id } = req.params;

    const attempt = await QuizAttempt.findOne({
      _id: attempt_id,
      student_id: req.user.userId,
      status: 'in_progress'
    }).populate('quiz_id');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: "Attempt not found or already submitted"
      });
    }

    const quiz = attempt.quiz_id;

    // Return clean quiz data (without correct answers)
    const cleanQuiz = {
      _id: quiz._id,
      quiz_title: quiz.quiz_title,
      quiz_description: quiz.quiz_description,
      quiz_topic: quiz.quiz_topic,
      total_questions: quiz.total_questions,
      total_points: quiz.total_points,
      quiz_settings: quiz.quiz_settings,
      questions: quiz.questions.map(q => ({
        question_number: q.question_number,
        question_text: q.question_text,
        options: q.options,
        points: q.points || 1
      }))
    };

    res.json({
      success: true,
      data: {
        quiz: cleanQuiz,
        attempt_id: attempt._id,
        time_limit: quiz.quiz_settings.time_limit
      }
    });

  } catch (error) {
    console.error('Get quiz attempt error:', error);
    res.status(500).json({
      success: false,
      error: "Error loading quiz"
    });
  }
};

module.exports = {
  createQuiz,
  getTeacherQuizzes,
  getQuizDetails,
  updateQuizStatus,
  updateQuizSettings,
  getQuizAttempts,
  getStudentQuizzes,
  startQuizAttempt,
  submitQuizAttempt,
  getQuizAttempt
};