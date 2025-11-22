const express= require('express');
const router = express.Router();
const {saveCourseInfo} = require('../controllers/formControllercourse');

router.post('/save', saveCourseInfo);
module.exports= router;