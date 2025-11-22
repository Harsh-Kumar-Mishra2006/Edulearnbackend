const express= require('express');
const router = express.Router();
const {savePersonalInfo} = require('../controllers/formControllerpersonal');

router.post('/save', savePersonalInfo);
module.exports= router;