const User = require('../models/User');
const WasherProfile = require('../models/WasherProfile');

async function getMyProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    let washerProfile = null;
    if (req.user.role === 'washer') {
      washerProfile = await WasherProfile.findByUserId(req.user.id);
    }
    res.json({ user, washerProfile });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, phone, apple_pay_handle, cash_app_handle, paypal_email, card_note,
            service_area, skills, payment_methods, payment_handle, availability, is_available } = req.body;

    const userFields = {};
    if (name !== undefined) userFields.name = name;
    if (phone !== undefined) userFields.phone = phone;
    if (apple_pay_handle !== undefined) userFields.apple_pay_handle = apple_pay_handle;
    if (cash_app_handle !== undefined) userFields.cash_app_handle = cash_app_handle;
    if (paypal_email !== undefined) userFields.paypal_email = paypal_email;
    if (card_note !== undefined) userFields.card_note = card_note;

    let user = req.user;
    if (Object.keys(userFields).length > 0) {
      user = await User.update(req.user.id, userFields);
    }

    let washerProfile = null;
    if (req.user.role === 'washer') {
      washerProfile = await WasherProfile.upsert(req.user.id, {
        service_area, skills, payment_methods, payment_handle, availability, is_available
      });
    }

    res.json({ user, washerProfile });
  } catch (err) {
    next(err);
  }
}

async function getUserProfile(req, res, next) {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function getNearbyWashers(req, res, next) {
  try {
    const { lat, lng } = req.query;
    const washers = await WasherProfile.findNearby(parseFloat(lat), parseFloat(lng));
    res.json(washers);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyProfile, updateProfile, getUserProfile, getNearbyWashers };
