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
  submitQuizAttempt
} = require('../controllers/questionController');

const { teacherAuth } = require('../middlewares/teacherauthMiddleware');
const { studentAuth } = require('../middlewares/studentauthMiddleware');

// Teacher routes
router.use('/teacher', teacherAuth);
router.post('/teacher/quizzes', createQuiz);
router.get('/teacher/quizzes', getTeacherQuizzes);
router.get('/teacher/quizzes/:quiz_id', getQuizDetails);
router.put('/teacher/quizzes/:quiz_id/status', updateQuizStatus);
router.put('/teacher/quizzes/:quiz_id/settings', updateQuizSettings);
router.get('/teacher/quizzes/:quiz_id/attempts', getQuizAttempts);

// Student routes
router.use('/student', studentAuth);
router.get('/student/quizzes', getStudentQuizzes);
router.post('/student/quizzes/:quiz_id/start', startQuizAttempt);
router.post('/student/attempts/:attempt_id/submit', submitQuizAttempt);

module.exports = router;