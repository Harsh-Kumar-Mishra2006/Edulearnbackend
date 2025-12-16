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
// DYNAMIC routes with /teachers prefix  
router.get('/teachers/:id', getTeacherById);      // GET /api/admin/teachers/:id
router.put('/teachers/:id', updateTeacher);       // PUT /api/admin/teachers/:id  
router.delete('/teachers/:id', deleteTeacher);    // DELETE /api/admin/teachers/:id


module.exports = router;