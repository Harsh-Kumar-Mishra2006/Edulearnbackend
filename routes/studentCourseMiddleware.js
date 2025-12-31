// routes/studentCourseRoutes.js
const express = require('express');
const router = express.Router();
const { studentAuth } = require('../middlewares/studentAuthMiddleware');
const {
  getPublishedCourses,
  getPublishedCourseById
} = require('../controllers/publicCourseController');

// Apply studentAuth middleware - students must be logged in to view courses
router.get('/', studentAuth, getPublishedCourses);
router.get('/:id', studentAuth, getPublishedCourseById);

module.exports = router;