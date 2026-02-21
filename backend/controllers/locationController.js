const pool = require('../config/database');
const WasherProfile = require('../models/WasherProfile');

async function updateLocation(req, res, next) {
  try {
    const { lat, lng } = req.body;
    const user = req.user;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'lat and lng must be numbers' });
    }

    await pool.query(
      `INSERT INTO location_signals (id, role, lat, lng, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (id) DO UPDATE SET lat = $3, lng = $4, updated_at = NOW()`,
      [user.id, user.role, lat, lng]
    );

    if (user.role === 'washer') {
      await WasherProfile.updateLocation(user.id, lat, lng);
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function getNearbyWashers(req, res, next) {
  try {
    const { lat, lng, radius } = req.query;
    const washers = await WasherProfile.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius) || 50
    );
    res.json(washers);
  } catch (err) {
    next(err);
  }
}

async function getNearbyRequests(req, res, next) {
  try {
    const { lat, lng } = req.query;
    const radiusKm = 50;
    const result = await pool.query(
      `SELECT r.*, u.name as client_name,
        (6371 * acos(
          cos(radians($1)) * cos(radians(ls.lat)) *
          cos(radians(ls.lng) - radians($2)) +
          sin(radians($1)) * sin(radians(ls.lat))
        )) AS distance_km
       FROM laundry_requests r
       JOIN users u ON u.id = r.client_id
       LEFT JOIN location_signals ls ON ls.id = r.client_id
       WHERE r.status = 'requested' AND r.washer_id IS NULL
         AND ls.lat IS NOT NULL
         AND (
           6371 * acos(
             cos(radians($1)) * cos(radians(ls.lat)) *
             cos(radians(ls.lng) - radians($2)) +
             sin(radians($1)) * sin(radians(ls.lat))
           )
         ) < $3
       ORDER BY distance_km ASC`,
      [parseFloat(lat), parseFloat(lng), radiusKm]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function getMapData(req, res, next) {
  try {
    // Only return signals updated in the last 5 minutes
    const result = await pool.query(
      `SELECT ls.id, ls.role, ls.lat, ls.lng, u.name
       FROM location_signals ls
       JOIN users u ON u.id = ls.id
       WHERE ls.updated_at > NOW() - INTERVAL '5 minutes'`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { updateLocation, getNearbyWashers, getNearbyRequests, getMapData };
