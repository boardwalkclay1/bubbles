const router = require('express').Router();
const { body, query } = require('express-validator');
const validate = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { updateLocation, getNearbyWashers, getNearbyRequests, getMapData } = require('../controllers/locationController');

router.post('/update-location',
  authenticate,
  body('lat').isFloat({ min: -90, max: 90 }),
  body('lng').isFloat({ min: -180, max: 180 }),
  validate,
  updateLocation
);

router.get('/nearby-washers', authenticate, getNearbyWashers);
router.get('/nearby-requests', authenticate, getNearbyRequests);
router.get('/map-data', authenticate, getMapData);

module.exports = router;
