const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { createCheckout, webhook, getStatus, verifySubscription } = require('../controllers/paymentController');
const rateLimit = require('express-rate-limit');

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many payment requests, please try again later' },
});

router.post('/create-checkout', authenticate, paymentLimiter, createCheckout);
router.post('/webhook', webhook);
router.get('/status', authenticate, getStatus);
router.post('/verify-subscription', authenticate, verifySubscription);

module.exports = router;
