const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getMyProfile, updateProfile, getUserProfile, getNearbyWashers } = require('../controllers/profileController');

router.get('/me', authenticate, getMyProfile);
router.put('/update', authenticate, updateProfile);
router.get('/washers/nearby', authenticate, getNearbyWashers);
router.get('/:userId', authenticate, getUserProfile);

module.exports = router;
