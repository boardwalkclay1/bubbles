const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { register, login, verify, getMe } = require('../controllers/authController');

router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  body('role').isIn(['client', 'washer']),
  validate,
  register
);

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
  login
);

router.post('/verify', verify);

router.get('/me', authenticate, getMe);

module.exports = router;
