const express = require('express');
const { login, signup, logout, getProfile, updateProfile,checkTeacherAuthorization } = require('../controllers/authController');
const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/check-teacher', checkTeacherAuthorization);

module.exports = router;