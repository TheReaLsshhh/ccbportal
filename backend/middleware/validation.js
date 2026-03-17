const { body, validationResult } = require('express-validator');

// Validation rules for different content types
const validationRules = {
  // Academic Programs
  academicProgram: [
    body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('duration').optional().trim().isLength({ max: 100 }),
    body('core_courses').optional().trim(),
    body('career_prospects').optional().trim()
  ],

  // News
  news: [
    body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
    body('body').trim().isLength({ min: 10 }).withMessage('Body must be at least 10 characters'),
    body('date').isISO8601().withMessage('Date must be valid ISO8601 format'),
    body('details').optional().trim(),
    body('is_active').optional().isBoolean(),
    body('display_order').optional().isInt({ min: 0 })
  ],

  // Events
  event: [
    body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
    body('event_date').isISO8601().withMessage('Event date must be valid ISO8601 format'),
    body('description').optional().trim(),
    body('details').optional().trim(),
    body('start_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be HH:MM format'),
    body('end_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be HH:MM format'),
    body('location').optional().trim().isLength({ max: 200 }),
    body('is_active').optional().isBoolean(),
    body('display_order').optional().isInt({ min: 0 })
  ],

  // Announcements
  announcement: [
    body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
    body('content').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
    body('date').isISO8601().withMessage('Date must be valid ISO8601 format'),
    body('is_active').optional().isBoolean(),
    body('display_order').optional().isInt({ min: 0 })
  ],

  // Achievements
  achievement: [
    body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('date').isISO8601().withMessage('Date must be valid ISO8601 format'),
    body('category').optional().trim().isLength({ max: 100 }),
    body('is_active').optional().isBoolean(),
    body('display_order').optional().isInt({ min: 0 })
  ],

  // Departments
  department: [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('head_name').optional().trim().isLength({ max: 100 }),
    body('contact_email').optional().isEmail().withMessage('Contact email must be valid'),
    body('is_active').optional().isBoolean(),
    body('display_order').optional().isInt({ min: 0 })
  ],

  // Personnel
  personnel: [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('position').trim().isLength({ min: 2, max: 100 }).withMessage('Position must be 2-100 characters'),
    body('department').trim().isLength({ min: 2, max: 100 }).withMessage('Department must be 2-100 characters'),
    body('email').optional().isEmail().withMessage('Email must be valid'),
    body('phone').optional().trim().isLength({ max: 20 }),
    body('is_active').optional().isBoolean(),
    body('display_order').optional().isInt({ min: 0 })
  ],

  // Contact Form
  contact: [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('phone').optional().trim().isLength({ max: 20 }),
    body('subject').trim().isLength({ min: 2, max: 200 }).withMessage('Subject must be 2-200 characters'),
    body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be 10-2000 characters')
  ]
};

// Validation middleware factory
const validate = (rules) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(rules.map(rule => rule.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }

    next();
  };
};

module.exports = {
  validationRules,
  validate
};
