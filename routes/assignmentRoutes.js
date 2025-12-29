const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/assignmentController');

const { teacherAuth } = require('../middlewares/teacherauthMiddleware');
const { studentAuth } = require('../middlewares/studentauthMiddleware');

console.log('🚀 [ASSIGNMENT ROUTES] File loaded successfully');
console.log('🚀 [ASSIGNMENT ROUTES] Routes to be registered:');
console.log('   - GET  /teacher/assignments');
console.log('   - POST /teacher/assignments');
console.log('   - GET  /test (debug route)');

// Add this BEFORE all other routes in assignmentRoutes.js
router.get('/test', (req, res) => {
  console.log('✅ Test route hit!');
  res.json({ message: 'Assignment routes are working!' });
});

// Teacher routes
router.post('/teacher/assignments', teacherAuth, createAssignment);
router.get('/teacher/assignments', teacherAuth, getTeacherAssignments);
router.get('/teacher/assignments/:assignment_id', teacherAuth, getAssignmentDetails);
router.get('/teacher/assignments/:assignment_id/submissions', teacherAuth, getAssignmentSubmissions);
router.post('/teacher/submissions/:submission_id/feedback', teacherAuth, provideFeedback);

// Student routes
router.get('/student/assignments', studentAuth, getStudentAssignments);
router.get('/student/assignments/today-summary', studentAuth, getTodayAssignmentsSummary);
router.post('/student/assignments/:assignment_id/start', studentAuth, startAssignmentAttempt);
router.post('/student/submissions/:submission_id/submit', studentAuth, submitAssignmentAttempt);
router.get('/student/assignments/:assignment_id/submission', studentAuth, getStudentSubmission);

module.exports = router;