const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/questionController');

const QuizAttempt = require('../models/quizAttemptModel'); // Import the QuizAttempt model
const { teacherAuth } = require('../middlewares/teacherauthMiddleware');
const { studentAuth } = require('../middlewares/studentauthMiddleware');

// routes/questionroute.js  ← ADD THIS AT THE TOP (after imports)

const { adminAuth } = require('../middlewares/adminauthMiddleware'); // your admin middleware

// ADMIN: GET ALL QUIZ ATTEMPTS WITH STUDENT EMAILS & SCORES
router.get('/admin/scores', adminAuth, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ status: 'submitted' })
      .populate('student_id', 'email name')
      .populate('quiz_id', 'quiz_title course_title')
      .sort({ submitted_at: -1 });

    const formattedScores = attempts.map(attempt => {
      const total = attempt.answers.length;
      const correct = attempt.answers.filter(a => a.is_correct).length;
      const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

      return {
        student_email: attempt.student_id?.email || 'Unknown',
        student_name: attempt.student_id?.name || 'Unknown',
        quiz_title: attempt.quiz_id?.quiz_title || 'Untitled Quiz',
        course_title: attempt.quiz_id?.course_title || 'Unknown Course',
        score: {
          percentage,
          correct,
          wrong: total - correct,
          total
        },
        submitted_at: attempt.submitted_at
      };
    });

    res.json({
      success: true,
      data: formattedScores
    });

  } catch (error) {
    console.error('Admin get scores error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scores'
    });
  }
});
// SIMPLE FIX: Remove the router.use lines and apply auth directly to routes
router.post('/teacher/quizzes', teacherAuth, createQuiz);
router.get('/teacher/quizzes', teacherAuth, getTeacherQuizzes);
router.get('/teacher/quizzes/:quiz_id', teacherAuth, getQuizDetails);
router.put('/teacher/quizzes/:quiz_id/status', teacherAuth, updateQuizStatus);
router.put('/teacher/quizzes/:quiz_id/settings', teacherAuth, updateQuizSettings);
router.get('/teacher/quizzes/:quiz_id/attempts', teacherAuth, getQuizAttempts);

// Student routes
router.get('/student/quizzes', studentAuth, getStudentQuizzes);
router.post('/student/quizzes/:quiz_id/start', studentAuth, startQuizAttempt);
router.get('/student/attempt/:attempt_id', studentAuth, getQuizAttempt);
router.post('/student/attempt/:attempt_id/submit', studentAuth, submitQuizAttempt);

module.exports = router;