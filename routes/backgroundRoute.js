const express= require('express');
const router = express.Router();
const {saveBackgroundInfo} = require('../controllers/formControllerbackground');

router.post('/save', saveBackgroundInfo);
module.exports= router;