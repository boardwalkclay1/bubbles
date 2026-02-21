const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validation');
const { authenticate, requireRole } = require('../middleware/auth');
const { createRequest, getAvailable, getMyRequests, acceptRequest, completeRequest, getRequest } = require('../controllers/requestController');

router.post('/create',
  authenticate,
  requireRole('client'),
  body('pickup_address').trim().notEmpty(),
  validate,
  createRequest
);

router.get('/available', authenticate, getAvailable);
router.get('/my-requests', authenticate, getMyRequests);
router.post('/:id/accept', authenticate, requireRole('washer'), acceptRequest);
router.post('/:id/complete', authenticate, requireRole('washer'), completeRequest);
router.get('/:id', authenticate, getRequest);

module.exports = router;
