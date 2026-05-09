// routes/personalInfoRoutes.js
const express = require('express');
const router = express.Router();
const { savePersonalInfo, getPersonalInfoByEmail } = require('../controllers/formControllerpersonal');

// Save/update personal info
router.post('/save-personal-info', savePersonalInfo);

// Get personal info by email
router.get('/personal-info/:email', getPersonalInfoByEmail);

module.exports = router;