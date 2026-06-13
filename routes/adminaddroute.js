// routes/adminaddroute.js
const express = require('express');
const router = express.Router();
const {
  addTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getTeacherStats,
  changePassword,
  getTeacherPassword,
  getAllStudents,
  getAllStudentsWithDetails, 
  getTeacherCredentials,       
  resetStudentPassword,        
  resetTeacherPassword  
} = require('../controllers/adminaddcontroller');

// Import auth middleware
const { adminAuth } = require('../middlewares/adminauthMiddleware');

// Apply admin auth middleware to all routes
router.use(adminAuth);

// ✅ CORRECT ORDER - Specific routes first, dynamic routes last
router.post('/add-teacher', addTeacher);
router.get('/teachers', getAllTeachers);
router.get('/stats', getTeacherStats);
router.put('/teachers/:id/change-password', changePassword);
router.get('/teachers/:id/credentials', getTeacherCredentials);
router.post('/teachers/:teacherId/reset-password', resetTeacherPassword);

// DYNAMIC routes with /teachers prefix
router.get('/teachers/:id', getTeacherById);
router.put('/teachers/:id', updateTeacher);
router.delete('/teachers/:id', deleteTeacher);
router.get('/teachers/:id/password', getTeacherPassword);

// Student routes
router.get('/students', getAllStudents);
router.get('/students/all', getAllStudentsWithDetails);
router.post('/students/:studentId/reset-password', resetStudentPassword);

module.exports = router;