const { body, validationResult } = require('express-validator');

const validateEmailRequest = [
  body('templateName').notEmpty().withMessage('Template name is required'),
  body('to').isEmail().withMessage('Valid email is required'),
  body('variables').optional().isObject().withMessage('Variables must be an object'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    next();
  }
];

module.exports = {
  validateEmailRequest
};