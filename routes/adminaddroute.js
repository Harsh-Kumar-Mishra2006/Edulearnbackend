// routes/teacherManagementRoutes.js
const express = require('express');
const router = express.Router();
const {
  addTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getTeacherStats
} = require('../controllers/adminaddcontroller');

// Import auth middleware (you'll need to create this)
const { adminAuth } = require('../middlewares/adminauthMiddleware');

// Apply admin auth middleware to all routes
router.use(adminAuth);

// ✅ CORRECT ORDER - Specific routes first, dynamic routes last
router.post('/add-teacher', addTeacher);
router.get('/teachers', getAllTeachers); // Specific route
router.get('/stats', getTeacherStats);   // Specific route  
router.get('/:id', getTeacherById);      // Dynamic route LAST
router.put('/:id', updateTeacher);
router.delete('/:id', deleteTeacher);

module.exports = router;